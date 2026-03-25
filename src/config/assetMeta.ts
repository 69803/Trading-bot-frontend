// ─────────────────────────────────────────────────────────────────────────────
// Asset metadata: names, avatar colours, asset type, and display decimals.
//
// HOW TO ADD MORE:
//   1. Add an entry to ASSET_INFO with { name, color, type, decimals? }
//   2. Add the symbol to the right ASSET_CATEGORIES entry (or a new one)
//   3. Backend: stocks → polygon.py FALLBACK_BASE_PRICES
//               forex/commodities → twelvedata.py FALLBACK_BASE_PRICES
//
// Asset types:
//   "stock"     → routed to Polygon (or Alpaca/GBM fallback)
//   "etf"       → routed to Polygon
//   "forex"     → routed to Twelve Data (or GBM fallback)
//   "commodity" → routed to Twelve Data (or GBM fallback)
//
// Color guide per sector:
//   Big Tech / FAANG  → indigo   #6366f1
//   Growth / SaaS     → violet   #8b5cf6
//   Semiconductors    → blue     #3b82f6
//   Finance / Banks   → sky      #0ea5e9
//   Healthcare        → emerald  #10b981
//   Consumer Staples  → amber    #f59e0b
//   Industrial        → slate    #64748b
//   Energy            → yellow   #ca8a04
//   ETFs              → green    #22c55e
//   EV / Speculative  → rose     #f43f5e
//   Forex — Majors    → blue     #3b82f6
//   Forex — Minors    → indigo   #6366f1
//   Metals            → amber    #f59e0b
//   Energy Comm.      → orange   #f97316
// ─────────────────────────────────────────────────────────────────────────────

export type AssetType = "stock" | "etf" | "forex" | "commodity";

export interface AssetInfo {
  name: string;
  color: string;
  type: AssetType;
  /** Decimal places for price display (default 2) */
  decimals?: number;
}

