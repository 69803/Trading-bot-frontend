"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { FullTokenResponse, User } from "@/types";
import { Zap, TrendingUp, BarChart2, Shield, Eye, EyeOff, AlertCircle } from "lucide-react";

function Feature({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-blue-300" />
      </div>
      <span className="text-sm text-blue-100/70">{text}</span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("username", email);
      params.append("password", password);

      const tokenRes = await api.post<FullTokenResponse>("/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token, refresh_token } = tokenRes.data;
      setTokens(access_token, refresh_token);

      const userRes = await api.get<User>("/auth/me");
      setUser(userRes.data);

      router.push("/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060D18] flex">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-gradient-to-br from-blue-950/80 via-[#060D18] to-[#060D18] border-r border-white/[0.06] p-12">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">TradePaper</span>
              <p className="text-xs text-blue-400/60 leading-none">Paper Trading Platform</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Simulate strategies.<br />Master markets.
          </h2>
          <p className="text-blue-100/50 text-sm mb-10 leading-relaxed">
            A professional paper trading environment with algorithmic bots, backtesting, and real-time risk management — no real money involved.
          </p>

          <div className="space-y-4">
            <Feature icon={TrendingUp} text="Automated EMA + RSI trading bot" />
            <Feature icon={BarChart2}  text="Full strategy backtesting engine" />
            <Feature icon={Shield}    text="Configurable risk management" />
          </div>
        </div>

        <p className="text-xs text-blue-400/30">
          Paper trading only — no real money, no broker required
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">TradePaper</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-100">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to your trading account</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label-base">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="input-base"
              />
            </div>

            <div>
              <label htmlFor="password" className="label-base">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="input-base pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
