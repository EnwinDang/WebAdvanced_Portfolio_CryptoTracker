// CoinGecko API integratie
/**
 * CoinGecko API integratie module
 * 
 * Dit bestand regelt alle API-aanroepen naar de CoinGecko cryptocurrency data API.
 * Het biedt methoden voor het ophalen van muntlijsten, globale marktgegevens,
 * muntdetails en historische prijsgegevens voor grafieken.
 * 
 * Bron: https://www.coingecko.com/en/api/documentation
 */

class CoinGeckoAPI {
  constructor() {
    this.baseUrl = 'https://api.coingecko.com/api/v3';
    this.apiKey = ''; // Voeg hier je API-sleutel toe als je er een hebt
  }

  /**
   * Haal lijst met munten en marktgegevens op
   * Demonstreert: Fetch API, Promises, Async/Await
   */
  async fetchCoinsList(page = 1, perPage = 100) {
    try {
      // Tijdstempel toevoegen om caching-problemen te voorkomen
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${this.baseUrl}/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h&timestamp=${timestamp}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API fout: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fout bij ophalen muntenlijst:', error);
      // Lege array teruggeven in plaats van een fout te gooien om crashes te voorkomen
      return [];
    }
  }

  /**
   * Haal globale marktgegevens op
   * Demonstreert: Fetch API, Foutafhandeling
   */
  async fetchGlobalData() {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${this.baseUrl}/global?timestamp=${timestamp}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API fout: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fout bij ophalen globale gegevens:', error);
      // Standaard datastructuur teruggeven om crashes te voorkomen
      return {
        data: {
          total_market_cap: { eur: 0 },
          total_volume: { eur: 0 },
          market_cap_percentage: { btc: 0 },
          active_cryptocurrencies: 0
        }
      };
    }
  }

  /**
   * Haalt gedetailleerde informatie op voor een specifieke munt
   * Demonstreert: Fetch API, Dynamische URL-parameters
   */
  async fetchCoinDetails(coinId) {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${this.baseUrl}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&timestamp=${timestamp}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API fout: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Fout bij ophalen details voor munt ${coinId}:`, error);
      throw error;
    }
  }

  /**
   * Haal marktgrafiekgegevens op voor een specifieke munt
   * Demonstreert: Fetch API, Query-parameters
   */
  async fetchCoinMarketChart(coinId, days = 7) {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=eur&days=${days}&timestamp=${timestamp}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`API fout: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Fout bij ophalen marktgrafiek voor munt ${coinId}:`, error);
      throw error;
    }
  }
  
  /**
   * Haal gegevens op voor favoriete munten
   * Demonstreert: Fetch API, Array-methoden
   */
  async fetchFavoriteCoins(favoriteIds) {
    try {
      if (!favoriteIds || favoriteIds.length === 0) {
        return [];
      }
      
      // Alle munten ophalen en filteren op favorieten
      const allCoins = await this.fetchCoinsList(1, 250);
      return allCoins.filter(coin => favoriteIds.includes(coin.id));
    } catch (error) {
      console.error('Fout bij ophalen favoriete munten:', error);
      return [];
    }
  }
}

// API-instantie aanmaken en exporteren
const coinGeckoAPI = new CoinGeckoAPI();

// API-methoden exporteren
export const fetchCoinsList = (page, perPage) => coinGeckoAPI.fetchCoinsList(page, perPage);
export const fetchGlobalData = () => coinGeckoAPI.fetchGlobalData();
export const fetchCoinDetails = (coinId) => coinGeckoAPI.fetchCoinDetails(coinId);
export const fetchCoinMarketChart = (coinId, days) => coinGeckoAPI.fetchCoinMarketChart(coinId, days);
export const fetchFavoriteCoins = (favoriteIds) => coinGeckoAPI.fetchFavoriteCoins(favoriteIds);
