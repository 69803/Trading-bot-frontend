"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";

const PAIRS = [
  { symbol: "BTC/USD",  stars: 5 },
  { symbol: "ETH/USD",  stars: 5 },
  { symbol: "BNB/USD",  stars: 4 },
  { symbol: "SOL/USD",  stars: 4 },
  { symbol: "ADA/USD",  stars: 3 },
  { symbol: "XRP/USD",  stars: 3 },
];

const INDICATORS = [
  { name: "ROC",           desc: "Fuerza del impulso" },
  { name: "RSI (10)",      desc: "Zona de momentum" },
  { name: "EMA 50 / 200",  desc: "Dirección macro" },
  { name: "ADX",           desc: ">25 para operar" },
  { name: "MACD",          desc: "Confirmación" },
  { name: "ATR × 1.5",     desc: "Stop loss dinámico" },
];

const RULES = [
  { label: "+1R",       action: "Break-even" },
  { label: "+2R",       action: "Cerrar 30%" },
  { label: "ADX <20",   action: "Salida total" },
  { label: "Trailing",  action: "ATR × 2" },
];

function Stars({ n }: { n: number }) {
  return (
    <span>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < n ? "#a855f7" : "rgba(255,255,255,0.15)", fontSize: 11 }}>★</span>
      ))}
    </span>
  );
}

