import type { AssetCategory } from "@/config/assetMeta";

interface AssetCategoriesProps {
  categories: AssetCategory[];
  activeId: string;
  onSelect: (id: string) => void;
}

const ICONS: Record<string, string> = {
  stocks:      "📈",
  etfs:        "🗂",
  forex:       "💱",
  commodities: "🛢️",
  crypto:      "₿",
  indices:     "📊",
};

export default function AssetCategories({
  categories,
  activeId,
  onSelect,
}: AssetCategoriesProps) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[140px] border-r border-white/[0.06] pr-1 py-1">
      {categories.map((cat) => {
        const isActive = cat.id === activeId;
        return (
          <button
            key={cat.id}
            onClick={() => !cat.soon && onSelect(cat.id)}
            disabled={cat.soon}
            className={`
              flex items-center justify-between gap-2 w-full text-left
              px-3 py-2.5 rounded-lg text-xs font-medium transition-all
              ${isActive
                ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                : cat.soon
                  ? "text-slate-700 cursor-default"
                  : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300 border border-transparent"
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm leading-none">{ICONS[cat.id] ?? "•"}</span>
              <span>{cat.label}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {cat.symbols.length > 0 && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-white/[0.05] text-slate-600"
                  }`}
                >
                  {cat.symbols.length}
                </span>
              )}
              {cat.soon && (
                <span className="text-[9px] font-semibold text-slate-700 uppercase tracking-wider">
                  Soon
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
