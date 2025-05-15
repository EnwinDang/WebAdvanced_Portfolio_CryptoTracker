export function renderCards(coins, favorites) {
  const container = document.getElementById('coin-cards');
  container.innerHTML = '';

  function formatNumber(value) {
    if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B';
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(2) + 'K';
    return value.toString();
  }

  coins.forEach((coin) => {
    const isFavorite = favorites.includes(coin.id);
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
      <button class="favorite-btn" data-id="${coin.id}">
        ${isFavorite ? '★' : '☆'}
      </button>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('favorite-btn')) return;
      window.location.hash = `#coin-${coin.id}`;
    });

    container.appendChild(card);
  });
}

export async function showCoinDetail(coinId) {
  document.getElementById('coin-cards').classList.add('hidden');
  document.getElementById('filter-section').classList.add('hidden');
  document.getElementById('favorites-view').classList.add('hidden');
  document.getElementById('detail-view').classList.remove('hidden');

  const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&sparkline=true`);
  const coin = await res.json();

  const formatNumber = (value) => {
    if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B';
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(2) + 'K';
    return value.toString();
  };

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
      </div>
      <div class="detail-chart">
        <canvas id="coinChart"></canvas>
      </div>
    </div>
    <div class="description">
      <h3>Beschrijving</h3>
      <div class="description-text"></div>
    </div>
  `;

  document.querySelector('.description-text').innerHTML = coin.description.en || 'Geen beschrijving beschikbaar.';

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
