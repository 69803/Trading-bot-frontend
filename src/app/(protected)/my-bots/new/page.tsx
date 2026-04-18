"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { CustomBotConfig } from "@/types";
import { Button } from "@/components/ui/Button";
import {
  ChevronRight, ChevronLeft, Bot, AlertCircle,
  Check, X,
} from "lucide-react";

// ─── Default config ────────────────────────────────────────────────────────────
const DEFAULT_CONFIG: CustomBotConfig = {
  color: "#6366f1",
  direction: "both",
  trade_stocks: true,
  trade_forex: true,
  trade_crypto: false,
  trade_commodities: false,
  allowed_symbols: [],
  blocked_symbols: [],
  timeframe: "1h",
  confirmation_timeframe: "4h",
  min_confidence_score: 35,
  min_rr_ratio: 1.5,
  use_technical_indicators: true,
  allow_reversals: false,
  allow_averaging_down: false,
  allow_pyramiding: false,
  run_interval_seconds: 300,
  cooldown_seconds: 900,
  per_symbol_max_positions: 1,
  ema_fast: 9,
  ema_slow: 21,
  rsi_period: 14,
  rsi_overbought: 70,
  rsi_oversold: 30,
  risk_level: "moderate",
  risk_per_trade_pct: 1.0,
  max_drawdown_pct: 15.0,
  max_open_positions: 5,
  max_position_size_pct: 10.0,
  daily_loss_limit_pct: 3.0,
  stop_after_consecutive_losses: 0,
  daily_profit_target_pct: 0,
  stop_loss_pct: 2.0,
  take_profit_pct: 4.0,
  trailing_stop: false,
  trailing_stop_pct: 0.5,
  breakeven: false,
  breakeven_trigger_pct: 1.0,
  partial_close: false,
  partial_close_pct: 50,
  max_trade_duration_hours: 0,
  close_end_of_day: false,
  only_market_hours: true,
  trade_premarket: false,
  trade_after_hours: false,
  session_filter: "all",
  volatility_filter: false,
  volume_filter: false,
  trend_filter: true,
  news_filter: false,
  spread_filter: false,
  investment_amount: 100,
  capital_allocation_pct: 20,
  priority: 1,
  enabled_on_save: false,
};

const COLORS = ["#6366f1", "#22c55e", "#3b82f6", "#a855f7", "#fb923c", "#14b8a6", "#f43f5e", "#f59e0b", "#06b6d4", "#84cc16"];
const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];
const FOREX_SYMBOLS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF", "NZD/USD", "EUR/GBP", "GBP/JPY", "AUD/JPY", "USD/CAD"];
const STOCK_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "SPY", "QQQ", "AMD"];
const CRYPTO_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT"];

const SECTIONS = ["General", "Mercados", "Riesgo", "Entradas & Salidas", "Filtros", "Avanzado", "Ejecución"];

// ─── Reusable field components ─────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 mt-6 first:mt-0">{children}</h3>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex-1">
        <p className="text-sm text-slate-300 font-medium">{label}</p>
        {hint && <p className="text-[11px] text-slate-600 mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${checked ? "bg-blue-600" : "bg-white/[0.1]"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function NumberInput({ value, onChange, min = 0, max, step = 1, suffix }: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-24 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-sm text-slate-200 font-mono text-right focus:outline-none focus:border-blue-500/50"
      />
      {suffix && <span className="text-xs text-slate-600">{suffix}</span>}
    </div>
  );
}

