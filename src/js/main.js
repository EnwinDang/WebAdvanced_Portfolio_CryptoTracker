/**
 * Hoofdscript voor CryptoTracker SPA
 * 
 * Dit bestand implementeert de Single Page Application architectuur met client-side routing
 * en regelt alle hoofdfunctionaliteit, waaronder:
 * - Dynamische weergave op basis van URL hash
 * - Gegevens ophalen van CoinGecko API
 * - Zoek-, filter- en sorteerfunctionaliteit
 * - Beheer van favorieten met localStorage
 * - Donker/licht thema met localStorage
 * - Grafiekweergave voor cryptocurrency prijsgeschiedenis
 * 
 * Bronnen:
 * - CoinGecko API: https://www.coingecko.com/en/api/documentation
 * - Chart.js: https://www.chartjs.org/docs/latest/
 */

import { fetchCoinsList, fetchGlobalData, fetchCoinDetails, fetchCoinMarketChart, fetchFavoriteCoins } from './api.js';
import { formatCurrency, formatPercentage, formatSupply, debounce, getChangeColor } from './utils.js';

// DOM Elementen
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

// Applicatie status
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

/**
 * Initialiseer de applicatie
 * Demonstreert: Async/Await, Event Listeners
 */
async function initApp() {
  console.log('CryptoTracker applicatie initialiseren...');
  
  // Event listeners instellen
  setupEventListeners();
  
  // Thema initialiseren
  initTheme();
  
  // Routing afhandelen op basis van URL hash
  handleRouting();
  
  // Luisteren naar hash-wijzigingen
  window.addEventListener('hashchange', handleRouting);
}

/**
 * Alle event listeners voor de applicatie instellen
 * Demonstreert: DOM Event Binding, Arrow Functions, Callback Functions
 */
function setupEventListeners() {
  // Thema schakelaar
  themeToggle.addEventListener('click', toggleTheme);
  
  // Zoekinvoer met debounce voor betere prestaties
  searchInput.addEventListener('input', debounce(handleSearch, 300));
  
  // Filter selectie
  filterSelect.addEventListener('change', handleFilter);
  
  // Sorteer selectie
  sortSelect.addEventListener('change', handleSort);
  
  // Paginering
  prevPageButton.addEventListener('click', goToPrevPage);
  nextPageButton.addEventListener('click', goToNextPage);
  
  // Navigatie links
  document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = e.currentTarget.getAttribute('data-view');
      navigateTo(view);
    });
  });
  
  // Terug knoppen
  if (backToHomeButton) {
    backToHomeButton.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('home');
    });
  }
  
  if (backToHomeFromFavorites) {
    backToHomeFromFavorites.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('home');
    });
  }
}

/**
 * Thema initialiseren op basis van gebruikersvoorkeur
 * Demonstreert: Observer API (matchMedia), LocalStorage
 */
function initTheme() {
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

/**
 * Schakelen tussen licht en donker thema
 * Demonstreert: DOM Manipulatie, LocalStorage
 */
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
}

/**
 * Routing afhandelen op basis van URL hash
 * Demonstreert: Async/Await, Client-side Routing
 */
async function handleRouting() {
  const hash = window.location.hash.substring(1); // Verwijder het # symbool
  
  if (hash.startsWith('coin/')) {
    const coinId = hash.split('/')[1];
    state.currentView = 'coin-detail';
    state.currentCoinId = coinId;
    showView('coin-detail');
    await loadCoinDetails(coinId);
  } else if (hash === 'favorites') {
    state.currentView = 'favorites';
    state.currentCoinId = null;
    showView('favorites');
    await loadFavoritesData();
  } else {
    state.currentView = 'home';
    state.currentCoinId = null;
    showView('home');
    await loadHomeData();
  }
}

/**
 * Navigeren naar een specifieke weergave
 * Demonstreert: Client-side Routing
 */
function navigateTo(view, params = {}) {
  if (view === 'home') {
    window.location.hash = '';
  } else if (view === 'coin-detail' && params.coinId) {
    window.location.hash = `coin/${params.coinId}`;
  } else if (view === 'favorites') {
    window.location.hash = 'favorites';
  }
}

/**
 * Een specifieke weergave tonen en anderen verbergen
 * Demonstreert: DOM Manipulatie
 */
function showView(view) {
  // Alle weergaven verbergen
  homeView.style.display = 'none';
  coinDetailView.style.display = 'none';
  if (favoritesView) favoritesView.style.display = 'none';
  
  // De gevraagde weergave tonen
  if (view === 'home') {
    homeView.style.display = 'block';
  } else if (view === 'coin-detail') {
    coinDetailView.style.display = 'block';
  } else if (view === 'favorites' && favoritesView) {
    favoritesView.style.display = 'block';
  }
}

