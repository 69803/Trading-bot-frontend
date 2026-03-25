"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard",  href: "/dashboard", icon: LayoutDashboard, description: "Overview & P&L" },
  { label: "Trade",      href: "/trade",      icon: TrendingUp,      description: "Place orders" },
  { label: "Orders",     href: "/orders",     icon: ClipboardList,   description: "Order history" },
  { label: "Strategy",   href: "/strategy",   icon: Cpu,             description: "EMA + RSI config" },
  { label: "Signals",    href: "/signals",    icon: Activity,        description: "Live signals & decisions" },
  { label: "Backtest",   href: "/backtest",   icon: BarChart2,       description: "Historical testing" },
  { label: "Risk",          href: "/risk",          icon: Shield,   description: "Exposure limits" },
  { label: "Contabilidad", href: "/accounting",   icon: BookOpen, description: "Balance & P&L" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="w-56 min-h-screen bg-[#080F1D] border-r border-white/[0.06] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight">TradePaper</span>
            <p className="text-[10px] text-slate-600 leading-none mt-0.5">Paper Trading Platform</p>
          </div>
        </div>
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
  );
}