function SelectInput({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0D1626]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SymbolPicker({
  symbols, selected, onToggle,
}: { symbols: string[]; selected: string[]; onToggle: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 max-w-xs">
      {symbols.map((s) => {
        const on = selected.includes(s);
        return (
          <button
            key={s}
            type="button"
            onClick={() => onToggle(s)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
              on
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                : "bg-white/[0.03] border-white/[0.08] text-slate-500 hover:border-white/[0.20] hover:text-slate-300"
            }`}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

// ─── Section panels ───────────────────────────────────────────────────────────
function SectionGeneral({ name, setName, cfg, setCfg, nameError }: {
  name: string; setName: (v: string) => void;
  cfg: CustomBotConfig; setCfg: (c: CustomBotConfig) => void;
  nameError: string;
}) {
  return (
    <div>
      <SectionTitle>Identidad del bot</SectionTitle>
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-1.5 font-medium">Nombre del bot <span className="text-red-400">*</span></label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Mi Bot Forex"
          maxLength={100}
          className={`w-full bg-white/[0.04] border rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none transition-colors ${
            nameError ? "border-red-500/60 focus:border-red-500" : "border-white/[0.1] focus:border-blue-500/60"
          }`}
        />
        {nameError && (
          <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
            <AlertCircle className="w-3.5 h-3.5" /> {nameError}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-1.5 font-medium">Descripción (opcional)</label>
        <textarea
          value={cfg.description || ""}
          onChange={(e) => setCfg({ ...cfg, description: e.target.value })}
          placeholder="Describe brevemente la estrategia de este bot..."
          rows={2}
          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 resize-none"
        />
      </div>

      <SectionTitle>Color e identidad visual</SectionTitle>
      <div className="flex flex-wrap gap-2 mb-6">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCfg({ ...cfg, color: c })}
            className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
            style={{
              background: c,
              borderColor: cfg.color === c ? "#fff" : "transparent",
            }}
          />
        ))}
      </div>

      <SectionTitle>Dirección de operación</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: "both",       label: "Long & Short" },
          { value: "long_only",  label: "Solo Long" },
          { value: "short_only", label: "Solo Short" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setCfg({ ...cfg, direction: opt.value as CustomBotConfig["direction"] })}
            className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              cfg.direction === opt.value
                ? "bg-blue-600/15 border-blue-500/40 text-blue-300"
                : "bg-white/[0.02] border-white/[0.08] text-slate-500 hover:border-white/[0.18] hover:text-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionMarkets({ cfg, setCfg }: { cfg: CustomBotConfig; setCfg: (c: CustomBotConfig) => void }) {
  const toggleSymbol = (sym: string, list: "allowed_symbols" | "blocked_symbols") => {
    const current = cfg[list];
    setCfg({
      ...cfg,
      [list]: current.includes(sym) ? current.filter((s) => s !== sym) : [...current, sym],
    });
  };

  return (
    <div>
      <SectionTitle>Clases de activos</SectionTitle>
      <Field label="Operar stocks (US equities)" hint="NYSE, NASDAQ — vía Alpaca">
        <Toggle checked={cfg.trade_stocks} onChange={(v) => setCfg({ ...cfg, trade_stocks: v })} />
      </Field>
      <Field label="Operar Forex / divisas" hint="EUR/USD, GBP/USD, etc.">
        <Toggle checked={cfg.trade_forex} onChange={(v) => setCfg({ ...cfg, trade_forex: v })} />
      </Field>
      <Field label="Operar crypto" hint="BTCUSDT, ETHUSDT, etc.">
        <Toggle checked={cfg.trade_crypto} onChange={(v) => setCfg({ ...cfg, trade_crypto: v })} />
      </Field>
      <Field label="Operar commodities" hint="XAU/USD, WTI, etc.">
        <Toggle checked={cfg.trade_commodities} onChange={(v) => setCfg({ ...cfg, trade_commodities: v })} />
      </Field>

      <SectionTitle>Símbolos permitidos</SectionTitle>
      <p className="text-xs text-slate-600 mb-3">Selecciona los símbolos que este bot puede operar. Si no seleccionas ninguno, el bot no podrá iniciar.</p>
      {cfg.trade_stocks && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Stocks</p>
          <SymbolPicker symbols={STOCK_SYMBOLS} selected={cfg.allowed_symbols} onToggle={(s) => toggleSymbol(s, "allowed_symbols")} />
        </div>
      )}
      {cfg.trade_forex && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Forex</p>
          <SymbolPicker symbols={FOREX_SYMBOLS} selected={cfg.allowed_symbols} onToggle={(s) => toggleSymbol(s, "allowed_symbols")} />
        </div>
      )}
      {cfg.trade_crypto && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Crypto</p>
          <SymbolPicker symbols={CRYPTO_SYMBOLS} selected={cfg.allowed_symbols} onToggle={(s) => toggleSymbol(s, "allowed_symbols")} />
        </div>
      )}

      {cfg.allowed_symbols.length > 0 && (
        <div className="mt-3 p-3 bg-emerald-500/[0.05] border border-emerald-500/20 rounded-xl">
          <p className="text-[11px] text-emerald-400 font-semibold mb-1">{cfg.allowed_symbols.length} símbolos seleccionados:</p>
          <p className="text-xs text-slate-400">{cfg.allowed_symbols.join(", ")}</p>
        </div>
      )}

      <SectionTitle>Símbolos bloqueados (opcional)</SectionTitle>
      <p className="text-xs text-slate-600 mb-3">El bot nunca operará estos símbolos, incluso si aparecen en la lista permitida.</p>
      <SymbolPicker
        symbols={[...FOREX_SYMBOLS, ...STOCK_SYMBOLS].filter((s) => !cfg.allowed_symbols.includes(s))}
        selected={cfg.blocked_symbols}
        onToggle={(s) => toggleSymbol(s, "blocked_symbols")}
      />
    </div>
  );
}

function SectionRisk({ cfg, setCfg }: { cfg: CustomBotConfig; setCfg: (c: CustomBotConfig) => void }) {
  return (
    <div>
      <SectionTitle>Nivel de riesgo global</SectionTitle>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { value: "conservative", label: "Conservador", desc: "SL/TP ajustados, bajo riesgo" },
          { value: "moderate",     label: "Moderado",    desc: "Balance entre riesgo y retorno" },
          { value: "aggressive",   label: "Agresivo",    desc: "Mayor exposición, más potencial" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setCfg({ ...cfg, risk_level: opt.value as CustomBotConfig["risk_level"] })}
            className={`p-3 rounded-xl border text-left transition-all ${
              cfg.risk_level === opt.value
                ? "bg-blue-600/15 border-blue-500/40"
                : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.18]"
            }`}
          >
            <p className={`text-xs font-bold ${cfg.risk_level === opt.value ? "text-blue-300" : "text-slate-400"}`}>{opt.label}</p>
            <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{opt.desc}</p>
          </button>
        ))}
      </div>

      <SectionTitle>Parámetros de riesgo</SectionTitle>
      <Field label="Stop Loss %" hint="Porcentaje de pérdida para cerrar posición">
        <NumberInput value={cfg.stop_loss_pct} onChange={(v) => setCfg({ ...cfg, stop_loss_pct: v })} min={0.1} max={50} step={0.1} suffix="%" />
      </Field>
      <Field label="Take Profit %" hint="Porcentaje de ganancia para cerrar posición">
        <NumberInput value={cfg.take_profit_pct} onChange={(v) => setCfg({ ...cfg, take_profit_pct: v })} min={0.1} max={100} step={0.1} suffix="%" />
      </Field>
      <Field label="Riesgo por operación %" hint="% del capital arriesgado en cada trade">
        <NumberInput value={cfg.risk_per_trade_pct} onChange={(v) => setCfg({ ...cfg, risk_per_trade_pct: v })} min={0.1} max={10} step={0.1} suffix="%" />
      </Field>
      <Field label="Máximo Drawdown %" hint="Si se supera este drawdown, el bot se detiene">
        <NumberInput value={cfg.max_drawdown_pct} onChange={(v) => setCfg({ ...cfg, max_drawdown_pct: v })} min={1} max={100} step={0.5} suffix="%" />
      </Field>
      <Field label="Máximo posiciones abiertas" hint="Límite de posiciones simultáneas">
        <NumberInput value={cfg.max_open_positions} onChange={(v) => setCfg({ ...cfg, max_open_positions: v })} min={1} max={50} />
      </Field>
      <Field label="Tamaño máximo de posición %" hint="Máximo % del balance por posición">
        <NumberInput value={cfg.max_position_size_pct} onChange={(v) => setCfg({ ...cfg, max_position_size_pct: v })} min={1} max={100} step={0.5} suffix="%" />
      </Field>
      <Field label="Límite de pérdida diaria %" hint="Bot se detiene si se supera esta pérdida en el día">
        <NumberInput value={cfg.daily_loss_limit_pct} onChange={(v) => setCfg({ ...cfg, daily_loss_limit_pct: v })} min={0.1} max={50} step={0.1} suffix="%" />
      </Field>
      <Field label="Detener después de X pérdidas seguidas" hint="0 = desactivado">
        <NumberInput value={cfg.stop_after_consecutive_losses} onChange={(v) => setCfg({ ...cfg, stop_after_consecutive_losses: v })} min={0} max={20} />
      </Field>
      <Field label="Objetivo de ganancia diaria %" hint="Bot se detiene al alcanzar este % de ganancia. 0 = desactivado">
        <NumberInput value={cfg.daily_profit_target_pct} onChange={(v) => setCfg({ ...cfg, daily_profit_target_pct: v })} min={0} max={100} step={0.5} suffix="%" />
      </Field>
    </div>
  );
}

function SectionEntries({ cfg, setCfg }: { cfg: CustomBotConfig; setCfg: (c: CustomBotConfig) => void }) {
  return (
    <div>
      <SectionTitle>Gestión de posición</SectionTitle>
      <Field label="Trailing Stop" hint="Stop Loss que sigue al precio cuando va a favor">
        <Toggle checked={cfg.trailing_stop} onChange={(v) => setCfg({ ...cfg, trailing_stop: v })} />
      </Field>
      {cfg.trailing_stop && (
        <Field label="Trailing Stop %" hint="Distancia del trailing stop respecto al precio máximo">
          <NumberInput value={cfg.trailing_stop_pct} onChange={(v) => setCfg({ ...cfg, trailing_stop_pct: v })} min={0.1} max={20} step={0.1} suffix="%" />
        </Field>
      )}
      <Field label="Breakeven" hint="Mover SL al precio de entrada cuando hay ganancia suficiente">
        <Toggle checked={cfg.breakeven} onChange={(v) => setCfg({ ...cfg, breakeven: v })} />
      </Field>
      {cfg.breakeven && (
        <Field label="Activar breakeven al %" hint="Activar cuando la ganancia alcance este %">
          <NumberInput value={cfg.breakeven_trigger_pct} onChange={(v) => setCfg({ ...cfg, breakeven_trigger_pct: v })} min={0.1} max={50} step={0.1} suffix="%" />
        </Field>
      )}
      <Field label="Cierre parcial" hint="Cerrar una parte de la posición al llegar al TP">
        <Toggle checked={cfg.partial_close} onChange={(v) => setCfg({ ...cfg, partial_close: v })} />
      </Field>
      {cfg.partial_close && (
        <Field label="% a cerrar parcialmente" hint="Porcentaje de la posición a cerrar en el primer TP">
          <NumberInput value={cfg.partial_close_pct} onChange={(v) => setCfg({ ...cfg, partial_close_pct: v })} min={10} max={90} step={5} suffix="%" />
        </Field>
      )}

      <SectionTitle>Tiempo</SectionTitle>
      <Field label="Duración máxima por trade (horas)" hint="0 = sin límite">
        <NumberInput value={cfg.max_trade_duration_hours} onChange={(v) => setCfg({ ...cfg, max_trade_duration_hours: v })} min={0} max={720} suffix="h" />
      </Field>
      <Field label="Cerrar posiciones al final del día" hint="Cerrar todo antes del cierre de mercado">
        <Toggle checked={cfg.close_end_of_day} onChange={(v) => setCfg({ ...cfg, close_end_of_day: v })} />
      </Field>
    </div>
  );
}

function SectionFilters({ cfg, setCfg }: { cfg: CustomBotConfig; setCfg: (c: CustomBotConfig) => void }) {
  return (
    <div>
      <SectionTitle>Sesión de mercado</SectionTitle>
      <Field label="Solo en horario de mercado" hint="Solo operar durante la sesión regular">
        <Toggle checked={cfg.only_market_hours} onChange={(v) => setCfg({ ...cfg, only_market_hours: v })} />
      </Field>
      <Field label="Operar en pre-market" hint="Permitir trades antes de la apertura">
        <Toggle checked={cfg.trade_premarket} onChange={(v) => setCfg({ ...cfg, trade_premarket: v })} />
      </Field>
      <Field label="Operar en after-hours" hint="Permitir trades después del cierre">
        <Toggle checked={cfg.trade_after_hours} onChange={(v) => setCfg({ ...cfg, trade_after_hours: v })} />
      </Field>
      <Field label="Sesión preferida">
        <SelectInput
          value={cfg.session_filter}
          onChange={(v) => setCfg({ ...cfg, session_filter: v })}
          options={[
            { value: "all",    label: "Todas las sesiones" },
            { value: "london", label: "Sesión Londres" },
            { value: "ny",     label: "Sesión New York" },
            { value: "asian",  label: "Sesión Asiática" },
          ]}
        />
      </Field>

      <SectionTitle>Filtros de mercado</SectionTitle>
      <Field label="Filtro de volatilidad" hint="Evitar operar en mercados con baja volatilidad">
        <Toggle checked={cfg.volatility_filter} onChange={(v) => setCfg({ ...cfg, volatility_filter: v })} />
      </Field>
      <Field label="Filtro de volumen" hint="Requerir volumen mínimo antes de operar">
        <Toggle checked={cfg.volume_filter} onChange={(v) => setCfg({ ...cfg, volume_filter: v })} />
      </Field>
      <Field label="Filtro de tendencia" hint="Solo operar en mercados con tendencia definida">
        <Toggle checked={cfg.trend_filter} onChange={(v) => setCfg({ ...cfg, trend_filter: v })} />
      </Field>
      <Field label="Filtro por noticias" hint="Pausar antes/después de eventos económicos importantes">
        <Toggle checked={cfg.news_filter} onChange={(v) => setCfg({ ...cfg, news_filter: v })} />
      </Field>
      <Field label="Filtro de spread" hint="Evitar operar cuando el spread es elevado">
        <Toggle checked={cfg.spread_filter} onChange={(v) => setCfg({ ...cfg, spread_filter: v })} />
      </Field>
    </div>
  );
}

function SectionAdvanced({ cfg, setCfg }: { cfg: CustomBotConfig; setCfg: (c: CustomBotConfig) => void }) {
  return (
    <div>
      <SectionTitle>Indicadores técnicos</SectionTitle>
      <Field label="Usar indicadores técnicos" hint="EMA, RSI para generar señales">
        <Toggle checked={cfg.use_technical_indicators} onChange={(v) => setCfg({ ...cfg, use_technical_indicators: v })} />
      </Field>
      {cfg.use_technical_indicators && (
        <>
          <Field label="EMA rápida" hint="Período de la EMA corta (señal de cruce)">
            <NumberInput value={cfg.ema_fast} onChange={(v) => setCfg({ ...cfg, ema_fast: v })} min={2} max={50} />
          </Field>
          <Field label="EMA lenta" hint="Período de la EMA larga">
            <NumberInput value={cfg.ema_slow} onChange={(v) => setCfg({ ...cfg, ema_slow: v })} min={5} max={500} />
          </Field>
          <Field label="RSI período">
            <NumberInput value={cfg.rsi_period} onChange={(v) => setCfg({ ...cfg, rsi_period: v })} min={2} max={50} />
          </Field>
          <Field label="RSI sobrecompra" hint="Por encima → considerar señal de venta">
            <NumberInput value={cfg.rsi_overbought} onChange={(v) => setCfg({ ...cfg, rsi_overbought: v })} min={50} max={95} step={0.5} />
          </Field>
          <Field label="RSI sobreventa" hint="Por debajo → considerar señal de compra">
            <NumberInput value={cfg.rsi_oversold} onChange={(v) => setCfg({ ...cfg, rsi_oversold: v })} min={5} max={50} step={0.5} />
          </Field>
        </>
      )}

      <SectionTitle>Timeframes</SectionTitle>
      <Field label="Timeframe principal">
        <SelectInput
          value={cfg.timeframe}
          onChange={(v) => setCfg({ ...cfg, timeframe: v })}
          options={TIMEFRAMES.map((t) => ({ value: t, label: t }))}
        />
      </Field>
      <Field label="Timeframe de confirmación">
        <SelectInput
          value={cfg.confirmation_timeframe}
          onChange={(v) => setCfg({ ...cfg, confirmation_timeframe: v })}
          options={TIMEFRAMES.map((t) => ({ value: t, label: t }))}
        />
      </Field>

      <SectionTitle>Lógica de estrategia</SectionTitle>
      <Field label="Confianza mínima para entrar" hint="Score 0–100 requerido para abrir posición">
        <NumberInput value={cfg.min_confidence_score} onChange={(v) => setCfg({ ...cfg, min_confidence_score: v })} min={0} max={100} />
      </Field>
      <Field label="Risk/Reward mínimo" hint="Ratio mínimo TP/SL requerido">
        <NumberInput value={cfg.min_rr_ratio} onChange={(v) => setCfg({ ...cfg, min_rr_ratio: v })} min={0.5} max={10} step={0.1} />
      </Field>
      <Field label="Permitir reversals" hint="Cerrar posición actual y abrir en dirección contraria">
        <Toggle checked={cfg.allow_reversals} onChange={(v) => setCfg({ ...cfg, allow_reversals: v })} />
      </Field>
      <Field label="Permitir averaging down" hint="Agregar a una posición perdedora">
        <Toggle checked={cfg.allow_averaging_down} onChange={(v) => setCfg({ ...cfg, allow_averaging_down: v })} />
      </Field>
      <Field label="Permitir pyramiding" hint="Agregar a una posición ganadora">
        <Toggle checked={cfg.allow_pyramiding} onChange={(v) => setCfg({ ...cfg, allow_pyramiding: v })} />
      </Field>
      <Field label="Máx posiciones por símbolo">
        <NumberInput value={cfg.per_symbol_max_positions} onChange={(v) => setCfg({ ...cfg, per_symbol_max_positions: v })} min={1} max={10} />
      </Field>
    </div>
  );
}

function SectionExecution({ cfg, setCfg }: { cfg: CustomBotConfig; setCfg: (c: CustomBotConfig) => void }) {
  return (
    <div>
      <SectionTitle>Capital y tamaño</SectionTitle>
      <Field label="Monto por operación ($)" hint="USD a invertir en cada trade">
        <NumberInput value={cfg.investment_amount} onChange={(v) => setCfg({ ...cfg, investment_amount: v })} min={1} max={100000} step={10} suffix="$" />
      </Field>
      <Field label="Capital asignado al bot %" hint="% del balance total reservado para este bot">
        <NumberInput value={cfg.capital_allocation_pct} onChange={(v) => setCfg({ ...cfg, capital_allocation_pct: v })} min={1} max={100} step={1} suffix="%" />
      </Field>

      <SectionTitle>Frecuencia y prioridad</SectionTitle>
      <Field label="Intervalo de ejecución" hint="Cada cuánto evalúa señales el bot">
        <SelectInput
          value={String(cfg.run_interval_seconds)}
          onChange={(v) => setCfg({ ...cfg, run_interval_seconds: Number(v) })}
          options={[
            { value: "60",    label: "Cada 1 min" },
            { value: "300",   label: "Cada 5 min" },
            { value: "900",   label: "Cada 15 min" },
            { value: "1800",  label: "Cada 30 min" },
            { value: "3600",  label: "Cada 1 hora" },
            { value: "14400", label: "Cada 4 horas" },
            { value: "86400", label: "Cada 24 horas" },
          ]}
        />
      </Field>
      <Field label="Cooldown entre trades" hint="Tiempo mínimo entre dos trades en el mismo símbolo">
        <SelectInput
          value={String(cfg.cooldown_seconds)}
          onChange={(v) => setCfg({ ...cfg, cooldown_seconds: Number(v) })}
          options={[
            { value: "0",     label: "Sin cooldown" },
            { value: "300",   label: "5 minutos" },
            { value: "900",   label: "15 minutos" },
            { value: "1800",  label: "30 minutos" },
            { value: "3600",  label: "1 hora" },
            { value: "7200",  label: "2 horas" },
            { value: "86400", label: "24 horas" },
          ]}
        />
      </Field>
      <Field label="Prioridad del bot" hint="Bots de mayor prioridad operan primero (1 = mayor)">
        <NumberInput value={cfg.priority} onChange={(v) => setCfg({ ...cfg, priority: v })} min={1} max={10} />
      </Field>

      <SectionTitle>Estado al guardar</SectionTitle>
      <Field label="Activar bot al guardar" hint="El bot comenzará a operar automáticamente después de guardarlo">
        <Toggle checked={cfg.enabled_on_save} onChange={(v) => setCfg({ ...cfg, enabled_on_save: v })} />
      </Field>
      {cfg.enabled_on_save && cfg.allowed_symbols.length === 0 && (
        <div className="flex items-start gap-2 mt-3 p-3 bg-amber-500/[0.07] border border-amber-500/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400">Selecciona al menos un símbolo en la sección "Mercados" para poder activar el bot.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NewBotPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [cfg, setCfg] = useState<CustomBotConfig>({ ...DEFAULT_CONFIG });
  const [section, setSection] = useState(0);
  const [nameError, setNameError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const mutation = useMutation({
    mutationFn: async () =>
      (await api.post("/custom-bots", { name: name.trim(), config: cfg })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-bots"] });
      router.push("/my-bots");
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } };
      const detail = e.response?.data?.detail ?? "Error al crear el bot";
      if (detail.includes("nombre")) {
        setNameError(detail);
        setSection(0);
      } else {
        setSubmitError(detail);
      }
    },
  });

  const handleSave = () => {
    setNameError("");
    setSubmitError("");
    if (!name.trim()) {
      setNameError("El nombre del bot es obligatorio");
      setSection(0);
      return;
    }
    mutation.mutate();
  };

  const sectionProps = { cfg, setCfg };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/my-bots")}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            Crear bot personalizado
          </h1>
          <p className="text-xs text-slate-600">Configura tu bot automático en 7 pasos</p>
        </div>
      </div>

      {/* Progress tabs */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {SECTIONS.map((s, i) => (
          <button
            key={s}
            onClick={() => setSection(i)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              i === section
                ? "bg-blue-600/15 border border-blue-500/40 text-blue-300"
                : i < section
                ? "bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400"
                : "bg-white/[0.02] border border-white/[0.06] text-slate-600 hover:text-slate-300"
            }`}
          >
            {i < section && <Check className="w-3 h-3" />}
            <span>{i + 1}. {s}</span>
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="bg-[#0D1626] border border-white/[0.07] rounded-2xl p-6">
        {section === 0 && <SectionGeneral name={name} setName={setName} cfg={cfg} setCfg={setCfg} nameError={nameError} />}
        {section === 1 && <SectionMarkets {...sectionProps} />}
        {section === 2 && <SectionRisk {...sectionProps} />}
        {section === 3 && <SectionEntries {...sectionProps} />}
        {section === 4 && <SectionFilters {...sectionProps} />}
        {section === 5 && <SectionAdvanced {...sectionProps} />}
        {section === 6 && <SectionExecution {...sectionProps} />}
      </div>

      {/* Error */}
      {submitError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/[0.08] border border-red-500/20 rounded-xl text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {submitError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setSection((s) => Math.max(0, s - 1))}
          disabled={section === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.08] text-sm font-medium text-slate-400 hover:text-slate-200 hover:border-white/[0.18] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <div className="flex items-center gap-2">
          {section < SECTIONS.length - 1 ? (
            <button
              onClick={() => setSection((s) => s + 1)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSave}
              loading={mutation.isPending}
              disabled={mutation.isPending}
            >
              {cfg.enabled_on_save ? "Guardar y activar bot" : "Guardar bot"}
            </Button>
          )}
        </div>
      </div>

      {/* Summary preview */}
      {name && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: cfg.color + "44", border: `1.5px solid ${cfg.color}88` }}
          >
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{name}</p>
            <p className="text-[11px] text-slate-600">
              {cfg.allowed_symbols.length} símbolo{cfg.allowed_symbols.length !== 1 ? "s" : ""} ·
              SL {cfg.stop_loss_pct}% / TP {cfg.take_profit_pct}% ·
              {cfg.direction === "both" ? " Long & Short" : cfg.direction === "long_only" ? " Solo Long" : " Solo Short"}
            </p>
          </div>
          {cfg.enabled_on_save && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
              Se activará
            </span>
          )}
        </div>
      )}
    </div>
  );
}
