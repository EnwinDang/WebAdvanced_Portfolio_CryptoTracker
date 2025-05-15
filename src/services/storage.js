export function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites')) || [];
}

export function saveFavorites(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}
