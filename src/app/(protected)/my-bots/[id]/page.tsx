"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import type { CustomBot, CustomBotConfig } from "@/types";
import { Button } from "@/components/ui/Button";
import {
  ChevronLeft, Play, Square, Trash2, Save, Copy,
  AlertCircle, Check, Bot, Clock, Activity, RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useBotTabsStore } from "@/store/botTabsStore";

// ─── Reuse the same sub-components from the new-bot form ─────────────────────
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

function NumIn({ value, onChange, min = 0, max, step = 1, suffix }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min} max={max} step={step}
        className="w-24 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-sm text-slate-200 font-mono text-right focus:outline-none focus:border-blue-500/50"
      />
      {suffix && <span className="text-xs text-slate-600">{suffix}</span>}
    </div>
  );
}

function Sel({ value, onChange, opts }: {
  value: string; onChange: (v: string) => void;
  opts: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer"
    >
      {opts.map((o) => <option key={o.value} value={o.value} className="bg-[#0D1626]">{o.label}</option>)}
    </select>
  );
}

const COLORS = ["#6366f1", "#22c55e", "#3b82f6", "#a855f7", "#fb923c", "#14b8a6", "#f43f5e", "#f59e0b", "#06b6d4", "#84cc16"];
const FOREX_SYMS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF", "NZD/USD", "EUR/GBP", "GBP/JPY", "AUD/JPY", "USD/CAD"];
const STOCK_SYMS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "SPY", "QQQ", "AMD"];
const CRYPTO_SYMS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT"];
const TFS = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];
const SECTIONS = ["General", "Mercados", "Riesgo", "Entradas & Salidas", "Filtros", "Avanzado", "Ejecución"];

