import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  rows?: number;
}

function SkeletonLine({ width = "full", height = "h-4" }: { width?: string; height?: string }) {
  return (
    <div className={cn("skeleton rounded", height, width === "full" ? "w-full" : width)} />
  );
}

export function SkeletonCard({ className, rows = 3 }: SkeletonCardProps) {
  return (
    <div className={cn("bg-[#0D1626] border border-white/[0.07] rounded-xl p-5 space-y-3 animate-pulse", className)}>
      <SkeletonLine width="w-28" height="h-3" />
      <SkeletonLine height="h-8" width="w-40" />
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <SkeletonLine key={i} height="h-3" width={i % 2 === 0 ? "w-full" : "w-3/4"} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-0 animate-pulse">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-white/[0.06]">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={cn("skeleton h-3 rounded", i === 0 ? "w-24" : "flex-1")} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4 py-3 border-b border-white/[0.04]">
          {Array.from({ length: cols }).map((_, ci) => (
            <div key={ci} className={cn("skeleton h-3 rounded", ci === 0 ? "w-24" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}
