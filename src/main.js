/* 
 Bronnen:
 - CoinGecko API: https://www.coingecko.com/en/api/documentation
 - Chart.js: https://www.chartjs.org/docs/latest/
 */

import { fetchCoinsList, fetchGlobalData, fetchCoinDetails, fetchCoinMarketChart } from './js/api.js';
import { formatCurrency, formatPercentage, formatSupply, debounce, getChangeColor } from './js/utils.js';

// DOM Elements
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
const backToHomeButton = document.getElementById('back-to-home');

// Application state
let state = {
  currentView: 'home',
  currentCoinId: null,
  coins: [],
  filteredCoins: [],
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
  currentPage: 1,
  itemsPerPage: 20,
  searchTerm: '',
  filterType: 'all',
  sortType: 'market_cap_desc'
};

/**
 * Initialize the application
 * Demonstrates: Async/Await, Event Listeners
 */
async function initApp() {
  // Set up event listeners
  setupEventListeners();
  
  // Initialize theme
  initTheme();
  
  // Handle routing based on URL hash
  handleRouting();
  
  // Listen for hash changes
  window.addEventListener('hashchange', handleRouting);
}

/**
 * Set up all event listeners for the application
 * Demonstrates: DOM Event Binding, Arrow Functions, Callback Functions
 */
function setupEventListeners() {
  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);
  
  // Search input with debounce to improve performance
  searchInput.addEventListener('input', debounce(handleSearch, 300));
  
  // Filter select
  filterSelect.addEventListener('change', handleFilter);
  
  // Sort select
  sortSelect.addEventListener('change', handleSort);
  
  // Pagination
  prevPageButton.addEventListener('click', goToPrevPage);
  nextPageButton.addEventListener('click', goToNextPage);
  
  // Navigation links
  document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = e.currentTarget.getAttribute('data-view');
      navigateTo(view);
    });
  });
  
  // Back button
  backToHomeButton.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('home');
  });
}

/**
 * Initialize theme based on user preference
 * Demonstrates: Observer API (matchMedia), LocalStorage
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
 * Toggle between light and dark theme
 * Demonstrates: DOM Manipulation, LocalStorage
 */
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
}

/**
 * Handle routing based on URL hash
 * Demonstrates: Async/Await, Client-side Routing
 */
async function handleRouting() {
  const hash = window.location.hash.substring(1); // Remove the # symbol
  
  if (hash.startsWith('coin/')) {
    const coinId = hash.split('/')[1];
    state.currentView = 'coin-detail';
    state.currentCoinId = coinId;
    showView('coin-detail');
    await loadCoinDetails(coinId);
  } else {
    state.currentView = 'home';
    state.currentCoinId = null;
    showView('home');
    await loadHomeData();
  }
}

/**
 * Navigate to a specific view
 * Demonstrates: Client-side Routing
 */
function navigateTo(view, params = {}) {
  if (view === 'home') {
    window.location.hash = '';
  } else if (view === 'coin-detail' && params.coinId) {
    window.location.hash = `coin/${params.coinId}`;
  }
}

/**
 * Show a specific view and hide others
 * Demonstrates: DOM Manipulation
 */
function showView(view) {
  // Hide all views
  homeView.style.display = 'none';
  coinDetailView.style.display = 'none';
  
  // Show the requested view
  if (view === 'home') {
    homeView.style.display = 'block';
  } else if (view === 'coin-detail') {
    coinDetailView.style.display = 'block';
  }
}

/**
 * Load home data (market overview and coins list)
 * Demonstrates: Async/Await, Error Handling, Promises
 */
async function loadHomeData() {
  try {
    // Show loading state
    showLoadingState();
    
    // Fetch global market data
    const globalData = await fetchGlobalData();
    updateMarketOverview(globalData);
    
    // Fetch coins list
    const coins = await fetchCoinsList(1, 100);
    state.coins = coins;
    state.filteredCoins = [...coins];
    
    // Render the table
    renderTable();
    
    // Hide loading state
    hideLoadingState();
  } catch (error) {
    console.error('Error loading home data:', error);
    showErrorState(error.message);
  }
}

/**
 * Load coin details for a specific cryptocurrency
 * Demonstrates: Async/Await, Error Handling, DOM Manipulation
 */
