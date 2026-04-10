"use client";

import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { QuotesResponse } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useBotTabsStore } from "@/store/botTabsStore";
import { cn } from "@/lib/utils";
import { Radio, Bot, X } from "lucide-react";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard",        subtitle: "Portfolio overview" },
  "/trade":     { title: "Trade",            subtitle: "Place market & limit orders" },
  "/orders":    { title: "Orders",           subtitle: "Order management" },
  "/strategy":  { title: "Strategy",         subtitle: "EMA crossover + RSI" },
  "/backtest":  { title: "Backtesting",      subtitle: "Historical strategy simulation" },
  "/risk":      { title: "Risk Management",  subtitle: "Exposure & circuit breaker" },
  "/bots":      { title: "Bots",             subtitle: "Seleccionar estrategia" },
};

function QuoteTicker({ symbol, price, changePct }: { symbol: string; price: number; changePct: number }) {
  const pct = Number(changePct ?? 0);
  const isPositive = pct >= 0;
  const decimals = symbol.includes("BTC") ? 0 : 4;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
      <span className="text-[10px] font-semibold text-slate-500 tracking-wider">{symbol}</span>
      <span className="text-xs font-mono text-slate-200 tabular-nums">
        {Number(price).toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals + 1,
        })}
      </span>
      <span className={cn("text-[10px] font-semibold tabular-nums", isPositive ? "text-emerald-400" : "text-red-400")}>
        {isPositive ? "+" : ""}{pct.toFixed(2)}%
      </span>
    </div>
  );
}

export function Topbar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const user      = useAuthStore((s) => s.user);
  const { tabs, removeTab, selectedBotId, setSelectedBot } = useBotTabsStore();

  const meta =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ||
    { title: "TradePaper", subtitle: "" };

  const { data } = useQuery({
    queryKey: ["market-quotes-topbar"],
    queryFn: async () => {
      const res = await api.get<QuotesResponse>("/market/quote?symbols=EURUSD,BTCUSDT");
      return res.data;
    },
    refetchInterval: 5000,
    staleTime: 0,
  });

  const quotes = data?.quotes ?? [];

  return (
    <header className="h-14 bg-[#060D18]/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6 sticky top-0 z-20 gap-3">

      {/* Left: title + bot tabs */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Page title */}
        <div className="flex items-baseline gap-2 shrink-0">
          <h2 className="text-sm font-semibold text-slate-200">{meta.title}</h2>
          {meta.subtitle && (
            <span className="text-xs text-slate-600 hidden sm:block">{meta.subtitle}</span>
          )}
        </div>

        {/* Divider — only when tabs exist */}
        {tabs.length > 0 && (
          <span className="w-px h-4 bg-white/[0.08] shrink-0" />
        )}

        {/* Bot tabs — scrollable */}
        {tabs.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide min-w-0">
            {tabs.map((tab) => {
              const isActive = tab.id === selectedBotId;
              return (
                <div
                  key={tab.id}
                  onClick={() => setSelectedBot(tab.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border shrink-0 group cursor-pointer transition-all duration-150"
                  style={{
                    background: isActive ? `${tab.color}28` : `${tab.color}10`,
                    borderColor: isActive ? `${tab.color}70` : `${tab.color}28`,
                    boxShadow: isActive ? `0 0 0 1px ${tab.color}40` : "none",
                  }}
                >
                  {/* Status dot */}
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                    style={{ background: tab.color }}
                  />
                  {/* Bot name */}
                  <span
                    className="text-[11px] font-semibold tracking-tight whitespace-nowrap"
                    style={{ color: tab.color, opacity: isActive ? 1 : 0.7 }}
                  >
                    {tab.name}
                  </span>
                  {/* Close button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                    className="ml-0.5 rounded-full p-0.5 opacity-40 hover:opacity-100 transition-opacity"
                    style={{ color: tab.color }}
                    title={`Cerrar pestaña ${tab.name}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: bots button + quotes + live + avatar */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Bots CTA button */}
        <button
          onClick={() => router.push("/bots")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 border",
            pathname.startsWith("/bots")
              ? "bg-blue-600/15 border-blue-500/30 text-blue-400"
              : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]"
          )}
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Bots</span>
        </button>

        {/* Live quotes */}
        <div className="hidden md:flex items-center gap-2">
          {quotes.map((q) => (
            <QuoteTicker
              key={q.symbol}
              symbol={q.symbol}
              price={q.price}
              changePct={q.change_pct}
            />
          ))}
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20">
          <Radio className="w-2.5 h-2.5 text-emerald-400" />
          <span className="text-[10px] font-medium text-emerald-400">Live</span>
        </div>

        {/* User avatar */}
        {user && (
          <div className="w-7 h-7 bg-blue-600/20 rounded-full flex items-center justify-center text-xs font-bold text-blue-400 ring-1 ring-blue-500/20">
            {user.email[0].toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
