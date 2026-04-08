"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import api from "@/lib/api";

export default function TrendMasterPage() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleIniciar = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/bot/activate/trendmaster");
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
      background: "#04120a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>

      {/* ── Robot image — fills the right side as the visual base ── */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
      }}>
        <Image
          src="/bot-trendmaster.png"
          alt="TrendMaster"
          fill
          style={{
            objectFit: "cover",
            objectPosition: "center right",
          }}
          priority
        />
        {/* subtle dark vignette on the left so panel reads clearly */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, rgba(4,18,10,0.78) 0%, rgba(4,18,10,0.45) 45%, rgba(4,18,10,0.0) 75%)",
        }} />
      </div>

      {/* ── Info panel — left side ─────────────────────────────────── */}
      <div style={{
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: 1280,
        padding: "0 48px",
        display: "flex",
        alignItems: "center",
        minHeight: "100vh",
      }}>
        <div style={{
          width: 320,
          background: "rgba(8,32,18,0.75)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(34,197,94,0.22)",
          borderRadius: 16,
          padding: "36px 30px 30px",
          boxShadow: "0 0 36px rgba(22,163,74,0.15), 0 16px 48px rgba(0,0,0,0.55)",
        }}>

          {/* back */}
          <button
            onClick={() => router.back()}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(134,239,172,0.6)",
              fontSize: 13,
              cursor: "pointer",
              padding: 0,
              marginBottom: 28,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            ← Volver
          </button>

          {/* title */}
          <h1 style={{
            color: "#ffffff",
            fontSize: 34,
            fontWeight: 800,
            margin: "0 0 14px",
            letterSpacing: -0.3,
          }}>
            TrendMaster
          </h1>

          {/* description */}
          <p style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: 15,
            lineHeight: 1.65,
            margin: "0 0 32px",
          }}>
            Especialista en identificar y seguir tendencias alcistas y bajistas.
          </p>

          {/* Iniciar button */}
          <button
            onClick={handleIniciar}
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px 0",
              background: loading
                ? "rgba(22,163,74,0.5)"
                : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: 0.3,
              boxShadow: "0 4px 20px rgba(22,163,74,0.4)",
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
