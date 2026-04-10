"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";
import { useBotTabsStore } from "@/store/botTabsStore";

export default function CryptoBotPage() {
  const router  = useRouter();
  const { addTab, hasTab } = useBotTabsStore();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [dupError, setDupError] = useState<string | null>(null);

  const handleIniciar = async () => {
    if (hasTab("cryptobot")) {
      setDupError("Ya el Bot Momentum está operando en este momento");
      setTimeout(() => setDupError(null), 4000);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/bot/activate/cryptobot");
      addTab("cryptobot");
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Error al activar el bot");
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      position: "relative",
      overflow: "hidden",
      backgroundImage: "url('/bot-cryptobot.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}>

      {/* dark vignette left side so panel reads clearly */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, rgba(13,4,20,0.80) 0%, rgba(13,4,20,0.45) 40%, transparent 70%)",
        zIndex: 1,
      }} />

      {/* ── Info panel — left side ─────────────────────────────────────── */}
      <div style={{
        position: "absolute", zIndex: 2,
        left: "4%", top: "50%", transform: "translateY(-50%)",
        width: 300,
        background: "rgba(13,4,20,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(168,85,247,0.25)",
        borderRadius: 16,
        padding: "32px 28px 28px",
        boxShadow: "0 0 36px rgba(168,85,247,0.15), 0 16px 48px rgba(0,0,0,0.6)",
      }}>

        {/* back */}
        <button onClick={() => router.back()} style={{
          background: "transparent", border: "none",
          color: "rgba(216,180,254,0.6)", fontSize: 13,
          cursor: "pointer", padding: 0, marginBottom: 24,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          ← Volver
        </button>

        {/* badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(168,85,247,0.15)",
          border: "1px solid rgba(168,85,247,0.3)",
          borderRadius: 20, padding: "4px 14px", marginBottom: 18,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#a855f7", display: "inline-block" }} />
          <span style={{ color: "#d8b4fe", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>MOMENTUM · FOREX</span>
        </div>

        <h1 style={{
          color: "#fff", fontSize: 32, fontWeight: 800,
          margin: "0 0 12px", letterSpacing: -0.3,
        }}>
          Momentum
        </h1>

        <p style={{
          color: "rgba(255,255,255,0.65)", fontSize: 14,
          lineHeight: 1.65, margin: "0 0 28px",
        }}>
          Lo que sube, sigue subiendo. Entra cuando el momentum está confirmado con Score ≥ 6/8 y deja correr la posición.
        </p>

        {/* Iniciar button */}
        <button
          onClick={handleIniciar}
          disabled={loading}
          style={{
            width: "100%", padding: "13px 0",
            background: loading
              ? "rgba(168,85,247,0.4)"
              : "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
            border: "none", borderRadius: 10,
            color: "#fff", fontSize: 16, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: 0.3,
            boxShadow: "0 4px 20px rgba(168,85,247,0.4)",
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = "brightness(1.15)"; }}
          onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
        >
          {loading ? "Activando..." : "Iniciar →"}
        </button>

        {error && (
          <p style={{ color: "#f87171", fontSize: 13, marginTop: 10, textAlign: "center" }}>
            {error}
          </p>
        )}
      </div>

      {dupError && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 100, display: "flex", alignItems: "center", gap: 10,
          background: "rgba(15,23,42,0.95)", border: "1px solid rgba(251,146,60,0.4)",
          borderRadius: 12, padding: "14px 20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          maxWidth: 380,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <p style={{ color: "#fdba74", fontSize: 13, fontWeight: 600, margin: 0 }}>{dupError}</p>
          <button onClick={() => setDupError(null)} style={{
            background: "transparent", border: "none", color: "rgba(253,186,116,0.5)",
            cursor: "pointer", fontSize: 16, padding: "0 0 0 6px", lineHeight: 1,
          }}>×</button>
        </div>
      )}
    </div>
  );
}
