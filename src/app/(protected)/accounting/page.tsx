"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
  Percent,
  RefreshCw,
  BookOpen,
  Trophy,
  XCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Trade {
  id: string;
  closed_at: string | null;
  opened_at: string | null;
  symbol: string;
  side: string;
  investment: number;
  entry_price: number;
  close_price: number;
  realized_pnl: number;
  pnl_pct: number;
  result: "win" | "loss";
}

interface AccountingSummary {
  from_date: string;
  to_date: string;
  total_closed_trades: number;
  total_profit: number;
  total_loss: number;
  net_pnl: number;
  win_count: number;
  loss_count: number;
  win_rate: number;
  trades: Trade[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function fmt(dt: string | null): string {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function pnlColor(v: number): string {
  if (v > 0) return "text-emerald-400";
  if (v < 0) return "text-red-400";
  return "text-slate-400";
}

// ── Summary card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: "green" | "red" | "blue" | "yellow" | "purple";
}) {
  const colors: Record<string, string> = {
    green:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red:    "bg-red-500/10    text-red-400    border-red-500/20",
    blue:   "bg-blue-500/10   text-blue-400   border-blue-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };
  return (
    <div className="bg-[#0d1117] border border-white/[0.06] rounded-xl p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${colors[accent]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-0.5">{label}</p>
        <p className="text-lg font-bold text-slate-100 leading-none">{value}</p>
        {sub && <p className="text-[11px] text-slate-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountingPage() {
  const [fromDate, setFromDate] = useState(firstOfMonth());
  const [toDate,   setToDate]   = useState(today());
  const [applied,  setApplied]  = useState({ from: firstOfMonth(), to: today() });

  const { data, isLoading, isError, refetch } = useQuery<AccountingSummary>({
    queryKey: ["accounting", applied.from, applied.to],
    queryFn: async () =>
      (await api.get(`/accounting/summary?from_date=${applied.from}&to_date=${applied.to}`)).data,
    staleTime: 30_000,
  });

  const handleApply = () => setApplied({ from: fromDate, to: toDate });
  const handleReset = () => {
    const f = firstOfMonth();
    const t = today();
    setFromDate(f);
    setToDate(t);
    setApplied({ from: f, to: t });
  };

  const netPositive = (data?.net_pnl ?? 0) >= 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#060D18] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">Contabilidad</h1>
              <p className="text-xs text-slate-600">Balance general de operaciones cerradas</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-white/[0.06] text-slate-600 hover:text-slate-300 hover:bg-white/[0.04] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Date filters */}
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-3">
            Filtro por rango de fechas
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Desde</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Hasta</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/40 transition-colors"
              />
            </div>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Aplicar
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 text-sm font-medium rounded-lg border border-white/[0.06] transition-colors"
            >
              Resetear
            </button>
          </div>
          <p className="text-[11px] text-slate-700 mt-2">
            Mostrando operaciones cerradas del <span className="text-slate-500">{applied.from}</span> al <span className="text-slate-500">{applied.to}</span>
          </p>
        </div>

        {/* Loading / error states */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-700">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Cargando datos…</span>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-red-400">Error al cargar los datos. Intenta de nuevo.</p>
          </div>
        )}

        {data && !isLoading && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <StatCard
                label="Ganancias"
                value={`$${data.total_profit.toFixed(2)}`}
                icon={TrendingUp}
                accent="green"
              />
              <StatCard
                label="Pérdidas"
                value={`$${Math.abs(data.total_loss).toFixed(2)}`}
                icon={TrendingDown}
                accent="red"
              />
              <StatCard
                label="Resultado neto"
                value={`${netPositive ? "+" : ""}$${data.net_pnl.toFixed(2)}`}
                icon={DollarSign}
                accent={netPositive ? "green" : "red"}
              />
              <StatCard
                label="Trades ganados"
                value={String(data.win_count)}
                sub={`de ${data.total_closed_trades} cerrados`}
                icon={Trophy}
                accent="yellow"
              />
              <StatCard
                label="Trades perdidos"
                value={String(data.loss_count)}
                icon={XCircle}
                accent="purple"
              />
              <StatCard
                label="Win rate"
                value={`${data.win_rate}%`}
                sub={`${data.total_closed_trades} operaciones`}
                icon={Percent}
                accent="blue"
              />
            </div>

            {/* Detailed table */}
            <div className="bg-[#0d1117] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">Operaciones cerradas</p>
                  <span className="px-1.5 py-0.5 bg-white/[0.05] text-slate-600 text-[10px] rounded font-mono">
                    {data.trades.length}
                  </span>
                </div>
              </div>

              {data.trades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <BookOpen className="w-8 h-8 text-slate-800" />
                  <p className="text-sm text-slate-700">No hay operaciones en este rango</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        {["Fecha cierre", "Símbolo", "Lado", "Invertido", "Entrada", "Cierre", "PnL $", "PnL %", "Resultado"].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-widest whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.trades.map((t) => (
                        <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">{fmt(t.closed_at)}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-200">{t.symbol}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              t.side === "long"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}>
                              {t.side === "long" ? "LONG" : "SHORT"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-slate-400">${t.investment.toFixed(2)}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-400">{t.entry_price.toFixed(5)}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-400">{t.close_price.toFixed(5)}</td>
                          <td className={`px-4 py-2.5 font-mono font-semibold ${pnlColor(t.realized_pnl)}`}>
                            {t.realized_pnl >= 0 ? "+" : ""}${t.realized_pnl.toFixed(2)}
                          </td>
                          <td className={`px-4 py-2.5 font-mono ${pnlColor(t.pnl_pct)}`}>
                            {t.pnl_pct >= 0 ? "+" : ""}{t.pnl_pct.toFixed(2)}%
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              t.result === "win"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}>
                              {t.result === "win" ? "GANANCIA" : "PÉRDIDA"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
