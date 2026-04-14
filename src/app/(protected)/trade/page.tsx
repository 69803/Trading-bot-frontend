"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  QuotesResponse,
  Order,
  OrdersResponse,
  Position,
  CandlesResponse,
  Candle,
  Quote,
  BalanceResponse,
} from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { SYMBOLS, TIMEFRAMES } from "@/config/constants";
import { ASSET_INFO, getAssetDecimals, isForexPair } from "@/config/assetMeta";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  Plus,
  X,
  Wallet,
} from "lucide-react";
import LiveChart from "@/components/trade/LiveChart";
import AssetSelector from "@/components/trade/AssetSelector";
import { useBotTabsStore, BOT_META, symbolBelongsToBot } from "@/store/botTabsStore";

type Side = "buy" | "sell";
type OrderType = "market" | "limit";

const INVESTMENT_PRESETS = [50, 100, 200, 500, 1000];

// ─── Data mode badge ─────────────────────────────────────────────────────────
function DataModeBadge() {
  return (
    <div className="flex items-center gap-1.5 bg-amber-500/[0.08] border border-amber-500/20 rounded-lg px-2.5 py-1.5">
      <AlertCircle className="w-3 h-3 text-amber-500/80 shrink-0" />
      <span className="text-[10px] font-semibold text-amber-500/80 tracking-wide uppercase">
        Prev-Close · Free Plan
      </span>
      <a
        href="https://polygon.io/pricing"
        target="_blank"
        rel="noreferrer"
        className="text-[10px] text-amber-500/50 hover:text-amber-400 underline underline-offset-2 transition-colors"
      >
        Upgrade
      </a>
    </div>
  );
}

// ─── Animated price display ───────────────────────────────────────────────────
function AnimatedPrice({
  price,
  prevPrice,
  decimals = 2,
}: {
  price: number | null;
  prevPrice: number | null;
  decimals?: number;
}) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (price === null || prevPrice === null || price === prevPrice) return;
    const dir = price > prevPrice ? "up" : "down";
    setFlash(dir);
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [price, prevPrice]);

  const colorClass =
    flash === "up"
      ? "text-emerald-300"
      : flash === "down"
      ? "text-red-300"
      : "text-slate-100";

  return (
    <span
      className={`font-bold font-mono tabular-nums transition-colors duration-500 ${colorClass}`}
    >
      {price !== null
        ? price.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : "—"}
    </span>
  );
}

