"use client";
// background: bot-combo.png (botito mix)
import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";

export default function MasterBotPage() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleIniciar = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/bot/activate/combo");
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
      backgroundImage: "url('/bot-combo.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}>

      {/* dark vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, rgba(5,2,20,0.82) 0%, rgba(5,2,20,0.45) 40%, transparent 70%)",
        zIndex: 1,
      }} />

      {/* ── Info panel — centered ──────────────────────────────────────── */}
      <div style={{
        position: "absolute", zIndex: 2,
        left: "50%", top: "50%", transform: "translate(-50%, -50%)",
        width: 320,
        background: "rgba(5,2,20,0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(99,102,241,0.3)",
        borderRadius: 16,
        padding: "32px 28px 28px",
        boxShadow: "0 0 40px rgba(99,102,241,0.2), 0 16px 48px rgba(0,0,0,0.65)",
      }}>

        {/* back */}
        <button onClick={() => router.back()} style={{
          background: "transparent", border: "none",
          color: "rgba(165,180,252,0.6)", fontSize: 13,
          cursor: "pointer", padding: 0, marginBottom: 24,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          ← Volver
        </button>

        {/* badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(99,102,241,0.15)",
          border: "1px solid rgba(99,102,241,0.35)",
          borderRadius: 20, padding: "4px 14px", marginBottom: 18,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
          <span style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>MASTER BOT · MULTI-ESTRATEGIA</span>
        </div>

        <h1 style={{
          color: "#fff", fontSize: 32, fontWeight: 800,
          margin: "0 0 12px", letterSpacing: -0.3,
        }}>
          Master Bot
        </h1>

        <p style={{
          color: "rgba(255,255,255,0.65)", fontSize: 14,
          lineHeight: 1.65, margin: "0 0 28px",
        }}>
          Sistema inteligente que combina los 5 bots. Detecta el estado del mercado y activa la estrategia correcta automáticamente.
        </p>

        {/* Iniciar button */}
        <button
          onClick={handleIniciar}
          disabled={loading}
          style={{
            width: "100%", padding: "13px 0",
            background: loading
              ? "rgba(99,102,241,0.4)"
              : "linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #0ea5e9 100%)",
            border: "none", borderRadius: 10,
            color: "#fff", fontSize: 16, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: 0.3,
            boxShadow: "0 4px 24px rgba(99,102,241,0.45)",
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
