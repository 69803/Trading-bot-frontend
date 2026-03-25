"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";
import {
  BacktestParams, BacktestRunResponse, BacktestStatusResponse,
  BacktestResults, BacktestHistoryResponse,
} from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, formatPctDirect } from "@/lib/utils";
import { SYMBOLS, BACKTEST_TIMEFRAMES } from "@/config/constants";
import { Play, BarChart2, Clock, TrendingUp, CheckCircle2, XCircle } from "lucide-react";

function MetricCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
      <p className="text-xs text-slate-600 mb-1.5 uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${
        positive === true ? "text-emerald-400" :
        positive === false ? "text-red-400" :
        "text-slate-100"
      }`}>{value}</p>
    </div>
  );
}

export default function BacktestPage() {
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [params, setParams] = useState<BacktestParams>({
    symbol: "EURUSD", timeframe: "1h",
    start_date: "2024-01-01", end_date: "2024-12-31",
    initial_capital: 100000,
    ema_fast: 9, ema_slow: 21,
    rsi_period: 14, rsi_overbought: 70, rsi_oversold: 30,
    stop_loss_pct: 0.03, take_profit_pct: 0.06, commission_pct: 0.001,
  });

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [statusData, setStatusData] = useState<BacktestStatusResponse | null>(null);
  const [results, setResults] = useState<BacktestResults | null>(null);

  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } =
    useQuery<BacktestHistoryResponse>({
      queryKey: ["backtest-history"],
      queryFn: async () => (await api.get("/backtest/history")).data,
    });

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<BacktestRunResponse>("/backtest/run", params);
      return res.data;
    },
    onSuccess: (data) => {
      setActiveRunId(data.id);
      setPolling(true);
      setResults(null);
      setStatusData({ id: data.id, status: "queued", progress_pct: 0 });
    },
  });

  useEffect(() => {
    if (!polling || !activeRunId) return;
    const poll = async () => {
      try {
        const statusRes = await api.get<BacktestStatusResponse>(`/backtest/${activeRunId}/status`);
        const s = statusRes.data;
        setStatusData({ id: s.id, status: s.status, progress_pct: s.progress_pct });
        if (s.status === "completed") {
          setPolling(false);
          const resultRes = await api.get<BacktestResults>(`/backtest/${activeRunId}/results`);
          setResults(resultRes.data);
          refetchHistory();
        } else if (s.status === "failed") {
          setPolling(false);
        }
      } catch (e) { console.error("Poll error", e); }
    };
    pollingIntervalRef.current = setInterval(poll, 2000);
    poll();
    return () => { if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current); };
  }, [polling, activeRunId, refetchHistory]);

  const handleChange = (key: keyof BacktestParams, value: string | number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const history = historyData?.items ?? [];

  const equityCurveData = results?.equity_curve?.map((p) => ({
    date: new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    equity: p.equity,
  })) ?? [];

  const netPnl = results?.results?.net_pnl ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Backtesting</h1>
        <p className="text-sm text-slate-600 mt-0.5">Simulate your strategy against historical data</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Form */}
        <Card title="Parameters" subtitle="Configure your backtest run" className="xl:col-span-1">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-base">Symbol</label>
                <select value={params.symbol} onChange={(e) => handleChange("symbol", e.target.value)} className="input-base">
                  {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label-base">Timeframe</label>
                <select value={params.timeframe} onChange={(e) => handleChange("timeframe", e.target.value)} className="input-base">
                  {BACKTEST_TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-base">Start Date</label>
                <input type="date" value={params.start_date} onChange={(e) => handleChange("start_date", e.target.value)} className="input-base" />
              </div>
              <div>
                <label className="label-base">End Date</label>
                <input type="date" value={params.end_date} onChange={(e) => handleChange("end_date", e.target.value)} className="input-base" />
              </div>
            </div>

            <div>
              <label className="label-base">Initial Capital (USD)</label>
              <input type="number" value={params.initial_capital} onChange={(e) => handleChange("initial_capital", Number(e.target.value))} className="input-base" min="1000" step="1000" />
            </div>

            <div className="border-t border-white/[0.05] pt-4 space-y-3">
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">Strategy Parameters</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">EMA Fast</label>
                  <input type="number" value={params.ema_fast} onChange={(e) => handleChange("ema_fast", Number(e.target.value))} className="input-base" min="2" />
                </div>
                <div>
                  <label className="label-base">EMA Slow</label>
                  <input type="number" value={params.ema_slow} onChange={(e) => handleChange("ema_slow", Number(e.target.value))} className="input-base" min="5" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label-base text-[10px]">RSI Period</label>
                  <input type="number" value={params.rsi_period} onChange={(e) => handleChange("rsi_period", Number(e.target.value))} className="input-base" min="2" />
                </div>
                <div>
                  <label className="label-base text-[10px]">Overbought</label>
                  <input type="number" value={params.rsi_overbought} onChange={(e) => handleChange("rsi_overbought", Number(e.target.value))} className="input-base" min="50" max="100" />
                </div>
                <div>
                  <label className="label-base text-[10px]">Oversold</label>
                  <input type="number" value={params.rsi_oversold} onChange={(e) => handleChange("rsi_oversold", Number(e.target.value))} className="input-base" min="0" max="50" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label-base text-[10px]">Stop Loss %</label>
                  <input type="number" value={params.stop_loss_pct} onChange={(e) => handleChange("stop_loss_pct", Number(e.target.value))} className="input-base" step="0.01" />
                </div>
                <div>
                  <label className="label-base text-[10px]">Take Profit %</label>
                  <input type="number" value={params.take_profit_pct} onChange={(e) => handleChange("take_profit_pct", Number(e.target.value))} className="input-base" step="0.01" />
                </div>
                <div>
                  <label className="label-base text-[10px]">Commission %</label>
                  <input type="number" value={params.commission_pct} onChange={(e) => handleChange("commission_pct", Number(e.target.value))} className="input-base" step="0.0001" />
                </div>
              </div>
            </div>

            <Button onClick={() => runMutation.mutate()} loading={runMutation.isPending || polling} className="w-full" size="lg">
              <Play className="w-4 h-4" />
              {polling ? "Running..." : "Run Backtest"}
            </Button>
          </div>
        </Card>

        {/* Results */}
        <div className="xl:col-span-2 space-y-4">
          {/* Progress */}
          {statusData && (statusData.status === "queued" || statusData.status === "running") && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Spinner size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200 capitalize">{statusData.status}…</p>
                  <p className="text-xs text-slate-600 mt-0.5 font-mono">{statusData.id.slice(0, 16)}…</p>
                </div>
                <span className="text-xl font-bold tabular-nums text-blue-400">
                  {Number(statusData.progress_pct).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${statusData.progress_pct}%` }}
                />
              </div>
            </Card>
          )}

          {/* Failed */}
          {statusData?.status === "failed" && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-500/[0.07] border border-red-500/20 rounded-xl">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">Backtest failed. Check that you have enough historical data for the selected parameters.</p>
            </div>
          )}

          {/* Metrics */}
          {results?.results && (
            <>
              <div className="flex items-center gap-2 px-1">
                {netPnl >= 0
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : <XCircle className="w-4 h-4 text-red-400" />
                }
                <p className="text-sm font-medium text-slate-300">
                  Backtest complete ·{" "}
                  <span className={netPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {netPnl >= 0 ? "+" : ""}{formatCurrency(netPnl)} net P&L
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <MetricCard label="Net P&L" value={`${netPnl >= 0 ? "+" : ""}${formatCurrency(netPnl)}`} positive={netPnl >= 0} />
                <MetricCard label="Win Rate" value={formatPctDirect(results.results.win_rate)} positive={(results.results.win_rate ?? 0) >= 50} />
                <MetricCard label="Total Trades" value={String(results.results.total_trades)} />
                <MetricCard label="Sharpe Ratio" value={Number(results.results.sharpe_ratio).toFixed(2)} positive={(results.results.sharpe_ratio ?? 0) >= 1} />
                <MetricCard label="Max Drawdown" value={`-${formatPctDirect(results.results.max_drawdown_pct)}`} positive={false} />
                <MetricCard label="Profit Factor" value={Number(results.results.profit_factor).toFixed(2)} positive={(results.results.profit_factor ?? 0) >= 1} />
                <MetricCard label="Avg Win" value={formatCurrency(results.results.avg_win)} positive />
                <MetricCard label="Avg Loss" value={formatCurrency(results.results.avg_loss)} positive={false} />
                <MetricCard label="Win Trades" value={String(results.results.win_trades)} />
                <MetricCard label="Loss Trades" value={String(results.results.loss_trades)} />
              </div>

              {equityCurveData.length > 0 && (
                <Card title="Equity Curve">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={equityCurveData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={44} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#112035", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "12px" }}
                        formatter={(v: number) => [formatCurrency(v), "Equity"]}
                        labelStyle={{ color: "#94A3B8" }}
                      />
                      <Line type="monotone" dataKey="equity" stroke={netPnl >= 0 ? "#22C55E" : "#EF4444"} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {results.trade_log && results.trade_log.length > 0 && (
                <Card title="Trade Log" subtitle={`${results.trade_log.length} trades`}>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[#0D1626]">
                        <tr className="border-b border-white/[0.06]">
                          {["Entry", "Exit", "Side", "Entry $", "Exit $", "Qty", "P&L", "Reason"].map((h, i) => (
                            <th key={h} className={`pb-2.5 text-[10px] font-medium text-slate-600 uppercase tracking-wider ${i <= 2 ? "text-left" : "text-right"} last:text-left`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.trade_log.map((t, i) => (
                          <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                            <td className="py-2 text-slate-600 whitespace-nowrap">{new Date(t.entry_time).toLocaleDateString()}</td>
                            <td className="py-2 text-slate-600 whitespace-nowrap">{new Date(t.exit_time).toLocaleDateString()}</td>
                            <td className="py-2"><Badge variant={t.side === "long" ? "long" : "short"}>{t.side}</Badge></td>
                            <td className="py-2 text-right font-mono text-slate-400 tabular-nums">{Number(t.entry_price).toFixed(5)}</td>
                            <td className="py-2 text-right font-mono text-slate-400 tabular-nums">{Number(t.exit_price).toFixed(5)}</td>
                            <td className="py-2 text-right font-mono text-slate-400 tabular-nums">{Number(t.qty).toFixed(4)}</td>
                            <td className={`py-2 text-right font-mono font-semibold tabular-nums ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {t.pnl >= 0 ? "+" : ""}{formatCurrency(t.pnl)}
                            </td>
                            <td className="py-2 text-slate-600 capitalize">{t.exit_reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Empty state before first run */}
          {!statusData && !results && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mb-4">
                <BarChart2 className="w-7 h-7 text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-400">Configure and run a backtest</p>
              <p className="text-xs text-slate-700 mt-1 max-w-xs">
                Set your parameters on the left and click "Run Backtest" to simulate your strategy against historical data
              </p>
            </div>
          )}

          {/* History */}
          <Card
            title="Run History"
            headerAction={
              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                <Clock className="w-3 h-3" />
                {history.length} runs
              </div>
            }
          >
            {historyLoading ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : history.length === 0 ? (
              <EmptyState icon={BarChart2} title="No backtest runs yet" description="Your completed runs will appear here" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Symbol", "TF", "Period", "Status", "Net P&L", "Win %", "Created"].map((h, i) => (
                        <th key={h} className={`pb-2.5 text-[10px] font-medium text-slate-600 uppercase tracking-wider ${i <= 3 ? "text-left" : "text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((run) => (
                      <tr key={run.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                        <td className="py-2.5 font-semibold text-slate-200">{run.symbol}</td>
                        <td className="py-2.5 text-slate-500 text-xs">{run.timeframe}</td>
                        <td className="py-2.5 text-slate-600 text-xs whitespace-nowrap">
                          {new Date(run.start_date).toLocaleDateString()} — {new Date(run.end_date).toLocaleDateString()}
                        </td>
                        <td className="py-2.5">
                          <Badge variant={run.status === "completed" ? "success" : run.status === "running" ? "open" : run.status === "failed" ? "error" : "pending"} dot>
                            {run.status}
                          </Badge>
                        </td>
                        <td className={`py-2.5 text-right font-mono text-xs font-semibold tabular-nums ${(run.results?.net_pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {run.results ? `${run.results.net_pnl >= 0 ? "+" : ""}${formatCurrency(run.results.net_pnl)}` : "—"}
                        </td>
                        <td className="py-2.5 text-right font-mono text-xs text-slate-400 tabular-nums">
                          {run.results ? `${Number(run.results.win_rate).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 text-right text-slate-600 text-xs">{formatDate(run.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