async function loadCoinDetails(coinId) {
  try {
    // Show loading state
    document.querySelector('.coin-detail-container').classList.add('loading');
    
    // Fetch coin data
    const coinData = await fetchCoinDetails(coinId);
    const chartData = await fetchCoinMarketChart(coinId, 30);
    
    // Render coin details
    renderCoinDetails(coinData);
    
    // Render price chart
    renderPriceChart(chartData);
    
    // Remove loading state
    document.querySelector('.coin-detail-container').classList.remove('loading');
  } catch (error) {
    console.error('Error loading coin details:', error);
    document.querySelector('.coin-detail-container').innerHTML = `
      <div class="error-message">
        <h2>Error loading coin data</h2>
        <p>${error.message}</p>
        <button onclick="window.location.hash = ''" class="retry-button">Return to Homepage</button>
      </div>
    `;
  }
}

/**
 * Update market overview section with global data
 * Demonstrates: DOM Manipulation, Object Destructuring
 */
function updateMarketOverview(data) {
  const { total_market_cap, total_volume, market_cap_percentage, active_cryptocurrencies } = data.data;
  
  totalMarketCap.textContent = formatCurrency(total_market_cap.usd);
  totalVolume.textContent = formatCurrency(total_volume.usd);
  btcDominance.textContent = formatPercentage(market_cap_percentage.btc);
  activeCryptocurrencies.textContent = active_cryptocurrencies.toLocaleString();
}

/**
 * Render the cryptocurrency table
 * Demonstrates: DOM Manipulation, Template Literals, Array Iteration, Conditional (Ternary) Operator
 */
function renderTable() {
  // Clear the table body
  cryptoTableBody.innerHTML = '';
  
  // Calculate pagination
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const paginatedCoins = state.filteredCoins.slice(startIndex, endIndex);
  
  // Update pagination info
  updatePaginationInfo();
  
  // If no coins to display
  if (paginatedCoins.length === 0) {
    const noResultsRow = document.createElement('tr');
    noResultsRow.innerHTML = `
      <td colspan="6" class="no-results">No cryptocurrencies found matching your criteria.</td>
    `;
    cryptoTableBody.appendChild(noResultsRow);
    return;
  }
  
  // Create table rows
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
  
  // Add event listeners to favorite buttons
  document.querySelectorAll('.favorite-button').forEach(button => {
    button.addEventListener('click', toggleFavorite);
  });
}

/**
 * Render coin details
 * Demonstrates: DOM Manipulation, Template Literals, Conditional Logic
 */
function renderCoinDetails(coin) {
  // Set coin logo
  document.getElementById('coin-logo').src = coin.image.small;
  document.getElementById('coin-logo').alt = `${coin.name} logo`;
  
  // Set coin name
  document.getElementById('coin-name').textContent = coin.name;
  
  // Set coin price
  document.getElementById('coin-price').textContent = formatCurrency(coin.market_data.current_price.usd);
  
  // Set price change percentage
  const priceChange = coin.market_data.price_change_percentage_24h;
  const coinChangeElement = document.getElementById('coin-change');
  coinChangeElement.textContent = formatPercentage(priceChange);
  coinChangeElement.className = 'coin-change';
  coinChangeElement.classList.add(priceChange >= 0 ? 'positive' : 'negative');
  
  // Set market cap
  document.getElementById('market-cap').textContent = formatCurrency(coin.market_data.market_cap.usd);
  
  // Set 24h volume
  document.getElementById('volume').textContent = formatCurrency(coin.market_data.total_volume.usd);
  
  // Set overview
  document.getElementById('overview').innerHTML = coin.description.en
    ? `<p>${coin.description.en.split('. ').slice(0, 3).join('. ')}.</p>`
    : '<p>No description available for this cryptocurrency.</p>';
}

/**
 * Render price chart using Chart.js
 * Demonstrates: Third-party Library Integration, Array Methods (map)
 * Source: Chart.js - https://www.chartjs.org/docs/latest/
 */
