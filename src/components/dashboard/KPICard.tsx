import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  loading?: boolean;
  accentColor?: "blue" | "emerald" | "red" | "amber" | "slate";
}

const accentColors = {
  blue:    "from-blue-500/20 to-transparent border-blue-500/30",
  emerald: "from-emerald-500/20 to-transparent border-emerald-500/30",
  red:     "from-red-500/20 to-transparent border-red-500/30",
  amber:   "from-amber-500/20 to-transparent border-amber-500/30",
  slate:   "from-slate-500/10 to-transparent border-slate-500/20",
};

const iconColors = {
  blue:    "bg-blue-500/10 text-blue-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  red:     "bg-red-500/10 text-red-400",
  amber:   "bg-amber-500/10 text-amber-400",
  slate:   "bg-slate-500/10 text-slate-400",
};

export function KPICard({
  title,
  value,
  subtitle,
  trend = "neutral",
  icon: Icon,
  loading = false,
  accentColor = "blue",
}: KPICardProps) {
  const trendColor =
    trend === "positive" ? "text-emerald-400" :
    trend === "negative" ? "text-red-400" :
    "text-slate-400";

  const TrendIcon =
    trend === "positive" ? TrendingUp :
    trend === "negative" ? TrendingDown :
    Minus;

  if (loading) {
    return (
      <div className="bg-[#0D1626] border border-white/[0.07] rounded-xl p-5 animate-pulse">
        <div className="h-3 bg-white/[0.06] rounded w-24 mb-4" />
        <div className="h-7 bg-white/[0.06] rounded w-32 mb-2" />
        <div className="h-3 bg-white/[0.06] rounded w-20" />
      </div>
    );
  }

  return (
    <div className={cn(
      "relative bg-[#0D1626] border border-white/[0.07] rounded-xl p-5",
      "hover:border-white/[0.12] transition-all duration-200 overflow-hidden group"
    )}>
      {/* Subtle top gradient accent */}
      <div className={cn(
        "absolute inset-x-0 top-0 h-px bg-gradient-to-r",
        accentColors[accentColor]
      )} />

      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", iconColors[accentColor])}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <p className={cn(
        "text-2xl font-bold tracking-tight font-variant-numeric tabular-nums",
        trend === "neutral" ? "text-slate-100" : trendColor
      )}>
        {value}
      </p>

      {subtitle && (
        <div className="flex items-center gap-1.5 mt-2">
          <TrendIcon className={cn("w-3 h-3 shrink-0", trendColor)} />
          <span className={cn("text-xs font-medium", trendColor)}>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
