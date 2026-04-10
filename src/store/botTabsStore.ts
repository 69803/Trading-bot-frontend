import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BotTab {
  id: string;
  name: string;
  color: string;
}

// Bot metadata — one source of truth
export const BOT_META: Record<string, { name: string; color: string }> = {
  trendmaster: { name: "TrendMaster", color: "#22c55e" },
  scalperx:    { name: "ScalerX",     color: "#3b82f6" },
  cryptobot:   { name: "Crypto Bot",  color: "#a855f7" },
  piphunter:   { name: "PipHunter",   color: "#fb923c" },
  safeguard:   { name: "SafeGuard",   color: "#14b8a6" },
  combo:       { name: "Master Bot",  color: "#6366f1" },
};

interface BotTabsState {
  tabs: BotTab[];
  addTab: (id: string) => { success: boolean; message?: string };
  removeTab: (id: string) => void;
  hasTab: (id: string) => boolean;
}

export const useBotTabsStore = create<BotTabsState>()(
  persist(
    (set, get) => ({
      tabs: [],

      addTab: (id: string) => {
        const meta = BOT_META[id];
        if (!meta) return { success: false, message: "Bot desconocido" };

        if (get().tabs.some((t) => t.id === id)) {
          return {
            success: false,
            message: `Ya el Bot ${meta.name} está operando en este momento`,
          };
        }

        set((state) => ({
          tabs: [...state.tabs, { id, name: meta.name, color: meta.color }],
        }));
        return { success: true };
      },

      removeTab: (id: string) => {
        set((state) => ({ tabs: state.tabs.filter((t) => t.id !== id) }));
      },

      hasTab: (id: string) => get().tabs.some((t) => t.id === id),
    }),
    { name: "bot-tabs-v1" }
  )
);