function renderPriceChart(chartData) {
  const ctx = document.getElementById('price-chart').getContext('2d');
  
  // Clear any existing chart
  if (window.priceChart) {
    window.priceChart.destroy();
  }
  
  // Format chart data
  const labels = chartData.prices.map(price => new Date(price[0]).toLocaleDateString());
  const data = chartData.prices.map(price => price[1]);
  
  // Determine chart color based on price trend
  const startPrice = data[0];
  const endPrice = data[data.length - 1];
  const chartColor = endPrice >= startPrice ? '#00b894' : '#e74c3c';
  
  // Create chart
  window.priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Price (USD)',
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
              return `$${context.raw.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
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
              return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
            }
          }
        }
      }
    }
  });
}

/**
 * Toggle favorite status for a coin
 * Demonstrates: Event Handling, LocalStorage, DOM Manipulation
 */
function toggleFavorite(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const button = event.currentTarget;
  const coinId = button.dataset.coinId;
  
  if (state.favorites.includes(coinId)) {
    // Remove from favorites
    state.favorites = state.favorites.filter(id => id !== coinId);
    button.classList.remove('favorited');
    button.textContent = '☆';
  } else {
    // Add to favorites
    state.favorites.push(coinId);
    button.classList.add('favorited');
    button.textContent = '★';
  }
  
  // Save to localStorage
  localStorage.setItem('favorites', JSON.stringify(state.favorites));
  
  // If currently filtering by favorites, update the table
  if (state.filterType === 'favorites') {
    handleFilter();
  }
}

/**
 * Handle search input
 * Demonstrates: Form Validation, State Management
 */
function handleSearch() {
  state.searchTerm = searchInput.value.toLowerCase().trim();
  filterAndSortCoins();
  state.currentPage = 1;
  renderTable();
}

/**
 * Handle filter change
 * Demonstrates: Event Handling, State Management
 */
function handleFilter() {
  state.filterType = filterSelect.value;
  filterAndSortCoins();
  state.currentPage = 1;
  renderTable();
}

/**
 * Handle sort change
 * Demonstrates: Event Handling, State Management
 */
function handleSort() {
  state.sortType = sortSelect.value;
  filterAndSortCoins();
  renderTable();
}

/**
 * Filter and sort coins based on current state
 * Demonstrates: Array Methods (filter, sort), Arrow Functions
 */
function filterAndSortCoins() {
  // First, filter the coins
  state.filteredCoins = state.coins.filter(coin => {
    // Apply search filter
    const matchesSearch = 
      coin.name.toLowerCase().includes(state.searchTerm) || 
      coin.symbol.toLowerCase().includes(state.searchTerm);
    
    // Apply type filter
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
  
  // Then, sort the filtered coins
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
        return 0;
    }
  });
}

/**
 * Update pagination information
 * Demonstrates: DOM Manipulation, Math Operations
 */
function updatePaginationInfo() {
  const totalPages = Math.ceil(state.filteredCoins.length / state.itemsPerPage);
  pageInfo.textContent = `Page ${state.currentPage} of ${totalPages || 1}`;
  
  // Update button states
  prevPageButton.disabled = state.currentPage <= 1;
  nextPageButton.disabled = state.currentPage >= totalPages;
}

/**
 * Go to previous page
 * Demonstrates: Event Handling, DOM Manipulation
 */
function goToPrevPage() {
  if (state.currentPage > 1) {
    state.currentPage--;
    renderTable();
    window.scrollTo(0, 0);
  }
}

/**
 * Go to next page
 * Demonstrates: Event Handling, DOM Manipulation
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
 * Show loading state
 * Demonstrates: DOM Manipulation, Template Literals
 */
function showLoadingState() {
  cryptoTableBody.innerHTML = `
    <tr class="loading-row">
      <td colspan="6" class="loading-message">Loading cryptocurrency data...</td>
    </tr>
  `;
}

/**
 * Hide loading state
 * This is handled by renderTable()
 */
function hideLoadingState() {
  // This is handled by renderTable()
}

/**
 * Show error state
 * Demonstrates: DOM Manipulation, Template Literals, Error Handling
 */
function showErrorState(message) {
  cryptoTableBody.innerHTML = `
    <tr class="error-row">
      <td colspan="6" class="error-message">
        Error loading data: ${message}
        <button onclick="location.reload()" class="retry-button">Retry</button>
      </td>
    </tr>
  `;
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
