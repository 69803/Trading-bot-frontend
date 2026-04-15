"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { RiskSettings, RiskStatus } from "@/types";
import { Card, CardSection } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/utils";
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, Save, RefreshCw,
} from "lucide-react";

function RiskMeter({ label, value, max, unit = "%", dangerThreshold = 80 }: {
  label: string; value: number; max: number; unit?: string; dangerThreshold?: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const isDanger = pct >= dangerThreshold;
  const isWarning = pct >= dangerThreshold * 0.7 && pct < dangerThreshold;
  const color = isDanger ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500";
  const textColor = isDanger ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{label}</span>
        <span className={`text-sm font-mono font-semibold tabular-nums ${textColor}`}>
          {Number(value).toFixed(2)}{unit}
        </span>
      </div>
      <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[10px] text-slate-700">0</span>
        <span className="text-[10px] text-slate-700">{max}{unit}</span>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, min = 0, max = 100, step = 0.1, unit = "%", hint }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; unit?: string; hint?: string;
}) {
  return (
    <div>
      <label className="label-base">
        {label}
        {unit && <span className="ml-1 text-slate-700 font-normal">({unit})</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min} max={max} step={step}
        className="input-base"
      />
      {hint && <p className="text-xs text-slate-700 mt-1">{hint}</p>}
    </div>
  );
}

