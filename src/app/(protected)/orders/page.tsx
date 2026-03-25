"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Order, OrdersResponse } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/SkeletonCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SYMBOLS } from "@/config/constants";
import { ChevronLeft, ChevronRight, Plus, X, ClipboardList, SlidersHorizontal } from "lucide-react";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = ["", "pending", "filled", "cancelled", "rejected"];

interface NewOrderForm {
  symbol: string;
  side: "buy" | "sell";
  order_type: "market" | "limit";
  investment_amount: string;
  limit_price: string;
}

const DEFAULT_FORM: NewOrderForm = {
  symbol: "EURUSD",
  side: "buy",
  order_type: "market",
  investment_amount: "",
  limit_price: "",
};

const INVESTMENT_PRESETS = [50, 100, 200, 500, 1000];

export default function OrdersPage() {
  const qc = useQueryClient();

  const [status, setStatus] = useState("");
  const [symbolFilter, setSymbolFilter] = useState("");
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewOrderForm>(DEFAULT_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ["orders", status, symbolFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("page", String(page + 1));
      params.set("page_size", String(PAGE_SIZE));
      return (await api.get(`/orders?${params.toString()}`)).data;
    },
    refetchInterval: 15000,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/orders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => api.post("/orders", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["portfolio-summary"] });
      setShowModal(false);
      setForm(DEFAULT_FORM);
      setFormError(null);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string | { msg: string }[] } } };
      const detail = axiosErr.response?.data?.detail;
      if (Array.isArray(detail)) {
        setFormError(detail.map((d) => d.msg).join("; "));
      } else {
        setFormError(detail || "Failed to place order. Please try again.");
      }
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amount = parseFloat(form.investment_amount);
    if (!amount || amount <= 0) { setFormError("Investment amount must be a positive number."); return; }
    if (form.order_type === "limit") {
      const lp = parseFloat(form.limit_price);
      if (!lp || lp <= 0) { setFormError("Limit price is required and must be positive."); return; }
    }
    const body: Record<string, unknown> = {
      symbol: form.symbol,
      side: form.side,
      order_type: form.order_type,
      investment_amount: amount,
    };
    if (form.order_type === "limit") body.limit_price = parseFloat(form.limit_price);
    createMutation.mutate(body);
  };

  const orders: Order[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const filtered = symbolFilter
    ? orders.filter((o) => o.symbol.toLowerCase().includes(symbolFilter.toLowerCase()))
    : orders;

  const hasFilters = status !== "" || symbolFilter !== "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Orders</h1>
          <p className="text-sm text-slate-600 mt-0.5">{total} orders total</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => { setShowModal(true); setFormError(null); setForm(DEFAULT_FORM); }}
        >
          <Plus className="w-4 h-4" />
          New Order
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-[#0D1626] border border-white/[0.07] rounded-xl">
        <div className="flex items-center gap-2 text-slate-600">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-xs font-medium text-slate-500">Filters</span>
        </div>
        <div className="w-px h-4 bg-white/[0.07]" />

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600">Status</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            className="bg-[#060D18] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s || "All statuses"}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600">Symbol</label>
          <input
            type="text"
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
            placeholder="e.g. EURUSD"
            className="bg-[#060D18] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 w-28 placeholder-slate-700"
          />
        </div>

        {hasFilters && (
          <button
            onClick={() => { setStatus(""); setSymbolFilter(""); setPage(0); }}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Orders Table */}
      <Card>
        {isLoading ? (
          <SkeletonTable rows={6} cols={8} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Symbol</th>
                    <th className="text-left pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Side</th>
                    <th className="text-left pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Type</th>
                    <th className="text-right pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Invested</th>
                    <th className="text-right pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Qty</th>
                    <th className="text-right pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Limit</th>
                    <th className="text-right pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Fill Price</th>
                    <th className="text-left pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="text-right pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">P&amp;L</th>
                    <th className="text-right pb-3 text-xs font-medium text-slate-600 uppercase tracking-wider">Created</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={11}>
                        <EmptyState
                          icon={ClipboardList}
                          title="No orders found"
                          description={hasFilters ? "Try adjusting your filters" : "Place your first order to get started"}
                        />
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o) => (
                      <tr key={o.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0">
                        <td className="py-3 font-semibold text-slate-200">{o.symbol}</td>
                        <td className="py-3">
                          <Badge variant={o.side === "buy" ? "buy" : "sell"}>{o.side.toUpperCase()}</Badge>
                        </td>
                        <td className="py-3 text-slate-500 capitalize text-xs">{o.order_type}</td>
                        <td className="py-3 text-right text-slate-300 font-mono tabular-nums">
                          {o.investment_amount ? formatCurrency(Number(o.investment_amount)) : "—"}
                        </td>
                        <td className="py-3 text-right text-slate-500 font-mono text-xs tabular-nums">
                          {Number(o.quantity).toFixed(4)}
                        </td>
                        <td className="py-3 text-right text-slate-500 font-mono text-xs tabular-nums">
                          {o.limit_price ? Number(o.limit_price).toFixed(5) : "—"}
                        </td>
                        <td className="py-3 text-right text-slate-300 font-mono text-xs tabular-nums">
                          {o.avg_fill_price ? Number(o.avg_fill_price).toFixed(5) : "—"}
                        </td>
                        <td className="py-3">
                          <div>
                            <Badge variant={o.status as "pending" | "filled" | "cancelled" | "rejected"} dot>
                              {o.status}
                            </Badge>
                            {o.rejection_reason && (
                              <p className="text-[10px] text-red-400/70 mt-0.5 max-w-[120px] truncate">{o.rejection_reason}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono text-xs tabular-nums">
                          {o.status === "filled" ? (
                            o.realized_pnl !== null && o.realized_pnl !== undefined ? (
                              <span className={o.realized_pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                                {o.realized_pnl >= 0 ? "+" : ""}{o.realized_pnl.toFixed(2)}
                              </span>
                            ) : o.side === "buy" ? (
                              <span className="text-blue-400 text-[10px] font-semibold">OPEN</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )
                          ) : (
                            <span className="text-slate-700">—</span>
                          )}
                        </td>
                        <td className="py-3 text-right text-slate-600 text-xs whitespace-nowrap">{formatDate(o.created_at)}</td>
                        <td className="py-3 text-right">
                          {o.status === "pending" && (
                            <button
                              onClick={() => cancelMutation.mutate(o.id)}
                              disabled={cancelMutation.isPending}
                              className="text-xs text-slate-600 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/[0.06]"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-slate-600">
                  Page {page + 1} of {totalPages} · {total} orders
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* New Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#0D1626] border border-white/[0.08] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">New Order</h2>
                <p className="text-xs text-slate-600 mt-0.5">Place a market or limit order</p>
              </div>
              <button
                onClick={() => { setShowModal(false); setFormError(null); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="px-5 py-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/[0.08] border border-red-500/20 rounded-lg text-red-400 text-xs">
                  {formError}
                </div>
              )}

              {/* Symbol */}
              <div>
                <label className="label-base">Symbol</label>
                <select
                  value={form.symbol}
                  onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
                  className="input-base"
                >
                  {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Side */}
              <div>
                <label className="label-base">Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["buy", "sell"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, side: s }))}
                      className={`py-2.5 rounded-lg text-sm font-semibold transition-all border ${
                        form.side === s
                          ? s === "buy"
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                            : "bg-red-500/10 border-red-500/40 text-red-400"
                          : "bg-transparent border-white/[0.08] text-slate-500 hover:border-white/[0.15] hover:text-slate-300"
                      }`}
                    >
                      {s === "buy" ? "▲ BUY" : "▼ SELL"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Type */}
              <div>
                <label className="label-base">Order Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["market", "limit"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, order_type: t, limit_price: "" }))}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                        form.order_type === t
                          ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                          : "bg-transparent border-white/[0.08] text-slate-500 hover:border-white/[0.15] hover:text-slate-300"
                      }`}
                    >
                      {t === "market" ? "Market" : "Limit"}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-700 mt-1.5">
                  {form.order_type === "market"
                    ? "Fills immediately at current market price"
                    : "Fills when price reaches your target level"}
                </p>
              </div>

              {/* Investment Amount */}
              <div>
                <label className="label-base">Investment ($)</label>
                <input
                  type="number" min="1" step="1"
                  value={form.investment_amount}
                  onChange={(e) => setForm((f) => ({ ...f, investment_amount: e.target.value }))}
                  placeholder="e.g. 100"
                  required
                  className="input-base"
                />
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {INVESTMENT_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, investment_amount: String(amt) }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                        form.investment_amount === String(amt)
                          ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                          : "bg-white/[0.03] border-white/[0.07] text-slate-600 hover:border-white/[0.15] hover:text-slate-400"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Limit Price */}
              {form.order_type === "limit" && (
                <div>
                  <label className="label-base">Limit Price</label>
                  <input
                    type="number" min="0.00001" step="any"
                    value={form.limit_price}
                    onChange={(e) => setForm((f) => ({ ...f, limit_price: e.target.value }))}
                    placeholder="e.g. 1.08500"
                    required
                    className="input-base"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={() => { setShowModal(false); setFormError(null); }} className="flex-1">
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                    form.side === "buy"
                      ? "bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50"
                      : "bg-red-600 hover:bg-red-500 disabled:bg-red-600/50"
                  }`}
                >
                  {createMutation.isPending ? (
                    <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Placing...</>
                  ) : (
                    `Place ${form.side === "buy" ? "Buy" : "Sell"} Order`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