export const ASSET_INFO: Record<string, AssetInfo> = {
  // ── Stocks: Big Tech ─────────────────────────────────────────────────────
  AAPL:  { name: "Apple Inc.",              color: "#6366f1", type: "stock" },
  MSFT:  { name: "Microsoft Corp.",         color: "#3b82f6", type: "stock" },
  GOOGL: { name: "Alphabet Inc.",           color: "#6366f1", type: "stock" },
  AMZN:  { name: "Amazon.com Inc.",         color: "#f59e0b", type: "stock" },
  META:  { name: "Meta Platforms",          color: "#0ea5e9", type: "stock" },
  NVDA:  { name: "NVIDIA Corp.",            color: "#10b981", type: "stock" },
  TSLA:  { name: "Tesla Inc.",              color: "#ef4444", type: "stock" },
  AMD:   { name: "Advanced Micro Devices",  color: "#a855f7", type: "stock" },
  INTC:  { name: "Intel Corp.",             color: "#0284c7", type: "stock" },
  NFLX:  { name: "Netflix Inc.",            color: "#dc2626", type: "stock" },

  // ── Stocks: Semiconductors ───────────────────────────────────────────────
  AVGO:  { name: "Broadcom Inc.",           color: "#3b82f6", type: "stock" },
  QCOM:  { name: "Qualcomm Inc.",           color: "#2563eb", type: "stock" },
  TXN:   { name: "Texas Instruments",       color: "#1d4ed8", type: "stock" },
  ASML:  { name: "ASML Holding",            color: "#3b82f6", type: "stock" },
  MRVL:  { name: "Marvell Technology",      color: "#6366f1", type: "stock" },
  AMAT:  { name: "Applied Materials",       color: "#4f46e5", type: "stock" },
  KLAC:  { name: "KLA Corp.",               color: "#7c3aed", type: "stock" },
  MU:    { name: "Micron Technology",       color: "#8b5cf6", type: "stock" },

  // ── Stocks: SaaS / Cloud ─────────────────────────────────────────────────
  CRM:   { name: "Salesforce Inc.",         color: "#0ea5e9", type: "stock" },
  ORCL:  { name: "Oracle Corp.",            color: "#dc2626", type: "stock" },
  ADBE:  { name: "Adobe Inc.",              color: "#ef4444", type: "stock" },
  NOW:   { name: "ServiceNow Inc.",         color: "#0284c7", type: "stock" },
  PANW:  { name: "Palo Alto Networks",      color: "#0ea5e9", type: "stock" },
  CRWD:  { name: "CrowdStrike Holdings",    color: "#dc2626", type: "stock" },
  NET:   { name: "Cloudflare Inc.",         color: "#f97316", type: "stock" },
  DDOG:  { name: "Datadog Inc.",            color: "#8b5cf6", type: "stock" },
  SNOW:  { name: "Snowflake Inc.",          color: "#06b6d4", type: "stock" },
  ZS:    { name: "Zscaler Inc.",            color: "#0ea5e9", type: "stock" },

  // ── Stocks: Growth / Popular ─────────────────────────────────────────────
  PLTR:  { name: "Palantir Technologies",   color: "#7c3aed", type: "stock" },
  COIN:  { name: "Coinbase Global",         color: "#d97706", type: "stock" },
  SHOP:  { name: "Shopify Inc.",            color: "#059669", type: "stock" },
  UBER:  { name: "Uber Technologies",       color: "#374151", type: "stock" },
  LYFT:  { name: "Lyft Inc.",               color: "#ec4899", type: "stock" },
  ABNB:  { name: "Airbnb Inc.",             color: "#f43f5e", type: "stock" },
  DASH:  { name: "DoorDash Inc.",           color: "#ef4444", type: "stock" },
  RBLX:  { name: "Roblox Corp.",            color: "#8b5cf6", type: "stock" },
  ROKU:  { name: "Roku Inc.",               color: "#7c3aed", type: "stock" },
  ZM:    { name: "Zoom Video Comm.",        color: "#2563eb", type: "stock" },
  HOOD:  { name: "Robinhood Markets",       color: "#22c55e", type: "stock" },
  SOFI:  { name: "SoFi Technologies",       color: "#0ea5e9", type: "stock" },
  SNAP:  { name: "Snap Inc.",               color: "#ca8a04", type: "stock" },
  TWLO:  { name: "Twilio Inc.",             color: "#f43f5e", type: "stock" },
  SQ:    { name: "Block Inc.",              color: "#374151", type: "stock" },
  PYPL:  { name: "PayPal Holdings",         color: "#2563eb", type: "stock" },

  // ── Stocks: Finance ──────────────────────────────────────────────────────
  JPM:   { name: "JPMorgan Chase",          color: "#1d4ed8", type: "stock" },
  BAC:   { name: "Bank of America",         color: "#0369a1", type: "stock" },
  GS:    { name: "Goldman Sachs",           color: "#4f46e5", type: "stock" },
  MS:    { name: "Morgan Stanley",          color: "#2563eb", type: "stock" },
  C:     { name: "Citigroup Inc.",          color: "#0284c7", type: "stock" },
  WFC:   { name: "Wells Fargo",             color: "#dc2626", type: "stock" },
  AXP:   { name: "American Express",        color: "#1d4ed8", type: "stock" },
  V:     { name: "Visa Inc.",               color: "#1d4ed8", type: "stock" },
  MA:    { name: "Mastercard Inc.",         color: "#dc2626", type: "stock" },
  BLK:   { name: "BlackRock Inc.",          color: "#0369a1", type: "stock" },
  SCHW:  { name: "Charles Schwab",          color: "#0ea5e9", type: "stock" },
  USB:   { name: "U.S. Bancorp",            color: "#2563eb", type: "stock" },

  // ── Stocks: Healthcare ───────────────────────────────────────────────────
  JNJ:   { name: "Johnson & Johnson",       color: "#dc2626", type: "stock" },
  PFE:   { name: "Pfizer Inc.",             color: "#0284c7", type: "stock" },
  MRK:   { name: "Merck & Co.",             color: "#059669", type: "stock" },
  ABBV:  { name: "AbbVie Inc.",             color: "#10b981", type: "stock" },
  UNH:   { name: "UnitedHealth Group",      color: "#0369a1", type: "stock" },
  TMO:   { name: "Thermo Fisher Sci.",      color: "#2563eb", type: "stock" },
  DHR:   { name: "Danaher Corp.",           color: "#0ea5e9", type: "stock" },
  CVS:   { name: "CVS Health",              color: "#dc2626", type: "stock" },
  GILD:  { name: "Gilead Sciences",         color: "#059669", type: "stock" },
  ISRG:  { name: "Intuitive Surgical",      color: "#10b981", type: "stock" },
  MRNA:  { name: "Moderna Inc.",            color: "#14b8a6", type: "stock" },
  REGN:  { name: "Regeneron Pharma.",       color: "#0d9488", type: "stock" },

  // ── Stocks: Consumer Staples ─────────────────────────────────────────────
  KO:    { name: "The Coca-Cola Co.",       color: "#dc2626", type: "stock" },
  PEP:   { name: "PepsiCo Inc.",            color: "#2563eb", type: "stock" },
  MCD:   { name: "McDonald's Corp.",        color: "#f59e0b", type: "stock" },
  SBUX:  { name: "Starbucks Corp.",         color: "#059669", type: "stock" },
  WMT:   { name: "Walmart Inc.",            color: "#2563eb", type: "stock" },
  COST:  { name: "Costco Wholesale",        color: "#dc2626", type: "stock" },
  PG:    { name: "Procter & Gamble",        color: "#0284c7", type: "stock" },
  CL:    { name: "Colgate-Palmolive",       color: "#0ea5e9", type: "stock" },

  // ── Stocks: Consumer Discretionary ──────────────────────────────────────
  NKE:   { name: "Nike Inc.",               color: "#374151", type: "stock" },
  DIS:   { name: "The Walt Disney Co.",     color: "#4f46e5", type: "stock" },
  HD:    { name: "Home Depot Inc.",         color: "#f97316", type: "stock" },
  LOW:   { name: "Lowe's Companies",        color: "#2563eb", type: "stock" },
  TGT:   { name: "Target Corp.",            color: "#dc2626", type: "stock" },
  LULU:  { name: "lululemon athletica",     color: "#f43f5e", type: "stock" },
  BKNG:  { name: "Booking Holdings",        color: "#0284c7", type: "stock" },

  // ── Stocks: Industrial ───────────────────────────────────────────────────
  BA:    { name: "Boeing Co.",              color: "#1d4ed8", type: "stock" },
  CAT:   { name: "Caterpillar Inc.",        color: "#f59e0b", type: "stock" },
  GE:    { name: "GE Aerospace",            color: "#64748b", type: "stock" },
  UPS:   { name: "United Parcel Service",   color: "#d97706", type: "stock" },
  HON:   { name: "Honeywell Intl.",         color: "#64748b", type: "stock" },
  RTX:   { name: "RTX Corp.",               color: "#475569", type: "stock" },
  DE:    { name: "Deere & Company",         color: "#16a34a", type: "stock" },
  MMM:   { name: "3M Company",              color: "#dc2626", type: "stock" },
  FDX:   { name: "FedEx Corp.",             color: "#7c3aed", type: "stock" },
  LMT:   { name: "Lockheed Martin",         color: "#0369a1", type: "stock" },

  // ── Stocks: Energy ───────────────────────────────────────────────────────
  XOM:   { name: "Exxon Mobil Corp.",       color: "#ca8a04", type: "stock" },
  CVX:   { name: "Chevron Corp.",           color: "#d97706", type: "stock" },
  SLB:   { name: "SLB (Schlumberger)",      color: "#a16207", type: "stock" },
  COP:   { name: "ConocoPhillips",          color: "#b45309", type: "stock" },
  OXY:   { name: "Occidental Petroleum",    color: "#92400e", type: "stock" },

  // ── Stocks: Telecom ──────────────────────────────────────────────────────
  T:     { name: "AT&T Inc.",               color: "#0284c7", type: "stock" },
  VZ:    { name: "Verizon Comm.",           color: "#dc2626", type: "stock" },
  TMUS:  { name: "T-Mobile US",             color: "#7c3aed", type: "stock" },
  CMCSA: { name: "Comcast Corp.",           color: "#1d4ed8", type: "stock" },

  // ── Stocks: EV / Automotive ──────────────────────────────────────────────
  GM:    { name: "General Motors",          color: "#374151", type: "stock" },
  F:     { name: "Ford Motor Co.",          color: "#2563eb", type: "stock" },
  RIVN:  { name: "Rivian Automotive",       color: "#059669", type: "stock" },
  LCID:  { name: "Lucid Group",             color: "#f59e0b", type: "stock" },

  // ── ETFs ─────────────────────────────────────────────────────────────────
  SPY:   { name: "SPDR S&P 500 ETF",        color: "#22c55e", type: "etf" },
  QQQ:   { name: "Invesco QQQ Trust",       color: "#16a34a", type: "etf" },
  DIA:   { name: "SPDR Dow Jones ETF",      color: "#15803d", type: "etf" },
  IWM:   { name: "iShares Russell 2000",    color: "#14532d", type: "etf" },

  // ── Forex: Majors ────────────────────────────────────────────────────────
  "EUR/USD": { name: "Euro / US Dollar",        color: "#3b82f6", type: "forex", decimals: 5 },
  "GBP/USD": { name: "British Pound / Dollar",  color: "#6366f1", type: "forex", decimals: 5 },
  "USD/JPY": { name: "Dollar / Japanese Yen",   color: "#ef4444", type: "forex", decimals: 3 },
  "USD/CHF": { name: "Dollar / Swiss Franc",    color: "#dc2626", type: "forex", decimals: 5 },
  "AUD/USD": { name: "Australian Dollar / USD", color: "#f59e0b", type: "forex", decimals: 5 },
  "USD/CAD": { name: "Dollar / Canadian Dollar",color: "#d97706", type: "forex", decimals: 5 },
  "NZD/USD": { name: "New Zealand Dollar / USD",color: "#0ea5e9", type: "forex", decimals: 5 },

  // ── Forex: Minors ────────────────────────────────────────────────────────
  "EUR/GBP": { name: "Euro / British Pound",    color: "#6366f1", type: "forex", decimals: 5 },
  "EUR/JPY": { name: "Euro / Japanese Yen",     color: "#6366f1", type: "forex", decimals: 3 },
  "GBP/JPY": { name: "British Pound / Yen",     color: "#7c3aed", type: "forex", decimals: 3 },
  "EUR/CHF": { name: "Euro / Swiss Franc",      color: "#4f46e5", type: "forex", decimals: 5 },
  "AUD/JPY": { name: "Australian Dollar / Yen", color: "#f59e0b", type: "forex", decimals: 3 },
  "GBP/CHF": { name: "British Pound / Franc",   color: "#8b5cf6", type: "forex", decimals: 5 },

  // ── Commodities: Metals ──────────────────────────────────────────────────
  "XAU/USD":  { name: "Gold / US Dollar",       color: "#f59e0b", type: "commodity", decimals: 2 },
  "XAG/USD":  { name: "Silver / US Dollar",     color: "#94a3b8", type: "commodity", decimals: 4 },
  "XPT/USD":  { name: "Platinum / US Dollar",   color: "#cbd5e1", type: "commodity", decimals: 2 },

  // ── Commodities: Energy ──────────────────────────────────────────────────
  "WTI/USD":   { name: "WTI Crude Oil",         color: "#f97316", type: "commodity", decimals: 2 },
  "BRENT/USD": { name: "Brent Crude Oil",        color: "#ea580c", type: "commodity", decimals: 2 },
  "XNG/USD":   { name: "Natural Gas",            color: "#06b6d4", type: "commodity", decimals: 3 },
};