export default function RiskPage() {
  const qc = useQueryClient();
  const [settings, setSettings] = useState<Partial<RiskSettings>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: riskSettings, isLoading: settingsLoading } = useQuery<RiskSettings>({
    queryKey: ["risk-settings"],
    queryFn: async () => (await api.get("/risk/settings")).data,
  });

  const { data: riskStatus } = useQuery<RiskStatus>({
    queryKey: ["risk-status"],
    queryFn: async () => (await api.get("/risk/status")).data,
    refetchInterval: 10000,
    staleTime: 0,
  });

  useEffect(() => {
    // Only populate on first load — never overwrite changes the user has already made
    if (riskSettings && Object.keys(settings).length === 0) {
      setSettings(riskSettings);
    }
  }, [riskSettings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { id, updated_at, ...rest } = settings as RiskSettings;
      return api.put("/risk/settings", rest);
    },
    onSuccess: () => {
      setSaveSuccess(true);
      setSaveError(null);
      qc.invalidateQueries({ queryKey: ["risk-settings"] });
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } };
      setSaveError(e.response?.data?.detail || "Failed to save settings");
    },
  });

  const handleChange = (key: keyof RiskSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const isHalted = riskStatus?.trading_halted ?? false;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Risk Management</h1>
        <p className="text-sm text-slate-600 mt-0.5">Configure exposure limits and monitor live risk</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Settings Form */}
        <div className="xl:col-span-2">
          <Card title="Risk Settings" subtitle="Define your maximum exposure parameters">
            {settingsLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  <CardSection label="Position Sizing">
                    <NumberInput
                      label="Max Position Size" unit="%"
                      value={(settings.max_position_size_pct as number) ?? 0}
                      onChange={(v) => handleChange("max_position_size_pct", v)}
                      min={0.1} max={100} step={0.5}
                      hint="Maximum % of equity per position"
                    />
                    <NumberInput
                      label="Max Open Positions" unit="count"
                      value={(settings.max_open_positions as number) ?? 0}
                      onChange={(v) => handleChange("max_open_positions", v)}
                      min={1} max={50} step={1}
                      hint="Concurrent open position limit"
                    />
                  </CardSection>

                  <CardSection label="Loss Limits">
                    <NumberInput
                      label="Max Daily Loss" unit="%"
                      value={(settings.max_daily_loss_pct as number) ?? 0}
                      onChange={(v) => handleChange("max_daily_loss_pct", v)}
                      min={0.1} max={100} step={0.1}
                      hint="Halts trading if daily P&L exceeds this"
                    />
                    <NumberInput
                      label="Max Drawdown" unit="%"
                      value={(settings.max_drawdown_pct as number) ?? 0}
                      onChange={(v) => handleChange("max_drawdown_pct", v)}
                      min={0.1} max={100} step={0.5}
                      hint="Max portfolio drawdown before halt"
                    />
                  </CardSection>

                  <CardSection label="Per-Trade Exits">
                    <NumberInput
                      label="Stop Loss" unit="%"
                      value={(settings.stop_loss_pct as number) ?? 0}
                      onChange={(v) => handleChange("stop_loss_pct", v)}
                      min={0.01} max={50} step={0.1}
                      hint="Automatic stop-loss per position"
                    />
                    <NumberInput
                      label="Take Profit" unit="%"
                      value={(settings.take_profit_pct as number) ?? 0}
                      onChange={(v) => handleChange("take_profit_pct", v)}
                      min={0.01} max={200} step={0.1}
                      hint="Automatic take-profit per position"
                    />
                  </CardSection>
                </div>

                {saveSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400">Risk settings saved successfully</span>
                  </div>
                )}
                {saveError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/[0.07] border border-red-500/20 rounded-xl">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">{saveError}</span>
                  </div>
                )}

                <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} size="md">
                  <Save className="w-4 h-4" />
                  Save Risk Settings
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Live Status */}
        <div className="xl:col-span-1 space-y-4">
          <Card
            title="Live Status"
            subtitle="Updates every 10s"
            headerAction={<RefreshCw className="w-3 h-3 text-slate-700" />}
          >
            {!riskStatus ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <div className="space-y-5">
                {/* Circuit breaker */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isHalted
                    ? "bg-red-500/[0.07] border-red-500/20"
                    : "bg-emerald-500/[0.07] border-emerald-500/20"
                }`}>
                  {isHalted
                    ? <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    : <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className={`text-sm font-semibold ${isHalted ? "text-red-400" : "text-emerald-400"}`}>
                      {isHalted ? "Trading Halted" : "Trading Active"}
                    </p>
                    {riskStatus.halt_reason && (
                      <p className="text-xs text-red-300/70 mt-0.5">{riskStatus.halt_reason}</p>
                    )}
                    {!isHalted && (
                      <p className="text-xs text-emerald-400/60 mt-0.5">Circuit breaker — OK</p>
                    )}
                  </div>
                </div>

                {/* Meters */}
                <div className="space-y-4">
                  <RiskMeter
                    label="Current Drawdown"
                    value={riskStatus.current_drawdown_pct}
                    max={riskSettings?.max_drawdown_pct ?? 20}
                    unit="%"
                  />
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Daily P&L</span>
                      <span className={`text-sm font-semibold font-mono tabular-nums ${riskStatus.daily_pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {riskStatus.daily_pnl >= 0 ? "+" : ""}{formatCurrency(riskStatus.daily_pnl)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-700">
                      <span>vs daily limit</span>
                      <span className={riskStatus.daily_pnl_pct >= 0 ? "text-emerald-400/60" : "text-red-400/60"}>
                        {Number(riskStatus.daily_pnl_pct) >= 0 ? "+" : ""}{Number(riskStatus.daily_pnl_pct).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Counts */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">Open Positions</p>
                    <p className="text-2xl font-bold tabular-nums text-slate-100">{riskStatus.open_position_count}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">of {riskSettings?.max_open_positions ?? "—"} max</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">Circuit Breaker</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Shield className={`w-5 h-5 ${isHalted ? "text-red-400" : "text-emerald-400"}`} />
                      <span className={`text-sm font-bold ${isHalted ? "text-red-400" : "text-emerald-400"}`}>
                        {isHalted ? "HALT" : "OK"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                {riskStatus.current_drawdown_pct > 0 && riskSettings &&
                  riskStatus.current_drawdown_pct / riskSettings.max_drawdown_pct > 0.7 && (
                    <div className="flex items-start gap-2.5 p-3 bg-amber-500/[0.07] border border-amber-500/20 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-400/80">
                        Drawdown approaching limit. Consider reducing position sizes.
                      </p>
                    </div>
                  )}
              </div>
            )}
          </Card>

          {/* Current limits summary */}
          {riskSettings && (
            <Card title="Current Limits">
              <div className="space-y-0">
                {[
                  ["Max Position", `${riskSettings.max_position_size_pct}% equity`],
                  ["Max Daily Loss", `${riskSettings.max_daily_loss_pct}%`],
                  ["Max Drawdown", `${riskSettings.max_drawdown_pct}%`],
                  ["Stop Loss", `${riskSettings.stop_loss_pct}%`],
                  ["Take Profit", `${riskSettings.take_profit_pct}%`],
                  ["Max Positions", `${riskSettings.max_open_positions}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-xs font-mono font-medium text-slate-300 tabular-nums">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
