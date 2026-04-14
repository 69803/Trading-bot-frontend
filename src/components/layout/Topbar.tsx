"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useBotTabsStore } from "@/store/botTabsStore";
import { cn } from "@/lib/utils";
import { Radio, X } from "lucide-react";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard",        subtitle: "Portfolio overview" },
  "/trade":     { title: "Trade",            subtitle: "Place market & limit orders" },
  "/orders":    { title: "Orders",           subtitle: "Order management" },
  "/strategy":  { title: "Strategy",         subtitle: "EMA crossover + RSI" },
  "/backtest":  { title: "Backtesting",      subtitle: "Historical strategy simulation" },
  "/risk":      { title: "Risk Management",  subtitle: "Exposure & circuit breaker" },
  "/bots":      { title: "Bots",             subtitle: "Seleccionar estrategia" },
};

export function Topbar() {
  const pathname  = usePathname();
  const user      = useAuthStore((s) => s.user);
  const { tabs, removeTab, selectedBotId, setSelectedBot } = useBotTabsStore();

  // Same queryKey as Dashboard → React Query serves from cache, zero extra requests
  const { data: botStatus } = useQuery<{ is_running: boolean }>({
    queryKey: ["bot-status"],
    queryFn: async () => (await api.get("/bot/status")).data,
    refetchInterval: 10000,
    staleTime: 5000,
  });
  const isRunning = botStatus?.is_running ?? false;

  const meta =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ||
    { title: "TradePaper", subtitle: "" };

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
              const isSelected = tab.id === selectedBotId;
              // Tab shows as "live" only when the backend confirms the bot is running
              const isLive = isRunning;
              return (
                <div
                  key={tab.id}
                  onClick={() => setSelectedBot(tab.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border shrink-0 group cursor-pointer transition-all duration-150"
                  style={{
                    background: isSelected
                      ? isLive ? `${tab.color}28` : "rgba(30,35,42,0.8)"
                      : isLive ? `${tab.color}10` : "rgba(20,25,32,0.6)",
                    borderColor: isSelected
                      ? isLive ? `${tab.color}70` : "rgba(100,116,139,0.35)"
                      : isLive ? `${tab.color}28` : "rgba(100,116,139,0.18)",
                    boxShadow: isSelected && isLive ? `0 0 0 1px ${tab.color}40` : "none",
                  }}
                >
                  {/* Status dot — pulses only when actually running */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLive ? "animate-pulse" : ""}`}
                    style={{ background: isLive ? tab.color : "#475569" }}
                  />
                  {/* Bot name */}
                  <span
                    className="text-[11px] font-semibold tracking-tight whitespace-nowrap"
                    style={{
                      color: isLive ? tab.color : "#64748b",
                      opacity: isSelected ? 1 : 0.7,
                    }}
                  >
                    {tab.name}
                  </span>
                  {/* Close button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                    className="ml-0.5 rounded-full p-0.5 opacity-40 hover:opacity-100 transition-opacity"
                    style={{ color: isLive ? tab.color : "#64748b" }}
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

      {/* Right: live indicator + avatar */}
      <div className="flex items-center gap-3 shrink-0">

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