/**
 * Home gegevens laden (marktoverzicht en muntenlijst)
 * Demonstreert: Async/Await, Foutafhandeling, Promises
 */
async function loadHomeData() {
  try {
    // Laadstatus tonen
    showLoadingState();
    
    // Globale marktgegevens ophalen
    const globalData = await fetchGlobalData();
    updateMarketOverview(globalData);
    
    // Muntenlijst ophalen
    const coins = await fetchCoinsList(1, 100);
    if (coins && coins.length > 0) {
      state.coins = coins;
      state.filteredCoins = [...coins];
      
      // De tabel renderen
      renderTable();
    } else {
      showErrorState("Kon cryptocurrency gegevens niet laden. Probeer het later opnieuw.");
    }
    
    // Laadstatus verbergen
    hideLoadingState();
  } catch (error) {
    console.error('Fout bij laden home gegevens:', error);
    showErrorState(error.message || "Kon gegevens niet laden. Controleer je verbinding en probeer opnieuw.");
  }
}

/**
 * Favorieten gegevens laden
 * Demonstreert: Async/Await, Foutafhandeling, DOM Manipulatie
 */
async function loadFavoritesData() {
  try {
    if (!favoritesTableBody) return;
    
    // Laadstatus tonen
    favoritesTableBody.innerHTML = '<tr><td colspan="6" class="loading-message">Je favoriete cryptocurrencies laden...</td></tr>';
    
    // Favorieten ophalen uit localStorage
    const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    // Als er geen favorieten zijn, bericht tonen
    if (favoriteIds.length === 0) {
      if (noFavoritesMessage) {
        noFavoritesMessage.style.display = 'block';
      }
      favoritesTableBody.innerHTML = '';
      return;
    }
    
    // Geen favorieten bericht verbergen
    if (noFavoritesMessage) {
      noFavoritesMessage.style.display = 'none';
    }
    
    // Favoriete munten gegevens ophalen
    const favoriteCoins = await fetchFavoriteCoins(favoriteIds);
    state.favoriteCoins = favoriteCoins;
    
    // Favorieten tabel renderen
    renderFavoritesTable();
  } catch (error) {
    console.error('Fout bij laden favorieten gegevens:', error);
    if (favoritesTableBody) {
      favoritesTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="error-message">
            Fout bij laden favorieten: ${error.message || "Onbekende fout"}
            <button onclick="window.location.reload()" class="retry-button">Opnieuw proberen</button>
          </td>
        </tr>
      `;
    }
  }
}

/**
 * Favorieten tabel renderen
 * Demonstreert: DOM Manipulatie, Template Literals, Array Methods
 */
function renderFavoritesTable() {
  if (!favoritesTableBody) return;
  
  // Tabel body leegmaken
  favoritesTableBody.innerHTML = '';
  
  // Als er geen favoriete munten zijn om weer te geven
  if (state.favoriteCoins.length === 0) {
    const noResultsRow = document.createElement('tr');
    noResultsRow.innerHTML = `
      <td colspan="6" class="no-results">Je hebt nog geen favorieten toegevoegd.</td>
    `;
    favoritesTableBody.appendChild(noResultsRow);
    return;
  }
  
  // Tabelrijen aanmaken
  state.favoriteCoins.forEach(coin => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td class="rank-col">
        <span class="rank">${coin.market_cap_rank || '-'}</span>
        <button class="favorite-button favorited" data-coin-id="${coin.id}">
          ★
        </button>
      </td>
      <td class="name-col">
        <a href="#coin/${coin.id}" class="coin-link">
          <img src="${coin.image}" alt="${coin.name}" class="coin-icon">
          <div class="coin-name-container">
            <span class="coin-name">${coin.name}</span>
            <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
          </div>
        </a>
      </td>
      <td class="price-col">${formatCurrency(coin.current_price)}</td>
      <td class="change-col">
        <span style="color: ${getChangeColor(coin.price_change_percentage_24h)}">
          ${formatPercentage(coin.price_change_percentage_24h)}
        </span>
      </td>
      <td class="market-cap-col">${formatCurrency(coin.market_cap)}</td>
      <td class="volume-col">${formatCurrency(coin.total_volume)}</td>
    `;
    
    favoritesTableBody.appendChild(row);
  });
  
  // Event listeners toevoegen aan favorieten knoppen
  document.querySelectorAll('.favorite-button').forEach(button => {
    button.addEventListener('click', toggleFavorite);
  });
}

