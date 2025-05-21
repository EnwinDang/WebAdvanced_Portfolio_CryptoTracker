// src/js/api.js

class CoinPaprikaAPI {
  constructor() {
    this.baseUrl = 'https://api.coinpaprika.com/v1';
  }

  // Helper: fetch + basic error handling
  async _get(path) {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) {
      throw new Error(`API fout: ${res.status}`);
    }
    return res.json();
  }

  // 1. Muntenlijst (paginering)
  async fetchCoinsList(page = 1, perPage = 100) {
    const offset = (page - 1) * perPage;
    const json = await this._get(`/tickers?quotes=EUR&limit=${perPage}&start=${offset}`);
    return json; // array van ticker-objecten
  }

  // 2. Globale marktgegevens
  async fetchGlobalData() {
    const json = await this._get(`/global`);
    return json; 
    // object bevat: market_cap_usd, volume_24h_usd, bitcoin_dominance_percentage, cryptocurrencies_count, etc.
  }

  // 3. Details van één munt
  async fetchCoinDetails(coinId) {
    const coinJson   = await this._get(`/coins/${coinId}`);
    const tickerJson = await this._get(`/tickers/${coinId}?quotes=EUR`);
    return {
      id:                 coinJson.id,
      name:               coinJson.name,
      symbol:             coinJson.symbol,
      rank:               tickerJson.rank,
      description:        coinJson.description,
      quotes:             tickerJson.quotes,         // quotes.EUR.price, .percent_change_24h, .market_cap, .volume_24h
      circulating_supply: tickerJson.circulating_supply,
      total_supply:       tickerJson.total_supply,
      max_supply:         tickerJson.max_supply,
      last_updated:       tickerJson.last_updated
    };
  }

  // 4. Marktgrafiek via Binance (gratis, CORS OK)
  async fetchCoinMarketChart(coinSymbol, days = 7) {
    try {
      // Binance verwacht symbol as e.g. 'BTCUSDT'
      const pair = `${coinSymbol.toUpperCase()}USDT`;
      const limit = days; // daily bars
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1d&limit=${limit}`
      );
      if (!res.ok) throw new Error(`API fout: ${res.status}`);
      const raw = await res.json();
      // raw: [ [ openTime, open, high, low, close, volume, ... ], ... ]
      return raw.map(item => ({
        time_close:  item[0],
        price_close: parseFloat(item[4])
      }));
    } catch (err) {
      console.warn('Binance chart-error:', err);
      return [];  // signal “no data”
    }
  }

  // 5. Favorieten: haal eerste 1000 en filter
  async fetchFavoriteCoins(favoriteIds) {
    if (!favoriteIds || favoriteIds.length === 0) return [];
    const all = await this.fetchCoinsList(1, 1000);
    return all.filter(c => favoriteIds.includes(c.id));
  }
}

const coinPaprikaAPI = new CoinPaprikaAPI();
export const fetchCoinsList       = (p, n) => coinPaprikaAPI.fetchCoinsList(p, n);
export const fetchGlobalData      = ()      => coinPaprikaAPI.fetchGlobalData();
export const fetchCoinDetails     = id      => coinPaprikaAPI.fetchCoinDetails(id);
export const fetchCoinMarketChart = (s, d)  => coinPaprikaAPI.fetchCoinMarketChart(s, d);
export const fetchFavoriteCoins   = ids     => coinPaprikaAPI.fetchFavoriteCoins(ids);
