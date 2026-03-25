"use client";

import { Position } from "@/types";

interface PnLBarProps {
  /** All open positions for the active symbol */
  positions: Position[];
  /** Live current price from quote poll (overrides position.current_price) */
  livePrice: number | null;
}

export default function PnLBar({ positions, livePrice }: PnLBarProps) {
  const open = positions.filter((p) => p.is_open);
  if (open.length === 0) return null;

  let totalInvested = 0;
  let currentValue = 0;

  for (const p of open) {
    const price = Number(livePrice ?? p.current_price ?? p.avg_entry_price);
    const qty = Number(p.quantity);
    const entry = Number(p.avg_entry_price);
    const invested = p.investment_amount != null ? Number(p.investment_amount) : entry * qty;
    totalInvested += invested;
    if (p.side === "long") {
      currentValue += price * qty;
    } else {
      const pnl = (entry - price) * qty;
      currentValue += invested + pnl;
    }
  }

  const pnl = currentValue - totalInvested;
  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
  const isPositive = pnl >= 0;

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-[#0d1117] border-b border-[#1e2329] text-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-[#848e9c]">Invested</span>
        <span className="font-medium text-white">
          ${totalInvested.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[#848e9c]">Value</span>
        <span className="font-medium text-white">
          ${currentValue.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[#848e9c]">P/L</span>
        <span
          className={`font-semibold ${isPositive ? "text-[#0ecb81]" : "text-[#f6465d]"}`}
        >
          {isPositive ? "+" : ""}${pnl.toFixed(2)}
        </span>
        <span
          className={`text-xs ${isPositive ? "text-[#0ecb81]" : "text-[#f6465d]"}`}
        >
          ({isPositive ? "+" : ""}
          {pnlPct.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}