// ─────────────────────────────────────────────────────────────────────────────

export interface AssetCategory {
  id: string;
  label: string;
  symbols: string[];
  soon?: boolean;
}

export const ASSET_CATEGORIES: AssetCategory[] = [
  {
    id: "stocks",
    label: "Stocks",
    symbols: [
      // Big Tech
      "AAPL","MSFT","GOOGL","AMZN","META","NVDA","TSLA","AMD","INTC","NFLX",
      // Semiconductors
      "AVGO","QCOM","TXN","ASML","MRVL","AMAT","KLAC","MU",
      // SaaS / Cloud
      "CRM","ORCL","ADBE","NOW","PANW","CRWD","NET","DDOG","SNOW","ZS",
      // Growth
      "PLTR","COIN","SHOP","UBER","LYFT","ABNB","DASH","RBLX","ROKU","ZM",
      "HOOD","SOFI","SNAP","TWLO","SQ","PYPL",
      // Finance
      "JPM","BAC","GS","MS","C","WFC","AXP","V","MA","BLK","SCHW","USB",
      // Healthcare
      "JNJ","PFE","MRK","ABBV","UNH","TMO","DHR","CVS","GILD","ISRG","MRNA","REGN",
      // Consumer Staples
      "KO","PEP","MCD","SBUX","WMT","COST","PG","CL",
      // Consumer Discretionary
      "NKE","DIS","HD","LOW","TGT","LULU","BKNG",
      // Industrial
      "BA","CAT","GE","UPS","HON","RTX","DE","MMM","FDX","LMT",
      // Energy
      "XOM","CVX","SLB","COP","OXY",
      // Telecom
      "T","VZ","TMUS","CMCSA",
      // EV / Auto
      "GM","F","RIVN","LCID",
    ],
  },
  {
    id: "etfs",
    label: "ETFs",
    symbols: ["SPY","QQQ","DIA","IWM"],
  },
  {
    id: "forex",
    label: "Forex",
    symbols: [
      // Majors
      "EUR/USD","GBP/USD","USD/JPY","USD/CHF","AUD/USD","USD/CAD","NZD/USD",
      // Minors
      "EUR/GBP","EUR/JPY","GBP/JPY","EUR/CHF","AUD/JPY","GBP/CHF",
    ],
  },
  {
    id: "commodities",
    label: "Commodities",
    symbols: [
      // Metals
      "XAU/USD","XAG/USD","XPT/USD",
      // Energy
      "WTI/USD","BRENT/USD","XNG/USD",
    ],
  },
  {
    id: "crypto",
    label: "Crypto",
    symbols: [],
    soon: true,
  },
  {
    id: "indices",
    label: "Indices",
    symbols: [],
    soon: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: get price decimal places for a symbol
// ─────────────────────────────────────────────────────────────────────────────

export function getAssetDecimals(symbol: string): number {
  return ASSET_INFO[symbol]?.decimals ?? 2;
}

export function getAssetType(symbol: string): AssetType {
  return ASSET_INFO[symbol]?.type ?? "stock";
}

/** Returns true for forex pairs where a "$" prefix is not appropriate */
export function isForexPair(symbol: string): boolean {
  return getAssetType(symbol) === "forex";
}
