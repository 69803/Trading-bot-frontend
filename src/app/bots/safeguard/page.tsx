"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";

export default function SafeGuardPage() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleIniciar = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/bot/activate/safeguard");
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
      backgroundImage: "url('/bot-safeguard.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}>

      {/* dark vignette left side so panel reads clearly */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, rgba(2,10,20,0.82) 0%, rgba(2,10,20,0.45) 40%, transparent 70%)",
        zIndex: 1,
      }} />

      {/* ── Info panel — left side ─────────────────────────────────────── */}
      <div style={{
        position: "absolute", zIndex: 2,
        left: "4%", top: "50%", transform: "translateY(-50%)",
        width: 300,
        background: "rgba(2,10,20,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(20,184,166,0.25)",
        borderRadius: 16,
        padding: "32px 28px 28px",
        boxShadow: "0 0 36px rgba(20,184,166,0.15), 0 16px 48px rgba(0,0,0,0.6)",
      }}>

        {/* back */}
        <button onClick={() => router.back()} style={{
          background: "transparent", border: "none",
          color: "rgba(94,234,212,0.6)", fontSize: 13,
          cursor: "pointer", padding: 0, marginBottom: 24,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          ← Volver
        </button>

        {/* badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(20,184,166,0.15)",
          border: "1px solid rgba(20,184,166,0.3)",
          borderRadius: 20, padding: "4px 14px", marginBottom: 18,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#14b8a6", display: "inline-block" }} />
          <span style={{ color: "#5eead4", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>CARRY TRADE · FOREX</span>
        </div>

        <h1 style={{
          color: "#fff", fontSize: 32, fontWeight: 800,
          margin: "0 0 12px", letterSpacing: -0.3,
        }}>
          SafeGuard
        </h1>

        <p style={{
          color: "rgba(255,255,255,0.65)", fontSize: 14,
          lineHeight: 1.65, margin: "0 0 28px",
        }}>
          Gana interés diario manteniendo posiciones en monedas de alta tasa. El tiempo trabaja a tu favor.
        </p>

        {/* Iniciar button */}
        <button
          onClick={handleIniciar}
          disabled={loading}
          style={{
            width: "100%", padding: "13px 0",
            background: loading
              ? "rgba(20,184,166,0.4)"
              : "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
            border: "none", borderRadius: 10,
            color: "#fff", fontSize: 16, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: 0.3,
            boxShadow: "0 4px 20px rgba(20,184,166,0.4)",
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
    </div>
  );
}
