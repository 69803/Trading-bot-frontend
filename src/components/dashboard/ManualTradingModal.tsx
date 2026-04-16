"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Lottie from "lottie-react";
import pcguyAnimation from "@/data/pcguy.json";
import api from "@/lib/api";
import type { QuotesResponse, BalanceResponse } from "@/types";
import { SYMBOLS } from "@/config/constants";
import { getAssetDecimals } from "@/config/assetMeta";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  BookOpen,
  ChevronDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

// ── Placeholder JSON shown in the disclaimer step ─────────────────────────────
const CONFIG_PLACEHOLDER = {
  trading_mode: "manual",
  risk_level: "high",
  disclaimer_accepted: false,
  version: "1.0.0",
  config: {
    max_position_size: "$500",
    recommended_practice_first: true,
    paper_trading_available: true,
    real_money_risk: true,
  },
};

const INVESTMENT_PRESETS = [50, 100, 200, 500, 1000];

type Step = "disclaimer" | "trade";
type Side = "buy" | "sell";
type OrderType = "market" | "limit";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: JSON viewer block
// ─────────────────────────────────────────────────────────────────────────────
function JsonBlock({ data }: { data: object }) {
  const lines = JSON.stringify(data, null, 2).split("\n");
  return (
    <div className="rounded-xl bg-[#04090F] border border-white/[0.07] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <span className="text-[10px] font-mono text-slate-600 ml-1">manual_trading_config.json</span>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-[11px] font-mono leading-relaxed">
          {lines.map((line, i) => {
            const isKey   = /^\s+"[^"]+":/.test(line);
            const isStr   = /:\s+"/.test(line);
            const isBool  = /:\s+(true|false)/.test(line);
            const isNum   = /:\s+\d/.test(line);
            const isBrace = /^[\s{}[\],]*$/.test(line);

            return (
              <div key={i} className="hover:bg-white/[0.02] px-1 rounded">
                {line.split(/(".*?"|true|false|\d+\.?\d*|null)/).map((part, j) => {
                  if (/^"[^"]*":$/.test(part.trim()) || /^"[^"]*":/.test(part.trim()) && isKey && j === 0) {
                    return <span key={j} className="text-blue-400">{part}</span>;
                  }
                  if (/^"/.test(part) && isStr) {
                    return <span key={j} className="text-emerald-400">{part}</span>;
                  }
                  if (part === "true" || part === "false") {
                    return <span key={j} className="text-amber-400">{part}</span>;
                  }
                  if (/^\d/.test(part)) {
                    return <span key={j} className="text-purple-400">{part}</span>;
                  }
                  return <span key={j} className="text-slate-500">{part}</span>;
                })}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Disclaimer step
// ─────────────────────────────────────────────────────────────────────────────
function DisclaimerStep({ onContinue }: { onContinue: () => void }) {
  const risks = [
    {
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/[0.08] border-amber-500/20",
      title: "Riesgo de pérdida total",
      text: "El trading manual implica riesgo real. Puedes perder todo tu capital invertido.",
    },
    {
      icon: ShieldCheck,
      color: "text-blue-400",
      bg: "bg-blue-500/[0.08] border-blue-500/20",
      title: "Practica primero",
      text: "Se recomienda entrenar con paper trading (dinero ficticio) antes de operar con fondos reales.",
    },
    {
      icon: BookOpen,
      color: "text-purple-400",
      bg: "bg-purple-500/[0.08] border-purple-500/20",
      title: "Sin garantía de ganancias",
      text: "Ningún resultado pasado garantiza ganancias futuras. Los mercados son impredecibles.",
    },
  ];

  return (
    <div className="space-y-5">
      {/* JSON config block */}
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Configuración
        </p>
        <JsonBlock data={CONFIG_PLACEHOLDER} />
      </div>

      {/* Risk cards */}
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Aviso de riesgo
        </p>
        <div className="space-y-2.5">
          {risks.map(({ icon: Icon, color, bg, title, text }) => (
            <div
              key={title}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${bg}`}
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
              <div>
                <p className="text-xs font-semibold text-slate-200 mb-0.5">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fine print */}
      <p className="text-[11px] text-slate-600 leading-relaxed px-1">
        Al continuar confirmas que tienes experiencia en trading, que entiendes los
        riesgos y que operas bajo tu propia responsabilidad. Esta plataforma no provee
        asesoría financiera.
      </p>

      {/* CTA */}
      <button
        onClick={onContinue}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold transition-all duration-150 shadow-lg shadow-blue-600/25 ring-1 ring-blue-500/30"
      >
        Inicializar Trading
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Symbol dropdown
// ─────────────────────────────────────────────────────────────────────────────
function SymbolPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = search
    ? SYMBOLS.filter((s) => s.toLowerCase().includes(search.toLowerCase())).slice(0, 15)
    : SYMBOLS.slice(0, 15);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 font-semibold hover:bg-white/[0.07] transition-colors"
      >
        {value}
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0B1220] border border-white/[0.10] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-white/[0.06]">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar símbolo..."
              className="w-full bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none px-2 py-1"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { onChange(s); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/[0.06] ${
                  s === value ? "text-blue-400 bg-blue-500/[0.06]" : "text-slate-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Trade step
// ─────────────────────────────────────────────────────────────────────────────
function TradeStep({ onSuccess }: { onSuccess: () => void }) {
  const qc = useQueryClient();
  const [symbol, setSymbol] = useState(SYMBOLS[0]);
  const [side, setSide] = useState<Side>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [amount, setAmount] = useState("100");
  const [limitPrice, setLimitPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const { data: balanceData } = useQuery<BalanceResponse>({
    queryKey: ["balance"],
    queryFn: async () => (await api.get("/portfolio/balance")).data,
    refetchInterval: 10_000,
  });

  const { data: quoteData } = useQuery<QuotesResponse>({
    queryKey: ["manual-quote", symbol],
    queryFn: async () => (await api.get(`/market/quote?symbols=${symbol}`)).data,
    refetchInterval: 30_000,
  });

  const quote = quoteData?.quotes?.[0];
  const livePrice = quote ? Number(quote.price) : null;
  const decimals  = getAssetDecimals(symbol);
  const cashBalance = balanceData?.cash_balance ?? null;
  const estShares = livePrice && livePrice > 0 && Number(amount) > 0
    ? Number(amount) / livePrice
    : null;

  const mutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        symbol,
        side,
        order_type: orderType,
        investment_amount: Number(amount),
      };
      if (orderType === "limit" && limitPrice) body.limit_price = Number(limitPrice);
      return api.post("/orders", body);
    },
    onSuccess: () => {
      setSuccess(`Orden ${side === "buy" ? "BUY" : "SELL"} ejecutada`);
      setError(null);
      qc.invalidateQueries({ queryKey: ["positions-all"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      qc.invalidateQueries({ queryKey: ["portfolio-summary"] });
      setTimeout(() => { setSuccess(null); onSuccess(); }, 2000);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } };
      const detail = e.response?.data?.detail ?? "Error al colocar la orden";
      if (detail.toLowerCase().startsWith("market is closed")) {
        setWarning("Market closed — order not submitted");
        setError(null);
      } else {
        setError(detail);
        setWarning(null);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!amount || Number(amount) <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    if (orderType === "limit" && (!limitPrice || Number(limitPrice) <= 0)) {
      setError("Ingresa un precio límite válido");
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Balance bar */}
      {cashBalance !== null && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <Wallet className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-xs text-slate-500">Balance disponible</span>
          <span className="ml-auto text-xs font-semibold font-mono text-slate-200">
            {formatCurrency(cashBalance)}
          </span>
        </div>
      )}

      {/* Symbol picker */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Símbolo
        </label>
        <SymbolPicker value={symbol} onChange={setSymbol} />
      </div>

      {/* Live price */}
      {livePrice !== null && (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <span className="text-xs text-slate-500">Precio actual</span>
          <span className="text-sm font-bold font-mono text-slate-100 tabular-nums">
            {livePrice.toLocaleString("en-US", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
          </span>
        </div>
      )}

      {/* BUY / SELL */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Dirección
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all duration-150 ${
              side === "buy"
                ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-600/10"
                : "bg-white/[0.03] border-white/[0.07] text-slate-500 hover:text-slate-300"
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            BUY
          </button>
          <button
            type="button"
            onClick={() => setSide("sell")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all duration-150 ${
              side === "sell"
                ? "bg-red-600/20 border-red-500/40 text-red-400 shadow-sm shadow-red-600/10"
                : "bg-white/[0.03] border-white/[0.07] text-slate-500 hover:text-slate-300"
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            SELL
          </button>
        </div>
      </div>

      {/* Market / Limit */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Tipo de orden
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["market", "limit"] as OrderType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setOrderType(t)}
              className={`py-2 rounded-lg text-xs font-semibold border transition-all duration-150 capitalize ${
                orderType === t
                  ? "bg-blue-600/15 border-blue-500/30 text-blue-400"
                  : "bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-slate-300"
              }`}
            >
              {t === "market" ? "Market" : "Limit"}
            </button>
          ))}
        </div>
      </div>

      {/* Limit price (conditional) */}
      {orderType === "limit" && (
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Precio límite
          </label>
          <input
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 font-mono placeholder-slate-700 outline-none focus:border-blue-500/40 focus:bg-white/[0.06] transition-colors"
          />
        </div>
      )}

      {/* Investment amount */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Inversión (USD)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100"
          min="1"
          className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-slate-200 font-mono placeholder-slate-700 outline-none focus:border-blue-500/40 focus:bg-white/[0.06] transition-colors mb-2"
        />
        {/* Quick presets */}
        <div className="flex gap-1.5">
          {INVESTMENT_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(String(p))}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-100 ${
                amount === String(p)
                  ? "bg-blue-600/15 border-blue-500/30 text-blue-400"
                  : "bg-white/[0.02] border-white/[0.06] text-slate-600 hover:text-slate-300 hover:border-white/[0.14]"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>
      </div>

      {/* Estimated units */}
      {estShares !== null && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.015] border border-white/[0.04]">
          <span className="text-[11px] text-slate-600">Unidades estimadas</span>
          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
            ≈ {estShares.toFixed(6)} {symbol}
          </span>
        </div>
      )}

      {/* Error / Warning / Success */}
      {warning && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/[0.08] border border-amber-500/20 text-xs text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {warning}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/[0.08] border border-red-500/20 text-xs text-red-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20 text-xs text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          {success}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={mutation.isPending}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-150 shadow-lg ring-1 flex items-center justify-center gap-2 ${
          side === "buy"
            ? "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-600/25 ring-emerald-500/30"
            : "bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-red-600/25 ring-red-500/30"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {mutation.isPending ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : side === "buy" ? (
          <><ArrowUpCircle className="w-4 h-4" /> Comprar {symbol}</>
        ) : (
          <><ArrowDownCircle className="w-4 h-4" /> Vender {symbol}</>
        )}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: ManualTradingModal
// ─────────────────────────────────────────────────────────────────────────────
export function ManualTradingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("disclaimer");

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#070E1A] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl shadow-black/60 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Manual Trading</h2>
              <p className="text-xs text-slate-600">
                {step === "disclaimer" ? "Información importante" : "Nueva posición manual"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step pills */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] shrink-0">
          {(["disclaimer", "trade"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  step === s
                    ? "bg-blue-600 text-white"
                    : i === 0 && step === "trade"
                    ? "bg-blue-600/25 text-blue-400"
                    : "bg-white/[0.05] text-slate-600"
                }`}
              >
                {i === 0 && step === "trade" ? "✓" : i + 1}
              </div>
              <span className={`text-[11px] font-medium ${step === s ? "text-slate-300" : "text-slate-600"}`}>
                {s === "disclaimer" ? "Aviso" : "Operar"}
              </span>
              {i < 1 && <div className="w-6 h-px bg-white/[0.06] mx-1" />}
            </div>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === "disclaimer" ? (
            <DisclaimerStep onContinue={() => setStep("trade")} />
          ) : (
            <TradeStep onSuccess={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
