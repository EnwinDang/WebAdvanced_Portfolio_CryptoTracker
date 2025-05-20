/**
 * Hulpfuncties voor formattering en gegevensverwerking
 */

// Valuta waarden formatteren
export function formatCurrency(value) {
  if (value === null || value === undefined) return '€0,00';
  
  // Verschillende waardebereiken afhandelen
  if (value >= 1e9) {
    return `€${(value / 1e9).toFixed(2).replace('.', ',')}B`;
  } else if (value >= 1e6) {
    return `€${(value / 1e6).toFixed(2).replace('.', ',')}M`;
  } else if (value >= 1e3) {
    return `€${(value / 1e3).toFixed(2).replace('.', ',')}K`;
  } else if (value >= 1) {
    return `€${value.toFixed(2).replace('.', ',')}`;
  } else {
    // Voor zeer kleine waarden, meer decimalen gebruiken
    return `€${value.toFixed(6).replace('.', ',')}`;
  }
}

// Percentagewaarden formatteren
export function formatPercentage(value) {
  if (value === null || value === undefined) return '0,00%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2).replace('.', ',')}%`;
}

// Voorraadwaarden formatteren
export function formatSupply(value, symbol) {
  if (value === null || value === undefined) return 'N/B';
  return `${value.toLocaleString('nl-NL')} ${symbol}`;
}

// Kleur krijgen op basis van prijsverandering
export function getChangeColor(change) {
  if (change === null || change === undefined) return 'var(--text-color)';
  return change >= 0 ? 'var(--positive-color)' : 'var(--negative-color)';
}

// Debounce functie voor zoekinvoer
export function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Datum formatteren voor grafiek labels
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' });
}

// Tekst afkappen met ellipsis
export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// URL-parameters analyseren
export function getUrlParams() {
  const params = {};
  const hash = window.location.hash.substring(1);
  
  if (hash.includes('/')) {
    const [view, id] = hash.split('/');
    params.view = view;
    params.id = id;
  } else if (hash) {
    params.view = hash;
  } else {
    params.view = 'home';
  }
  
  return params;
}

// Willekeurige kleur genereren voor grafieken
export function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
