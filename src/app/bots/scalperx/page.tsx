"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import api from "@/lib/api";

export default function ScalperXPage() {
  const router  = useRouter();
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
      minHeight: "100vh",
      width: "100%",
      position: "relative",
      overflow: "hidden",
      background: "#0a0414",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>

      {/* ── Bot image as background ────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Image
          src="/bot-trendmaster.png"
          alt="ScalperX"
          fill
          style={{
            objectFit: "cover",
            objectPosition: "center right",
            filter: "hue-rotate(200deg) saturate(1.2)",
          }}
          priority
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, rgba(10,4,20,0.82) 0%, rgba(10,4,20,0.48) 45%, rgba(10,4,20,0.0) 75%)",
        }} />
      </div>

      {/* ── Info panel ────────────────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 2,
        width: "100%", maxWidth: 1280,
        padding: "0 48px",
        display: "flex", alignItems: "center", minHeight: "100vh",
      }}>
        <div style={{
          width: 320,
          background: "rgba(20,8,40,0.78)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(168,85,247,0.25)",
          borderRadius: 16,
          padding: "36px 30px 30px",
          boxShadow: "0 0 36px rgba(168,85,247,0.15), 0 16px 48px rgba(0,0,0,0.55)",
        }}>

          <button
            onClick={() => router.back()}
            style={{
              background: "transparent", border: "none",
              color: "rgba(216,180,254,0.6)", fontSize: 13,
              cursor: "pointer", padding: 0, marginBottom: 28,
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            ← Volver
          </button>

          {/* badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(168,85,247,0.15)",
            border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: 20, padding: "4px 14px", marginBottom: 20,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#a855f7", display: "inline-block" }} />
            <span style={{ color: "#d8b4fe", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>MEAN REVERSION</span>
          </div>

          <h1 style={{
            color: "#fff", fontSize: 34, fontWeight: 800,
            margin: "0 0 14px", letterSpacing: -0.3,
          }}>
            ScalperX
          </h1>

          <p style={{
            color: "rgba(255,255,255,0.65)", fontSize: 15,
            lineHeight: 1.65, margin: "0 0 32px",
          }}>
            Opera la reversión a la media. Entra cuando el precio se aleja demasiado del equilibrio y espera el regreso.
          </p>

          <button
            onClick={handleIniciar}
            disabled={loading}
            style={{
              width: "100%", padding: "13px 0",
              background: loading
                ? "rgba(168,85,247,0.4)"
                : "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)",
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 16, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: 0.3,
              boxShadow: "0 4px 20px rgba(168,85,247,0.4)",
              transition: "filter 0.2s",
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = "brightness(1.1)"; }}
            onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
          >
            {loading ? "Activando..." : "Iniciar"}
          </button>

          {error && (
            <p style={{ color: "#f87171", fontSize: 13, marginTop: 10, textAlign: "center" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
