import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-14 text-center", className)}>
      <div className="w-12 h-12 bg-white/[0.04] border border-white/[0.07] rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-slate-500" />
      </div>
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {description && (
        <p className="text-xs text-slate-600 mt-1 max-w-[220px]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
