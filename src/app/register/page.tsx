"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { FullTokenResponse, User } from "@/types";
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle2, Check, X } from "lucide-react";

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs transition-colors ${met ? "text-emerald-400" : "text-slate-600"}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {text}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isLongEnough = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  const validate = (): string | null => {
    if (!email.trim()) return "Email is required.";
    if (!isEmailValid) return "Enter a valid email address.";
    if (!isLongEnough) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const tokenRes = await api.post<FullTokenResponse>("/auth/register", { email, password });
      const { access_token, refresh_token } = tokenRes.data;
      setTokens(access_token, refresh_token);

      const userRes = await api.get<User>("/auth/me");
      setUser(userRes.data);

      router.push("/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { detail?: string } };
      };
      if (axiosErr.response?.status === 409) {
        setError("An account with this email already exists.");
      } else {
        setError(axiosErr.response?.data?.detail || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060D18] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">TradePaper</span>
        </div>

        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-100">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Start paper trading in seconds — free forever</p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="label-base">Email address</label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="input-base pr-9"
              />
              {email && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isEmailValid
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : <AlertCircle className="w-4 h-4 text-red-400/60" />
                  }
                </span>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="label-base">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
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
            {password && (
              <div className="mt-2 space-y-1 pl-1">
                <PasswordRequirement met={isLongEnough} text="At least 8 characters" />
                <PasswordRequirement met={hasUppercase} text="Contains an uppercase letter" />
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="label-base">Confirm password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
                className="input-base pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && (
              <p className={`text-xs mt-1.5 flex items-center gap-1.5 ${passwordsMatch ? "text-emerald-400" : "text-red-400/70"}`}>
                {passwordsMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {passwordsMatch ? "Passwords match" : "Passwords don't match"}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 text-sm mt-1"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-slate-700">
          Paper trading only — no real money involved
        </p>
      </div>
    </div>
  );
}
