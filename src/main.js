import { fetchCoins } from './services/api.js';
import { renderCards } from './components/table.js';
import { setupFilters } from './components/filters.js';
import { setupFavorites } from './components/favorites.js';
import { getFavorites } from './services/storage.js';
import Chart from 'chart.js/auto';

function formatNumber(value) {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B';
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M';
  if (value >= 1_000) return (value / 1_000).toFixed(2) + 'K';
  return value.toString();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggleInput = document.getElementById('theme-toggle');
  toggleInput.checked = theme === 'dark';
}

function initThemeToggle() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  const toggleInput = document.getElementById('theme-toggle');
  toggleInput.addEventListener('change', () => {
    const newTheme = toggleInput.checked ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });
}

function showFavoritesView(allCoins) {
  const favorites = getFavorites();
  const favCoins = allCoins.filter((coin) => favorites.includes(coin.id));
  const container = document.getElementById('favorites-view');
  container.innerHTML = '';
  favCoins.forEach((coin) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <img src="${coin.image}" alt="${coin.name}" class="coin-img" />
      <h2>${coin.name}</h2>
      <p><strong>Symbool:</strong> ${coin.symbol.toUpperCase()}</p>
      <p><strong>Prijs:</strong> €${formatNumber(coin.current_price)}</p>
      <p><strong>Marktkap:</strong> €${formatNumber(coin.market_cap)}</p>
      <p class="${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
        <strong>24u:</strong> ${coin.price_change_percentage_24h.toFixed(2)}%
      </p>
      <button class="favorite-btn" data-id="${coin.id}">★</button>
    `;
    card.addEventListener('click', () => {
      window.location.hash = `#coin-${coin.id}`;
    });
    container.appendChild(card);
  });
}

async function showCoinDetail(coinId) {
  document.getElementById('coin-cards').classList.add('hidden');
  document.getElementById('filter-section').classList.add('hidden');
  document.getElementById('favorites-view').classList.add('hidden');
  document.getElementById('detail-view').classList.remove('hidden');

  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&sparkline=true`);
  const coin = await res.json();

  const container = document.getElementById('detail-view');
  container.innerHTML = `
    <div class="detail-grid">
      <div class="detail-info">
        <h2>${coin.name}</h2>
        <p><strong>Symbool:</strong> ${coin.symbol.toUpperCase()}</p>
        <p><strong>Prijs:</strong> €${formatNumber(coin.market_data.current_price.eur)}</p>
        <p><strong>Marktkap:</strong> €${formatNumber(coin.market_data.market_cap.eur)}</p>
        <p><strong>Volume:</strong> €${formatNumber(coin.market_data.total_volume.eur)}</p>
        <p><strong>ATH:</strong> €${formatNumber(coin.market_data.ath.eur)}</p>
        <p><strong>ATL:</strong> €${formatNumber(coin.market_data.atl.eur)}</p>
        <p><strong>Genesis datum:</strong> ${coin.genesis_date || 'Onbekend'}</p>
        <p><strong>In omloop:</strong> ${formatNumber(coin.market_data.circulating_supply)}</p>
        <p><strong>Website:</strong> <a href="${coin.links.homepage[0]}" target="_blank">${coin.links.homepage[0]}</a></p>
        <p><strong>Explorer:</strong> <a href="${coin.links.blockchain_site[0]}" target="_blank">Bekijk explorer</a></p>
        <p><strong>Beschrijving:</strong></p>
        <p>${coin.description.en?.slice(0, 500) || 'Geen beschrijving beschikbaar.'}</p>
      </div>
      <div class="detail-chart">
        <canvas id="coinChart"></canvas>
      </div>
    </div>
  `;

  const sparkline = coin.market_data.sparkline_7d.price;
  new Chart(document.getElementById('coinChart').getContext('2d'), {
    type: 'line',
    data: {
      labels: sparkline.map((_, i) => i),
      datasets: [{
        label: '7d prijs',
        data: sparkline,
        borderColor: 'purple',
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { display: false },
        y: { beginAtZero: false }
      }
    }
  });
}


window.addEventListener('hashchange', () => {
  const hash = window.location.hash;
  if (hash.startsWith('#coin-')) {
    const coinId = hash.replace('#coin-', '');
    showCoinDetail(coinId);
  } else {
    document.getElementById('coin-cards').classList.remove('hidden');
    document.getElementById('filter-section').classList.remove('hidden');
    document.getElementById('favorites-view').classList.add('hidden');
    document.getElementById('detail-view').classList.add('hidden');
  }
});

async function init() {
  const allCoins = await fetchCoins();
  const favorites = getFavorites();

  renderCards(allCoins, favorites);
  setupFilters(allCoins, favorites, renderCards);
  setupFavorites();
  initThemeToggle();

  const toggleBtn = document.getElementById('toggle-view');
  toggleBtn.addEventListener('click', () => {
    const mainView = document.getElementById('coin-cards');
    const favView = document.getElementById('favorites-view');
    const filterSection = document.getElementById('filter-section');
    mainView.classList.toggle('hidden');
    favView.classList.toggle('hidden');
    filterSection.classList.toggle('hidden');

    if (!favView.classList.contains('hidden')) {
      toggleBtn.textContent = '🔙 Terug naar overzicht';
      showFavoritesView(allCoins);
    } else {
      toggleBtn.textContent = '⭐ Watchlist';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('header h1');
  if (title) {
    title.style.cursor = 'pointer';
    title.addEventListener('click', () => {
      window.location.hash = '';
    });
  }
});

init();
