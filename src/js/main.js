import {
  fetchCoinsList,
  fetchGlobalData,
  fetchCoinDetails,
  fetchCoinMarketChart,
  fetchFavoriteCoins
} from './api.js';
import {
  formatCurrency,
  formatPercentage,
  debounce,
  getChangeColor
} from './utils.js';

// DOM-elementen
const themeToggle = document.getElementById('theme-toggle');
const totalMarketCap = document.getElementById('total-market-cap');
const totalVolume = document.getElementById('total-volume');
const btcDominance = document.getElementById('btc-dominance');
const activeCryptocurrencies = document.getElementById('active-cryptocurrencies');
const cryptoTableBody = document.getElementById('crypto-table-body');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const sortSelect = document.getElementById('sort-select');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const homeView = document.getElementById('home-view');
const coinDetailView = document.getElementById('coin-detail-view');
const favoritesView = document.getElementById('favorites-view');
const backToHomeButton = document.getElementById('back-to-home');
const backToHomeFromFavorites = document.getElementById('back-to-home-from-favorites');
const favoritesTableBody = document.getElementById('favorites-table-body');
const noFavoritesMessage = document.getElementById('no-favorites-message');

let state = {
  currentView: 'home',
  currentCoinId: null,
  coins: [],
  filteredCoins: [],
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
  favoriteCoins: [],
  currentPage: 1,
  itemsPerPage: 20,
  searchTerm: '',
  filterType: 'all',
  sortType: 'market_cap_desc'
};

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  setupEventListeners();
  initTheme();
  await handleRouting();
  window.addEventListener('hashchange', handleRouting);
}

function setupEventListeners() {
  themeToggle.addEventListener('click', toggleTheme);
  searchInput.addEventListener('input', debounce(handleSearch, 300));
  filterSelect.addEventListener('change', handleFilter);
  sortSelect.addEventListener('change', handleSort);
  prevPageButton.addEventListener('click', goToPrevPage);
  nextPageButton.addEventListener('click', goToNextPage);

  document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.getAttribute('data-view'), link.dataset.coinId);
    });
  });

  if (backToHomeButton) backToHomeButton.addEventListener('click', e => { e.preventDefault(); navigateTo('home'); });
  if (backToHomeFromFavorites) backToHomeFromFavorites.addEventListener('click', e => { e.preventDefault(); navigateTo('home'); });
}

function initTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && prefersDark.matches)) document.body.classList.add('dark-theme');
  prefersDark.addEventListener('change', e => document.body.classList.toggle('dark-theme', e.matches));
}
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

async function handleRouting() {
  const hash = window.location.hash.substring(1);
  if (hash.startsWith('coin/')) {
    state.currentView = 'coin-detail';
    state.currentCoinId = hash.split('/')[1];
    showView('coin-detail');
    await loadCoinDetails(state.currentCoinId);
  } else if (hash === 'favorites') {
    state.currentView = 'favorites';
    showView('favorites');
    await loadFavoritesData();
  } else {
    state.currentView = 'home';
    showView('home');
    await loadHomeData();
  }
}

function navigateTo(view, coinId) {
  if (view === 'home') window.location.hash = '';
  else if (view === 'favorites') window.location.hash = 'favorites';
  else if (view === 'coin-detail' && coinId) window.location.hash = `coin/${coinId}`;
}

function showView(view) {
  homeView.style.display = 'none';
  coinDetailView.style.display = 'none';
  if (favoritesView) favoritesView.style.display = 'none';
  if (view === 'home') homeView.style.display = 'block';
  if (view === 'coin-detail') coinDetailView.style.display = 'block';
  if (view === 'favorites' && favoritesView) favoritesView.style.display = 'block';
}