/**
 * Muntdetails laden voor een specifieke cryptocurrency
 * Demonstreert: Async/Await, Foutafhandeling, DOM Manipulatie
 */
async function loadCoinDetails(coinId) {
  try {
    // Laadstatus tonen
    document.querySelector('.coin-detail-container').classList.add('loading');
    
    // Munt gegevens ophalen
    const coinData = await fetchCoinDetails(coinId);
    const chartData = await fetchCoinMarketChart(coinId, 30);
    
    // Muntdetails renderen
    renderCoinDetails(coinData);
    
    // Prijsgrafiek renderen
    renderPriceChart(chartData);
    
    // Laadstatus verwijderen
    document.querySelector('.coin-detail-container').classList.remove('loading');
  } catch (error) {
    console.error('Fout bij laden muntdetails:', error);
    document.querySelector('.coin-detail-container').innerHTML = `
      <div class="error-message">
        <h2>Fout bij laden muntgegevens</h2>
        <p>${error.message || "Kon muntdetails niet laden. Probeer het later opnieuw."}</p>
        <button onclick="window.location.hash = ''" class="retry-button">Terug naar Startpagina</button>
      </div>
    `;
  }
}

/**
 * Marktoverzicht bijwerken met globale gegevens
 * Demonstreert: DOM Manipulatie, Object Destructuring
 */
function updateMarketOverview(data) {
  if (!data || !data.data) {
    console.error('Ongeldig formaat globale gegevens:', data);
    return;
  }
  
  const { total_market_cap, total_volume, market_cap_percentage, active_cryptocurrencies } = data.data;
  
  totalMarketCap.textContent = formatCurrency(total_market_cap.eur || total_market_cap.usd);
  totalVolume.textContent = formatCurrency(total_volume.eur || total_volume.usd);
  btcDominance.textContent = formatPercentage(market_cap_percentage.btc);
  activeCryptocurrencies.textContent = active_cryptocurrencies.toLocaleString('nl-NL');
}

/**
 * De cryptocurrency tabel renderen
 * Demonstreert: DOM Manipulatie, Template Literals, Array Iteratie, Conditionele (Ternary) Operator
 */
function renderTable() {
  // Tabel body leegmaken
  cryptoTableBody.innerHTML = '';
  
  // Paginering berekenen
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const paginatedCoins = state.filteredCoins.slice(startIndex, endIndex);
  
  // Paginering info bijwerken
  updatePaginationInfo();
  
  // Als er geen munten zijn om weer te geven
  if (paginatedCoins.length === 0) {
    const noResultsRow = document.createElement('tr');
    noResultsRow.innerHTML = `
      <td colspan="6" class="no-results">Geen cryptocurrencies gevonden die aan je criteria voldoen.</td>
    `;
    cryptoTableBody.appendChild(noResultsRow);
    return;
  }
  
  // Tabelrijen aanmaken
  paginatedCoins.forEach(coin => {
    const row = document.createElement('tr');
    const isFavorite = state.favorites.includes(coin.id);
    
    row.innerHTML = `
      <td class="rank-col">
        <span class="rank">${coin.market_cap_rank || '-'}</span>
        <button class="favorite-button ${isFavorite ? 'favorited' : ''}" data-coin-id="${coin.id}">
          ${isFavorite ? '★' : '☆'}
        </button>
      </td>
      <td class="name-col">
        <a href="#coin/${coin.id}" class="coin-link">
          <img src="${coin.image}" alt="${coin.name}" class="coin-icon">
          <div class="coin-name-container">
            <span class="coin-name">${coin.name}</span>
            <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
          </div>
        </a>
      </td>
      <td class="price-col">${formatCurrency(coin.current_price)}</td>
      <td class="change-col">
        <span style="color: ${getChangeColor(coin.price_change_percentage_24h)}">
          ${formatPercentage(coin.price_change_percentage_24h)}
        </span>
      </td>
      <td class="market-cap-col">${formatCurrency(coin.market_cap)}</td>
      <td class="volume-col">${formatCurrency(coin.total_volume)}</td>
    `;
    
    cryptoTableBody.appendChild(row);
  });
  
  // Event listeners toevoegen aan favorieten knoppen
  document.querySelectorAll('.favorite-button').forEach(button => {
    button.addEventListener('click', toggleFavorite);
  });
}

/**
 * Muntdetails renderen
 * Demonstreert: DOM Manipulatie, Template Literals, Conditionele Logica
 */
