/**
 * Utility functions for formatting and data handling
 */

// Format currency values
export function formatCurrency(value) {
  if (value === null || value === undefined) return '$0.00';
  
  // Handle different value ranges
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  } else if (value >= 1) {
    return `$${value.toFixed(2)}`;
  } else {
    // For very small values, use more decimal places
    return `$${value.toFixed(6)}`;
  }
}

// Format percentage values
export function formatPercentage(value) {
  if (value === null || value === undefined) return '0.00%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

// Format supply values
export function formatSupply(value, symbol) {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toLocaleString()} ${symbol}`;
}

// Get color based on price change
export function getChangeColor(change) {
  if (change === null || change === undefined) return 'var(--text-color)';
  return change >= 0 ? 'var(--positive-color)' : 'var(--negative-color)';
}

// Debounce function for search input
export function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Format date for chart labels
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Truncate text with ellipsis
export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Parse URL parameters
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

// Generate random color for charts
export function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
