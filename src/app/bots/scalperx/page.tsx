"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";

export default function ScalperXPage() {
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

      {/* ── Back button ──────────────────────────────────────────────────── */}
      <button
        onClick={() => router.back()}
        style={{
          position: "absolute", top: 24, left: 24, zIndex: 10,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 8, color: "rgba(255,255,255,0.8)",
          fontSize: 13, padding: "7px 16px", cursor: "pointer",
        }}
      >
        ← Volver
      </button>

      {/* ── Invisible overlay on the "Iniciar" button in the image ───────── */}
      {/* Calibrated to botito222.png: button ~left 5%, top 76%, w 28%, h 7% */}
      <button
        onClick={handleIniciar}
        disabled={loading}
        style={{
          position: "absolute",
          left: "5%", top: "76%",
          width: "28%", height: "7%",
          background: "transparent",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          outline: "none",
          zIndex: 5,
        }}
      />

      {/* ── Error toast ───────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          position: "absolute", bottom: 32, left: "50%",
          transform: "translateX(-50%)", zIndex: 20,
          background: "rgba(239,68,68,0.92)",
          backdropFilter: "blur(8px)",
          borderRadius: 10, padding: "12px 28px",
          color: "#fff", fontSize: 14, fontWeight: 600,
          whiteSpace: "nowrap",
        }}>
          {error}
        </div>
      )}

      {/* ── Loading overlay ───────────────────────────────────────────────── */}
      {loading && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 15,
          background: "rgba(2,11,24,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "rgba(14,30,60,0.95)",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 16, padding: "32px 48px", textAlign: "center",
          }}>
            <div style={{
              width: 36, height: 36,
              border: "3px solid rgba(59,130,246,0.2)",
              borderTop: "3px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }} />
            <p style={{ color: "#fff", fontWeight: 600, margin: 0 }}>
              Activando ScalperX...
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
