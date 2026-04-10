import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Bot visual identity ───────────────────────────────────────────────────────

export interface BotTab {
  id: string;
  name: string;
  color: string;
}

export const BOT_META: Record<string, { name: string; color: string }> = {
  trendmaster: { name: "TrendMaster", color: "#22c55e" },
  scalperx:    { name: "ScalerX",     color: "#3b82f6" },
  cryptobot:   { name: "Crypto Bot",  color: "#a855f7" },
  piphunter:   { name: "PipHunter",   color: "#fb923c" },
  safeguard:   { name: "SafeGuard",   color: "#14b8a6" },
  combo:       { name: "Master Bot",  color: "#6366f1" },
};

// ── Symbol lists (for data filtering) ────────────────────────────────────────
// Keys are normalized (no slash, uppercase) to match both "EURUSD" and "EUR/USD"

export const BOT_SYMBOLS: Record<string, string[]> = {
  trendmaster: ["EURUSD", "GBPUSD", "USDCHF", "AUDUSD"],
  scalperx:    ["EURUSD", "EURGBP", "USDCHF", "AUDNZD"],
  cryptobot:   ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT", "XRPUSDT", "BTCUSD", "ETHUSD"],
  piphunter:   ["GBPUSD", "EURUSD", "GBPJPY", "USDJPY"],
  safeguard:   ["AUDJPY", "NZDJPY", "GBPJPY", "USDJPY"],
  combo:       ["EURUSD", "GBPUSD", "AUDJPY", "GBPJPY", "USDJPY", "NZDJPY"],
};

