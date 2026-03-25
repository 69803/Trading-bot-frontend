import { ASSET_INFO } from "@/config/assetMeta";
import type { Quote } from "@/types";

interface AssetListProps {
  symbols: string[];
  quotes: Record<string, Quote>;
  selectedSymbol: string;
  pinnedSymbols?: string[];
  search: string;
  onSelect: (symbol: string) => void;
  isLoading: boolean;
}

// Avatar: colored square with ticker initials
function AssetAvatar({ symbol }: { symbol: string }) {
  const info = ASSET_INFO[symbol];
  const color = info?.color ?? "#6366f1";
  const initials = symbol.length <= 2 ? symbol : symbol.slice(0, 2);
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs select-none"
      style={{ backgroundColor: color + "22", border: `1.5px solid ${color}44` }}
    >
      <span style={{ color }}>{initials}</span>
    </div>
  );
}

export default function AssetList({
  symbols,
  quotes,
  selectedSymbol,
  pinnedSymbols = [],
  search,
  onSelect,
  isLoading,
}: AssetListProps) {
  const q = search.trim().toUpperCase();
  const filtered = q
    ? symbols.filter(
        (s) =>
          s.includes(q) ||
          (ASSET_INFO[s]?.name ?? "").toUpperCase().includes(q)
      )
    : symbols;

  if (isLoading && filtered.length === 0) {
    return (
      <div className="flex flex-col gap-2 py-4 px-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-2.5 w-28 bg-white/[0.05] rounded animate-pulse" />
              <div className="h-2 w-16 bg-white/[0.04] rounded animate-pulse" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-2.5 w-14 bg-white/[0.05] rounded animate-pulse" />
              <div className="h-2 w-10 bg-white/[0.04] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-slate-500">No assets match</p>
        <p className="text-xs text-slate-700 mt-1">&ldquo;{search}&rdquo;</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {filtered.map((sym) => {
        const info = ASSET_INFO[sym];
        const quote = quotes[sym];
        const price = quote ? Number(quote.price) : null;
        const changePct = quote ? Number(quote.change_pct) : null;
        const isPos = (changePct ?? 0) >= 0;
        const isSelected = sym === selectedSymbol;
        const isPinned = pinnedSymbols.includes(sym);

        return (
          <button
            key={sym}
            onClick={() => onSelect(sym)}
            className={`
              flex items-center gap-3 w-full text-left rounded-xl px-3 py-2.5
              transition-all duration-150 group
              ${isSelected
                ? "bg-blue-600/10 border border-blue-500/20"
                : isPinned
                ? "bg-emerald-600/[0.06] border border-emerald-500/15"
                : "hover:bg-white/[0.04] border border-transparent"
              }
            `}
          >
            <AssetAvatar symbol={sym} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-sm font-bold leading-none ${
                    isSelected ? "text-blue-400" : "text-slate-200 group-hover:text-white"
                  }`}
                >
                  {sym}
                </span>
                {isPinned && (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    Added
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 truncate mt-0.5 leading-none">
                {info?.name ?? sym}
              </p>
            </div>

            <div className="text-right shrink-0">
              {price !== null ? (
                <>
                  <p className="text-sm font-semibold font-mono tabular-nums text-slate-200">
                    ${price.toFixed(2)}
                  </p>
                  {changePct !== null && (
                    <p
                      className={`text-[11px] font-semibold tabular-nums mt-0.5 ${
                        isPos ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {isPos ? "+" : ""}
                      {changePct.toFixed(2)}%
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-700">—</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
