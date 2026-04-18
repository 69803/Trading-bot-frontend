"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { CustomBotListItem } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Plus, Bot, Play, Square, Trash2, Settings, Copy,
  TrendingUp, Clock, Zap,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useBotTabsStore } from "@/store/botTabsStore";

function EmptyBots({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="w-20 h-20 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
        <Bot className="w-9 h-9 text-blue-400" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-slate-200">No tienes bots personalizados</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Crea tu primer bot automático personalizado y empieza a operar con tu propia estrategia.
        </p>
      </div>
      <Button variant="primary" onClick={onNew}>
        <Plus className="w-4 h-4" />
        Crear mi primer bot
      </Button>
    </div>
  );
}

function BotCard({
  bot,
  onStart,
  onStop,
  onDelete,
  onDuplicate,
  starting,
  stopping,
}: {
  bot: CustomBotListItem;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  starting: boolean;
  stopping: boolean;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="group relative bg-[#0D1626] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.14] transition-all duration-200 cursor-pointer"
      onClick={() => router.push(`/my-bots/${bot.id}`)}
      style={{ borderLeft: `3px solid ${bot.color}` }}
    >
      {/* Running pulse */}
      {bot.is_running && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] font-semibold text-emerald-400">ACTIVO</span>
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
          style={{ background: bot.color + "33", border: `1.5px solid ${bot.color}66` }}
        >
          {bot.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 pr-16">
          <h3 className="font-semibold text-slate-100 truncate text-sm">{bot.name}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {bot.cycles_run > 0 ? `${bot.cycles_run} ciclos ejecutados` : "Sin ciclos aún"}
          </p>
        </div>
      </div>

      {bot.last_log && (
        <p className="text-[11px] text-slate-600 font-mono truncate mb-3 px-2 py-1 bg-white/[0.02] rounded-lg border border-white/[0.04]">
          {bot.last_log}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-600 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(bot.created_at)}
        </span>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onDuplicate}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
            title="Duplicar"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => router.push(`/my-bots/${bot.id}`)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-500/[0.08] transition-all"
            title="Configurar"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {bot.is_running ? (
            <button
              onClick={onStop}
              disabled={stopping}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-semibold hover:bg-red-500/20 transition-all disabled:opacity-40"
            >
              <Square className="w-3 h-3" />
              Detener
            </button>
          ) : (
            <button
              onClick={onStart}
              disabled={starting}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/20 transition-all disabled:opacity-40"
            >
              <Play className="w-3 h-3" />
              Iniciar
            </button>
          )}

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onDelete}
                className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-500 transition-colors"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 bg-white/[0.06] text-slate-400 text-[10px] font-bold rounded-lg hover:bg-white/[0.12] transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyBotsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { addTab } = useBotTabsStore();

  const { data: bots = [], isLoading } = useQuery<CustomBotListItem[]>({
    queryKey: ["custom-bots"],
    queryFn: async () => (await api.get("/custom-bots")).data,
    refetchInterval: 15_000,
  });

  const [startingId, setStartingId] = useState<string | null>(null);
  const [stoppingId, setStoppingId] = useState<string | null>(null);

  const startMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/custom-bots/${id}/start`)).data,
    onSuccess: (_data, id) => {
      const bot = bots.find((b) => b.id === id);
      if (bot) addTab(bot.bot_id, { name: bot.name, color: bot.color });
      qc.invalidateQueries({ queryKey: ["custom-bots"] });
      setStartingId(null);
    },
    onError: () => setStartingId(null),
  });

  const stopMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/custom-bots/${id}/stop`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-bots"] });
      setStoppingId(null);
    },
    onError: () => setStoppingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/custom-bots/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-bots"] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/custom-bots/${id}/duplicate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-bots"] }),
  });

  const running = bots.filter((b) => b.is_running).length;
  const total = bots.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            Tus Bots
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Bots automáticos personalizados creados por ti
          </p>
        </div>
        <Button variant="primary" onClick={() => router.push("/my-bots/new")}>
          <Plus className="w-4 h-4" />
          Crear bot
        </Button>
      </div>

      {/* Stats bar */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total bots", value: total, icon: Bot, color: "blue" },
            { label: "Activos ahora", value: running, icon: Play, color: "emerald" },
            { label: "Inactivos", value: total - running, icon: Square, color: "slate" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#0D1626] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${color}-500/10`}>
                <Icon className={`w-4 h-4 text-${color}-400`} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-100 leading-none">{value}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/[0.02] border border-white/[0.04] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : total === 0 ? (
        <Card>
          <EmptyBots onNew={() => router.push("/my-bots/new")} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              starting={startingId === bot.id}
              stopping={stoppingId === bot.id}
              onStart={() => { setStartingId(bot.id); startMutation.mutate(bot.id); }}
              onStop={() => { setStoppingId(bot.id); stopMutation.mutate(bot.id); }}
              onDelete={() => deleteMutation.mutate(bot.id)}
              onDuplicate={() => duplicateMutation.mutate(bot.id)}
            />
          ))}

          {/* Add new */}
          <button
            onClick={() => router.push("/my-bots/new")}
            className="h-full min-h-[120px] bg-transparent border-2 border-dashed border-white/[0.08] rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-slate-300 hover:border-white/[0.18] hover:bg-white/[0.02] transition-all duration-200 group"
          >
            <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Crear nuevo bot</span>
          </button>
        </div>
      )}
    </div>
  );
}
