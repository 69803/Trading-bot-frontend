"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Ban,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Newspaper,
  Brain,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LiveIndicators {
  price: number;
  rsi: number;
  ema_fast: number;
  ema_slow: number;
  macd: number;
  macd_histogram: number;
  atr: number;
  volume_ratio: number;
}

interface LiveSignal {
  symbol: string;
  analyzed_at: string;
  tech_direction: "BUY" | "SELL" | "HOLD";
  tech_confidence: number;
  tech_reasons: string[];
  indicators: LiveIndicators;
  ema_crossover: string | null;
  macd_crossover: string | null;
  rsi_extreme: string | null;
  candles_used: number;
  sentiment_label: "positive" | "negative" | "neutral";
  sentiment_score: number;
  sentiment_impact: number;
  sentiment_modifier: number;
  sentiment_source: string;
  news_count: number;
  top_headlines: string[];
  direction: "BUY" | "SELL" | "HOLD" | "BLOCKED";
  final_confidence: number;
  override_reason: string | null;
  decision_reasons: string[];
  is_actionable: boolean;
  is_blocked: boolean;
}

interface LiveSignalsResponse {
  signals: LiveSignal[];
  generated_at: string;
  symbols_requested: number;
  symbols_ok: number;
  symbols_failed: number;
}

interface DecisionLog {
  id: string;
  symbol: string;
  decided_at: string;
  direction: string;
  final_confidence: number;
  tech_direction: string;
  tech_confidence: number;
  sentiment_label: string;
  sentiment_score: number;
  sentiment_impact: number;
  executed: boolean;
  rejection_reason: string | null;
  override_reason: string | null;
  risk_stop_loss: number | null;
  risk_take_profit: number | null;
  risk_rr_ratio: number | null;
  reasons: string | null;
}

interface DecisionsResponse {
  items: DecisionLog[];
  total: number;
}

// ── Direction helpers ─────────────────────────────────────────────────────────

function directionColor(d: string) {
  if (d === "BUY")     return "text-emerald-400";
  if (d === "SELL")    return "text-red-400";
  if (d === "BLOCKED") return "text-amber-400";
  return "text-slate-400";
}

function directionBg(d: string) {
  if (d === "BUY")     return "bg-emerald-500/10 border-emerald-500/20";
  if (d === "SELL")    return "bg-red-500/10 border-red-500/20";
  if (d === "BLOCKED") return "bg-amber-500/10 border-amber-500/20";
  return "bg-slate-500/10 border-slate-500/20";
}

function DirectionIcon({ d, cls = "w-4 h-4" }: { d: string; cls?: string }) {
  if (d === "BUY")     return <TrendingUp  className={`${cls} text-emerald-400`} />;
  if (d === "SELL")    return <TrendingDown className={`${cls} text-red-400`} />;
  if (d === "BLOCKED") return <Ban          className={`${cls} text-amber-400`} />;
  return <Minus className={`${cls} text-slate-400`} />;
}

function sentimentColor(l: string) {
  if (l === "positive") return "text-emerald-400";
  if (l === "negative") return "text-red-400";
  return "text-slate-400";
}