async function loadHomeData() {
  try {
    showLoadingState();
    const stats = await fetchGlobalData();
    updateMarketOverview(stats);
    const coins = await fetchCoinsList(1, 100);
    state.coins = coins;
    state.filteredCoins = [...coins];
    renderTable();
    hideLoadingState();
  } catch (e) {
    console.error('Fout bij laden home:', e);
    showErrorState(e.message || 'Kon gegevens niet laden.');
  }
}

async function loadFavoritesData() {
  try {
    if (!favoritesTableBody) return;
    favoritesTableBody.innerHTML = '<tr><td colspan="6" class="loading-message">Je favorieten laden...</td></tr>';
    const favIds = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (favIds.length === 0) {
      if (noFavoritesMessage) noFavoritesMessage.style.display = 'block';
      favoritesTableBody.innerHTML = '';
      return;
    }
    if (noFavoritesMessage) noFavoritesMessage.style.display = 'none';
    const favCoins = await fetchFavoriteCoins(favIds);
    state.favoriteCoins = favCoins;
    renderFavoritesTable();
  } catch (e) {
    console.error('Fout bij laden favorieten:', e);
    if (favoritesTableBody) {
      favoritesTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="error-message">
            Fout bij laden favorieten: ${e.message}
            <button onclick="window.location.reload()" class="retry-button">Opnieuw proberen</button>
          </td>
        </tr>`;
    }
  }
}

function updateMarketOverview(data) {
  totalMarketCap.textContent = formatCurrency(data.market_cap_usd);
  totalVolume.textContent    = formatCurrency(data.volume_24h_usd);
  btcDominance.textContent   = formatPercentage(data.bitcoin_dominance_percentage);
  const count = data.cryptocurrencies_count != null
    ? data.cryptocurrencies_count
    : (state.coins ? state.coins.length : 0);
  activeCryptocurrencies.textContent = count.toLocaleString('nl-NL');
}

function renderTable() {
  cryptoTableBody.innerHTML = '';
  const start = (state.currentPage - 1) * state.itemsPerPage;
  const paginated = state.filteredCoins.slice(start, start + state.itemsPerPage);
  updatePaginationInfo();

  if (paginated.length === 0) {
    cryptoTableBody.innerHTML = `<tr><td colspan="6" class="no-results">Geen cryptocurrencies gevonden.</td></tr>`;
    return;
  }

  paginated.forEach(coin => {
    const q = coin.quotes.EUR;
    const isFav = state.favorites.includes(coin.id);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="rank-col">
        <span class="rank">${coin.rank || '-'}</span>
        <button class="favorite-button ${isFav ? 'favorited' : ''}" data-coin-id="${coin.id}" aria-label="${isFav ? 'Verwijder' : 'Voeg toe'} ${coin.name} favorieten">
          ${isFav ? '★' : '☆'}
        </button>
      </td>
      <td class="name-col">
        <a href="#coin/${coin.id}" class="coin-link" data-view="coin-detail" data-coin-id="${coin.id}">
          <img src="https://static.coinpaprika.com/coin/${coin.id}/logo.png" alt="${coin.name}" class="coin-icon">
          <div class="coin-name-container">
            <span class="coin-name">${coin.name}</span>
            <span class="coin-symbol">${coin.symbol}</span>
          </div>
        </a>
      </td>
      <td class="price-col">${formatCurrency(q.price)}</td>
      <td class="change-col"><span style="color:${getChangeColor(q.percent_change_24h)}">${formatPercentage(q.percent_change_24h)}</span></td>
      <td class="market-cap-col">${formatCurrency(q.market_cap)}</td>
      <td class="volume-col">${formatCurrency(q.volume_24h)}</td>
    `;
    cryptoTableBody.appendChild(row);
  });

  document.querySelectorAll('.favorite-button').forEach(btn => btn.addEventListener('click', toggleFavorite));
}

