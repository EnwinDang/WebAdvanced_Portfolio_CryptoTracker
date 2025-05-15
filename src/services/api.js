export async function fetchCoins(currency = 'eur', perPage = 50, page = 1) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch coin data');
  }
  return await response.json();
}
