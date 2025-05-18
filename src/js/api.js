// API-klasse om data op te halen van CoinGecko
class CoinGeckoAPI {
  constructor() {
    // Basis-URL voor alle CoinGecko-aanvragen
    this.baseUrl = 'https://api.coingecko.com/api/v3';
  }

  // Haal lijst van munten op met marktgegevens (in euro)
  async fetchCoinsList(page = 1, perPage = 100) {
    try {
      const response = await fetch(
        `${this.baseUrl}/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h`
      );
      if (!response.ok) throw new Error(`API fout: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Fout bij ophalen van muntenlijst:', error);
      throw error;
    }
  }

  // Haal globale marktgegevens op
  async fetchGlobalData() {
    try {
      const response = await fetch(`${this.baseUrl}/global`);
      if (!response.ok) throw new Error(`API fout: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Fout bij ophalen van globale gegevens:', error);
      throw error;
    }
  }

  // Haal gedetailleerde info op van één specifieke munt
  async fetchCoinDetails(coinId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
      );
      if (!response.ok) throw new Error(`API fout: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Fout bij ophalen van details voor munt ${coinId}:`, error);
      throw error;
    }
  }

  // Haal prijshistoriek op voor grafiek (in euro)
  async fetchCoinMarketChart(coinId, days = 7) {
    try {
      const response = await fetch(
        `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=eur&days=${days}`
      );
      if (!response.ok) throw new Error(`API fout: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Fout bij ophalen van markgrafiek voor munt ${coinId}:`, error);
      throw error;
    }
  }
}

// Maak een instantie van de API klasse aan
const coinGeckoAPI = new CoinGeckoAPI();

// Exporteer de functies voor gebruik in andere bestanden
export const fetchCoinsList = (page, perPage) => coinGeckoAPI.fetchCoinsList(page, perPage);
export const fetchGlobalData = () => coinGeckoAPI.fetchGlobalData();
export const fetchCoinDetails = (coinId) => coinGeckoAPI.fetchCoinDetails(coinId);
export const fetchCoinMarketChart = (coinId, days) => coinGeckoAPI.fetchCoinMarketChart(coinId, days);
