"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";
import {
  PortfolioSummary,
  PortfolioHistoryItem,
  Position,
  Trade,
  TradesResponse,
  BotStatus,
} from "@/types";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formatCurrency,
  formatPctDirect,
  formatDate,
} from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Activity,
  Target,
  RotateCcw,
  Bot,
  Square,
  Plus,
  Clock,
  LayoutGrid,
  Sparkles,
} from "lucide-react";
import Lottie from "lottie-react";
import aiRobotAnimation from "@/data/ai-robot.json";
import { useRouter } from "next/navigation";
import { useBotTabsStore } from "@/store/botTabsStore";

function DepositModal({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: (amount: number) => void;
  loading: boolean;
}) {
  const [amount, setAmount] = useState("1000");

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0D1626] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-semibold text-slate-100 mb-1">Add Funds</h3>
        <p className="text-sm text-slate-500 mb-5">
          Enter the amount to add to your cash balance.
        </p>
        <label className="label-base">Amount (USD)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input-base mb-5"
          min="1"
          step="100"
          autoFocus
        />
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(Number(amount))}
            loading={loading}
            disabled={!amount || Number(amount) <= 0}
            className="flex-1"
          >
            Add Funds
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResetModal({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: (capital: number) => void;
  loading: boolean;
}) {
  const [capital, setCapital] = useState("10000");

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0D1626] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-semibold text-slate-100 mb-1">Reset Portfolio</h3>
        <p className="text-sm text-slate-500 mb-5">
          All open positions and pending orders will be cancelled. Set a new starting capital below.
        </p>
        <label className="label-base">Starting Capital (USD)</label>
        <input
          type="number"
          value={capital}
          onChange={(e) => setCapital(e.target.value)}
          className="input-base mb-5"
          min="0"
          step="100"
        />
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(Number(capital))}
            loading={loading}
            className="flex-1"
          >
            Reset Portfolio
          </Button>
        </div>
      </div>
    </div>
  );
}