export default function CryptoBotPage() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleIniciar = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/bot/activate/cryptobot");
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Error al activar el bot");
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: "100vw",
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
      background: "#0d0414",
    }}>

      {/* ── Background image ─────────────────────────────────────────── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: "url('/bot-cryptobot.png')",
        backgroundSize: "cover",
        backgroundPosition: "center right",
        backgroundRepeat: "no-repeat",
      }} />
      {/* dark overlay so left panel reads clearly */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "linear-gradient(90deg, rgba(13,4,20,0.92) 0%, rgba(13,4,20,0.70) 45%, rgba(13,4,20,0.15) 75%)",
      }} />

      {/* ── Layout: panel left + chart-like right ─────────────────────── */}
      <div style={{
        position: "relative", zIndex: 2,
        display: "flex",
        alignItems: "flex-start",
        minHeight: "100vh",
        padding: "40px 4% 60px",
        gap: 32,
        maxWidth: 1280,
        margin: "0 auto",
      }}>

        {/* ── LEFT PANEL ───────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          width: 300,
          position: "sticky",
          top: 40,
          background: "rgba(13,4,20,0.82)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(168,85,247,0.22)",
          borderRadius: 18,
          padding: "32px 26px 28px",
          boxShadow: "0 0 40px rgba(168,85,247,0.15), 0 20px 60px rgba(0,0,0,0.7)",
        }}>

          {/* back */}
          <button onClick={() => router.back()} style={{
            background: "transparent", border: "none",
            color: "rgba(251,191,36,0.6)", fontSize: 13,
            cursor: "pointer", padding: 0, marginBottom: 22,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            ← Volver
          </button>

          {/* badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(168,85,247,0.12)",
            border: "1px solid rgba(168,85,247,0.28)",
            borderRadius: 20, padding: "4px 14px", marginBottom: 16,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#a855f7", display: "inline-block" }} />
            <span style={{ color: "#d8b4fe", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>MOMENTUM · CRYPTO</span>
          </div>

          <h1 style={{
            color: "#fff", fontSize: 30, fontWeight: 800,
            margin: "0 0 10px", letterSpacing: -0.3,
          }}>
            Crypto Bot
          </h1>

          <p style={{
            color: "rgba(255,255,255,0.6)", fontSize: 13.5,
            lineHeight: 1.65, margin: "0 0 24px",
          }}>
            Estrategia de momentum para criptomonedas. Lo que sube, sigue subiendo — entra cuando el impulso está confirmado y deja correr las ganancias.
          </p>

          {/* stats row */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 10, marginBottom: 24,
          }}>
            {[
              { label: "Win Rate", value: ">42%" },
              { label: "Profit Factor", value: ">1.8" },
              { label: "Max DD", value: "<18%" },
              { label: "Backtest", value: "18 meses" },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(168,85,247,0.07)",
                border: "1px solid rgba(168,85,247,0.15)",
                borderRadius: 10, padding: "10px 12px",
              }}>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginBottom: 3 }}>{s.label}</div>
                <div style={{ color: "#d8b4fe", fontSize: 16, fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Iniciar button */}
          <button
            onClick={handleIniciar}
            disabled={loading}
            style={{
              width: "100%", padding: "13px 0",
              background: loading
                ? "rgba(168,85,247,0.35)"
                : "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)",
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 15, fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: 0.4,
              boxShadow: loading ? "none" : "0 4px 24px rgba(168,85,247,0.45)",
              transition: "filter 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.filter = "brightness(1.1)"; e.currentTarget.style.boxShadow = "0 6px 32px rgba(168,85,247,0.6)"; } }}
            onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(168,85,247,0.45)"; }}
          >
            {loading ? "Activando..." : "Seleccionar →"}
          </button>

          {error && (
            <p style={{ color: "#f87171", fontSize: 13, marginTop: 10, textAlign: "center" }}>
              {error}
            </p>
          )}
        </div>

        {/* ── RIGHT CONTENT ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>

          {/* Section: Estrategia */}
          <Section title="Estrategia" accent="#a855f7">
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: "#d8b4fe" }}>Momentum = lo que sube, sigue subiendo.</strong> Basado en estudios de Jegadeesh &amp; Titman.
              Funciona porque los flujos institucionales son sostenidos, el sentimiento persiste y los mercados cripto reaccionan con fuerza a noticias macro.
              Entramos cuando el momentum está <em>confirmado</em>, dejamos correr las ganancias y salimos cuando se agota.
            </p>
          </Section>

          {/* Section: Pares */}
          <Section title="Pares de Trading" accent="#a855f7">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {PAIRS.map(p => (
                <div key={p.symbol} style={{
                  background: "rgba(168,85,247,0.07)",
                  border: "1px solid rgba(168,85,247,0.18)",
                  borderRadius: 10, padding: "10px 14px",
                  display: "flex", flexDirection: "column", gap: 4,
                }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{p.symbol}</span>
                  <Stars n={p.stars} />
                </div>
              ))}
            </div>
          </Section>

          {/* Section: Timeframes */}
          <Section title="Timeframes" accent="#a855f7">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { tf: "1D",  role: "Dirección macro",  primary: true },
                { tf: "4H",  role: "Confirmación",     primary: true },
                { tf: "1H",  role: "Entrada",          primary: false },
                { tf: "15M", role: "Ejecución",        primary: false },
              ].map(t => (
                <div key={t.tf} style={{
                  background: t.primary ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${t.primary ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 10, padding: "10px 16px",
                  minWidth: 90, textAlign: "center",
                }}>
                  <div style={{ color: t.primary ? "#d8b4fe" : "#fff", fontWeight: 800, fontSize: 18 }}>{t.tf}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 3 }}>{t.role}</div>
                </div>
              ))}
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 10, marginBottom: 0 }}>
              Regla: todos los timeframes alineados o NO entrar.
            </p>
          </Section>

          {/* Section: Indicadores */}
          <Section title="Indicadores" accent="#a855f7">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {INDICATORS.map(ind => (
                <div key={ind.name} style={{
                  background: "rgba(168,85,247,0.06)",
                  border: "1px solid rgba(168,85,247,0.15)",
                  borderRadius: 10, padding: "11px 14px",
                }}>
                  <div style={{ color: "#d8b4fe", fontWeight: 700, fontSize: 13 }}>{ind.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 3 }}>{ind.desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Section: Señales de entrada */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Section title="Entrada LONG" accent="#22c55e">
              <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 2 }}>
                <li>Precio &gt; EMA200 (1D)</li>
                <li>ADX &gt;25, DI+ &gt; DI−</li>
                <li>EMA 50 &gt; EMA 200</li>
                <li>MACD positivo</li>
                <li>RSI 50–75</li>
                <li>ROC positivo y subiendo</li>
                <li>Pullback + confirmación</li>
              </ul>
            </Section>
            <Section title="Entrada SHORT" accent="#ef4444">
              <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 2 }}>
                <li>Precio &lt; EMA200 (1D)</li>
                <li>ADX &gt;25, DI− &gt; DI+</li>
                <li>EMA 50 &lt; EMA 200</li>
                <li>MACD negativo</li>
                <li>RSI 25–50</li>
                <li>ROC negativo y cayendo</li>
                <li>Pullback + confirmación</li>
              </ul>
            </Section>
          </div>

          {/* Section: Riesgo */}
          <Section title="Gestión de Riesgo" accent="#a855f7">
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
              {[
                { score: "8–10",  size: "1.5%",  label: "Fuerte" },
                { score: "6–7",   size: "1.0%",  label: "Normal" },
                { score: "4–5",   size: "0.5%",  label: "Débil" },
                { score: "<4",    size: "0%",    label: "No operar" },
              ].map(r => (
                <div key={r.score} style={{
                  background: r.size === "0%" ? "rgba(239,68,68,0.08)" : "rgba(168,85,247,0.08)",
                  border: `1px solid ${r.size === "0%" ? "rgba(239,68,68,0.2)" : "rgba(168,85,247,0.2)"}`,
                  borderRadius: 10, padding: "12px 18px", textAlign: "center", minWidth: 90,
                }}>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginBottom: 4 }}>Score {r.score}</div>
                  <div style={{ color: r.size === "0%" ? "#f87171" : "#d8b4fe", fontWeight: 800, fontSize: 20 }}>{r.size}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>{r.label}</div>
                </div>
              ))}
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: 0 }}>
              Máx 2 posiciones simultáneas · SL debajo EMA50 o ATR ×1.5 · Sin TP fijo.
            </p>
          </Section>

          {/* Section: Gestión de posición */}
          <Section title="Gestión de Posición" accent="#a855f7">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {RULES.map(r => (
                <div key={r.label} style={{
                  background: "rgba(168,85,247,0.07)",
                  border: "1px solid rgba(168,85,247,0.15)",
                  borderRadius: 10, padding: "11px 14px",
                  display: "flex", flexDirection: "column", gap: 4,
                }}>
                  <span style={{ color: "#d8b4fe", fontWeight: 700, fontSize: 14 }}>{r.label}</span>
                  <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{r.action}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Section: Señales de agotamiento */}
          <Section title="Señales de Agotamiento (Salida)" accent="#a855f7">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                "Divergencia MACD",
                "Divergencia ROC",
                "RSI pierde zona momentum",
                "ADX cae por debajo de 20",
                "Velas con sombras largas",
                "Score <4",
              ].map(s => (
                <span key={s} style={{
                  background: "rgba(168,85,247,0.09)",
                  border: "1px solid rgba(168,85,247,0.22)",
                  borderRadius: 20, padding: "5px 14px",
                  color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 500,
                }}>
                  {s}
                </span>
              ))}
            </div>
          </Section>

          {/* Section: Horarios */}
          <Section title="Horarios Óptimos" accent="#a855f7">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                { time: "Londres apertura", ok: true },
                { time: "Sesión Londres",   ok: true },
                { time: "NY apertura",      ok: null },
                { time: "LDN + NY overlap", ok: true },
                { time: "Sesión Asia",      ok: false },
              ].map(h => (
                <div key={h.time} style={{
                  background: h.ok === true
                    ? "rgba(34,197,94,0.08)"
                    : h.ok === false
                    ? "rgba(239,68,68,0.08)"
                    : "rgba(234,179,8,0.08)",
                  border: `1px solid ${h.ok === true ? "rgba(34,197,94,0.2)" : h.ok === false ? "rgba(239,68,68,0.2)" : "rgba(234,179,8,0.2)"}`,
                  borderRadius: 10, padding: "8px 14px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 14 }}>
                    {h.ok === true ? "✅" : h.ok === false ? "❌" : "⚠️"}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>{h.time}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Section: Errores comunes */}
          <Section title="Errores a Evitar" accent="#ef4444">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {[
                "Perseguir precio",
                "Salir demasiado temprano",
                "Ignorar el timeframe diario",
                "No considerar correlación",
              ].map(e => (
                <div key={e} style={{
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  borderRadius: 10, padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ color: "#f87171", fontSize: 16, flexShrink: 0 }}>✕</span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{e}</span>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>

    </div>
  );
}

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(13,4,20,0.6)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(168,85,247,0.12)",
      borderRadius: 14, padding: "22px 22px 18px",
    }}>
      <h2 style={{
        color: accent, fontSize: 13, fontWeight: 700,
        letterSpacing: 1, textTransform: "uppercase",
        margin: "0 0 14px",
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
