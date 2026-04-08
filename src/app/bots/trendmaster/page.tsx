"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

const STATS = [
  { label: "Mercados",    value: "Forex · Índices" },
  { label: "Estrategia", value: "Seguimiento de tendencia" },
  { label: "Timeframe",  value: "H1 · H4 · D1" },
  { label: "Riesgo",     value: "Moderado" },
  { label: "Señales",    value: "ADX + EMA + MACD" },
];

export default function TrendMasterPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#07120f",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
    }}>

      {/* ── subtle background grid ──────────────────────────────── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(16,185,100,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16,185,100,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "56px 56px",
      }} />

      {/* ── ambient glow (left) ─────────────────────────────────── */}
      <div style={{
        position: "fixed", top: "10%", left: "-8%",
        width: 520, height: 520, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(22,163,74,0.13) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── page content ────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 1280,
        margin: "0 auto",
        padding: "40px 48px",
        display: "flex",
        alignItems: "center",
        gap: 0,
      }}>

        {/* ════ LEFT: info panel ════════════════════════════════════ */}
        <div style={{
          flex: "0 0 420px",
          maxWidth: 420,
          background: "rgba(10,35,22,0.72)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(34,197,94,0.18)",
          borderRadius: 20,
          padding: "40px 36px 36px",
          boxShadow: "0 0 40px rgba(22,163,74,0.12), 0 20px 60px rgba(0,0,0,0.5)",
        }}>

          {/* back button */}
          <button
            onClick={() => router.back()}
            style={{
              background: "transparent",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 8,
              color: "rgba(134,239,172,0.75)",
              fontSize: 13,
              padding: "6px 14px",
              cursor: "pointer",
              marginBottom: 32,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ← Volver
          </button>

          {/* badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(22,163,74,0.15)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 20,
            padding: "4px 14px",
            marginBottom: 20,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            <span style={{ color: "#86efac", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>ACTIVO</span>
          </div>

          {/* title */}
          <h1 style={{
            color: "#ffffff",
            fontSize: 38,
            fontWeight: 800,
            margin: "0 0 10px",
            lineHeight: 1.1,
            letterSpacing: -0.5,
          }}>
            TrendMaster
          </h1>

          {/* tagline */}
          <p style={{
            color: "rgba(134,239,172,0.7)",
            fontSize: 14,
            fontWeight: 500,
            margin: "0 0 24px",
            letterSpacing: 0.3,
          }}>
            Especialista en tendencias de mercado
          </p>

          {/* description */}
          <p style={{
            color: "rgba(255,255,255,0.65)",
            fontSize: 15,
            lineHeight: 1.7,
            margin: "0 0 32px",
          }}>
            TrendMaster identifica y sigue tendencias alcistas y bajistas con alta precisión.
            Usa ADX para confirmar la fuerza del movimiento, EMA para la dirección y MACD
            para el momento exacto de entrada.
          </p>

          {/* stats grid */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 36,
          }}>
            {STATS.map(s => (
              <div key={s.label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "rgba(34,197,94,0.06)",
                borderRadius: 10,
                border: "1px solid rgba(34,197,94,0.1)",
              }}>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{s.label}</span>
                <span style={{ color: "#d1fae5", fontSize: 13, fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={() => router.push("/trade?bot=trendmaster")}
            style={{
              width: "100%",
              padding: "15px 0",
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: 0.3,
              boxShadow: "0 4px 24px rgba(22,163,74,0.35)",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Activar TrendMaster →
          </button>
        </div>

        {/* ════ RIGHT: bot image ════════════════════════════════════ */}
        <div style={{
          flex: 1,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          paddingLeft: 0,
        }}>
          <Image
            src="/bot-trendmaster.png"
            alt="TrendMaster"
            width={720}
            height={580}
            style={{
              width: "100%",
              maxWidth: 700,
              height: "auto",
              objectFit: "contain",
              display: "block",
              filter: "drop-shadow(0 0 40px rgba(22,163,74,0.3))",
            }}
            priority
          />
        </div>

      </div>
    </div>
  );
}