function renderFavoritesTable() {
  favoritesTableBody.innerHTML = '';
  if (state.favoriteCoins.length === 0) {
    favoritesTableBody.innerHTML = `<tr><td colspan="6" class="no-results">Je hebt nog geen favorieten.</td></tr>`;
    return;
  }
  state.favoriteCoins.forEach(coin => {
    const q = coin.quotes.EUR;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="rank-col">
        <span class="rank">${coin.rank || '-'}</span>
        <button class="favorite-button favorited" data-coin-id="${coin.id}" aria-label="Verwijder ${coin.name} favorieten">★</button>
      </td>
      <td class="name-col">
        <a href="#coin/${coin.id}" class="coin-link" data-view="coin-detail" data-coin-id="${coin.id}">
          <img src="https://static.coinpaprika.com/coin/${coin.id}/logo.png" alt="${coin.name}" class="coin-icon">
          <div class="coin-name-container">
            <span class="coin-name">${coin.name}</span>
            <span class="coin-symbol">${coin.symbol}</span>
          </div>
        </a>
      </td>
      <td class="price-col">${formatCurrency(q.price)}</td>
      <td class="change-col"><span style="color:${getChangeColor(q.percent_change_24h)}">${formatPercentage(q.percent_change_24h)}</span></td>
      <td class="market-cap-col">${formatCurrency(q.market_cap)}</td>
      <td class="volume-col">${formatCurrency(q.volume_24h)}</td>
    `;
    favoritesTableBody.appendChild(row);
  });
  document.querySelectorAll('.favorite-button').forEach(btn => btn.addEventListener('click', toggleFavorite));
}

async function loadCoinDetails(coinId) {
  try {
    document.querySelector('.coin-detail-container').classList.add('loading');
    const coinData  = await fetchCoinDetails(coinId);
    const chartData = await fetchCoinMarketChart(coinData.symbol, 30);
    renderCoinDetails(coinData);
    renderPriceChart(chartData);
    document.querySelector('.coin-detail-container').classList.remove('loading');
  } catch (e) {
    console.error('Fout bij laden muntdetails:', e);
    document.querySelector('.coin-detail-container').innerHTML = `
      <div class="error-message">
        <h2>Fout bij laden muntgegevens</h2>
        <p>${e.message}</p>
        <button onclick="window.location.hash = ''" class="retry-button">Terug naar Startpagina</button>
      </div>`;
  }
}

function renderCoinDetails(coin) {
  const q = coin.quotes.EUR;
  document.getElementById('coin-logo').src = `https://static.coinpaprika.com/coin/${coin.id}/logo.png`;
  document.getElementById('coin-logo').alt = `${coin.name} logo`;
  document.getElementById('coin-name').textContent  = coin.name;
  document.getElementById('coin-price').textContent = formatCurrency(q.price);
  const changeVal = q.percent_change_24h;
  const changeEl = document.getElementById('coin-change');
  changeEl.textContent = formatPercentage(changeVal);
  changeEl.className    = `coin-change ${changeVal >= 0 ? 'positive' : 'negative'}`;
  document.getElementById('market-cap').textContent = formatCurrency(q.market_cap);
  document.getElementById('volume').textContent     = formatCurrency(q.volume_24h);
  document.getElementById('overview').innerHTML     = coin.description
    ? `<p>${coin.description}</p>`
    : '<p>Geen beschrijving beschikbaar.</p>';
}

function renderPriceChart(chartData) {
  const container = document.querySelector('.chart-container');
  const canvas    = document.getElementById('price-chart');
  const oldWarn   = container.querySelector('.chart-warning');
  if (oldWarn) oldWarn.remove();

  if (!chartData || chartData.length === 0) {
    if (window.priceChart) {
      window.priceChart.destroy();
      window.priceChart = null;
    }
    canvas.style.display = 'none';
    const msg = document.createElement('div');
    msg.className = 'chart-warning';
    msg.textContent = 'Historische prijsgegevens niet beschikbaar.';
    container.appendChild(msg);
    return;
  }

  canvas.style.display = '';
  const ctx = canvas.getContext('2d');
  if (window.priceChart) window.priceChart.destroy();

  const labels = chartData.map(pt => new Date(pt.time_close).toLocaleDateString('nl-NL'));
  const data   = chartData.map(pt => pt.price_close);
  const color  = data[data.length - 1] >= data[0] ? '#10b981' : '#ef4444';

  window.priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Prijs (EUR)',
        data,
        borderColor: color,
        backgroundColor: `${color}20`,
        fill: true,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { /* zoals eerder */ },
      plugins: { /* zoals eerder */ }
    }
  });
}

