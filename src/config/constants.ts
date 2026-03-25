export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
export const SYMBOLS = [
  "AAPL", "TSLA", "MSFT", "NVDA",
  "AMZN", "META", "GOOGL", "NFLX",
  "AMD",  "INTC", "PLTR", "COIN",
  "JPM",  "BAC",  "DIS",  "NKE",
  "SHOP", "PYPL", "UBER", "SNAP",
];
export const TIMEFRAMES = ["1m", "5m", "1h", "4h", "1d"];
// Only timeframes accepted by the backtest engine
export const BACKTEST_TIMEFRAMES = ["1h", "4h", "1d"];

export const ASSET_CLASSES: Record<string, { label: string; symbols: string[] }> = {
  stocks: {
    label: "Stocks",
    symbols: ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "META", "GOOGL", "AMD", "INTC", "NFLX"],
  },
  forex: {
    label: "Forex",
    symbols: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD", "EURGBP"],
  },
  commodities: {
    label: "Commodities",
    symbols: ["XAUUSD", "XAGUSD", "USOIL", "UKOIL", "NATURALGAS"],
  },
  crypto: {
    label: "Crypto",
    symbols: ["BTCUSD", "ETHUSD", "BNBUSD", "SOLUSD", "ADAUSD", "XRPUSD"],
  },
};
