"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore, AccountMode } from "@/store/authStore";
import { useBotTabsStore } from "@/store/botTabsStore";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronDown, Radio, X } from "lucide-react";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":       { title: "Dashboard",        subtitle: "Portfolio overview" },
  "/manual-trading":  { title: "Manual Trading",   subtitle: "Aviso antes de operar" },
  "/trading":         { title: "Manual Trading",   subtitle: "Solo tus operaciones manuales" },
  "/trade":           { title: "Trade",            subtitle: "Place market & limit orders" },
  "/orders":    { title: "Orders",           subtitle: "Order management" },
  "/strategy":  { title: "Strategy",         subtitle: "EMA crossover + RSI" },
  "/backtest":  { title: "Backtesting",      subtitle: "Historical strategy simulation" },
  "/risk":      { title: "Risk Management",  subtitle: "Exposure & circuit breaker" },
  "/bots":      { title: "Bots",             subtitle: "Seleccionar estrategia" },
};

export function Topbar() {
  const pathname    = usePathname();
  const user        = useAuthStore((s) => s.user);
  const accountMode = useAuthStore((s) => s.accountMode);
  const setAccountMode = useAuthStore((s) => s.setAccountMode);
  const { tabs, removeTab, selectedBotId, setSelectedBot } = useBotTabsStore();
  const queryClient = useQueryClient();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isLiveMode = accountMode === "live";

  function handleModeSelect(mode: AccountMode) {
    setDropdownOpen(false);
    if (mode === accountMode) return;
    if (mode === "live") {
      // Show confirmation modal before switching to real money
      setConfirmModal(true);
    } else {
      applyModeChange("paper");
    }
  }

  function applyModeChange(mode: AccountMode) {
    setAccountMode(mode);
    // Invalidate ALL queries so every page re-fetches with the new mode header
    queryClient.invalidateQueries();
    setConfirmModal(false);
  }

  // Only fetch bot status when a bot is selected — avoids 422 (bot_id is required)
  const { data: botStatus } = useQuery<{ is_running: boolean }>({
    queryKey: ["bot-status", selectedBotId],
    queryFn: async () => (await api.get(`/bot/status?bot_id=${selectedBotId}`)).data,
    enabled: !!selectedBotId,
    refetchInterval: 10000,
    staleTime: 5000,
  });
  const isBotRunning = botStatus?.is_running ?? false;

  const meta =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ||
    { title: "TradePaper", subtitle: "" };

  return (
    <>
      <header className={cn(
        "h-14 backdrop-blur-xl border-b flex items-center justify-between px-6 sticky top-0 z-20 gap-3 transition-colors duration-300",
        isLiveMode
          ? "bg-[#0D0606]/95 border-red-500/20"
          : "bg-[#060D18]/95 border-white/[0.06]"
      )}>

        {/* Left: title + bot tabs */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Page title */}
          <div className="flex items-baseline gap-2 shrink-0">
            <h2 className="text-sm font-semibold text-slate-200">{meta.title}</h2>
            {meta.subtitle && (
              <span className="text-xs text-slate-600 hidden sm:block">{meta.subtitle}</span>
            )}
          </div>

          {/* Divider */}
          <span className="w-px h-4 bg-white/[0.08] shrink-0" />

          {/* Account Mode Dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-all duration-150",
                isLiveMode
                  ? "bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20"
                  : "bg-blue-500/[0.08] border-blue-500/20 text-blue-400 hover:bg-blue-500/15"
              )}
            >
              {/* Mode indicator dot */}
              <span className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                isLiveMode ? "bg-red-400 animate-pulse" : "bg-blue-400"
              )} />
              {isLiveMode ? "REAL MONEY" : "Paper Trading"}
              <ChevronDown className={cn(
                "w-3 h-3 transition-transform duration-150",
                dropdownOpen && "rotate-180"
              )} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-44 rounded-lg border border-white/[0.08] bg-[#0A1120] shadow-2xl overflow-hidden z-50">
                <button
                  onClick={() => handleModeSelect("paper")}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-medium transition-colors",
                    accountMode === "paper"
                      ? "bg-blue-500/10 text-blue-300"
                      : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <div className="text-left">
                    <div>Paper Trading</div>
                    <div className="text-[10px] text-slate-600 font-normal">Simulated funds</div>
                  </div>
                  {accountMode === "paper" && (
                    <span className="ml-auto text-blue-400 text-[10px]">✓</span>
                  )}
                </button>

                <div className="h-px bg-white/[0.05]" />

                <button
                  onClick={() => handleModeSelect("live")}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-medium transition-colors",
                    accountMode === "live"
                      ? "bg-red-500/10 text-red-300"
                      : "text-slate-400 hover:bg-red-500/[0.06] hover:text-red-300"
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-pulse" />
                  <div className="text-left">
                    <div>Real Trading</div>
                    <div className="text-[10px] text-slate-600 font-normal">Real funds</div>
                  </div>
                  {accountMode === "live" && (
                    <span className="ml-auto text-red-400 text-[10px]">✓</span>
                  )}
                </button>
              </div>
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
                const isLive = isBotRunning;
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
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLive ? "animate-pulse" : ""}`}
                      style={{ background: isLive ? tab.color : "#475569" }}
                    />
                    <span
                      className="text-[11px] font-semibold tracking-tight whitespace-nowrap"
                      style={{
                        color: isLive ? tab.color : "#64748b",
                        opacity: isSelected ? 1 : 0.7,
                      }}
                    >
                      {tab.name}
                    </span>
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

        {/* Right: LIVE badge (when real) + radio indicator + avatar */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Real Money warning badge */}
          {isLiveMode && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
              <span className="text-[10px] font-bold text-red-400 tracking-wide">REAL MONEY</span>
            </div>
          )}

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

      {/* Confirmation modal for switching to REAL MONEY */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setConfirmModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md mx-4 bg-[#0A1120] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden">
            {/* Red top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-red-600 to-red-400" />

            <div className="p-6">
              {/* Icon + title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Switch to Real Money Trading
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    You are switching to <span className="text-red-400 font-semibold">REAL MONEY</span> trading mode.
                    Real funds from your Alpaca live account will be used.
                  </p>
                </div>
              </div>

              {/* Warning box */}
              <div className="bg-red-500/[0.06] border border-red-500/20 rounded-lg p-3 mb-5">
                <ul className="text-xs text-red-300/80 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    Orders will execute with real money on Alpaca live
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    Paper trading data is completely separate
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    Losses are real and cannot be reversed
                  </li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/[0.08] text-sm font-medium text-slate-400 hover:text-slate-200 hover:border-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => applyModeChange("live")}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-bold text-white transition-colors"
                >
                  Confirm — Use Real Money
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