function toggleFavorite(e) {
  e.preventDefault(); e.stopPropagation();
  const id = e.currentTarget.dataset.coinId;
  if (state.favorites.includes(id)) {
    state.favorites = state.favorites.filter(x => x !== id);
  } else {
    state.favorites.push(id);
  }
  localStorage.setItem('favorites', JSON.stringify(state.favorites));
  if (state.currentView === 'favorites') loadFavoritesData();
  renderTable();
}

function handleSearch() { state.searchTerm = searchInput.value.toLowerCase(); state.currentPage = 1; filterAndSort(); renderTable(); }
function handleFilter() { state.filterType  = filterSelect.value;              state.currentPage = 1; filterAndSort(); renderTable(); }
function handleSort()   { state.sortType    = sortSelect.value;               filterAndSort(); renderTable(); }

function filterAndSort() {
  state.filteredCoins = state.coins.filter(c => {
    const q = c.quotes.EUR;
    const match = c.name.toLowerCase().includes(state.searchTerm)
               || c.symbol.toLowerCase().includes(state.searchTerm);
    let ok = true;
    if (state.filterType === 'favorites') ok = state.favorites.includes(c.id);
    if (state.filterType === 'gainers')   ok = q.percent_change_24h > 0;
    if (state.filterType === 'losers')    ok = q.percent_change_24h < 0;
    return match && ok;
  });

  state.filteredCoins.sort((a, b) => {
    const qa = a.quotes.EUR, qb = b.quotes.EUR;
    switch (state.sortType) {
      case 'market_cap_desc': return qb.market_cap - qa.market_cap;
      case 'market_cap_asc':  return qa.market_cap - qb.market_cap;
      case 'price_desc':      return qb.price - qa.price;
      case 'price_asc':       return qa.price - qb.price;
      case 'volume_desc':     return qb.volume_24h - qa.volume_24h;
      case 'volume_asc':      return qa.volume_24h - qb.volume_24h;
      case 'change_desc':     return qb.percent_change_24h - qa.percent_change_24h;
      case 'change_asc':      return qa.percent_change_24h - qb.percent_change_24h;
      default:                return qb.market_cap - qa.market_cap;
    }
  });
}

function updatePaginationInfo() {
  const total = Math.ceil(state.filteredCoins.length / state.itemsPerPage);
  pageInfo.textContent = `Pagina ${state.currentPage} van ${total || 1}`;
  prevPageButton.disabled = state.currentPage <= 1;
  nextPageButton.disabled = state.currentPage >= total;
}
function goToPrevPage() { if (state.currentPage > 1) { state.currentPage--; renderTable(); window.scrollTo(0,0);} }
function goToNextPage() { const total = Math.ceil(state.filteredCoins.length/state.itemsPerPage); if (state.currentPage < total) { state.currentPage++; renderTable(); window.scrollTo(0,0);} }

function showLoadingState() {
  cryptoTableBody.innerHTML = `<tr class="loading-row"><td colspan="6" class="loading-message">Laden…</td></tr>`;
}
function hideLoadingState() { /* overschreven bij render */ }
function showErrorState(msg) {
  cryptoTableBody.innerHTML = `<tr class="error-row"><td colspan="6" class="error-message">${msg}<button onclick="window.location.reload()" class="retry-button">Opnieuw proberen</button></td></tr>`;
}
