"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Search } from "lucide-react";
import api from "@/lib/api";
import { ASSET_CATEGORIES, ASSET_INFO } from "@/config/assetMeta";
import type { QuotesResponse, Quote } from "@/types";
import AssetCategories from "./AssetCategories";
import AssetList from "./AssetList";

interface AssetSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (s: string) => void;
  /** Symbols already pinned — shown with "Added" badge in the list */
  pinnedSymbols?: string[];
}

// Batch-fetch quotes for all symbols in the active category
function useCategoryQuotes(symbols: string[], enabled: boolean) {
  return useQuery<QuotesResponse>({
    queryKey: ["panel-quotes", symbols.join(",")],
    queryFn: async () =>
      (await api.get(`/market/quote?symbols=${symbols.join(",")}`)).data,
    enabled: enabled && symbols.length > 0,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AssetSelector({
  open,
  onClose,
  onSelect,
  pinnedSymbols = [],
}: AssetSelectorProps) {
  const [activeCategoryId, setActiveCategoryId] = useState("stocks");
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const activeCategory =
    ASSET_CATEGORIES.find((c) => c.id === activeCategoryId) ??
    ASSET_CATEGORIES[0];

  const { data: quotesData, isFetching: quotesLoading } = useCategoryQuotes(
    activeCategory.symbols,
    open
  );

  const quotesMap: Record<string, Quote> = {};
  for (const q of quotesData?.quotes ?? []) {
    quotesMap[q.symbol] = q;
  }

  // Focus search when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 80);
    } else {
      setSearch("");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Close on outside click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSelect = useCallback(
    (sym: string) => {
      onSelect(sym);
    },
    [onSelect]
  );

  if (!open) return null;

  return (
    <>
      {/* Overlay + Panel */}
      <div
        className="fixed inset-0 z-50 flex"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        onClick={handleBackdropClick}
      >
        {/* Panel — slides in from left */}
        <div
          ref={panelRef}
          className="relative flex flex-col bg-[#090f1c] border-r border-white/[0.07] w-full max-w-[520px] h-full shadow-2xl"
          style={{ animation: "slideInLeft 0.18s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-slate-200">
              Add Asset
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-white/[0.05]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ticker or name…"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500/30 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Body: categories + list */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: categories */}
            <div className="overflow-y-auto px-2 py-2 shrink-0">
              <AssetCategories
                categories={ASSET_CATEGORIES}
                activeId={activeCategoryId}
                onSelect={(id) => {
                  setActiveCategoryId(id);
                  setSearch("");
                }}
              />
            </div>

            {/* Right: asset list */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {activeCategory.soon ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <span className="text-2xl">🔜</span>
                  <p className="text-sm text-slate-500">
                    {activeCategory.label} coming soon
                  </p>
                  <p className="text-xs text-slate-700">
                    More asset classes are on the way
                  </p>
                </div>
              ) : (
                <AssetList
                  symbols={activeCategory.symbols}
                  quotes={quotesMap}
                  selectedSymbol=""
                  pinnedSymbols={pinnedSymbols}
                  search={search}
                  onSelect={handleSelect}
                  isLoading={quotesLoading && Object.keys(quotesMap).length === 0}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/[0.05]">
            <p className="text-[10px] text-slate-700">
              {activeCategory.symbols.length} assets · Prev-day close prices
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInLeft {
          from { transform: translateX(-12px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </>
  );
}