function renderCoinDetails(coin) {
  // Munt logo instellen
  document.getElementById('coin-logo').src = coin.image.small;
  document.getElementById('coin-logo').alt = `${coin.name} logo`;
  
  // Munt naam instellen
  document.getElementById('coin-name').textContent = coin.name;
  
  // Munt prijs instellen
  document.getElementById('coin-price').textContent = formatCurrency(coin.market_data.current_price.eur || coin.market_data.current_price.usd);
  
  // Prijsverandering percentage instellen
  const priceChange = coin.market_data.price_change_percentage_24h;
  const coinChangeElement = document.getElementById('coin-change');
  coinChangeElement.textContent = formatPercentage(priceChange);
  coinChangeElement.className = 'coin-change';
  coinChangeElement.classList.add(priceChange >= 0 ? 'positive' : 'negative');
  
  // Marktkapitalisatie instellen
  document.getElementById('market-cap').textContent = formatCurrency(coin.market_data.market_cap.eur || coin.market_data.market_cap.usd);
  
  // 24u volume instellen
  document.getElementById('volume').textContent = formatCurrency(coin.market_data.total_volume.eur || coin.market_data.total_volume.usd);
  
  // Overzicht instellen
  document.getElementById('overview').innerHTML = coin.description.en
    ? `<p>${coin.description.en.split('. ').slice(0, 3).join('. ')}.</p>`
    : '<p>Geen beschrijving beschikbaar voor deze cryptocurrency.</p>';
}

/**
 * Prijsgrafiek renderen met Chart.js
 * Demonstreert: Integratie van externe bibliotheek, Array Methods (map)
 * Bron: Chart.js - https://www.chartjs.org/docs/latest/
 */
function renderPriceChart(chartData) {
  const ctx = document.getElementById('price-chart').getContext('2d');
  
  // Bestaande grafiek wissen
  if (window.priceChart) {
    window.priceChart.destroy();
  }
  
  // Grafiekgegevens formatteren
  const labels = chartData.prices.map(price => new Date(price[0]).toLocaleDateString('nl-NL'));
  const data = chartData.prices.map(price => price[1]);
  
  // Grafiekkleur bepalen op basis van prijstrend
  const startPrice = data[0];
  const endPrice = data[data.length - 1];
  const chartColor = endPrice >= startPrice ? '#00b894' : '#e74c3c';
  
  // Grafiek aanmaken
  window.priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Prijs (EUR)',
        data: data,
        borderColor: chartColor,
        backgroundColor: `${chartColor}20`,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return `€${context.raw.toLocaleString('nl-NL', { maximumFractionDigits: 2 }).replace('.', ',')}`;
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          },
          ticks: {
            maxTicksLimit: 5,
            color: '#718096'
          }
        },
        y: {
          display: true,
          grid: {
            color: '#2d3748',
            drawBorder: false
          },
          ticks: {
            color: '#718096',
            callback: function(value) {
              return '€' + value.toLocaleString('nl-NL', { maximumFractionDigits: 0 }).replace('.', ',');
            }
          }
        }
      }
    }
  });
}

/**
 * Favoriete status voor een munt in-/uitschakelen
 * Demonstreert: Event Handling, LocalStorage, DOM Manipulatie
 */
function toggleFavorite(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const button = event.currentTarget;
  const coinId = button.dataset.coinId;
  
  if (state.favorites.includes(coinId)) {
    // Uit favorieten verwijderen
    state.favorites = state.favorites.filter(id => id !== coinId);
    button.classList.remove('favorited');
    button.textContent = '☆';
  } else {
    // Aan favorieten toevoegen
    state.favorites.push(coinId);
    button.classList.add('favorited');
    button.textContent = '★';
  }
  
  // Opslaan in localStorage
  localStorage.setItem('favorites', JSON.stringify(state.favorites));
  
  // Als we op de favorieten pagina zijn, de weergave bijwerken
  if (state.currentView === 'favorites') {
    loadFavoritesData();
  }
  
  // Als we momenteel filteren op favorieten, de tabel bijwerken
  if (state.filterType === 'favorites') {
    handleFilter();
  }
}

/**
 * Zoekinvoer afhandelen
 * Demonstreert: Formuliervalidatie, State Management
 */
function handleSearch() {
  state.searchTerm = searchInput.value.toLowerCase().trim();
  filterAndSortCoins();
  state.currentPage = 1;
  renderTable();
}

/**
 * Filterwijziging afhandelen
 * Demonstreert: Event Handling, State Management
 */
