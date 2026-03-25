import { cn } from "@/lib/utils";

type BadgeVariant =
  | "buy"
  | "sell"
  | "hold"
  | "open"
  | "filled"
  | "pending"
  | "cancelled"
  | "rejected"
  | "long"
  | "short"
  | "success"
  | "warning"
  | "error"
  | "neutral"
  | "info"
  | "running";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  buy:       "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  sell:      "bg-red-500/10     text-red-400     ring-1 ring-red-500/20",
  hold:      "bg-slate-500/10   text-slate-400   ring-1 ring-slate-500/20",
  open:      "bg-blue-500/10    text-blue-400    ring-1 ring-blue-500/20",
  filled:    "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  pending:   "bg-amber-500/10   text-amber-400   ring-1 ring-amber-500/20",
  cancelled: "bg-slate-500/10   text-slate-400   ring-1 ring-slate-500/20",
  rejected:  "bg-red-500/10     text-red-400     ring-1 ring-red-500/20",
  long:      "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  short:     "bg-red-500/10     text-red-400     ring-1 ring-red-500/20",
  success:   "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  warning:   "bg-amber-500/10   text-amber-400   ring-1 ring-amber-500/20",
  error:     "bg-red-500/10     text-red-400     ring-1 ring-red-500/20",
  neutral:   "bg-slate-500/10   text-slate-500   ring-1 ring-slate-500/20",
  info:      "bg-blue-500/10    text-blue-400    ring-1 ring-blue-500/20",
  running:   "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
};

const dotColors: Record<BadgeVariant, string> = {
  buy:       "bg-emerald-400",
  sell:      "bg-red-400",
  hold:      "bg-slate-400",
  open:      "bg-blue-400",
  filled:    "bg-emerald-400",
  pending:   "bg-amber-400",
  cancelled: "bg-slate-400",
  rejected:  "bg-red-400",
  long:      "bg-emerald-400",
  short:     "bg-red-400",
  success:   "bg-emerald-400",
  warning:   "bg-amber-400",
  error:     "bg-red-400",
  neutral:   "bg-slate-400",
  info:      "bg-blue-400",
  running:   "bg-emerald-400",
};

export function Badge({ variant, children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
