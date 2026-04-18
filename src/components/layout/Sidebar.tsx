"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  TrendingUp,
  ClipboardList,
  Cpu,
  BarChart2,
  Shield,
  Activity,
  LogOut,
  Zap,
  BookOpen,
  Bot,
  ChevronDown,
  AlertTriangle,
  Wrench,
} from "lucide-react";
import { useAuthStore, AccountMode } from "@/store/authStore";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard",    href: "/dashboard",  icon: LayoutDashboard, description: "Overview & P&L" },
  { label: "Bots",         href: "/bots",       icon: Bot,             description: "Seleccionar bot" },
  { label: "Tus Bots",     href: "/my-bots",    icon: Wrench,          description: "Bots personalizados" },
  { label: "Trade",        href: "/trade",      icon: TrendingUp,      description: "Place orders" },
  { label: "Manual",       href: "/trading",    icon: TrendingUp,      description: "Manual trading" },
  { label: "Orders",       href: "/orders",     icon: ClipboardList,   description: "Order history" },
  { label: "Strategy",     href: "/strategy",   icon: Cpu,             description: "EMA + RSI config" },
  { label: "Signals",      href: "/signals",    icon: Activity,        description: "Live signals & decisions" },
  { label: "Backtest",     href: "/backtest",   icon: BarChart2,       description: "Historical testing" },
  { label: "Risk",         href: "/risk",       icon: Shield,          description: "Exposure limits" },
  { label: "Contabilidad", href: "/accounting", icon: BookOpen,        description: "Balance & P&L" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const accountMode    = useAuthStore((s) => s.accountMode);
  const setAccountMode = useAuthStore((s) => s.setAccountMode);
  const queryClient    = useQueryClient();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (logoRef.current && !logoRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleModeSelect(mode: AccountMode) {
    setDropdownOpen(false);
    if (mode === accountMode) return;
    if (mode === "live") {
      setConfirmModal(true);
    } else {
      applyModeChange("paper");
    }
  }

  function applyModeChange(mode: AccountMode) {
    setAccountMode(mode);
    queryClient.invalidateQueries();
    setConfirmModal(false);
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <aside className="w-56 min-h-screen bg-[#080F1D] border-r border-white/[0.06] flex flex-col shrink-0">
        {/* Logo — click to switch account mode */}
        <div className="px-5 py-5 border-b border-white/[0.06] relative" ref={logoRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-3 w-full rounded-lg hover:bg-white/[0.04] -mx-1.5 px-1.5 py-1 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50 shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-white tracking-tight">TradePaper</span>
                <ChevronDown className={cn(
                  "w-3 h-3 text-slate-500 transition-transform duration-150",
                  dropdownOpen && "rotate-180"
                )} />
              </div>
              <p className="text-[10px] text-slate-600 leading-none mt-0.5">Paper Trading Platform</p>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-3 right-3 mt-1 rounded-lg border border-white/[0.08] bg-[#0A1120] shadow-2xl overflow-hidden z-50">
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

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-2 mb-3 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
            Navigation
          </p>
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                  isActive
                    ? "bg-blue-600/10 text-blue-400"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-blue-400" : "text-slate-600 group-hover:text-slate-400"
                  )}
                />
                <span className="text-xs">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
          {user && (
            <div className="px-3 py-2.5 mb-1 rounded-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-600/20 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-400 ring-1 ring-blue-500/20 shrink-0">
                  {user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-300 truncate leading-none">
                    {user.email}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {user.is_admin ? "Admin" : "Trader"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Confirmation modal for switching to REAL MONEY */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setConfirmModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 bg-[#0A1120] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-red-600 to-red-400" />
            <div className="p-6">
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
