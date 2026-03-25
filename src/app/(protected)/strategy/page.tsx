"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ASSET_CLASSES } from "@/config/constants";
import {
  Play,
  Square,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Clock,
  TrendingUp,
  Zap,
  History,
  X,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface BotConfig {
  ema_fast: number;
  ema_slow: number;
  rsi_period: number;
  rsi_overbought: number;
  rsi_oversold: number;
  symbols: string[];
  asset_classes: string[];
  investment_amount: number;
  run_interval_seconds: number;
  per_symbol_max_positions: number;
  allow_buy: boolean;
  allow_sell: boolean;
  cooldown_seconds: number;
  stop_loss_pct: number;
  take_profit_pct: number;
  max_open_positions: number;
  max_daily_loss_pct: number;
  max_position_size_pct: number;
}

interface BotStatus {
  is_running: boolean;
  started_at: string | null;
  last_run_at: string | null;
  next_run_at: string | null;
  cycles_run: number;
  open_positions_count: number;
  monitored_symbols: string[];
  last_log: string | null;
  last_error: string | null;
  last_signal: {
    symbol: string;
    signal_type: string;
    triggered_at: string;
    acted_on: boolean;
    confidence: number;
  } | null;
}

interface BotLog {
  timestamp: string;
  message: string;
  symbol: string | null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

function NumInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-slate-500">{label}</label>
        {suffix && <span className="text-[10px] text-slate-700">{suffix}</span>}
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500/40 transition-colors"
      />
    </div>
  );
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  valueColor = "text-blue-400",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  valueColor?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-slate-500">{label}</label>
        <span className={`text-xs font-mono font-semibold tabular-nums ${valueColor}`}>
          {value}
        </span>
      </div>
      <div className="relative h-1.5 bg-white/[0.06] rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-blue-500/60 rounded-full"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[10px] text-slate-700">{min}</span>
        <span className="text-[10px] text-slate-700">{max}</span>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-white/[0.06] border border-white/[0.08] rounded-full peer peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
      </div>
      <div>
        <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
          {label}
        </span>
        {description && <p className="text-xs text-slate-600 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function StatusRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-slate-600 shrink-0">{label}</span>
      <span className={`text-xs text-slate-300 text-right ${mono ? "font-mono" : ""}`}>{value ?? "—"}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StrategyPage() {
  const qc = useQueryClient();
  const [config, setConfig] = useState<Partial<BotConfig>>({});
  const [saved, setSaved] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"symbols" | "execution" | "strategy" | "risk">(
    "symbols"
  );
  const [showLogsModal, setShowLogsModal] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: botStatus, refetch: refetchStatus } = useQuery<BotStatus>({
    queryKey: ["bot-status"],
    queryFn: async () => (await api.get("/bot/status")).data,
    refetchInterval: 5000,
  });

  const { data: botConfig } = useQuery<BotConfig>({
    queryKey: ["bot-config"],
    queryFn: async () => (await api.get("/bot/config")).data,
  });

  const { data: logsData } = useQuery<{ logs: BotLog[] }>({
    queryKey: ["bot-logs"],
    queryFn: async () => (await api.get("/bot/logs?limit=30")).data,
    refetchInterval: 10000,
  });

  const { data: logsHistoryData, isLoading: logsHistoryLoading } = useQuery<{ logs: BotLog[] }>({
    queryKey: ["bot-logs-history"],
    queryFn: async () => (await api.get("/bot/logs?limit=200")).data,
    enabled: showLogsModal,
    refetchInterval: showLogsModal ? 10000 : false,
  });

  useEffect(() => {
    if (botConfig) {
      setConfig({
        ...botConfig,
        rsi_overbought: Number(botConfig.rsi_overbought),
        rsi_oversold: Number(botConfig.rsi_oversold),
        investment_amount: Number(botConfig.investment_amount),
        stop_loss_pct: Number(botConfig.stop_loss_pct),
        take_profit_pct: Number(botConfig.take_profit_pct),
        max_daily_loss_pct: Number(botConfig.max_daily_loss_pct),
        max_position_size_pct: Number(botConfig.max_position_size_pct),
      });
    }
  }, [botConfig]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const startMutation = useMutation({
    mutationFn: async () => {
      setStartError(null);
      const payload = {
        ...config,
        stop_loss_pct: config.stop_loss_pct,
        take_profit_pct: config.take_profit_pct,
        max_daily_loss_pct: config.max_daily_loss_pct,
        max_position_size_pct: config.max_position_size_pct,
      };
      console.log("[StartBot:1] mutationFn entered. config.symbols =", config.symbols);
      console.log("[StartBot:2] Full payload being sent to PUT /bot/config:", JSON.stringify(payload));

      let saveResp;
      try {
        saveResp = await api.put("/bot/config", payload);
        console.log("[StartBot:3] PUT /bot/config succeeded. Status:", saveResp.status, "Body:", saveResp.data);
      } catch (saveErr: unknown) {
        const axiosErr = saveErr as { response?: { status: number; data: unknown }; message?: string };
        const detail = axiosErr.response?.data ?? axiosErr.message ?? String(saveErr);
        console.error("[StartBot:3-FAIL] PUT /bot/config FAILED. Status:", axiosErr.response?.status, "Body:", detail);
        throw new Error(`Save config failed (${axiosErr.response?.status ?? "network"}): ${JSON.stringify(detail)}`);
      }

      console.log("[StartBot:4] Sending POST /bot/start");
      let startResp;
      try {
        startResp = await api.post("/bot/start");
        console.log("[StartBot:5] POST /bot/start succeeded. Status:", startResp.status, "Body:", startResp.data);
      } catch (startErr: unknown) {
        const axiosErr = startErr as { response?: { status: number; data: unknown }; message?: string };
        const detail = axiosErr.response?.data ?? axiosErr.message ?? String(startErr);
        console.error("[StartBot:5-FAIL] POST /bot/start FAILED. Status:", axiosErr.response?.status, "Body:", detail);
        throw new Error(`Start bot failed (${axiosErr.response?.status ?? "network"}): ${JSON.stringify(detail)}`);
      }

      return startResp.data;
    },
    onSuccess: (data) => {
      console.log("[StartBot:6] onSuccess. Bot started:", data);
      setStartError(null);
      qc.invalidateQueries({ queryKey: ["bot-config"] });
      qc.invalidateQueries({ queryKey: ["bot-status"] });
      refetchStatus();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[StartBot:onError]", msg);
      setStartError(msg);
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => (await api.post("/bot/stop")).data,
    onSuccess: () => refetchStatus(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...config,
        // convert % fields from UI (e.g. 3 → 0.03 for backend)
        stop_loss_pct: config.stop_loss_pct,
        take_profit_pct: config.take_profit_pct,
        max_daily_loss_pct: config.max_daily_loss_pct,
        max_position_size_pct: config.max_position_size_pct,
      };
      return (await api.put("/bot/config", payload)).data;
    },
    onSuccess: () => {
      console.log("[SaveConfig] Saved successfully. Symbols:", config.symbols);
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["bot-config"] });
      qc.invalidateQueries({ queryKey: ["bot-status"] });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => {
      console.error("[SaveConfig] Failed:", err);
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const set = <K extends keyof BotConfig>(key: K, val: BotConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: val }));

  const toggleSymbol = (sym: string) => {
    const current = (config.symbols ?? []) as string[];
    const next = current.includes(sym) ? current.filter((s) => s !== sym) : [...current, sym];
    console.log("[SymbolToggle]", sym, "→ selected symbols:", next);
    set("symbols", next);
  };

  const toggleAssetClass = (cls: string) => {
    const current = (config.asset_classes ?? []) as string[];
    const enabled = current.includes(cls);
    if (enabled) {
      // Remove asset class and its symbols from selection
      const clsSymbols = ASSET_CLASSES[cls]?.symbols ?? [];
      set("asset_classes", current.filter((c) => c !== cls));
      set(
        "symbols",
        (config.symbols ?? []).filter((s) => !clsSymbols.includes(s))
      );
    } else {
      set("asset_classes", [...current, cls]);
    }
  };

  const enabledClasses = (config.asset_classes ?? []) as string[];
  const selectedSymbols = (config.symbols ?? []) as string[];
  const logs = logsData?.logs ?? [];

  const tabs = [
    { id: "symbols", label: "Symbols" },
    { id: "execution", label: "Execution" },
    { id: "strategy", label: "Strategy" },
    { id: "risk", label: "Risk" },
  ] as const;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Bot Control Panel</h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Configure and control your automated trading bot
        </p>
      </div>

      {/* ── Bot Control Bar ── */}
      <div className="flex flex-col gap-3 px-5 py-4 bg-[#0d1117] border border-[#1e2329] rounded-xl">
        {startError && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-400 font-mono break-all">{startError}</p>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              botStatus?.is_running
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                : "bg-slate-600"
            }`}
          />
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {botStatus?.is_running ? "Bot is running" : "Bot is stopped"}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {selectedSymbols.length
                ? `Monitoring: ${selectedSymbols.join(", ")}`
                : "No symbols selected"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/[0.05] border border-white/[0.1] text-slate-300 hover:bg-white/[0.08] transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save Config
          </button>
          {botStatus?.is_running ? (
            <button
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5" />
              Stop Bot
            </button>
          ) : (
            <button
              onClick={() => {
                console.log("[StartBot:CLICK] Button clicked. selectedSymbols:", selectedSymbols, "isPending:", startMutation.isPending);
                startMutation.mutate();
              }}
              disabled={startMutation.isPending || selectedSymbols.length === 0}
              title={selectedSymbols.length === 0 ? "Select symbols first" : undefined}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5" />
              Start Bot
            </button>
          )}
        </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* ── LEFT: Config Panel ── */}
        <div className="xl:col-span-2 bg-[#0d1117] border border-[#1e2329] rounded-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#1e2329]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-400 border-b-2 border-blue-500 -mb-px"
                    : "text-slate-600 hover:text-slate-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-5 overflow-y-auto max-h-[600px]">
            {/* ── Tab: Symbols ── */}
            {activeTab === "symbols" && (
              <div className="space-y-5">
                <div>
                  <SectionTitle>Asset Classes</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ASSET_CLASSES).map(([cls, { label }]) => {
                      const active = enabledClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          onClick={() => toggleAssetClass(cls)}
                          className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all text-left ${
                            active
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                              : "bg-transparent border-white/[0.08] text-slate-500 hover:border-white/[0.15] hover:text-slate-300"
                          }`}
                        >
                          <span className="block">{label}</span>
                          <span className="text-[10px] font-normal opacity-60">
                            {ASSET_CLASSES[cls].symbols.length} symbols
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {enabledClasses.map((cls) => {
                  const assetClass = ASSET_CLASSES[cls];
                  if (!assetClass) return null;
                  return (
                    <div key={cls}>
                      <SectionTitle>{assetClass.label}</SectionTitle>
                      <div className="grid grid-cols-2 gap-1.5">
                        {assetClass.symbols.map((sym) => {
                          const selected = selectedSymbols.includes(sym);
                          return (
                            <button
                              key={sym}
                              onClick={() => toggleSymbol(sym)}
                              className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold border transition-all ${
                                selected
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  : "bg-transparent border-white/[0.06] text-slate-600 hover:border-white/[0.14] hover:text-slate-400"
                              }`}
                            >
                              {sym}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {enabledClasses.length === 0 && (
                  <p className="text-xs text-slate-700 text-center py-4">
                    Enable an asset class above to select symbols
                  </p>
                )}

                <div className="pt-2 border-t border-white/[0.05]">
                  <SectionTitle>
                    Selected ({selectedSymbols.length})
                  </SectionTitle>
                  {selectedSymbols.length === 0 ? (
                    <p className="text-xs text-slate-700 py-1">
                      Click symbols above to add them
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSymbols.map((sym) => (
                        <button
                          key={sym}
                          onClick={() => toggleSymbol(sym)}
                          title={`Remove ${sym}`}
                          className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono rounded-md hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all group"
                        >
                          {sym}
                          <span className="opacity-50 group-hover:opacity-100 text-[10px] leading-none">×</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab: Execution ── */}
            {activeTab === "execution" && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <SectionTitle>Execution Settings</SectionTitle>
                  <NumInput
                    label="Investment per trade ($)"
                    value={config.investment_amount ?? 100}
                    onChange={(v) => set("investment_amount", v)}
                    min={10}
                    step={10}
                  />
                  <NumInput
                    label="Run interval"
                    value={config.run_interval_seconds ?? 60}
                    onChange={(v) => set("run_interval_seconds", v)}
                    min={10}
                    suffix="seconds"
                  />
                  <NumInput
                    label="Max total open positions"
                    value={config.max_open_positions ?? 10}
                    onChange={(v) => set("max_open_positions", v)}
                    min={1}
                    max={50}
                  />
                  <NumInput
                    label="Max positions per symbol"
                    value={config.per_symbol_max_positions ?? 1}
                    onChange={(v) => set("per_symbol_max_positions", v)}
                    min={1}
                    max={10}
                  />
                  <NumInput
                    label="Cooldown between trades"
                    value={config.cooldown_seconds ?? 0}
                    onChange={(v) => set("cooldown_seconds", v)}
                    min={0}
                    suffix="seconds"
                  />
                </div>

                <div className="border-t border-white/[0.05] pt-4 space-y-4">
                  <SectionTitle>Trade Direction</SectionTitle>
                  <Toggle
                    label="Allow BUY trades"
                    description="Bot can open long positions"
                    checked={config.allow_buy ?? true}
                    onChange={(v) => set("allow_buy", v)}
                  />
                  <Toggle
                    label="Allow SELL trades"
                    description="Bot can open short positions"
                    checked={config.allow_sell ?? true}
                    onChange={(v) => set("allow_sell", v)}
                  />
                </div>
              </div>
            )}

            {/* ── Tab: Strategy ── */}
            {activeTab === "strategy" && (
              <div className="space-y-5">
                <div className="space-y-4">
                  <SectionTitle>EMA Periods</SectionTitle>
                  <SliderInput
                    label="Fast EMA"
                    value={config.ema_fast ?? 9}
                    onChange={(v) => set("ema_fast", v)}
                    min={3}
                    max={50}
                  />
                  <SliderInput
                    label="Slow EMA"
                    value={config.ema_slow ?? 21}
                    onChange={(v) => set("ema_slow", v)}
                    min={10}
                    max={200}
                  />
                </div>

                <div className="border-t border-white/[0.05] pt-4 space-y-4">
                  <SectionTitle>RSI Settings</SectionTitle>
                  <SliderInput
                    label="RSI Period"
                    value={config.rsi_period ?? 14}
                    onChange={(v) => set("rsi_period", v)}
                    min={3}
                    max={50}
                  />
                  <SliderInput
                    label="Overbought Level"
                    value={config.rsi_overbought ?? 70}
                    onChange={(v) => set("rsi_overbought", v)}
                    min={60}
                    max={90}
                    valueColor="text-red-400"
                  />
                  <SliderInput
                    label="Oversold Level"
                    value={config.rsi_oversold ?? 30}
                    onChange={(v) => set("rsi_oversold", v)}
                    min={10}
                    max={40}
                    valueColor="text-emerald-400"
                  />
                </div>
              </div>
            )}

            {/* ── Tab: Risk ── */}
            {activeTab === "risk" && (
              <div className="space-y-5">
                <div className="space-y-4">
                  <SectionTitle>Position Risk</SectionTitle>
                  <SliderInput
                    label="Stop Loss %"
                    value={Math.round((config.stop_loss_pct ?? 0.03) * 100)}
                    onChange={(v) => set("stop_loss_pct", v / 100)}
                    min={1}
                    max={20}
                    valueColor="text-red-400"
                  />
                  <SliderInput
                    label="Take Profit %"
                    value={Math.round((config.take_profit_pct ?? 0.06) * 100)}
                    onChange={(v) => set("take_profit_pct", v / 100)}
                    min={1}
                    max={50}
                    valueColor="text-emerald-400"
                  />
                </div>

                <div className="border-t border-white/[0.05] pt-4 space-y-4">
                  <SectionTitle>Portfolio Risk</SectionTitle>
                  <SliderInput
                    label="Max Daily Loss % — auto-stops bot"
                    value={Math.round((config.max_daily_loss_pct ?? 0.02) * 100)}
                    onChange={(v) => set("max_daily_loss_pct", v / 100)}
                    min={1}
                    max={20}
                    valueColor="text-amber-400"
                  />
                  <SliderInput
                    label="Max Position Size % of balance"
                    value={Math.round((config.max_position_size_pct ?? 0.05) * 100)}
                    onChange={(v) => set("max_position_size_pct", v / 100)}
                    min={1}
                    max={50}
                    valueColor="text-blue-400"
                  />
                </div>

                <div className="border-t border-white/[0.05] pt-4 space-y-3">
                  <SectionTitle>Trade Limits</SectionTitle>
                  <NumInput
                    label="Max open positions"
                    value={config.max_open_positions ?? 10}
                    onChange={(v) => set("max_open_positions", v)}
                    min={1}
                    max={50}
                  />
                  <NumInput
                    label="Cooldown between trades"
                    value={config.cooldown_seconds ?? 0}
                    onChange={(v) => set("cooldown_seconds", v)}
                    min={0}
                    suffix="seconds"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Status + Logs ── */}
        <div className="xl:col-span-3 space-y-5">
          {/* ── Status Card ── */}
          <div className="bg-[#0d1117] border border-[#1e2329] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-300">Live Status</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                <RefreshCw className="w-3 h-3" />
                <span>5s</span>
              </div>
            </div>

            {/* Running banner */}
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-4 ${
                botStatus?.is_running
                  ? "bg-emerald-500/[0.07] border border-emerald-500/20"
                  : "bg-white/[0.03] border border-white/[0.06]"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  botStatus?.is_running ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                }`}
              />
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold ${
                    botStatus?.is_running ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  {botStatus?.is_running ? "Bot is running" : "Bot is stopped"}
                </p>
                {botStatus?.cycles_run != null && (
                  <p className="text-xs text-slate-700 mt-0.5">
                    {botStatus.cycles_run} cycles completed
                  </p>
                )}
              </div>
              {botStatus?.open_positions_count != null && (
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-200">
                    {botStatus.open_positions_count}
                  </p>
                  <p className="text-[10px] text-slate-600">open positions</p>
                </div>
              )}
            </div>

            <div className="space-y-0">
              <StatusRow
                label="Last run"
                value={botStatus?.last_run_at ? formatDate(botStatus.last_run_at) : null}
              />
              <StatusRow
                label="Next run"
                value={botStatus?.next_run_at ? formatDate(botStatus.next_run_at) : null}
              />
              <StatusRow
                label="Monitored symbols"
                value={
                  botStatus?.monitored_symbols?.length ? (
                    <span className="flex flex-wrap justify-end gap-1">
                      {botStatus.monitored_symbols.map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-mono rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </span>
                  ) : (
                    "None selected"
                  )
                }
              />
              <div className="flex items-start justify-between gap-3 py-2 border-b border-white/[0.04]">
                <span className="text-xs text-slate-600 shrink-0">Last log</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-xs text-slate-300 text-right truncate max-w-[200px]"
                    title={botStatus?.last_log ?? ""}
                  >
                    {botStatus?.last_log ?? "—"}
                  </span>
                  <button
                    onClick={() => setShowLogsModal(true)}
                    className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] transition-colors text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    <History className="w-3 h-3" />
                    History
                  </button>
                </div>
              </div>
              {botStatus?.last_error && (
                <StatusRow
                  label="Last error"
                  value={
                    <span className="text-red-400">{botStatus.last_error}</span>
                  }
                />
              )}
              {botStatus?.last_signal && (
                <StatusRow
                  label="Last signal"
                  value={
                    <span className="flex items-center gap-1.5 justify-end">
                      <span className="font-mono text-slate-400">
                        {botStatus.last_signal.symbol}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          botStatus.last_signal.signal_type === "buy"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : botStatus.last_signal.signal_type === "sell"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {botStatus.last_signal.signal_type.toUpperCase()}
                      </span>
                      {botStatus.last_signal.acted_on && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      )}
                    </span>
                  }
                />
              )}
            </div>
          </div>

          {/* ── Bot Logs ── */}
          <div className="bg-[#0d1117] border border-[#1e2329] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2329]">
              <p className="text-sm font-semibold text-slate-300">Recent Activity</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                <RefreshCw className="w-3 h-3" />
                <span>10s</span>
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Activity className="w-8 h-8 text-slate-800" />
                <p className="text-sm text-slate-700">No activity yet</p>
                <p className="text-xs text-slate-800">Start the bot to see signals here</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.03]">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                    <span className="shrink-0 text-[10px] font-mono text-slate-600 pt-px whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono break-all leading-relaxed">
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Log History Modal ── */}
      {showLogsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLogsModal(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-4xl max-h-[80vh] flex flex-col bg-[#0d1117] border border-[#1e2329] rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2329] shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-300">Log History</p>
                {logsHistoryData?.logs && (
                  <span className="px-1.5 py-0.5 bg-white/[0.05] text-slate-600 text-[10px] rounded font-mono">
                    {logsHistoryData.logs.length} entries
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                className="p-1 rounded hover:bg-white/[0.06] text-slate-600 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Last log full text */}
            {botStatus?.last_log && (
              <div className="px-5 py-3 border-b border-[#1e2329] bg-white/[0.02] shrink-0">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-1">Last log</p>
                <p className="text-xs text-slate-300 font-mono break-all">{botStatus.last_log}</p>
              </div>
            )}

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {logsHistoryLoading ? (
                <div className="flex items-center justify-center py-16 gap-2 text-slate-700">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading logs…</span>
                </div>
              ) : !logsHistoryData?.logs?.length ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Activity className="w-8 h-8 text-slate-800" />
                  <p className="text-sm text-slate-700">No logs yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.03]">
                  {logsHistoryData.logs.map((log, i) => (
                    <div key={i} className="flex gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                      <span className="shrink-0 text-[10px] font-mono text-slate-600 pt-px whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </span>
                      <span className="text-xs text-slate-400 font-mono break-all leading-relaxed">
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
