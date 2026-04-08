"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";

export default function MeanReversionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleIniciar = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/bot/activate/scalperx");
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
      backgroundImage: "url('/bot-scalperx.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}>

      {/* dark vignette left side so panel reads clearly */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, rgba(2,11,24,0.75) 0%, rgba(2,11,24,0.4) 40%, transparent 70%)",
        zIndex: 1,
      }} />

      {/* ── Info panel — left side ─────────────────────────────────────── */}
      <div style={{
        position: "absolute", zIndex: 2,
        left: "4%", top: "50%", transform: "translateY(-50%)",
        width: 300,
        background: "rgba(2,14,35,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(59,130,246,0.25)",
        borderRadius: 16,
        padding: "32px 28px 28px",
        boxShadow: "0 0 36px rgba(59,130,246,0.15), 0 16px 48px rgba(0,0,0,0.6)",
      }}>

        {/* back */}
        <button onClick={() => router.back()} style={{
          background: "transparent", border: "none",
          color: "rgba(147,197,253,0.6)", fontSize: 13,
          cursor: "pointer", padding: 0, marginBottom: 24,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          ← Volver
        </button>

        {/* badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(59,130,246,0.15)",
          border: "1px solid rgba(59,130,246,0.3)",
          borderRadius: 20, padding: "4px 14px", marginBottom: 18,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
          <span style={{ color: "#93c5fd", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>MEAN REVERSION</span>
        </div>

        <h1 style={{
          color: "#fff", fontSize: 32, fontWeight: 800,
          margin: "0 0 12px", letterSpacing: -0.3,
        }}>
          Mean Reversion
        </h1>

        <p style={{
          color: "rgba(255,255,255,0.65)", fontSize: 14,
          lineHeight: 1.65, margin: "0 0 28px",
        }}>
          Opera cuando el precio se aleja demasiado del equilibrio y espera el regreso a la media. Solo activo en mercados laterales.
        </p>

        {/* Iniciar button */}
        <button
          onClick={handleIniciar}
          disabled={loading}
          style={{
            width: "100%", padding: "13px 0",
            background: loading
              ? "rgba(59,130,246,0.4)"
              : "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
            border: "none", borderRadius: 10,
            color: "#fff", fontSize: 16, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: 0.3,
            boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
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
