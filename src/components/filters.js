export function setupFilters(coins, favorites, renderCards) {
  const searchInput = document.querySelector('#search-input');
  const marketCapFilter = document.querySelector('#market-cap-filter');
  const sortSelect = document.querySelector('#sort-select');

  function applyFilters() {
    const query = searchInput.value.toLowerCase();
    const cap = marketCapFilter.value;
    const sort = sortSelect.value;

    let filtered = coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query)
    );

    if (cap === 'large') {
      filtered = filtered.filter((coin) => coin.market_cap > 10000000000);
    } else if (cap === 'medium') {
      filtered = filtered.filter((coin) => coin.market_cap <= 10000000000 && coin.market_cap > 1000000000);
    } else if (cap === 'small') {
      filtered = filtered.filter((coin) => coin.market_cap <= 1000000000);
    }

    if (sort === 'name-asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'name-desc') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sort === 'price-asc') {
      filtered.sort((a, b) => a.current_price - b.current_price);
    } else if (sort === 'price-desc') {
      filtered.sort((a, b) => b.current_price - a.current_price);
    }

    renderCards(filtered, favorites);
  }

  searchInput.addEventListener('input', applyFilters);
  marketCapFilter.addEventListener('change', applyFilters);
  sortSelect.addEventListener('change', applyFilters);
}
