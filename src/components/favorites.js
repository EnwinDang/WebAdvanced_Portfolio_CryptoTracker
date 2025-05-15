import { getFavorites, saveFavorites } from '../services/storage.js';

export function setupFavorites() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('favorite-btn')) {
      const coinId = e.target.dataset.id;
      let favorites = getFavorites();
      if (favorites.includes(coinId)) {
        favorites = favorites.filter((id) => id !== coinId);
      } else {
        favorites.push(coinId);
      }
      saveFavorites(favorites);
      e.target.textContent = favorites.includes(coinId) ? '★' : '☆';
    }
  });
}