function handleFilter() {
  state.filterType = filterSelect.value;
  filterAndSortCoins();
  state.currentPage = 1;
  renderTable();
}

/**
 * Sorteerwijziging afhandelen
 * Demonstreert: Event Handling, State Management
 */
function handleSort() {
  state.sortType = sortSelect.value;
  filterAndSortCoins();
  renderTable();
}

/**
 * Munten filteren en sorteren op basis van huidige status
 * Demonstreert: Array Methods (filter, sort), Arrow Functions
 */
function filterAndSortCoins() {
  // Eerst de munten filteren
  state.filteredCoins = state.coins.filter(coin => {
    // Zoekfilter toepassen
    const matchesSearch = 
      coin.name.toLowerCase().includes(state.searchTerm) || 
      coin.symbol.toLowerCase().includes(state.searchTerm);
    
    // Type filter toepassen
    let matchesFilter = true;
    if (state.filterType === 'favorites') {
      matchesFilter = state.favorites.includes(coin.id);
    } else if (state.filterType === 'gainers') {
      matchesFilter = coin.price_change_percentage_24h > 0;
    } else if (state.filterType === 'losers') {
      matchesFilter = coin.price_change_percentage_24h < 0;
    }
    
    return matchesSearch && matchesFilter;
  });
  
  // Daarna de gefilterde munten sorteren
  state.filteredCoins.sort((a, b) => {
    switch (state.sortType) {
      case 'market_cap_desc':
        return b.market_cap - a.market_cap;
      case 'market_cap_asc':
        return a.market_cap - b.market_cap;
      case 'price_desc':
        return b.current_price - a.current_price;
      case 'price_asc':
        return a.current_price - b.current_price;
      case 'volume_desc':
        return b.total_volume - a.total_volume;
      case 'volume_asc':
        return a.total_volume - b.total_volume;
      case 'change_desc':
        return b.price_change_percentage_24h - a.price_change_percentage_24h;
      case 'change_asc':
        return a.price_change_percentage_24h - b.price_change_percentage_24h;
      default:
        return b.market_cap - a.market_cap;
    }
  });
}

/**
 * Paginering informatie bijwerken
 * Demonstreert: DOM Manipulatie, Wiskundige bewerkingen
 */
function updatePaginationInfo() {
  const totalPages = Math.ceil(state.filteredCoins.length / state.itemsPerPage);
  pageInfo.textContent = `Pagina ${state.currentPage} van ${totalPages || 1}`;
  
  // Knopstatussen bijwerken
  prevPageButton.disabled = state.currentPage <= 1;
  nextPageButton.disabled = state.currentPage >= totalPages;
}

/**
 * Naar vorige pagina gaan
 * Demonstreert: Event Handling, State Management
 */
function goToPrevPage() {
  if (state.currentPage > 1) {
    state.currentPage--;
    renderTable();
    window.scrollTo(0, 0);
  }
}

/**
 * Naar volgende pagina gaan
 * Demonstreert: Event Handling, State Management
 */
function goToNextPage() {
  const totalPages = Math.ceil(state.filteredCoins.length / state.itemsPerPage);
  if (state.currentPage < totalPages) {
    state.currentPage++;
    renderTable();
    window.scrollTo(0, 0);
  }
}

/**
 * Laadstatus tonen
 * Demonstreert: DOM Manipulatie
 */
function showLoadingState() {
  cryptoTableBody.innerHTML = `
    <tr class="loading-row">
      <td colspan="6" class="loading-message">Cryptocurrency gegevens laden...</td>
    </tr>
  `;
}

/**
 * Laadstatus verbergen
 * Demonstreert: DOM Manipulatie
 */
function hideLoadingState() {
  // Laadstatus wordt automatisch verborgen wanneer de tabel wordt gerenderd
}

/**
 * Foutstatus tonen
 * Demonstreert: DOM Manipulatie, Foutafhandeling
 */
function showErrorState(message) {
  cryptoTableBody.innerHTML = `
    <tr class="error-row">
      <td colspan="6" class="error-message">
        ${message}
        <button onclick="window.location.reload()" class="retry-button">Opnieuw proberen</button>
      </td>
    </tr>
  `;
}

// Initialiseer de applicatie wanneer de DOM volledig is geladen
document.addEventListener('DOMContentLoaded', initApp);

// Functies exporteren voor testen
export {
  initApp,
  toggleTheme,
  handleRouting,
  loadHomeData,
  loadCoinDetails,
  renderTable,
  toggleFavorite
};