function SymPicker({ symbols, selected, onToggle }: { symbols: string[]; selected: string[]; onToggle: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 max-w-xs">
      {symbols.map((s) => {
        const on = selected.includes(s);
        return (
          <button key={s} type="button" onClick={() => onToggle(s)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${on ? "bg-blue-600/20 border-blue-500/40 text-blue-300" : "bg-white/[0.03] border-white/[0.08] text-slate-500 hover:border-white/[0.20] hover:text-slate-300"}`}>
            {s}
          </button>
        );
      })}
    </div>
  );
}

// ─── Status panel ─────────────────────────────────────────────────────────────
function StatusPanel({ botId, botUuid }: { botId: string; botUuid: string }) {
  const { data: status, refetch } = useQuery({
    queryKey: ["custom-bot-status", botUuid],
    queryFn: async () => (await api.get(`/custom-bots/${botUuid}/status`)).data,
    refetchInterval: 10_000,
  });

  const { data: logs } = useQuery({
    queryKey: ["bot-logs", botId],
    queryFn: async () => (await api.get(`/bot/logs?bot_id=${botId}&limit=20`)).data,
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Estado del bot</h3>
        <button onClick={() => refetch()} className="text-slate-600 hover:text-slate-300 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            {status?.is_running ? (
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            ) : (
              <span className="w-2 h-2 bg-slate-600 rounded-full" />
            )}
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Estado</span>
          </div>
          <p className={`text-sm font-semibold ${status?.is_running ? "text-emerald-400" : "text-slate-500"}`}>
            {status?.is_running ? "Activo" : "Inactivo"}
          </p>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Ciclos</p>
          <p className="text-sm font-semibold text-slate-300">{status?.cycles_run ?? 0}</p>
        </div>
      </div>

      {status?.last_log && (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Último log</p>
          <p className="text-xs font-mono text-slate-400">{status.last_log}</p>
        </div>
      )}

      {status?.last_error && (
        <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-1">Error</p>
          <p className="text-xs font-mono text-red-400">{status.last_error}</p>
        </div>
      )}

      {/* Logs */}
      {logs?.logs?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-2">Historial reciente</p>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {logs.logs.map((l: { timestamp: string; message: string }, i: number) => (
              <div key={i} className="flex gap-2 text-[10px]">
                <span className="text-slate-700 shrink-0 font-mono">{new Date(l.timestamp).toLocaleTimeString()}</span>
                <span className="text-slate-500 truncate">{l.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BotDetailPage() {
  const router = useRouter();
  const params = useParams();
  const botUuid = params.id as string;
  const qc = useQueryClient();
  const { addTab, removeTab } = useBotTabsStore();

  const { data: bot, isLoading } = useQuery<CustomBot>({
    queryKey: ["custom-bot", botUuid],
    queryFn: async () => (await api.get(`/custom-bots/${botUuid}`)).data,
  });

  const [name, setName] = useState("");
  const [cfg, setCfg] = useState<CustomBotConfig | null>(null);
  const [section, setSection] = useState(0);
  const [nameError, setNameError] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (bot) {
      setName(bot.name);
      setCfg(bot.config);
    }
  }, [bot]);

  const updateMutation = useMutation({
    mutationFn: async () =>
      (await api.put(`/custom-bots/${botUuid}`, { name: name.trim(), config: cfg })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-bot", botUuid] });
      qc.invalidateQueries({ queryKey: ["custom-bots"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } };
      const detail = e.response?.data?.detail ?? "";
      if (detail.includes("nombre")) { setNameError(detail); setSection(0); }
    },
  });

  const startMutation = useMutation({
    mutationFn: async () => (await api.post(`/custom-bots/${botUuid}/start`)).data,
    onSuccess: () => {
      if (bot) addTab(bot.bot_id, { name: bot.name, color: bot.color });
      qc.invalidateQueries({ queryKey: ["custom-bot", botUuid] });
      qc.invalidateQueries({ queryKey: ["custom-bots"] });
      qc.invalidateQueries({ queryKey: ["custom-bot-status", botUuid] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => (await api.post(`/custom-bots/${botUuid}/stop`)).data,
    onSuccess: () => {
      if (bot) removeTab(bot.bot_id);
      qc.invalidateQueries({ queryKey: ["custom-bot", botUuid] });
      qc.invalidateQueries({ queryKey: ["custom-bots"] });
      qc.invalidateQueries({ queryKey: ["custom-bot-status", botUuid] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => (await api.post(`/custom-bots/${botUuid}/duplicate`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-bots"] });
      router.push("/my-bots");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/custom-bots/${botUuid}`),
    onSuccess: () => {
      if (bot) removeTab(bot.bot_id);
      qc.invalidateQueries({ queryKey: ["custom-bots"] });
      router.push("/my-bots");
    },
  });

  if (isLoading || !bot || !cfg) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  const handleSave = () => {
    setNameError("");
    if (!name.trim()) { setNameError("El nombre es obligatorio"); setSection(0); return; }
    updateMutation.mutate();
  };

  const toggleSymbol = (sym: string, list: "allowed_symbols" | "blocked_symbols") => {
    const current = cfg[list];
    setCfg({ ...cfg, [list]: current.includes(sym) ? current.filter((s) => s !== sym) : [...current, sym] });
  };

  return (
    <div className="flex gap-6 items-start">

      {/* ── Main config area ───────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/my-bots")} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: bot.color + "33", border: `1.5px solid ${bot.color}66` }}
          >
            {bot.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-slate-100 truncate">{bot.name}</h1>
            <p className="text-[11px] text-slate-600">
              Creado {formatDate(bot.created_at)} · ID: {bot.bot_id}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Guardado
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => duplicateMutation.mutate()} loading={duplicateMutation.isPending}>
              <Copy className="w-3.5 h-3.5" /> Duplicar
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={updateMutation.isPending}>
              <Save className="w-3.5 h-3.5" /> Guardar
            </Button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {SECTIONS.map((s, i) => (
            <button key={s} onClick={() => setSection(i)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${i === section ? "bg-blue-600/15 border border-blue-500/40 text-blue-300" : "bg-white/[0.02] border border-white/[0.06] text-slate-600 hover:text-slate-300"}`}>
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {/* Section panel */}
        <div className="bg-[#0D1626] border border-white/[0.07] rounded-2xl p-6">
          {section === 0 && (
            <div>
              <SectionTitle>Nombre</SectionTitle>
              <div className="mb-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(""); }}
                  maxLength={100}
                  className={`w-full bg-white/[0.04] border rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none transition-colors ${nameError ? "border-red-500/60" : "border-white/[0.1] focus:border-blue-500/60"}`}
                />
                {nameError && <p className="flex items-center gap-1 mt-1 text-xs text-red-400"><AlertCircle className="w-3.5 h-3.5" />{nameError}</p>}
              </div>
              <SectionTitle>Descripción</SectionTitle>
              <textarea value={cfg.description || ""} onChange={(e) => setCfg({ ...cfg, description: e.target.value })} rows={2} className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 resize-none mb-4" />
              <SectionTitle>Color</SectionTitle>
              <div className="flex flex-wrap gap-2 mb-6">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setCfg({ ...cfg, color: c })} className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110" style={{ background: c, borderColor: cfg.color === c ? "#fff" : "transparent" }} />
                ))}
              </div>
              <SectionTitle>Dirección</SectionTitle>
              <div className="grid grid-cols-3 gap-2">
                {[{ value: "both", label: "Long & Short" }, { value: "long_only", label: "Solo Long" }, { value: "short_only", label: "Solo Short" }].map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setCfg({ ...cfg, direction: opt.value as CustomBotConfig["direction"] })} className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${cfg.direction === opt.value ? "bg-blue-600/15 border-blue-500/40 text-blue-300" : "bg-white/[0.02] border-white/[0.08] text-slate-500 hover:border-white/[0.18]"}`}>{opt.label}</button>
                ))}
              </div>
            </div>
          )}

          {section === 1 && (
            <div>
              <SectionTitle>Clases de activos</SectionTitle>
              <Field label="Stocks"><Toggle checked={cfg.trade_stocks} onChange={(v) => setCfg({ ...cfg, trade_stocks: v })} /></Field>
              <Field label="Forex"><Toggle checked={cfg.trade_forex} onChange={(v) => setCfg({ ...cfg, trade_forex: v })} /></Field>
              <Field label="Crypto"><Toggle checked={cfg.trade_crypto} onChange={(v) => setCfg({ ...cfg, trade_crypto: v })} /></Field>
              <Field label="Commodities"><Toggle checked={cfg.trade_commodities} onChange={(v) => setCfg({ ...cfg, trade_commodities: v })} /></Field>
              <SectionTitle>Símbolos permitidos</SectionTitle>
              {cfg.trade_stocks && <div className="mb-3"><p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2">Stocks</p><SymPicker symbols={STOCK_SYMS} selected={cfg.allowed_symbols} onToggle={(s) => toggleSymbol(s, "allowed_symbols")} /></div>}
              {cfg.trade_forex && <div className="mb-3"><p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2">Forex</p><SymPicker symbols={FOREX_SYMS} selected={cfg.allowed_symbols} onToggle={(s) => toggleSymbol(s, "allowed_symbols")} /></div>}
              {cfg.trade_crypto && <div className="mb-3"><p className="text-[11px] text-slate-500 uppercase tracking-wide mb-2">Crypto</p><SymPicker symbols={CRYPTO_SYMS} selected={cfg.allowed_symbols} onToggle={(s) => toggleSymbol(s, "allowed_symbols")} /></div>}
            </div>
          )}

          {section === 2 && (
            <div>
              <SectionTitle>Parámetros de riesgo</SectionTitle>
              <Field label="Stop Loss %"><NumIn value={cfg.stop_loss_pct} onChange={(v) => setCfg({ ...cfg, stop_loss_pct: v })} min={0.1} max={50} step={0.1} suffix="%" /></Field>
              <Field label="Take Profit %"><NumIn value={cfg.take_profit_pct} onChange={(v) => setCfg({ ...cfg, take_profit_pct: v })} min={0.1} max={100} step={0.1} suffix="%" /></Field>
              <Field label="Máx. Drawdown %"><NumIn value={cfg.max_drawdown_pct} onChange={(v) => setCfg({ ...cfg, max_drawdown_pct: v })} min={1} max={100} step={0.5} suffix="%" /></Field>
              <Field label="Máx. posiciones abiertas"><NumIn value={cfg.max_open_positions} onChange={(v) => setCfg({ ...cfg, max_open_positions: v })} min={1} max={50} /></Field>
              <Field label="Daily loss limit %"><NumIn value={cfg.daily_loss_limit_pct} onChange={(v) => setCfg({ ...cfg, daily_loss_limit_pct: v })} min={0.1} max={50} step={0.1} suffix="%" /></Field>
              <Field label="Detener después de X pérdidas seguidas"><NumIn value={cfg.stop_after_consecutive_losses} onChange={(v) => setCfg({ ...cfg, stop_after_consecutive_losses: v })} min={0} max={20} /></Field>
            </div>
          )}

          {section === 3 && (
            <div>
              <SectionTitle>Gestión de posición</SectionTitle>
              <Field label="Trailing Stop"><Toggle checked={cfg.trailing_stop} onChange={(v) => setCfg({ ...cfg, trailing_stop: v })} /></Field>
              {cfg.trailing_stop && <Field label="Trailing Stop %"><NumIn value={cfg.trailing_stop_pct} onChange={(v) => setCfg({ ...cfg, trailing_stop_pct: v })} min={0.1} max={20} step={0.1} suffix="%" /></Field>}
              <Field label="Breakeven"><Toggle checked={cfg.breakeven} onChange={(v) => setCfg({ ...cfg, breakeven: v })} /></Field>
              {cfg.breakeven && <Field label="Activar breakeven al %"><NumIn value={cfg.breakeven_trigger_pct} onChange={(v) => setCfg({ ...cfg, breakeven_trigger_pct: v })} min={0.1} max={50} step={0.1} suffix="%" /></Field>}
              <Field label="Cierre parcial"><Toggle checked={cfg.partial_close} onChange={(v) => setCfg({ ...cfg, partial_close: v })} /></Field>
              {cfg.partial_close && <Field label="% a cerrar parcialmente"><NumIn value={cfg.partial_close_pct} onChange={(v) => setCfg({ ...cfg, partial_close_pct: v })} min={10} max={90} step={5} suffix="%" /></Field>}
              <SectionTitle>Tiempo</SectionTitle>
              <Field label="Duración máxima por trade (h)" hint="0 = sin límite"><NumIn value={cfg.max_trade_duration_hours} onChange={(v) => setCfg({ ...cfg, max_trade_duration_hours: v })} min={0} max={720} suffix="h" /></Field>
              <Field label="Cerrar posiciones al final del día"><Toggle checked={cfg.close_end_of_day} onChange={(v) => setCfg({ ...cfg, close_end_of_day: v })} /></Field>
            </div>
          )}

          {section === 4 && (
            <div>
              <SectionTitle>Sesión</SectionTitle>
              <Field label="Solo horario de mercado"><Toggle checked={cfg.only_market_hours} onChange={(v) => setCfg({ ...cfg, only_market_hours: v })} /></Field>
              <Field label="Pre-market"><Toggle checked={cfg.trade_premarket} onChange={(v) => setCfg({ ...cfg, trade_premarket: v })} /></Field>
              <Field label="After-hours"><Toggle checked={cfg.trade_after_hours} onChange={(v) => setCfg({ ...cfg, trade_after_hours: v })} /></Field>
              <Field label="Sesión preferida">
                <Sel value={cfg.session_filter} onChange={(v) => setCfg({ ...cfg, session_filter: v })} opts={[{ value: "all", label: "Todas" }, { value: "london", label: "Londres" }, { value: "ny", label: "New York" }, { value: "asian", label: "Asiática" }]} />
              </Field>
              <SectionTitle>Filtros</SectionTitle>
              <Field label="Filtro de volatilidad"><Toggle checked={cfg.volatility_filter} onChange={(v) => setCfg({ ...cfg, volatility_filter: v })} /></Field>
              <Field label="Filtro de volumen"><Toggle checked={cfg.volume_filter} onChange={(v) => setCfg({ ...cfg, volume_filter: v })} /></Field>
              <Field label="Filtro de tendencia"><Toggle checked={cfg.trend_filter} onChange={(v) => setCfg({ ...cfg, trend_filter: v })} /></Field>
              <Field label="Filtro por noticias"><Toggle checked={cfg.news_filter} onChange={(v) => setCfg({ ...cfg, news_filter: v })} /></Field>
              <Field label="Filtro de spread"><Toggle checked={cfg.spread_filter} onChange={(v) => setCfg({ ...cfg, spread_filter: v })} /></Field>
            </div>
          )}

          {section === 5 && (
            <div>
              <SectionTitle>Indicadores</SectionTitle>
              <Field label="Usar indicadores técnicos"><Toggle checked={cfg.use_technical_indicators} onChange={(v) => setCfg({ ...cfg, use_technical_indicators: v })} /></Field>
              {cfg.use_technical_indicators && (
                <>
                  <Field label="EMA rápida"><NumIn value={cfg.ema_fast} onChange={(v) => setCfg({ ...cfg, ema_fast: v })} min={2} max={50} /></Field>
                  <Field label="EMA lenta"><NumIn value={cfg.ema_slow} onChange={(v) => setCfg({ ...cfg, ema_slow: v })} min={5} max={500} /></Field>
                  <Field label="RSI período"><NumIn value={cfg.rsi_period} onChange={(v) => setCfg({ ...cfg, rsi_period: v })} min={2} max={50} /></Field>
                  <Field label="RSI sobrecompra"><NumIn value={cfg.rsi_overbought} onChange={(v) => setCfg({ ...cfg, rsi_overbought: v })} min={50} max={95} step={0.5} /></Field>
                  <Field label="RSI sobreventa"><NumIn value={cfg.rsi_oversold} onChange={(v) => setCfg({ ...cfg, rsi_oversold: v })} min={5} max={50} step={0.5} /></Field>
                </>
              )}
              <SectionTitle>Timeframes</SectionTitle>
              <Field label="Timeframe principal"><Sel value={cfg.timeframe} onChange={(v) => setCfg({ ...cfg, timeframe: v })} opts={TFS.map((t) => ({ value: t, label: t }))} /></Field>
              <Field label="Timeframe de confirmación"><Sel value={cfg.confirmation_timeframe} onChange={(v) => setCfg({ ...cfg, confirmation_timeframe: v })} opts={TFS.map((t) => ({ value: t, label: t }))} /></Field>
              <SectionTitle>Lógica</SectionTitle>
              <Field label="Confianza mínima (0–100)"><NumIn value={cfg.min_confidence_score} onChange={(v) => setCfg({ ...cfg, min_confidence_score: v })} min={0} max={100} /></Field>
              <Field label="R/R mínimo"><NumIn value={cfg.min_rr_ratio} onChange={(v) => setCfg({ ...cfg, min_rr_ratio: v })} min={0.5} max={10} step={0.1} /></Field>
              <Field label="Permitir reversals"><Toggle checked={cfg.allow_reversals} onChange={(v) => setCfg({ ...cfg, allow_reversals: v })} /></Field>
              <Field label="Permitir averaging down"><Toggle checked={cfg.allow_averaging_down} onChange={(v) => setCfg({ ...cfg, allow_averaging_down: v })} /></Field>
              <Field label="Permitir pyramiding"><Toggle checked={cfg.allow_pyramiding} onChange={(v) => setCfg({ ...cfg, allow_pyramiding: v })} /></Field>
            </div>
          )}

          {section === 6 && (
            <div>
              <SectionTitle>Capital</SectionTitle>
              <Field label="Monto por operación ($)"><NumIn value={cfg.investment_amount} onChange={(v) => setCfg({ ...cfg, investment_amount: v })} min={1} max={100000} step={10} suffix="$" /></Field>
              <Field label="Capital asignado (%)"><NumIn value={cfg.capital_allocation_pct} onChange={(v) => setCfg({ ...cfg, capital_allocation_pct: v })} min={1} max={100} step={1} suffix="%" /></Field>
              <SectionTitle>Frecuencia</SectionTitle>
              <Field label="Intervalo de ejecución">
                <Sel value={String(cfg.run_interval_seconds)} onChange={(v) => setCfg({ ...cfg, run_interval_seconds: Number(v) })} opts={[{ value: "60", label: "1 min" }, { value: "300", label: "5 min" }, { value: "900", label: "15 min" }, { value: "1800", label: "30 min" }, { value: "3600", label: "1 hora" }, { value: "14400", label: "4 horas" }, { value: "86400", label: "24 horas" }]} />
              </Field>
              <Field label="Cooldown entre trades">
                <Sel value={String(cfg.cooldown_seconds)} onChange={(v) => setCfg({ ...cfg, cooldown_seconds: Number(v) })} opts={[{ value: "0", label: "Sin cooldown" }, { value: "300", label: "5 min" }, { value: "900", label: "15 min" }, { value: "1800", label: "30 min" }, { value: "3600", label: "1 hora" }, { value: "7200", label: "2 horas" }, { value: "86400", label: "24 horas" }]} />
              </Field>
              <Field label="Prioridad"><NumIn value={cfg.priority} onChange={(v) => setCfg({ ...cfg, priority: v })} min={1} max={10} /></Field>
            </div>
          )}
        </div>
      </div>

      {/* ── Right sidebar ──────────────────────────────────────────── */}
      <div className="w-72 shrink-0 space-y-4 sticky top-0">

        {/* Control panel */}
        <div className="bg-[#0D1626] border border-white/[0.07] rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Control</h3>

          {bot.is_enabled ? (
            <button
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/15 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-600/25 transition-all disabled:opacity-40"
            >
              <Square className="w-4 h-4" />
              {stopMutation.isPending ? "Deteniendo..." : "Detener bot"}
            </button>
          ) : (
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending || cfg.allowed_symbols.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-600/25 transition-all disabled:opacity-40"
            >
              <Play className="w-4 h-4" />
              {startMutation.isPending ? "Iniciando..." : "Iniciar bot"}
            </button>
          )}

          {cfg.allowed_symbols.length === 0 && !bot.is_enabled && (
            <p className="text-[11px] text-amber-400/80 text-center">Configura al menos un símbolo para poder iniciar</p>
          )}
        </div>

        {/* Status */}
        <div className="bg-[#0D1626] border border-white/[0.07] rounded-2xl p-4">
          <StatusPanel botId={bot.bot_id} botUuid={botUuid} />
        </div>

        {/* Danger zone */}
        <div className="bg-[#0D1626] border border-red-500/[0.12] rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-red-400/80">Zona peligrosa</h3>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-red-500/20 text-red-500/70 text-xs font-semibold hover:bg-red-500/[0.06] hover:text-red-400 hover:border-red-500/40 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar bot
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 text-center leading-snug">
                ¿Estás seguro que deseas eliminar este bot?
              </p>
              <p className="text-[11px] text-slate-600 text-center">
                Se eliminarán la configuración y el historial de logs. Las posiciones/trades se conservan como historial.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-40"
                >
                  {deleteMutation.isPending ? "Eliminando..." : "Sí, eliminar"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 rounded-lg bg-white/[0.06] text-slate-400 text-xs font-semibold hover:bg-white/[0.10] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
