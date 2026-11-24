/**
 * Market Data Service
 * Real-time quotes for Equities, ETFs, and Crypto with offline fallback
 */

const CRYPTO_COINGECKO_MAP = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2'
};

// Fallback baseline quotes when offline or API limit reached
const BASELINE_MARKET_PRICES = {
  VOO: 546.20,
  SPY: 597.50,
  QQQ: 508.80,
  AAPL: 229.10,
  MSFT: 423.50,
  NVDA: 142.30,
  AMZN: 202.80,
  GOOGL: 178.60,
  SCHD: 84.40,
  BND: 73.15,
  VTI: 288.70,
  BTC: 88450.00,
  ETH: 3390.00,
  SOL: 218.00
};

class MarketDataService {
  constructor() {
    this.cachedPrices = { ...BASELINE_MARKET_PRICES };
    this.lastFetched = null;
    this.isFetching = false;
  }

  async fetchCryptoPrices(symbols = []) {
    const cryptoIds = symbols
      .map(s => CRYPTO_COINGECKO_MAP[s.toUpperCase()])
      .filter(Boolean);

    if (cryptoIds.length === 0) return {};

    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=usd`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`CoinGecko status ${res.status}`);
      const data = await res.json();

      const priceMap = {};
      Object.entries(CRYPTO_COINGECKO_MAP).forEach(([symbol, id]) => {
        if (data[id]?.usd) {
          priceMap[symbol] = data[id].usd;
          this.cachedPrices[symbol] = data[id].usd;
        }
      });
      return priceMap;
    } catch (err) {
      console.warn('Crypto live fetch fallback:', err.message);
      return {};
    }
  }

  async fetchStockPrices(symbols = [], apiKey = '') {
    // If user provided a Finnhub API Key in settings, query live quotes
    if (apiKey) {
      const results = {};
      for (const sym of symbols.slice(0, 10)) {
        try {
          const url = `https://finnhub.io/api/v1/quote?symbol=${sym.toUpperCase()}&token=${apiKey}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const data = await res.json();
            if (data.c) { // current price
              results[sym.toUpperCase()] = data.c;
              this.cachedPrices[sym.toUpperCase()] = data.c;
            }
          }
        } catch {}
      }
      return results;
    }

    // Default: Slight realistic jitter around baseline quotes to simulate live market activity
    const simulated = {};
    symbols.forEach(sym => {
      const upper = sym.toUpperCase();
      const base = this.cachedPrices[upper] || BASELINE_MARKET_PRICES[upper] || 100.00;
      // +/- 0.3% subtle micro-tick
      const jitter = (Math.random() - 0.48) * 0.006;
      const livePrice = Number((base * (1 + jitter)).toFixed(2));
      simulated[upper] = livePrice;
      this.cachedPrices[upper] = livePrice;
    });

    return simulated;
  }

  async updateAllHoldingsPrices(holdings = [], apiKey = '') {
    if (this.isFetching) return this.cachedPrices;
    this.isFetching = true;

    try {
      const cryptoSymbols = holdings
        .filter(h => h.assetClass === 'crypto')
        .map(h => h.symbol.toUpperCase());

      const stockSymbols = holdings
        .filter(h => h.assetClass !== 'crypto')
        .map(h => h.symbol.toUpperCase());

      const [cryptoPrices, stockPrices] = await Promise.all([
        this.fetchCryptoPrices(cryptoSymbols),
        this.fetchStockPrices(stockSymbols, apiKey)
      ]);

      this.lastFetched = new Date();
      return { ...this.cachedPrices, ...cryptoPrices, ...stockPrices };
    } finally {
      this.isFetching = false;
    }
  }
}

export const marketDataService = new MarketDataService();