/** Normalize a symbol for comparison: remove slashes, uppercase */
export function normSym(s: string): string {
  return s.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** Check if a position/trade symbol belongs to a bot */
export function symbolBelongsToBot(symbol: string, botId: string): boolean {
  const normalized = normSym(symbol);
  return (BOT_SYMBOLS[botId] ?? []).some((s) => normSym(s) === normalized);
}

// ── Bot profiles (for Strategy read-only panel) ───────────────────────────────

export interface BotIndicator { name: string; desc: string }
export interface BotTimeframe  { tf: string; role: string; primary: boolean }
export interface BotSymbolEntry { symbol: string; stars: number }

export interface BotProfile {
  id: string;
  name: string;
  color: string;
  strategyType: string;
  market: string;
  description: string;
  condition: string;           // when does this bot operate
  timeframes: BotTimeframe[];
  symbolsList: BotSymbolEntry[];
  indicators: BotIndicator[];
  risk: {
    sl: string;
    tp: string;
    riskPerTrade: string;
    maxPositions: number;
    dailyDD: string;
    cooldown: string;
  };
  entryLong: string[];
  entryShort: string[];
  emergencyExit: string[];
}

export const BOT_PROFILES: Record<string, BotProfile> = {
  trendmaster: {
    id: "trendmaster", name: "TrendMaster", color: "#22c55e",
    strategyType: "Trend Following",
    market: "Forex",
    description: "Especialista en identificar y seguir tendencias alcistas y bajistas. Entra cuando la tendencia está confirmada y la deja correr.",
    condition: "ADX > 25 · mercado en tendencia",
    timeframes: [
      { tf: "4H",  role: "Dirección macro",  primary: true },
      { tf: "1H",  role: "Confirmación",     primary: true },
      { tf: "15M", role: "Entrada",          primary: false },
    ],
    symbolsList: [
      { symbol: "EUR/USD", stars: 5 }, { symbol: "GBP/USD", stars: 5 },
      { symbol: "USD/CHF", stars: 4 }, { symbol: "AUD/USD", stars: 4 },
    ],
    indicators: [
      { name: "EMA 9 / 21",   desc: "Señal de cruce" },
      { name: "RSI (14)",     desc: "45–75 zona de entrada" },
      { name: "ADX (14)",     desc: "> 25 tendencia válida" },
      { name: "ATR × 1.5",   desc: "Stop loss dinámico" },
    ],
    risk: {
      sl: "ATR × 1.5",  tp: "ATR × 3.0",
      riskPerTrade: "1%",  maxPositions: 4,
      dailyDD: "3%",  cooldown: "15 min",
    },
    entryLong:  ["EMA 9 cruza sobre EMA 21", "RSI 45–75", "ADX > 25", "Precio > EMA 50"],
    entryShort: ["EMA 9 cruza bajo EMA 21",  "RSI 25–55", "ADX > 25", "Precio < EMA 50"],
    emergencyExit: ["ADX cae < 20", "EMA cruza en contra"],
  },

  scalperx: {
    id: "scalperx", name: "ScalerX", color: "#3b82f6",
    strategyType: "Mean Reversion",
    market: "Forex",
    description: "Opera cuando el precio se aleja demasiado del equilibrio y espera el regreso a la media. Solo activo en mercados laterales.",
    condition: "ADX < 25 · mercado en rango",
    timeframes: [
      { tf: "15M", role: "Señal",  primary: true },
      { tf: "5M",  role: "Entrada", primary: false },
    ],
    symbolsList: [
      { symbol: "EUR/USD", stars: 5 }, { symbol: "EUR/GBP", stars: 4 },
      { symbol: "USD/CHF", stars: 4 }, { symbol: "AUD/NZD", stars: 3 },
    ],
    indicators: [
      { name: "BB (20, 2)",    desc: "Extremos de precio" },
      { name: "RSI (14)",      desc: "< 30 / > 70" },
      { name: "Stoch 5/3/3",  desc: "Cruce de confirmación" },
      { name: "ADX (14)",      desc: "< 25 rango válido" },
      { name: "ATR × 2.0",    desc: "Stop loss" },
    ],
    risk: {
      sl: "ATR × 2.0",  tp: "SMA 20 (banda media)",
      riskPerTrade: "1%",  maxPositions: 4,
      dailyDD: "3%",  cooldown: "30 min",
    },
    entryLong:  ["ADX < 25", "Precio ≤ BB lower", "RSI < 30", "Stoch %K < 20 + cruce alcista", "Vela cierra dentro de la banda"],
    entryShort: ["ADX < 25", "Precio ≥ BB upper", "RSI > 70", "Stoch %K > 80 + cruce bajista", "Vela cierra dentro de la banda"],
    emergencyExit: ["ADX > 30 mientras en trade", "2 velas cierran fuera de la banda"],
  },

  cryptobot: {
    id: "cryptobot", name: "Crypto Bot", color: "#a855f7",
    strategyType: "Momentum",
    market: "Crypto",
    description: "Estrategia de momentum para criptomonedas. Lo que sube, sigue subiendo — entra cuando el impulso está confirmado y deja correr.",
    condition: "ADX > 25 · tendencia confirmada · multi-TF alineado",
    timeframes: [
      { tf: "1D",  role: "Dirección macro", primary: true },
      { tf: "4H",  role: "Confirmación",    primary: true },
      { tf: "1H",  role: "Entrada",         primary: false },
      { tf: "15M", role: "Ejecución",       primary: false },
    ],
    symbolsList: [
      { symbol: "BTC/USD", stars: 5 }, { symbol: "ETH/USD", stars: 5 },
      { symbol: "BNB/USD", stars: 4 }, { symbol: "SOL/USD", stars: 4 },
      { symbol: "ADA/USD", stars: 3 }, { symbol: "XRP/USD", stars: 3 },
    ],
    indicators: [
      { name: "ROC",           desc: "Fuerza del impulso" },
      { name: "RSI (10)",      desc: "50–75 zona momentum" },
      { name: "EMA 50 / 200", desc: "Dirección macro" },
      { name: "ADX > 25",     desc: "Tendencia válida" },
      { name: "MACD",         desc: "Confirmación" },
    ],
    risk: {
      sl: "ATR × 1.5 o EMA 50",  tp: "Sin TP fijo · trailing",
      riskPerTrade: "1–1.5%",  maxPositions: 2,
      dailyDD: "N/A",  cooldown: "N/A",
    },
    entryLong:  ["Precio > EMA 200 (1D)", "ADX > 25, DI+ > DI−", "MACD positivo", "RSI 50–75", "ROC positivo y subiendo"],
    entryShort: ["Precio < EMA 200 (1D)", "ADX > 25, DI− > DI+", "MACD negativo", "RSI 25–50", "ROC negativo y cayendo"],
    emergencyExit: ["Divergencia MACD / ROC", "RSI pierde zona momentum", "ADX < 20"],
  },

  piphunter: {
    id: "piphunter", name: "PipHunter", color: "#fb923c",
    strategyType: "Breakout",
    market: "Forex",
    description: "Detecta rupturas de niveles clave y entra cuando el precio explota. Gestión de riesgo estricta con TP escalonado.",
    condition: "Ruptura de nivel + ADX > 20 · sesión Londres / NY",
    timeframes: [
      { tf: "4H",  role: "Niveles clave",  primary: true },
      { tf: "1H",  role: "Confirmación",   primary: true },
      { tf: "15M", role: "Entrada",        primary: false },
      { tf: "5M",  role: "Timing",         primary: false },
    ],
    symbolsList: [
      { symbol: "GBP/USD", stars: 5 }, { symbol: "EUR/USD", stars: 5 },
      { symbol: "GBP/JPY", stars: 4 }, { symbol: "USD/JPY", stars: 4 },
    ],
    indicators: [
      { name: "ATR (14)",  desc: "SL = ATR × 1" },
      { name: "ADX (14)",  desc: "> 20 momentum válido" },
      { name: "RSI (14)",  desc: "> 50 LONG / < 50 SHORT" },
      { name: "BB Squeeze", desc: "Detectar compresión previa" },
    ],
    risk: {
      sl: "ATR × 1.0",  tp: "TP1: 1:1 · TP2: 1:2 · TP3: 1:3",
      riskPerTrade: "0.5–1%",  maxPositions: 3,
      dailyDD: "3%",  cooldown: "1h",
    },
    entryLong:  ["Precio rompe resistencia (cierre de vela)", "Cuerpo > 60% del rango", "ADX > 20 y subiendo", "RSI > 50", "Sesión Londres o NY"],
    entryShort: ["Precio rompe soporte (cierre de vela)", "Cuerpo > 60% del rango", "ADX > 20 y subiendo", "RSI < 50", "Sesión Londres o NY"],
    emergencyExit: ["2 velas cierran de vuelta a través del nivel roto", "Fakeout confirmado → cerrar"],
  },

  safeguard: {
    id: "safeguard", name: "SafeGuard", color: "#14b8a6",
    strategyType: "Carry Trade",
    market: "Forex (JPY pairs)",
    description: "Gana interés diario (swap) manteniendo posiciones en monedas de alta tasa. El tiempo trabaja a tu favor.",
    condition: "VIX < 20 · mercado risk-on · swap positivo",
    timeframes: [
      { tf: "Mensual", role: "Contexto macro", primary: true },
      { tf: "Semanal", role: "Estructura",     primary: true },
      { tf: "Diario",  role: "Entrada",        primary: false },
      { tf: "4H",      role: "Timing",         primary: false },
    ],
    symbolsList: [
      { symbol: "AUD/JPY", stars: 5 }, { symbol: "NZD/JPY", stars: 5 },
      { symbol: "GBP/JPY", stars: 4 }, { symbol: "USD/JPY", stars: 4 },
    ],
    indicators: [
      { name: "VIX proxy",    desc: "< 20 risk-on · > 25 cerrar" },
      { name: "EMA 50 / 200", desc: "Tendencia macro" },
      { name: "ADX (14)",     desc: "> 15 algo de dirección" },
      { name: "RSI (14)",     desc: "35–70 zona entrada" },
      { name: "ATR × 3.0",   desc: "SL amplio (estrategia lenta)" },
    ],
    risk: {
      sl: "ATR × 3.0",  tp: "Trailing tras ATR × 6",
      riskPerTrade: "0.5–0.8%",  maxPositions: 3,
      dailyDD: "2.5% total",  cooldown: "24h",
    },
    entryLong:  ["Swap positivo", "VIX < 20", "Precio > SMA 200", "ADX > 15", "RSI 35–70", "Pullback a valor"],
    entryShort: ["N/A — solo Long (carry cobra swap a favor)"],
    emergencyExit: ["VIX > 25 → cerrar 70%", "VIX > 35 → cerrar TODO sin excepción", "Evento BOJ / NFP"],
  },

  combo: {
    id: "combo", name: "Master Bot", color: "#6366f1",
    strategyType: "Multi-Strategy Inteligente",
    market: "Forex + Crypto",
    description: "Sistema que detecta el estado del mercado y activa automáticamente la estrategia correcta. Combina los 5 bots con lógica de prioridad.",
    condition: "Detecta automáticamente: Rango / Tendencia / Breakout / Momentum / Carry / Risk-Off",
    timeframes: [
      { tf: "4H",  role: "Clasificación de mercado", primary: true },
      { tf: "1H",  role: "Confirmación + Entrada",  primary: true },
      { tf: "15M", role: "Ejecución",               primary: false },
    ],
    symbolsList: [
      { symbol: "EUR/USD", stars: 5 }, { symbol: "GBP/USD", stars: 5 },
      { symbol: "AUD/JPY", stars: 4 }, { symbol: "GBP/JPY", stars: 4 },
      { symbol: "USD/JPY", stars: 4 }, { symbol: "NZD/JPY", stars: 3 },
    ],
    indicators: [
      { name: "ADX (14)",     desc: "< 20 Rango · > 25 Trend · > 30 Momentum" },
      { name: "VIX proxy",   desc: "< 20 OK · > 25 Risk-Off" },
      { name: "EMA 200",     desc: "Sesgo macro alcista / bajista" },
      { name: "BB + Stoch",  desc: "Para modo Mean Reversion" },
      { name: "ATR (14)",    desc: "SL adaptativo por estrategia" },
    ],
    risk: {
      sl: "Adaptativo por estrategia activa",
      tp: "Adaptativo por estrategia activa",
      riskPerTrade: "0.65–1.25%",  maxPositions: 3,
      dailyDD: "3%",  cooldown: "1h",
    },
    entryLong: [
      "RANGO → Mean Reversion: precio en BB lower + RSI < 30",
      "BREAKOUT → precio > resistencia + cuerpo > 60%",
      "MOMENTUM → precio > SMA200 + ADX > 30",
      "TREND → uptrend confirmado + RSI > 45",
      "CARRY → swap positivo + VIX < 20",
    ],
    entryShort: [
      "RANGO → precio en BB upper + RSI > 70",
      "BREAKOUT → precio < soporte + cuerpo > 60%",
      "MOMENTUM → precio < SMA200 + ADX > 30",
      "TREND → downtrend confirmado + RSI < 55",
    ],
    emergencyExit: ["VIX > 25 → RISK-OFF · cerrar todo", "Sin condición válida → NO_TRADE", "Lógica de cada sub-estrategia activa"],
  },
};

// ── Store ─────────────────────────────────────────────────────────────────────

interface BotTabsState {
  tabs: BotTab[];
  selectedBotId: string | null;

  addTab:       (id: string) => { success: boolean; message?: string };
  removeTab:    (id: string) => void;
  hasTab:       (id: string) => boolean;
  setSelectedBot: (id: string | null) => void;
}

export const useBotTabsStore = create<BotTabsState>()(
  persist(
    (set, get) => ({
      tabs: [],
      selectedBotId: null,

      addTab: (id: string) => {
        const meta = BOT_META[id];
        if (!meta) return { success: false, message: "Bot desconocido" };

        if (get().tabs.some((t) => t.id === id)) {
          return {
            success: false,
            message: `Ya el Bot ${meta.name} está operando en este momento`,
          };
        }

        const newTab = { id, name: meta.name, color: meta.color };
        const currentSelected = get().selectedBotId;
        set((state) => ({
          tabs: [...state.tabs, newTab],
          // Auto-select if nothing is selected
          selectedBotId: currentSelected ?? id,
        }));
        return { success: true };
      },

      removeTab: (id: string) => {
        const { tabs, selectedBotId } = get();
        const newTabs = tabs.filter((t) => t.id !== id);

        let newSelected = selectedBotId;
        if (selectedBotId === id) {
          // Select first remaining tab, or null if none
          newSelected = newTabs.length > 0 ? newTabs[0].id : null;
        }

        set({ tabs: newTabs, selectedBotId: newSelected });
      },

      hasTab: (id: string) => get().tabs.some((t) => t.id === id),

      setSelectedBot: (id: string | null) => set({ selectedBotId: id }),
    }),
    { name: "bot-tabs-v1" }
  )
);