// ─── Asset Tab (IQ Option style) ─────────────────────────────────────────────
function AssetTab({
  sym,
  quote,
  isActive,
  canRemove,
  onSelect,
  onRemove,
}: {
  sym: string;
  quote?: Quote;
  isActive: boolean;
  canRemove: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const info = ASSET_INFO[sym];
  const color = info?.color ?? "#6366f1";
  const initials = sym.length <= 2 ? sym : sym.slice(0, 2);
  const pct = quote ? Number(quote.change_pct) : null;
  const isPos = (pct ?? 0) >= 0;

  return (
    <button
      onClick={onSelect}
      className={`
        flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-xl border transition-all group shrink-0
        ${isActive
          ? "bg-blue-600/15 border-blue-500/30"
          : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.14]"
        }
      `}
    >
      {/* Avatar */}
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-bold select-none"
        style={{
          backgroundColor: color + "22",
          border: `1.5px solid ${color}44`,
          color,
        }}
      >
        {initials}
      </div>

      {/* Symbol + % */}
      <div className="text-left leading-none">
        <p className={`text-xs font-bold ${isActive ? "text-blue-300" : "text-slate-300"}`}>
          {sym}
        </p>
        {pct !== null ? (
          <p className={`text-[10px] font-mono tabular-nums mt-0.5 ${isPos ? "text-emerald-400" : "text-red-400"}`}>
            {isPos ? "+" : ""}{pct.toFixed(2)}%
          </p>
        ) : (
          <p className="text-[10px] text-slate-700 mt-0.5">—</p>
        )}
      </div>

      {/* Remove × */}
      {canRemove && (
        <div
          role="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="w-4 h-4 flex items-center justify-center rounded-full text-slate-700 hover:text-slate-300 hover:bg-white/[0.1] transition-colors ml-0.5 cursor-pointer"
        >
          <X className="w-2.5 h-2.5" />
        </div>
      )}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TradePage() {
  const qc = useQueryClient();
  const { selectedBotId } = useBotTabsStore();

  // Multi-symbol state (IQ Option-style tab bar)
  const [pinnedSymbols, setPinnedSymbols] = useState<string[]>([SYMBOLS[0]]);
  const [activeSymbol, setActiveSymbol] = useState(SYMBOLS[0]);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const [side, setSide] = useState<Side>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [investmentAmount, setInvestmentAmount] = useState("100");
  const [limitPrice, setLimitPrice] = useState("");
  const [timeframe, setTimeframe] = useState("1h");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("1000");
  const prevPriceRef = useRef<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────

  // Balance
  const { data: balanceData, refetch: refetchBalance } = useQuery<BalanceResponse>({
    queryKey: ["balance"],
    queryFn: async () => (await api.get("/portfolio/balance")).data,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  // Batch-fetch quotes for ALL pinned symbols (positions symbols added after positions load)
  const { data: tabQuotesData } = useQuery<QuotesResponse>({
    queryKey: ["tab-quotes", pinnedSymbols.join(",")],
    queryFn: async () =>
      (await api.get(`/market/quote?symbols=${pinnedSymbols.join(",")}`)).data,
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: pinnedSymbols.length > 0,
  });

  // tabQuotes built after extraQuotesData is declared (see below)

  // Single-symbol quote for the order panel
  const { data: quoteData, dataUpdatedAt: quoteUpdatedAt } =
    useQuery<QuotesResponse>({
      queryKey: ["quote", activeSymbol],
      queryFn: async () =>
        (await api.get(`/market/quote?symbols=${activeSymbol}`)).data,
      refetchInterval: 60_000,
      staleTime: 30_000,
    });

  const { data: candlesData, isFetching: candlesLoading } =
    useQuery<CandlesResponse>({
      queryKey: ["candles", activeSymbol, timeframe],
      queryFn: async () =>
        (
          await api.get(
            `/market/candles?symbol=${activeSymbol}&timeframe=${timeframe}&limit=120`
          )
        ).data,
      refetchInterval: 15000,
      staleTime: 0,
    });

  const { data: ordersData } = useQuery<OrdersResponse>({
    queryKey: ["orders-trade"],
    queryFn: async () => (await api.get("/orders?limit=30")).data,
    refetchInterval: 8000,
  });

  const { data: allPositions } = useQuery<Position[]>({
    queryKey: ["positions-all"],
    queryFn: async () =>
      (await api.get("/portfolio/positions?open_only=false&limit=100")).data,
    refetchInterval: 4000,
  });

  const positions = allPositions ?? [];
  // Manual trading page: only show positions with no bot_id (opened by the user, not by any bot)
  const openPositions   = positions.filter((p) =>  p.is_open && !p.bot_id);
  const closedPositions = positions.filter((p) => !p.is_open && !p.bot_id);

  // Extra quotes for any open-position symbols not already pinned
  const openSymbols = openPositions.map((p) => p.symbol);
  const extraSymbols = openSymbols.filter((s) => !pinnedSymbols.includes(s));
  const { data: extraQuotesData } = useQuery<QuotesResponse>({
    queryKey: ["extra-quotes", extraSymbols.join(",")],
    queryFn: async () =>
      (await api.get(`/market/quote?symbols=${extraSymbols.join(",")}`)).data,
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: extraSymbols.length > 0,
  });

  const tabQuotes: Record<string, Quote> = {};
  for (const q of tabQuotesData?.quotes ?? []) tabQuotes[q.symbol] = q;
  for (const q of extraQuotesData?.quotes ?? []) tabQuotes[q.symbol] = q;

  // Track prev price for the colour-flash animation on quote refresh
  useEffect(() => {
    const q = quoteData?.quotes?.[0];
    if (!q) return;
    const p = Number(q.price);
    setPrevPrice(prevPriceRef.current);
    prevPriceRef.current = p;
  }, [quoteUpdatedAt]);

  // ── Symbol management ───────────────────────────────────────────────────────

  const handleAddSymbol = useCallback(
    (sym: string) => {
      setPinnedSymbols((prev) =>
        prev.includes(sym) ? prev : [...prev, sym]
      );
      setActiveSymbol(sym);
      setSelectorOpen(false);
      setFormError(null);
      setFormSuccess(null);
      qc.invalidateQueries({ queryKey: ["quote", sym] });
      qc.invalidateQueries({ queryKey: ["candles", sym, timeframe] });
    },
    [timeframe, qc]
  );

  const handleRemoveSymbol = useCallback(
    (sym: string) => {
      setPinnedSymbols((prev) => {
        const next = prev.filter((s) => s !== sym);
        if (next.length === 0) return prev; // keep at least 1
        if (activeSymbol === sym) {
          setActiveSymbol(next[next.length - 1]);
        }
        return next;
      });
    },
    [activeSymbol]
  );

  const handleSelectSymbol = useCallback(
    (sym: string) => {
      if (sym === activeSymbol) return;
      setActiveSymbol(sym);
      setFormError(null);
      setFormSuccess(null);
      qc.invalidateQueries({ queryKey: ["quote", sym] });
      qc.invalidateQueries({ queryKey: ["candles", sym, timeframe] });
    },
    [activeSymbol, timeframe, qc]
  );

  // ── Deposit ─────────────────────────────────────────────────────────────────
  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;
    setDepositLoading(true);
    try {
      await api.post(`/portfolio/deposit?amount=${amount}`);
      refetchBalance();
      qc.invalidateQueries({ queryKey: ["portfolio-summary"] });
      setDepositOpen(false);
      setDepositAmount("1000");
    } finally {
      setDepositLoading(false);
    }
  };

  // ── Close position ──────────────────────────────────────────────────────────
  const closeMutation = useMutation({
    mutationFn: async (pos: Position) =>
      api.post(`/portfolio/positions/${pos.id}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions-all"] });
      qc.invalidateQueries({ queryKey: ["orders-trade"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["portfolio-summary"] });
    },
  });

  // ── Delete closed position ──────────────────────────────────────────────────
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  const clearHistoryMutation = useMutation({
    mutationFn: async () => api.delete("/portfolio/positions"),
    onSuccess: () => {
      setShowClearHistoryConfirm(false);
      setDeleteError(null);
      qc.invalidateQueries({ queryKey: ["positions-all"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
    },
    onError: () => {
      setDeleteError("Failed to clear trade history. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (posId: string) => {
      console.log("[DELETE] Sending DELETE /portfolio/positions/" + posId);
      const res = await api.delete(`/portfolio/positions/${posId}`);
      console.log("[DELETE] Response status:", res.status);
      return res;
    },
    onSuccess: (_data, posId) => {
      console.log("[DELETE] Success — invalidating queries for posId:", posId);
      setDeleteConfirmId(null);
      setDeleteError(null);
      qc.invalidateQueries({ queryKey: ["positions-all"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["portfolio-summary"] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: unknown; status?: number } };
      const data = e.response?.data;
      const detail = (data as { detail?: string })?.detail ?? JSON.stringify(data) ?? "Delete failed";
      const status = e.response?.status ?? "network error";
      console.error("[DELETE] Failed — status:", status, "raw data:", JSON.stringify(data), err);
      setDeleteError(`Error ${status}: ${detail}`);
    },
  });

  // ── Sell All ────────────────────────────────────────────────────────────────
  const [sellAllLoading, setSellAllLoading] = useState(false);
  const handleSellAll = async () => {
    const open = openPositions;
    if (open.length === 0) return;
    setSellAllLoading(true);
    try {
      await Promise.all(
        open.map((pos) => api.post(`/portfolio/positions/${pos.id}/close`))
      );
      qc.invalidateQueries({ queryKey: ["positions-all"] });
      qc.invalidateQueries({ queryKey: ["orders-trade"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["portfolio-summary"] });
    } finally {
      setSellAllLoading(false);
    }
  };

  // ── Asset metadata ──────────────────────────────────────────────────────────
  const activeDecimals = getAssetDecimals(activeSymbol);
  const activeIsForex  = isForexPair(activeSymbol);
  const pricePrefix    = activeIsForex ? "" : "$";

  // ── Derived values ──────────────────────────────────────────────────────────
  const quote: Quote | undefined = quoteData?.quotes?.[0];
  const livePrice = quote ? Number(quote.price) : null;
  const changePct = quote ? Number(quote.change_pct) : 0;
  const changeAbs = quote ? Number(quote.change) : 0;
  const isPositive = changePct >= 0;

  const candles: Candle[] = candlesData?.candles ?? [];
  const orders: Order[] = ordersData?.items ?? [];

  const cashBalance = balanceData?.cash_balance ?? null;
  const equity = balanceData?.equity ?? null;

  // ── Order mutation ──────────────────────────────────────────────────────────
  const orderMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        symbol: activeSymbol,
        side,
        order_type: orderType,
        investment_amount: Number(investmentAmount),
      };
      if (orderType === "limit" && limitPrice)
        body.limit_price = Number(limitPrice);
      return api.post("/orders", body);
    },
    onSuccess: () => {
      setFormSuccess("Order placed!");
      setFormError(null);
      qc.invalidateQueries({ queryKey: ["orders-trade"] });
      qc.invalidateQueries({ queryKey: ["positions-all"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["portfolio-summary"] });
      setTimeout(() => setFormSuccess(null), 3000);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } };
      setFormError(e.response?.data?.detail ?? "Failed to place order");
      setFormSuccess(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/orders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders-trade"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!investmentAmount || Number(investmentAmount) <= 0) {
      setFormError("Enter a valid investment amount");
      return;
    }
    if (orderType === "limit" && (!limitPrice || Number(limitPrice) <= 0)) {
      setFormError("Enter a valid limit price");
      return;
    }
    orderMutation.mutate();
  };

  // Estimated shares to receive (informational only)
  const estShares =
    livePrice && livePrice > 0 && investmentAmount && Number(investmentAmount) > 0
      ? Number(investmentAmount) / livePrice
      : null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Manual trading badge ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] text-xs font-semibold text-blue-400">
        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
        Manual Trading
        <span className="ml-auto font-normal text-blue-400/60">
          Solo posiciones manuales — operaciones de bots no se muestran aquí
        </span>
      </div>

      {/* ── Balance bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1117] border border-[#1e2329] rounded-xl">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#848e9c]" />
            <span className="text-sm text-[#848e9c]">Balance</span>
            <span className="text-sm font-bold text-white">
              {cashBalance !== null ? formatCurrency(cashBalance) : "—"}
            </span>
          </div>
          {equity !== null && cashBalance !== null && equity !== cashBalance && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-[#848e9c]">Equity</span>
              <span className="text-sm font-semibold text-white">
                {formatCurrency(equity)}
              </span>
            </div>
          )}
          {balanceData && balanceData.unrealized_pnl !== 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-[#848e9c]">Unrealized</span>
              <span
                className={`text-sm font-semibold ${
                  balanceData.unrealized_pnl >= 0 ? "text-[#0ecb81]" : "text-[#f6465d]"
                }`}
              >
                {balanceData.unrealized_pnl >= 0 ? "+" : ""}
                {formatCurrency(balanceData.unrealized_pnl)}
              </span>
            </div>
          )}
        </div>
        {depositOpen ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[100, 500, 1000, 5000, 10000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(String(amt))}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                    depositAmount === String(amt)
                      ? "bg-[#f0b90b] text-black"
                      : "bg-white/[0.06] text-slate-400 hover:bg-white/[0.12]"
                  }`}
                >
                  ${amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Amount"
              className="w-24 bg-white/[0.06] border border-white/[0.1] rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#f0b90b]/50"
              onKeyDown={(e) => e.key === "Enter" && handleDeposit()}
              autoFocus
            />
            <button
              onClick={handleDeposit}
              disabled={depositLoading || !depositAmount}
              className="px-3 py-1 bg-[#f0b90b] hover:bg-[#f0c932] disabled:opacity-60 text-black text-xs font-bold rounded-lg transition-colors"
            >
              {depositLoading ? "..." : "Add"}
            </button>
            <button
              onClick={() => setDepositOpen(false)}
              className="px-2 py-1 text-xs text-slate-600 hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDepositOpen(true)}
            className="px-4 py-1.5 bg-[#f0b90b] hover:bg-[#f0c932] text-black text-xs font-bold rounded-lg transition-colors"
          >
            + Deposit
          </button>
        )}
      </div>

      {/* ── IQ Option-style asset tab bar ──────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Scrollable tab strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0 pb-0.5">
          {pinnedSymbols.map((sym) => (
            <AssetTab
              key={sym}
              sym={sym}
              quote={tabQuotes[sym]}
              isActive={sym === activeSymbol}
              canRemove={pinnedSymbols.length > 1}
              onSelect={() => handleSelectSymbol(sym)}
              onRemove={() => handleRemoveSymbol(sym)}
            />
          ))}

          {/* Add button */}
          <button
            onClick={() => setSelectorOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.03] border border-dashed border-white/[0.12] text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.22] transition-all shrink-0"
            title="Add asset"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Right: active symbol price + data badge */}
        <div className="flex items-center gap-3 shrink-0">
          {livePrice !== null && (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono tabular-nums text-slate-100">
                {pricePrefix}{livePrice.toFixed(activeDecimals)}
              </span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  isPositive ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isPositive ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
              </span>
            </div>
          )}
          <DataModeBadge />
        </div>
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4 items-start">

        {/* ── Left sidebar ───────────────────────────────────────────────── */}
        <div className="space-y-3">

          {/* Quote panel */}
          <Card>
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">
                    {activeSymbol} · Prev Close
                  </p>
                  <div className="text-3xl leading-none">
                    {pricePrefix}
                    <AnimatedPrice
                      price={livePrice}
                      prevPrice={prevPrice}
                      decimals={activeDecimals}
                    />
                  </div>
                </div>
                {quote && (
                  <div
                    className={`text-right px-2.5 py-1.5 rounded-lg border ${
                      isPositive
                        ? "bg-emerald-500/[0.07] border-emerald-500/20 text-emerald-400"
                        : "bg-red-500/[0.07] border-red-500/20 text-red-400"
                    }`}
                  >
                    <p className="text-sm font-bold tabular-nums">
                      {isPositive ? "+" : ""}
                      {changePct.toFixed(2)}%
                    </p>
                    <p className="text-xs opacity-70 tabular-nums">
                      {changeAbs >= 0 ? "+" : ""}
                      {changeAbs.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Bid / Ask */}
              {quote && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-lg p-2.5 text-center">
                    <p className="text-emerald-400 font-mono font-semibold tabular-nums text-sm">
                      {pricePrefix}{Number(quote.bid).toFixed(activeDecimals)}
                    </p>
                    <p className="text-slate-600 mt-0.5 text-[10px] uppercase tracking-wider">
                      Bid
                    </p>
                  </div>
                  <div className="bg-red-500/[0.06] border border-red-500/15 rounded-lg p-2.5 text-center">
                    <p className="text-red-400 font-mono font-semibold tabular-nums text-sm">
                      {pricePrefix}{Number(quote.ask).toFixed(activeDecimals)}
                    </p>
                    <p className="text-slate-600 mt-0.5 text-[10px] uppercase tracking-wider">
                      Ask
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Order form */}
          <Card title="Place Order">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Side */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSide("buy")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-bold text-sm border transition-all ${
                    side === "buy"
                      ? "bg-emerald-600/15 border-emerald-500/40 text-emerald-400"
                      : "bg-transparent border-white/[0.08] text-slate-500 hover:border-emerald-500/20 hover:text-emerald-400/60"
                  }`}
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" /> BUY
                </button>
                <button
                  type="button"
                  onClick={() => setSide("sell")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-bold text-sm border transition-all ${
                    side === "sell"
                      ? "bg-red-600/15 border-red-500/40 text-red-400"
                      : "bg-transparent border-white/[0.08] text-slate-500 hover:border-red-500/20 hover:text-red-400/60"
                  }`}
                >
                  <ArrowDownCircle className="w-3.5 h-3.5" /> SELL
                </button>
              </div>

              {/* Order type */}
              <div className="grid grid-cols-2 gap-2">
                {(["market", "limit"] as OrderType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOrderType(t)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      orderType === t
                        ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                        : "bg-transparent border-white/[0.07] text-slate-600 hover:border-white/[0.15] hover:text-slate-400"
                    }`}
                  >
                    {t === "market" ? "Market" : "Limit"}
                  </button>
                ))}
              </div>

              {/* Investment amount */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Investment ($)
                </label>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/40"
                  min="1"
                  step="1"
                  placeholder="100"
                />
                {/* Quick-select presets */}
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {INVESTMENT_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInvestmentAmount(String(amt))}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                        investmentAmount === String(amt)
                          ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                          : "bg-white/[0.03] border-white/[0.07] text-slate-600 hover:border-white/[0.15] hover:text-slate-400"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Limit price */}
              {orderType === "limit" && (
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">
                    Limit Price
                  </label>
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/40"
                    min="0"
                    step="0.01"
                    placeholder={livePrice ? livePrice.toFixed(activeDecimals) : "0.00"}
                  />
                </div>
              )}

              {/* Estimated shares */}
              {estShares !== null && (
                <p className="text-xs text-slate-600 text-right">
                  ≈{" "}
                  <span className="text-slate-400 font-mono">
                    {estShares < 0.01
                      ? estShares.toFixed(6)
                      : estShares < 1
                      ? estShares.toFixed(4)
                      : estShares.toFixed(2)}{" "}
                    shares
                  </span>
                </p>
              )}

              {formError && (
                <p className="text-xs text-red-400 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
              {formSuccess && (
                <p className="text-xs text-emerald-400 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-lg px-3 py-2">
                  {formSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={orderMutation.isPending}
                className={`w-full py-3 rounded-lg font-bold text-sm text-white transition-all flex items-center justify-center gap-2 ${
                  side === "buy"
                    ? "bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40"
                    : "bg-red-600 hover:bg-red-500 disabled:bg-red-600/40"
                }`}
              >
                {orderMutation.isPending ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : side === "buy" ? (
                  <ArrowUpCircle className="w-4 h-4" />
                ) : (
                  <ArrowDownCircle className="w-4 h-4" />
                )}
                {side === "buy" ? "Buy" : "Sell"} {activeSymbol}
              </button>
            </form>
          </Card>
        </div>

        {/* ── Right column ───────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Chart card */}
          <div className="bg-[#0D1626] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-200">
                  {activeSymbol}
                </span>
                <span className="text-xs text-slate-600">Historical Chart</span>
                {candlesLoading && (
                  <span className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      timeframe === tf
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                        : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[380px] px-2 py-3">
              <LiveChart
                candles={candles}
                livePrice={livePrice}
                symbol={activeSymbol}
                timeframe={timeframe}
                isLoading={candlesLoading && candles.length === 0}
                positions={openPositions}
                onTimeframeChange={setTimeframe}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ── Open positions panel ─────────────────────────────────────────────── */}
      {openPositions.length > 0 && (() => {
        let totalInvested = 0;
        let totalPnl = 0;
        for (const p of openPositions) {
          const symQuote = tabQuotes[p.symbol];
          const cur = symQuote ? Number(symQuote.price) : Number(p.current_price ?? p.avg_entry_price);
          const qty = Number(p.quantity);
          const entry = Number(p.avg_entry_price);
          const invested = p.investment_amount != null ? Number(p.investment_amount) : entry * qty;
          const currentVal = p.side === "long" ? cur * qty : invested + (entry - cur) * qty;
          totalInvested += invested;
          totalPnl += currentVal - invested;
        }
        const totalIsPos = totalPnl >= 0;
        return (
          <div className="bg-[#0b0e11] border border-[#1e2329] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2329]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Open Positions ({openPositions.length})
                </span>
                <span className={`text-xs font-semibold font-mono tabular-nums ${totalIsPos ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>
                  {totalIsPos ? "+" : ""}{formatCurrency(totalPnl)}
                </span>
              </div>
              <button
                onClick={handleSellAll}
                disabled={sellAllLoading}
                className="px-3 py-1.5 bg-[#f0b90b]/10 border border-[#f0b90b]/40 text-[#f0b90b] text-xs font-bold rounded-lg hover:bg-[#f0b90b]/20 transition-all disabled:opacity-40"
              >
                {sellAllLoading ? "..." : `Close All (${openPositions.length})`}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1e2329]">
                    {["Symbol", "Side", "Invested", "Entry", "Current", "SL", "TP", "PnL ($)", "PnL (%)", "Opened", "Age", ""].map((h) => (
                      <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-[#848e9c] uppercase tracking-wider whitespace-nowrap ${h === "" ? "" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {openPositions.map((pos) => {
                    const symQuote = tabQuotes[pos.symbol];
                    const posDecimals = getAssetDecimals(pos.symbol);
                    const cur = symQuote ? Number(symQuote.price) : Number(pos.current_price ?? pos.avg_entry_price);
                    const qty = Number(pos.quantity);
                    const entry = Number(pos.avg_entry_price);
                    const invested = pos.investment_amount != null ? Number(pos.investment_amount) : entry * qty;
                    const currentVal = pos.side === "long" ? cur * qty : invested + (entry - cur) * qty;
                    const pnl = currentVal - invested;
                    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                    const isPos = pnl >= 0;
                    const isActive = pos.symbol === activeSymbol;
                    const openedAt = new Date(pos.opened_at);
                    const openedLabel = openedAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                    const ageMs = Date.now() - openedAt.getTime();
                    const ageMins = Math.floor(ageMs / 60000);
                    const ageLabel = ageMins < 60
                      ? `${ageMins}m`
                      : `${Math.floor(ageMins / 60)}h ${ageMins % 60}m`;
                    return (
                      <tr
                        key={pos.id}
                        onClick={() => handleAddSymbol(pos.symbol)}
                        className={`border-b border-[#1e2329]/60 last:border-0 transition-colors cursor-pointer ${
                          isActive
                            ? "bg-blue-500/[0.07] shadow-[inset_2px_0_0_0_rgba(59,130,246,0.5)]"
                            : "hover:bg-white/[0.025]"
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pos.side === "long" ? "bg-[#0ecb81]" : "bg-[#f6465d]"}`} />
                            <span className="font-bold text-slate-200">{pos.symbol}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.side === "long" ? "bg-[#0ecb81]/10 text-[#0ecb81]" : "bg-[#f6465d]/10 text-[#f6465d]"}`}>
                            {pos.side === "long" ? "▲ LONG" : "▼ SHORT"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-300 tabular-nums">{formatCurrency(invested)}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-400 tabular-nums">{entry.toFixed(posDecimals)}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-200 tabular-nums">{cur.toFixed(posDecimals)}</td>
                        <td className="px-3 py-2.5 font-mono text-red-400/70 tabular-nums">
                          {pos.stop_loss_price != null ? Number(pos.stop_loss_price).toFixed(posDecimals) : "—"}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-emerald-400/70 tabular-nums">
                          {pos.take_profit_price != null ? Number(pos.take_profit_price).toFixed(posDecimals) : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`font-mono font-bold tabular-nums ${isPos ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>
                            {isPos ? "+" : ""}{formatCurrency(pnl)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`font-mono font-bold tabular-nums ${isPos ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>
                            {isPos ? "+" : ""}{pnlPct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[#848e9c] tabular-nums whitespace-nowrap text-[10px]">
                          {openedLabel}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${ageMins >= 30 ? "bg-amber-500/10 text-amber-400" : "text-[#848e9c]"}`}>
                            {ageLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); closeMutation.mutate(pos); }}
                            disabled={closeMutation.isPending}
                            className="px-2.5 py-1 bg-[#f6465d]/10 border border-[#f6465d]/40 text-[#f6465d] text-[10px] font-bold rounded-lg hover:bg-[#f6465d]/20 transition-all disabled:opacity-40 whitespace-nowrap"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-6 px-4 py-2 border-t border-[#1e2329] bg-[#0d1117]">
              <span className="text-[#848e9c] text-xs">Invested: <span className="text-white font-semibold font-mono">{formatCurrency(totalInvested)}</span></span>
              <span className="text-[#848e9c] text-xs">Value: <span className="text-white font-semibold font-mono">{formatCurrency(totalInvested + totalPnl)}</span></span>
              <span className="text-[#848e9c] text-xs">Total PnL: <span className={`font-bold font-mono ${totalIsPos ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>{totalIsPos ? "+" : ""}{formatCurrency(totalPnl)}</span></span>
            </div>
          </div>
        );
      })()}

      {/* ── Closed positions / history ────────────────────────────────────────── */}
      {closedPositions.length > 0 && (
        <div className="bg-[#0b0e11] border border-[#1e2329] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#1e2329] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Trade History ({closedPositions.length})
            </span>
            <button
              onClick={() => setShowClearHistoryConfirm(true)}
              className="text-[10px] font-semibold text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06] px-2 py-1 rounded transition-all border border-transparent hover:border-red-500/20"
            >
              Clear All
            </button>
          </div>
          {deleteError && (
            <p className="text-xs text-red-400 bg-red-500/[0.08] border border-red-500/20 rounded-lg px-3 py-2 mx-4 mt-2">
              {deleteError}
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1e2329]">
                  {["Symbol", "Side", "Invested", "Entry", "Close", "SL", "TP", "PnL ($)", "PnL (%)", "Opened", ""].map((h) => (
                    <th key={h} className="px-3 py-2 text-[10px] font-semibold text-[#848e9c] uppercase tracking-wider whitespace-nowrap text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {closedPositions.map((pos) => {
                  const posDecimals = getAssetDecimals(pos.symbol);
                  const qty = Number(pos.quantity);
                  const entry = Number(pos.avg_entry_price);
                  const closePrice = pos.closed_price != null ? Number(pos.closed_price) : null;
                  const invested = pos.investment_amount != null ? Number(pos.investment_amount) : entry * qty;
                  const pnl = Number(pos.realized_pnl);
                  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                  const isPos = pnl >= 0;
                  return (
                    <tr key={pos.id} className="border-b border-[#1e2329]/60 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pos.side === "long" ? "bg-slate-500" : "bg-slate-600"}`} />
                          <span className="font-bold text-slate-400">{pos.symbol}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pos.side === "long" ? "bg-slate-500/10 text-slate-400" : "bg-slate-600/10 text-slate-500"}`}>
                          {pos.side === "long" ? "▲ LONG" : "▼ SHORT"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-500 tabular-nums">{formatCurrency(invested)}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-500 tabular-nums">{entry.toFixed(posDecimals)}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-400 tabular-nums">
                        {closePrice != null ? closePrice.toFixed(posDecimals) : "—"}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600 tabular-nums">
                        {pos.stop_loss_price != null ? Number(pos.stop_loss_price).toFixed(posDecimals) : "—"}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600 tabular-nums">
                        {pos.take_profit_price != null ? Number(pos.take_profit_price).toFixed(posDecimals) : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`font-mono font-bold tabular-nums ${isPos ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>
                          {isPos ? "+" : ""}{formatCurrency(pnl)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`font-mono font-bold tabular-nums ${isPos ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>
                          {isPos ? "+" : ""}{pnlPct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 tabular-nums whitespace-nowrap">
                        {new Date(pos.opened_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {deleteConfirmId === pos.id ? (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-[10px] text-slate-500 mr-1">Sure?</span>
                            <button
                              onClick={() => deleteMutation.mutate(pos.id)}
                              disabled={deleteMutation.isPending}
                              className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-500 disabled:opacity-40 transition-colors"
                            >
                              {deleteMutation.isPending ? "..." : "Yes"}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 bg-white/[0.06] text-slate-400 text-[10px] font-bold rounded hover:bg-white/[0.12] transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(pos.id)}
                            className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.1] text-slate-500 text-[10px] font-bold rounded-lg hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/[0.06] transition-all whitespace-nowrap"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Clear history confirmation modal ─────────────────────────────── */}
      {showClearHistoryConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#0D1626] border border-white/[0.08] rounded-2xl shadow-2xl">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-slate-100">Clear Trade History</h2>
              <p className="text-xs text-slate-500 mt-0.5">This cannot be undone</p>
            </div>
            <div className="px-5 py-5 space-y-4">
              <p className="text-sm text-slate-400">
                Permanently delete all <span className="text-slate-200 font-semibold">{closedPositions.length} closed trades</span> from your history? Open positions are not affected.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearHistoryConfirm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/[0.08] text-slate-400 text-sm font-semibold hover:bg-white/[0.04] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => clearHistoryMutation.mutate()}
                  disabled={clearHistoryMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {clearHistoryMutation.isPending ? (
                    <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Deleting...</>
                  ) : "Delete All"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Asset selector panel (controlled) ────────────────────────────── */}
      <AssetSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleAddSymbol}
        pinnedSymbols={pinnedSymbols}
      />
    </div>
  );
}
