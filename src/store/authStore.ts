import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

export type AccountMode = "paper" | "live";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  accountMode: AccountMode;
  setTokens: (access: string, refresh: string) => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setAccountMode: (mode: AccountMode) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      accountMode: "paper",
      setTokens: (access, refresh) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", access);
          localStorage.setItem("refresh_token", refresh);
        }
        set({ token: access, refreshToken: refresh });
      },
      setToken: (token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token);
        }
        set({ token });
      },
      setUser: (user) => set({ user }),
      setAccountMode: (mode: AccountMode) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("account_mode", mode);
        }
        set({ accountMode: mode });
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        set({ token: null, refreshToken: null, user: null, accountMode: "paper" });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        accountMode: state.accountMode,
      }),
    }
  )
);