function ConfidenceBar({ value, dir }: { value: number; dir: string }) {
  const color =
    dir === "BUY"  ? "bg-emerald-500" :
    dir === "SELL" ? "bg-red-500"     :
    dir === "BLOCKED" ? "bg-amber-500" : "bg-slate-600";
  return (
    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ── Signal Card ───────────────────────────────────────────────────────────────

function SignalCard({ sig }: { sig: LiveSignal }) {
  const [expanded, setExpanded] = useState(false);
  const ind = sig.indicators;

  return (
    <div className="bg-[#080F1D] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white font-mono">{sig.symbol}</span>
          <span className="text-xs text-slate-500 font-mono">
            ${ind.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
          </span>
        </div>
        {/* Final decision badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold ${directionBg(sig.direction)}`}>
          <DirectionIcon d={sig.direction} cls="w-3 h-3" />
          <span className={directionColor(sig.direction)}>{sig.direction}</span>
          {sig.direction !== "HOLD" && sig.direction !== "BLOCKED" && (
            <span className="text-slate-500 font-normal ml-0.5">{sig.final_confidence}%</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Confidence bar */}
        {sig.is_actionable && (
          <div>
            <div className="flex justify-between text-[10px] text-slate-600 mb-1">
              <span>Final confidence</span>
              <span>{sig.final_confidence}%</span>
            </div>
            <ConfidenceBar value={sig.final_confidence} dir={sig.direction} />
          </div>
        )}

        {/* 3-layer row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Technical */}
          <div className="bg-white/[0.02] rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1.5">
              <BarChart3 className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-slate-500 font-medium">Technical</span>
            </div>
            <div className={`text-xs font-bold ${directionColor(sig.tech_direction)}`}>
              {sig.tech_direction}
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">{sig.tech_confidence}% conf</div>
          </div>

          {/* Sentiment */}
          <div className="bg-white/[0.02] rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1.5">
              <Newspaper className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-slate-500 font-medium">Sentiment</span>
            </div>
            <div className={`text-xs font-bold capitalize ${sentimentColor(sig.sentiment_label)}`}>
              {sig.sentiment_label}
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              {sig.sentiment_score >= 0 ? "+" : ""}{sig.sentiment_score.toFixed(2)} · {sig.news_count} art.
            </div>
          </div>

          {/* Decision */}
          <div className="bg-white/[0.02] rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1.5">
              <Brain className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-slate-500 font-medium">Decision</span>
            </div>
            <div className={`text-xs font-bold ${directionColor(sig.direction)}`}>
              {sig.direction}
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              ×{sig.sentiment_modifier.toFixed(2)} mod
            </div>
          </div>
        </div>

        {/* Key indicators row */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "RSI", value: ind.rsi.toFixed(1) },
            { label: "ATR", value: ind.atr.toFixed(4) },
            { label: "MACD H", value: ind.macd_histogram.toFixed(4) },
            { label: "Vol ×", value: ind.volume_ratio.toFixed(2) },
          ].map(({ label, value }) => (
            <div key={label} className="text-center bg-white/[0.02] rounded p-1.5">
              <div className="text-[9px] text-slate-600 mb-0.5">{label}</div>
              <div className="text-[10px] font-mono text-slate-300">{value}</div>
            </div>
          ))}
        </div>

        {/* Override reason */}
        {sig.override_reason && (
          <div className="flex items-start gap-2 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg px-3 py-2">
            <Ban className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-300 leading-relaxed">{sig.override_reason}</p>
          </div>
        )}

        {/* Top headline */}
        {sig.top_headlines.length > 0 && (
          <div className="flex items-start gap-2 bg-white/[0.02] rounded-lg px-3 py-2">
            <Newspaper className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
            <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{sig.top_headlines[0]}</p>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors py-0.5"
        >
          {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> Reasons ({sig.decision_reasons.length})</>}
        </button>

        {expanded && (
          <ul className="space-y-1">
            {sig.decision_reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[10px] text-slate-600 mt-0.5">•</span>
                <span className="text-[10px] text-slate-400 leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-[9px] text-slate-600">
          {sig.candles_used} candles · {sig.sentiment_source}
        </span>
        <span className="text-[9px] text-slate-600">
          {new Date(sig.analyzed_at).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

// ── Decisions Table ───────────────────────────────────────────────────────────

function DecisionsTable({ data }: { data: DecisionsResponse | undefined }) {
  if (!data || data.items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-600 text-sm">
        No decisions logged yet. Start the bot to generate decisions.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {["Time", "Symbol", "Decision", "Tech", "Sentiment", "Impact", "Executed", "Rejection / Override"].map(h => (
              <th key={h} className="text-left py-2 px-3 text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {data.items.map(row => (
            <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
              <td className="py-2.5 px-3 text-slate-500 font-mono whitespace-nowrap">
                {new Date(row.decided_at).toLocaleString(undefined, {
                  month: "2-digit", day: "2-digit",
                  hour: "2-digit", minute: "2-digit",
                })}
              </td>
              <td className="py-2.5 px-3 font-mono font-bold text-white">{row.symbol}</td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-1.5">
                  <DirectionIcon d={row.direction} cls="w-3 h-3" />
                  <span className={`font-bold ${directionColor(row.direction)}`}>{row.direction}</span>
                  {row.final_confidence > 0 && (
                    <span className="text-slate-600">{row.final_confidence}%</span>
                  )}
                </div>
              </td>
              <td className="py-2.5 px-3">
                <span className={`font-medium ${directionColor(row.tech_direction)}`}>
                  {row.tech_direction}
                </span>
                <span className="text-slate-600 ml-1">{row.tech_confidence}%</span>
              </td>
              <td className="py-2.5 px-3">
                <span className={`capitalize ${sentimentColor(row.sentiment_label)}`}>
                  {row.sentiment_label}
                </span>
                <span className="text-slate-600 ml-1">
                  {row.sentiment_score >= 0 ? "+" : ""}{row.sentiment_score.toFixed(2)}
                </span>
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-1">
                  <div className="h-1 w-10 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${row.sentiment_impact}%` }}
                    />
                  </div>
                  <span className="text-slate-600">{row.sentiment_impact}</span>
                </div>
              </td>
              <td className="py-2.5 px-3">
                {row.executed
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  : <XCircle     className="w-3.5 h-3.5 text-slate-600" />
                }
              </td>
              <td className="py-2.5 px-3 max-w-xs">
                {row.override_reason || row.rejection_reason
                  ? <span className="text-amber-400/80 text-[10px] line-clamp-1">
                      {row.override_reason || row.rejection_reason}
                    </span>
                  : <span className="text-slate-700">—</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SignalsPage() {
  const [activeTab, setActiveTab] = useState<"live" | "decisions">("live");
  const [decisionSymbol, setDecisionSymbol] = useState("");

  const {
    data: liveData,
    isFetching: liveFetching,
    refetch: refetchLive,
    dataUpdatedAt,
  } = useQuery<LiveSignalsResponse>({
    queryKey: ["signals-live"],
    queryFn: () => api.get("/signals/live").then(r => r.data),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: decisionsData, isFetching: decisionsFetching } =
    useQuery<DecisionsResponse>({
      queryKey: ["signals-decisions", decisionSymbol],
      queryFn: () =>
        api
          .get("/signals/decisions", { params: decisionSymbol ? { symbol: decisionSymbol, limit: 100 } : { limit: 100 } })
          .then(r => r.data),
      enabled: activeTab === "decisions",
      staleTime: 10_000,
    });

  const updatedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Signals & Decisions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Live pipeline output — Technical · Sentiment · Decision
          </p>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-[10px] text-slate-600 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Updated {updatedAt}
            </span>
          )}
          <button
            onClick={() => refetchLive()}
            disabled={liveFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-lg text-xs text-slate-300 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-3 h-3 ${liveFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-[#080F1D] border border-white/[0.06] rounded-xl w-fit">
        {(["live", "decisions"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab === "live" ? "Live Signals" : "Decision Log"}
          </button>
        ))}
      </div>

      {/* ── Live Signals Tab ─────────────────────────────────────────────── */}
      {activeTab === "live" && (
        <>
          {/* Summary bar */}
          {liveData && (
            <div className="flex gap-4 text-xs text-slate-500">
              <span><span className="text-white font-medium">{liveData.symbols_ok}</span> signals</span>
              <span className="text-emerald-400 font-medium">
                {liveData.signals.filter(s => s.direction === "BUY").length} BUY
              </span>
              <span className="text-red-400 font-medium">
                {liveData.signals.filter(s => s.direction === "SELL").length} SELL
              </span>
              <span className="text-slate-500">
                {liveData.signals.filter(s => s.direction === "HOLD").length} HOLD
              </span>
              {liveData.signals.filter(s => s.direction === "BLOCKED").length > 0 && (
                <span className="text-amber-400 font-medium">
                  {liveData.signals.filter(s => s.direction === "BLOCKED").length} BLOCKED
                </span>
              )}
              {liveData.symbols_failed > 0 && (
                <span className="text-red-400/60">{liveData.symbols_failed} failed</span>
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {liveFetching && !liveData && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 bg-[#080F1D] border border-white/[0.06] rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!liveFetching && liveData?.signals.length === 0 && (
            <div className="text-center py-16">
              <Activity className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No symbols configured.</p>
              <p className="text-slate-600 text-xs mt-1">Add symbols in the Strategy page to see live signals.</p>
            </div>
          )}

          {/* Signal cards grid */}
          {liveData && liveData.signals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {liveData.signals.map(sig => (
                <SignalCard key={sig.symbol} sig={sig} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Decisions Tab ────────────────────────────────────────────────── */}
      {activeTab === "decisions" && (
        <div className="space-y-4">
          {/* Symbol filter */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-500">Filter by symbol:</label>
            <input
              type="text"
              value={decisionSymbol}
              onChange={e => setDecisionSymbol(e.target.value.toUpperCase())}
              placeholder="NVDA, EURUSD…"
              className="bg-[#080F1D] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-blue-500/40 w-36 font-mono uppercase"
            />
            {decisionSymbol && (
              <button
                onClick={() => setDecisionSymbol("")}
                className="text-xs text-slate-600 hover:text-slate-400"
              >
                Clear
              </button>
            )}
            {decisionsData && (
              <span className="text-xs text-slate-600 ml-auto">
                {decisionsData.total.toLocaleString()} total decisions
              </span>
            )}
          </div>

          {/* Table card */}
          <div className="bg-[#080F1D] border border-white/[0.06] rounded-xl overflow-hidden">
            {decisionsFetching && !decisionsData ? (
              <div className="h-48 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-slate-600 animate-spin" />
              </div>
            ) : (
              <DecisionsTable data={decisionsData} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
