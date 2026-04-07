"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import type { Candle, Position } from "@/types";

const TIMEFRAME_STEPS = ["1m", "5m", "1h", "4h", "1d"];

interface LiveChartProps {
  candles: Candle[];
  livePrice: number | null;
  symbol: string;
  timeframe: string;
  isLoading: boolean;
  positions?: Position[];
  onTimeframeChange?: (tf: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTs(ts: string, timeframe: string): string {
  try {
    const d = new Date(ts);
    if (timeframe === "1d") return format(d, "MMM d");
    if (timeframe === "4h") return format(d, "MMM d HH:mm");
    return format(d, "HH:mm");
  } catch {
    return "";
  }
}

/** Auto-detect decimal places from price magnitude */
function detectDecimals(price: number): number {
  if (price <= 0) return 2;
  if (price < 0.01) return 6;
  if (price < 1) return 5;
  if (price < 10) return 4;
  if (price < 100) return 3;
  if (price < 10000) return 2;
  return 0;
}

function fmtPrice(price: number, dec: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2)}M`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(1)}k`;
  return price.toFixed(dec);
}

// ── OHLCV tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  timeframe,
  dec,
}: {
  active?: boolean;
  payload?: { payload: Candle }[];
  timeframe: string;
  dec: number;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-[#080f1c] border border-white/[0.1] rounded-lg px-3.5 py-3 text-xs shadow-2xl pointer-events-none">
      <p className="text-slate-400 mb-2 font-medium">{formatTs(d.timestamp, timeframe)}</p>
      <div className="space-y-1 min-w-[130px]">
        <div className="flex justify-between gap-5">
          <span className="text-slate-500">Open</span>
          <span className="text-slate-200 font-mono tabular-nums">{Number(d.open).toFixed(dec)}</span>
        </div>
        <div className="flex justify-between gap-5">
          <span className="text-emerald-500">High</span>
          <span className="text-emerald-400 font-mono tabular-nums">{Number(d.high).toFixed(dec)}</span>
        </div>
        <div className="flex justify-between gap-5">
          <span className="text-red-500">Low</span>
          <span className="text-red-400 font-mono tabular-nums">{Number(d.low).toFixed(dec)}</span>
        </div>
        <div className="flex justify-between gap-5 pt-1 border-t border-white/[0.06]">
          <span className="text-blue-400 font-semibold">Close</span>
          <span className="text-blue-300 font-mono font-semibold tabular-nums">{Number(d.close).toFixed(dec)}</span>
        </div>
        <div className="flex justify-between gap-5 pt-0.5">
          <span className="text-slate-600">Vol</span>
          <span className="text-slate-500 font-mono tabular-nums">{Number(d.volume).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ── Entry dot shape (SVG) ─────────────────────────────────────────────────────

interface EntryDotProps {
  cx?: number;
  cy?: number;
  color: string;
  side: "long" | "short";
  tooltipLabel: string;
  onEnter: (cx: number, cy: number, label: string, color: string) => void;
  onLeave: () => void;
}

function EntryDotShape({
  cx = 0,
  cy = 0,
  color,
  side,
  tooltipLabel,
  onEnter,
  onLeave,
}: EntryDotProps) {
  return (
    <g
      style={{ cursor: "pointer" }}
      onMouseEnter={() => onEnter(cx, cy, tooltipLabel, color)}
      onMouseLeave={onLeave}
    >
      {/* Invisible larger hit area */}
      <circle cx={cx} cy={cy} r={18} fill="transparent" />
      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={15} fill={color} fillOpacity={0.10} />
      {/* Mid glow ring */}
      <circle cx={cx} cy={cy} r={10} fill={color} fillOpacity={0.20} />
      {/* Main solid dot */}
      <circle cx={cx} cy={cy} r={6} fill={color} stroke="#0b0e11" strokeWidth={1.5} />
      {/* Arrow icon inside dot */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fill="#0b0e11"
        fontSize={8}
        fontWeight={900}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {side === "long" ? "▲" : "▼"}
      </text>
    </g>
  );
}

// ── Chart margins (must match AreaChart margin prop) ──────────────────────────
const MARGIN_TOP    = 20;
const MARGIN_BOTTOM = 4;
const MARGIN_RIGHT  = 72; // matches right margin; Y-axis labels rendered within this

// Fraction of chart width where the current price sits (0.65 = 65% from left).
// Phantom candles are appended on the right to push real data left.
const PRICE_ANCHOR_PCT = 0.65;

// ── Main component ────────────────────────────────────────────────────────────

export default function LiveChart({
  candles,
  livePrice,
  symbol,
  timeframe,
  isLoading,
  positions = [],
  onTimeframeChange,
}: LiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll-to-zoom: wheel up = zoom out (larger TF), wheel down = zoom in (smaller TF)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onTimeframeChange) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const idx = TIMEFRAME_STEPS.indexOf(timeframe);
      if (e.deltaY < 0) {
        // scroll up → zoom out → larger timeframe
        if (idx < TIMEFRAME_STEPS.length - 1) onTimeframeChange(TIMEFRAME_STEPS[idx + 1]);
      } else {
        // scroll down → zoom in → smaller timeframe
        if (idx > 0) onTimeframeChange(TIMEFRAME_STEPS[idx - 1]);
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [timeframe, onTimeframeChange]);

  // Track container pixel height for the live-dot overlay positioning
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setContainerHeight(e.contentRect.height);
    });
    ro.observe(el);
    // Set initial value synchronously
    setContainerHeight(el.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, []);

  // Floating tooltip state for entry dots
  const [dotTooltip, setDotTooltip] = useState<{
    x: number; y: number; label: string; color: string;
  } | null>(null);

  // Real chart data (used for domain / color / entry-dot calculations)
  const chartData = useMemo(() => {
    if (!candles.length) return [];
    const data = [...candles];
    if (livePrice !== null && livePrice > 0) {
      const last = { ...data[data.length - 1], close: livePrice };
      if (livePrice > last.high) last.high = livePrice;
      if (livePrice < last.low) last.low = livePrice;
      data[data.length - 1] = last;
    }
    return data;
  }, [candles, livePrice]);

  // Display data: real candles + phantom right-padding so the current price
  // sits at PRICE_ANCHOR_PCT instead of at the far-right edge.
  const displayData = useMemo(() => {
    if (!chartData.length) return [];
    const padCount = Math.round(chartData.length * (1 - PRICE_ANCHOR_PCT) / PRICE_ANCHOR_PCT);
    const padded = [...chartData];
    for (let i = 1; i <= padCount; i++) {
      padded.push({
        timestamp: `__pad_${i}`,
        open: 0, high: 0, low: 0,
        close: null as unknown as number,
        volume: 0,
      });
    }
    return padded;
  }, [chartData]);

  // Positions for this symbol
  const openPositions = positions.filter((p) => p.is_open && p.symbol === symbol);

  // Detect decimal places from current price
  const dec = useMemo(() => {
    const ref = livePrice ?? chartData[chartData.length - 1]?.close ?? 1;
    return detectDecimals(ref);
  }, [livePrice, chartData]);

  // Y-axis domain: include entry prices so markers stay in view
  const closePrices  = chartData.map((d) => d.close).filter(Boolean);
  const entryPrices  = openPositions.map((p) => Number(p.avg_entry_price));
  const tpPrices     = openPositions.map((p) => p.take_profit_price).filter((v): v is number => v != null && v > 0);
  const slPrices     = openPositions.map((p) => p.stop_loss_price).filter((v): v is number => v != null && v > 0);
  const livePriceArr = livePrice && livePrice > 0 ? [livePrice] : [];

  const allPrices = [...closePrices, ...entryPrices, ...tpPrices, ...slPrices, ...livePriceArr];
  const minPrice  = allPrices.length ? Math.min(...allPrices) * 0.997 : 0;
  const maxPrice  = allPrices.length ? Math.max(...allPrices) * 1.003 : 100;

  // For each open position find nearest candle timestamp
  const entryDots = useMemo(() => {
    if (!chartData.length) return [];
    return openPositions.map((pos) => {
      const openedMs = new Date(pos.opened_at).getTime();
      let nearest = chartData[0];
      let minDiff = Math.abs(new Date(chartData[0].timestamp).getTime() - openedMs);
      for (const candle of chartData) {
        const diff = Math.abs(new Date(candle.timestamp).getTime() - openedMs);
        if (diff < minDiff) { minDiff = diff; nearest = candle; }
      }
      return { pos, timestamp: nearest.timestamp };
    });
  }, [chartData, openPositions]);

  // Chart gradient direction (computed from real data, not padded)
  const isUp = chartData.length >= 2
    ? chartData[chartData.length - 1].close >= chartData[0].close
    : true;
  const strokeColor = isUp ? "#10b981" : "#ef4444";
  const gradId = `grad-${symbol}-${isUp ? "up" : "dn"}`;

  const maxTicks = 7;
  const tickInterval = displayData.length > maxTicks
    ? Math.floor(displayData.length / maxTicks)
    : 0;

  // ── Live-dot overlay Y-position ────────────────────────────────────────────
  // Compute pixel Y of the live price within the container.
  // Chart plot area = [MARGIN_TOP, containerHeight - MARGIN_BOTTOM]
  const liveDotY = useMemo(() => {
    if (!containerHeight || !livePrice || livePrice <= 0) return null;
    const plotHeight = containerHeight - MARGIN_TOP - MARGIN_BOTTOM;
    const range = maxPrice - minPrice;
    if (range <= 0) return null;
    const normalized = (livePrice - minPrice) / range;
    return MARGIN_TOP + plotHeight * (1 - normalized);
  }, [containerHeight, livePrice, minPrice, maxPrice]);

  // Handlers for dot tooltip
  const handleDotEnter = (cx: number, cy: number, label: string, color: string) => {
    setDotTooltip({ x: cx, y: cy, label, color });
  };
  const handleDotLeave = () => setDotTooltip(null);

  // ── Loading / empty states ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
          <p className="text-xs text-slate-600">Loading {symbol}…</p>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-slate-600">No chart data</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative w-full h-full">

      {/* ── Floating entry-dot tooltip ─────────────────────────────────────── */}
      {dotTooltip && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: dotTooltip.x,
            top: dotTooltip.y - 48,
            transform: "translateX(-50%)",
          }}
        >
          <div
            className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono shadow-xl border whitespace-nowrap"
            style={{
              background: "#0d1117",
              borderColor: dotTooltip.color,
              color: dotTooltip.color,
              boxShadow: `0 0 12px ${dotTooltip.color}40`,
            }}
          >
            {dotTooltip.label}
          </div>
          {/* Arrow */}
          <div
            className="w-0 h-0 mx-auto"
            style={{
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `5px solid ${dotTooltip.color}`,
            }}
          />
        </div>
      )}

      {/* ── Blinking live-price dot overlay ───────────────────────────────── */}
      {liveDotY !== null && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            right: MARGIN_RIGHT - 6,
            top: liveDotY,
            transform: "translateY(-50%)",
          }}
        >
          {/* Pulsing ring (animate-ping scales from center and fades) */}
          <span
            className="absolute inline-flex rounded-full animate-ping"
            style={{
              width: 14,
              height: 14,
              top: -3,
              left: -3,
              background: strokeColor,
              opacity: 0.45,
            }}
          />
          {/* Solid core dot */}
          <span
            className="relative inline-flex rounded-full"
            style={{
              width: 8,
              height: 8,
              background: strokeColor,
              boxShadow: `0 0 8px 2px ${strokeColor}80`,
            }}
          />
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={displayData}
          margin={{ top: MARGIN_TOP, right: MARGIN_RIGHT, left: 0, bottom: MARGIN_BOTTOM }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.18} />
              <stop offset="70%" stopColor={strokeColor} stopOpacity={0.03} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="timestamp"
            tickFormatter={(ts) =>
              typeof ts === "string" && ts.startsWith("__pad_") ? "" : formatTs(ts, timeframe)
            }
            interval={tickInterval}
            tick={{ fontSize: 10, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />

          <YAxis
            domain={[minPrice, maxPrice]}
            tickFormatter={(v: number) => fmtPrice(v, dec)}
            tick={{ fontSize: 10, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
            orientation="right"
            width={64}
            tickCount={6}
          />

          <Tooltip
            content={<CustomTooltip timeframe={timeframe} dec={dec} />}
            cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
          />

          {/* ── Live price line — subtle white/gray, solid, thin ────────── */}
          {livePrice !== null && livePrice > 0 && (
            <ReferenceLine
              y={livePrice}
              stroke="rgba(255,255,255,0.28)"
              strokeWidth={1}
              strokeOpacity={1}
              label={{
                value: fmtPrice(livePrice, dec),
                position: "right",
                fill: "rgba(255,255,255,0.55)",
                fontSize: 10,
                fontWeight: 600,
                dx: 6,
              }}
            />
          )}

          {/* ── Entry price horizontal lines — strong, solid ────────────── */}
          {openPositions.map((pos) => {
            const entry = Number(pos.avg_entry_price);
            const color = pos.side === "long" ? "#0ecb81" : "#f6465d";
            const action = pos.side === "long" ? "BUY" : "SELL";
            return (
              <ReferenceLine
                key={`eline-${pos.id}`}
                y={entry}
                stroke={color}
                strokeDasharray="6 3"
                strokeWidth={2}
                strokeOpacity={1}
                label={{
                  value: `${action} ${fmtPrice(entry, dec)}`,
                  position: "right",
                  fill: color,
                  fontSize: 10,
                  fontWeight: 700,
                  dx: 6,
                }}
              />
            );
          })}

          {/* ── Take-profit lines (emerald dashed) ────────────────────────── */}
          {openPositions
            .filter((p) => p.take_profit_price && p.take_profit_price > 0)
            .map((pos) => (
              <ReferenceLine
                key={`tp-${pos.id}`}
                y={Number(pos.take_profit_price)}
                stroke="#10b981"
                strokeDasharray="2 4"
                strokeWidth={1}
                strokeOpacity={0.55}
                label={{
                  value: `TP ${fmtPrice(Number(pos.take_profit_price), dec)}`,
                  position: "right",
                  fill: "#10b981",
                  fontSize: 9,
                  fontWeight: 600,
                  dx: 6,
                }}
              />
            ))}

          {/* ── Stop-loss lines (red dashed) ──────────────────────────────── */}
          {openPositions
            .filter((p) => p.stop_loss_price && p.stop_loss_price > 0)
            .map((pos) => (
              <ReferenceLine
                key={`sl-${pos.id}`}
                y={Number(pos.stop_loss_price)}
                stroke="#f6465d"
                strokeDasharray="2 4"
                strokeWidth={1}
                strokeOpacity={0.55}
                label={{
                  value: `SL ${fmtPrice(Number(pos.stop_loss_price), dec)}`,
                  position: "right",
                  fill: "#f6465d",
                  fontSize: 9,
                  fontWeight: 600,
                  dx: 6,
                }}
              />
            ))}

          {/* ── Price area line ───────────────────────────────────────────── */}
          <Area
            type="monotone"
            dataKey="close"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
            isAnimationActive={false}
            connectNulls={false}
          />

          {/* ── Entry point dots (rendered last = on top) ─────────────────── */}
          {entryDots.map(({ pos, timestamp }) => {
            const entry = Number(pos.avg_entry_price);
            const color = pos.side === "long" ? "#0ecb81" : "#f6465d";
            const action = pos.side === "long" ? "BUY" : "SELL";
            const label = `${action} @ ${fmtPrice(entry, dec)}`;
            return (
              <ReferenceDot
                key={`dot-${pos.id}`}
                x={timestamp}
                y={entry}
                r={0}
                shape={(shapeProps: { cx?: number; cy?: number }) => (
                  <EntryDotShape
                    cx={shapeProps.cx}
                    cy={shapeProps.cy}
                    color={color}
                    side={pos.side}
                    tooltipLabel={label}
                    onEnter={handleDotEnter}
                    onLeave={handleDotLeave}
                  />
                )}
              />
            );
          })}

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