// Custom tooltip for the area chart
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#112035] border border-white/[0.10] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-100 tabular-nums">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { selectedBotId } = useBotTabsStore();
  const [showReset, setShowReset] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);

  const { data: summary, isLoading: summaryLoading } = useQuery<PortfolioSummary>({
    queryKey: ["portfolio-summary"],
    queryFn: async () => (await api.get("/portfolio/summary")).data,
    refetchInterval: 10000,
  });

  const { data: history } = useQuery<PortfolioHistoryItem[]>({
    queryKey: ["portfolio-history"],
    queryFn: async () => (await api.get("/portfolio/history?limit=90")).data,
    refetchInterval: 30000,
  });

  const { data: openPositions } = useQuery<Position[]>({
    queryKey: ["portfolio-positions", selectedBotId],
    queryFn: async () => {
      const botParam = selectedBotId ? `&bot_id=${selectedBotId}` : "";
      return (await api.get(`/portfolio/positions?open_only=true${botParam}`)).data;
    },
    refetchInterval: 15000,
  });

  const { data: tradesData } = useQuery<TradesResponse>({
    queryKey: ["trades-recent", selectedBotId],
    queryFn: async () => {
      const botParam = selectedBotId ? `&bot_id=${selectedBotId}` : "";
      return (await api.get(`/trades?limit=10${botParam}`)).data;
    },
    refetchInterval: 15000,
  });

  const { data: botStatus, refetch: refetchBot } = useQuery<BotStatus>({
    queryKey: ["bot-status", selectedBotId],
    queryFn: async () => (await api.get(`/bot/status?bot_id=${selectedBotId}`)).data,
    refetchInterval: 10000,
    enabled: !!selectedBotId,
  });

  const botMutation = useMutation({
    mutationFn: async (action: "start" | "stop") =>
      api.post(`/bot/${action}?bot_id=${selectedBotId}`),
    onSuccess: () => {
      refetchBot();
      qc.invalidateQueries({ queryKey: ["portfolio-summary"] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (capital: number) =>
      api.post(`/portfolio/reset?initial_capital=${capital}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio-summary"] });
      qc.invalidateQueries({ queryKey: ["portfolio-history"] });
      qc.invalidateQueries({ queryKey: ["portfolio-positions"] });
      setShowReset(false);
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: number) =>
      api.post(`/portfolio/deposit?amount=${amount}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio-summary"] });
      setShowDeposit(false);
    },
  });

  const trades: Trade[] = tradesData?.items ?? [];
  const positions: Position[] = openPositions ?? [];

  const pnlTrend = (summary?.pnl ?? 0) >= 0 ? "positive" : "negative";
  const dailyTrend = (summary?.daily_pnl ?? 0) >= 0 ? "positive" : "negative";

  const chartData = (history ?? []).map((h) => ({
    date: new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: Number(h.total_value),
  }));

  const isRunning = botStatus?.is_running ?? false;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Portfolio Overview</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Bot status pill */}
          {isRunning && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-lg">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">
                Bot active · {botStatus?.cycles_run ?? 0} cycles
              </span>
            </div>
          )}
          <Button
            variant={isRunning ? "danger" : "outline"}
            size="sm"
            onClick={() => botMutation.mutate(isRunning ? "stop" : "start")}
            loading={botMutation.isPending}
          >
            {isRunning ? (
              <><Square className="w-3.5 h-3.5" />Stop Bot</>
            ) : (
              <><Bot className="w-3.5 h-3.5" />Start Bot</>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDeposit(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add Funds
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowReset(true)}>
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push("/bots")}>
            <LayoutGrid className="w-3.5 h-3.5" />
            Bots
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Cash Balance"
          value={formatCurrency(summary?.balance ?? 0)}
          icon={DollarSign}
          trend="neutral"
          accentColor="blue"
          loading={summaryLoading}
        />
        <KPICard
          title="Total Equity"
          value={formatCurrency(summary?.equity ?? 0)}
          subtitle={summary && (summary.equity - summary.balance) !== 0
            ? `${(summary.equity - summary.balance) >= 0 ? "+" : ""}${formatCurrency(summary.equity - summary.balance)} in positions`
            : undefined}
          icon={TrendingUp}
          trend="neutral"
          accentColor="blue"
          loading={summaryLoading}
        />
        <KPICard
          title="Total P&L"
          value={formatCurrency(summary?.pnl ?? 0)}
          subtitle={summary ? `${(Number(summary.pnl) >= 0 ? "+" : "")}${Number(summary.pnl).toFixed(2)}` : undefined}
          icon={Activity}
          trend={pnlTrend}
          accentColor={pnlTrend === "positive" ? "emerald" : "red"}
          loading={summaryLoading}
        />
        <KPICard
          title="Today's P&L"
          value={formatCurrency(summary?.daily_pnl ?? 0)}
          subtitle="Daily performance"
          icon={Activity}
          trend={dailyTrend}
          accentColor={dailyTrend === "positive" ? "emerald" : "red"}
          loading={summaryLoading}
        />
        <KPICard
          title="Win Rate"
          value={summary ? formatPctDirect(summary.win_rate) : "0.00%"}
          subtitle={summary ? `${summary.closed_positions_count} closed trades` : undefined}
          icon={Target}
          trend={(summary?.win_rate ?? 0) >= 50 ? "positive" : "negative"}
          accentColor={(summary?.win_rate ?? 0) >= 50 ? "emerald" : "red"}
          loading={summaryLoading}
        />
      </div>

      {/* Bot log strip */}
      {botStatus?.last_log && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0D1626] border border-white/[0.06] rounded-lg">
          <Bot className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="font-mono text-xs text-slate-500 truncate flex-1">{botStatus.last_log}</span>
          {botStatus.last_cycle_at && (
            <span className="text-xs text-slate-700 shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(botStatus.last_cycle_at).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {/* Chart + Positions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* AI Robot — Bots CTA */}
        <Card className="xl:col-span-2 overflow-hidden relative flex flex-col items-center justify-center py-8 gap-0">
          {/* ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.07] via-transparent to-indigo-700/[0.05] pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/[0.06] rounded-full blur-3xl pointer-events-none" />

          {/* Lottie */}
          <div className="relative w-44 h-44 select-none">
            <Lottie animationData={aiRobotAnimation} loop autoplay style={{ width: "100%", height: "100%" }} />
          </div>

          {/* Copy */}
          <div className="relative text-center px-8 mt-1 space-y-2">
            <p className="text-[15px] font-semibold text-slate-100 leading-snug tracking-tight">
              ¿Quieres que hagamos tus trades por ti?
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Selecciona el mejor bot para ti
            </p>
          </div>

          {/* Button */}
          <button
            onClick={() => router.push("/bots")}
            className="relative mt-6 flex items-center gap-2 px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-bold shadow-xl shadow-blue-600/25 transition-all duration-150 ring-1 ring-blue-500/35"
          >
            <Sparkles className="w-3.5 h-3.5" />
            BOTS
          </button>
        </Card>

        {/* Manual Trading CTA */}
        <Card className="xl:col-span-1 overflow-hidden relative flex flex-col items-center justify-center py-8 gap-0">
          {/* ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.05] via-transparent to-cyan-700/[0.04] pointer-events-none rounded-xl" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/[0.07] rounded-full blur-3xl pointer-events-none" />

          {/* SVG chart illustration */}
          <div className="relative w-36 h-28 select-none mb-2">
            <svg viewBox="0 0 144 112" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Grid */}
              {[20, 40, 60, 80, 100].map(y => (
                <line key={y} x1="8" y1={y} x2="136" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              ))}
              {/* Area under line */}
              <path d="M8 90 L28 70 L48 78 L68 48 L88 56 L108 30 L128 38 L136 24 L136 100 L8 100Z"
                fill="url(#mtGrad)" />
              {/* Main trend line */}
              <path d="M8 90 L28 70 L48 78 L68 48 L88 56 L108 30 L128 38 L136 24"
                stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              {/* Candlesticks */}
              {[
                {x:20, o:82, c:66, h:60, l:88},
                {x:40, o:70, c:80, h:64, l:84},
                {x:60, o:56, c:44, h:38, l:60},
                {x:80, o:52, c:60, h:46, l:64},
                {x:100, o:40, c:28, h:22, l:44},
                {x:120, o:34, c:42, h:28, l:48},
              ].map(({x,o,c,h,l})=>{
                const green = c < o;
                const col = green ? "#22d3ee" : "#f43f5e";
                const top = Math.min(o,c), bot = Math.max(o,c);
                return (
                  <g key={x}>
                    <line x1={x} y1={h} x2={x} y2={l} stroke={col} strokeWidth="1" opacity="0.5"/>
                    <rect x={x-4} y={top} width={8} height={Math.max(bot-top,2)} fill={col} opacity="0.75" rx="1"/>
                  </g>
                );
              })}
              {/* Dot on last point */}
              <circle cx="136" cy="24" r="4" fill="#3b82f6" opacity="0.9"/>
              <circle cx="136" cy="24" r="7" stroke="#3b82f6" strokeWidth="1.5" opacity="0.3"/>
              <defs>
                <linearGradient id="mtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Copy */}
          <div className="relative text-center px-5 space-y-1.5">
            <p className="text-[15px] font-semibold text-slate-100 leading-snug tracking-tight">
              Manual Trading
            </p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Empieza a hacer trading y aumenta tu capital
            </p>
          </div>

          {/* Button */}
          <button
            onClick={(e) => { e.stopPropagation(); router.push("/manual-trading"); }}
            className="relative mt-5 flex items-center gap-2 px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-bold shadow-xl shadow-blue-600/25 transition-all duration-150 ring-1 ring-blue-500/35"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            TRADING
          </button>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card title="Recent Trades" subtitle="Last 10 executed trades">
        {trades.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No trades yet"
            description="Your executed trades will appear here"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Symbol</th>
                  <th className="text-left pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Side</th>
                  <th className="text-right pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Quantity</th>
                  <th className="text-right pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Price</th>
                  <th className="text-right pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Realized P&L</th>
                  <th className="text-right pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                    <td className="py-3 font-semibold text-slate-200">{t.symbol}</td>
                    <td className="py-3">
                      <Badge variant={t.side === "buy" ? "buy" : "sell"}>
                        {t.side.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-slate-300 tabular-nums">{t.quantity}</td>
                    <td className="py-3 text-right text-slate-300 tabular-nums font-mono text-xs">
                      {formatCurrency(t.price)}
                    </td>
                    <td className={`py-3 text-right font-semibold tabular-nums ${(t.realized_pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {t.realized_pnl != null
                        ? `${t.realized_pnl >= 0 ? "+" : ""}${formatCurrency(t.realized_pnl)}`
                        : "—"}
                    </td>
                    <td className="py-3 text-right text-slate-600 text-xs">{formatDate(t.executed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showDeposit && (
        <DepositModal
          onClose={() => setShowDeposit(false)}
          onConfirm={(amount) => depositMutation.mutate(amount)}
          loading={depositMutation.isPending}
        />
      )}

      {showReset && (
        <ResetModal
          onClose={() => setShowReset(false)}
          onConfirm={(capital) => resetMutation.mutate(capital)}
          loading={resetMutation.isPending}
        />
      )}

    </div>
  );
}
