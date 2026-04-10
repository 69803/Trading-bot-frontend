"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Overlay button positions as % of image width/height
// Calibrated to the 5 bot cards in bots.png
// Each entry covers the full card area so clicks anywhere on a card work
const BOT_OVERLAYS = [
  { id: "trendmaster", left: "1%",   top: "18%", width: "18%", height: "76%" },
  { id: "scalperx",   left: "20%",  top: "18%", width: "18%", height: "76%" },
  { id: "cryptobot",  left: "39%",  top: "14%", width: "21%", height: "80%" },
  { id: "piphunter",  left: "61%",  top: "18%", width: "18%", height: "76%" },
  { id: "safeguard",  left: "80%",  top: "18%", width: "18%", height: "76%" },
];

export default function BotsPage() {
  const router  = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // ── Particle canvas ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 80 }, () => ({
      x:    Math.random() * window.innerWidth,
      y:    Math.random() * window.innerHeight,
      r:    Math.random() * 1.5 + 0.3,
      dx:   (Math.random() - 0.5) * 0.3,
      dy:   (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Bots that have a dedicated detail page
  const DETAIL_PAGES: Record<string, string> = {
    trendmaster: "/bots/trendmaster",
    scalperx:    "/bots/scalperx",
    cryptobot:   "/bots/cryptobot",
    piphunter:   "/bots/piphunter",
    safeguard:   "/bots/safeguard",
    combo:       "/bots/combo",
  };

  const select = (id: string) => {
    const dest = DETAIL_PAGES[id] ?? `/trade?bot=${id}`;
    router.push(dest);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07081a", position: "relative", overflow: "hidden" }}>

      {/* ── animated background blobs ─────────────────────────────── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      }}>
        <div style={{
          position: "absolute", width: 600, height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
          top: "-10%", left: "-5%",
          animation: "blob1 18s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)",
          bottom: "-10%", right: "5%",
          animation: "blob2 22s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
          top: "40%", left: "40%",
          animation: "blob1 26s ease-in-out infinite reverse",
        }} />
        {/* grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* ── particle canvas ───────────────────────────────────────── */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }} />

      {/* ── content ───────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px 60px" }}>

        {/* header */}
        <nav style={{
          width: "100%", maxWidth: 1200,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 48,
        }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 20, letterSpacing: 1 }}>
            🤖 TradingBot
          </span>
          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            {["Inicio", "Planes", "Soporte"].map(link => (
              <a key={link} href="#" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: 15, transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
              >{link}</a>
            ))}
            <button
              onClick={() => router.push("/login")}
              style={{
                background: "linear-gradient(135deg,#6366f1,#0ea5e9)",
                border: "none", borderRadius: 8,
                color: "#fff", padding: "9px 22px", fontSize: 14, fontWeight: 600,
                cursor: "pointer",
              }}
            >Registrarse</button>
          </div>
        </nav>

        {/* headline */}
        <h1 style={{
          color: "#fff", fontSize: "clamp(28px,4vw,52px)", fontWeight: 800,
          textAlign: "center", marginBottom: 12, lineHeight: 1.15,
        }}>
          Escoge tu bot preferido
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.6)", fontSize: 17, textAlign: "center", marginBottom: 40,
        }}>
          Selecciona entre varios bots para operar en Forex y criptomonedas automáticamente.
        </p>

        {/* ── image + overlay buttons ───────────────────────────── */}
        <div style={{
          position: "relative",
          width: "100%",
          maxWidth: 1100,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 0 80px rgba(99,102,241,0.25), 0 30px 80px rgba(0,0,0,0.6)",
        }}>
          <Image
            src="/bots.png"
            alt="Selecciona tu bot"
            width={1100}
            height={600}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />

          {/* invisible clickable overlay per bot card */}
          {BOT_OVERLAYS.map(bot => (
            <button
              key={bot.id}
              onClick={() => { setSelected(bot.id); select(bot.id); }}
              className="bot-select-btn"
              style={{
                position: "absolute",
                left:   bot.left,
                top:    bot.top,
                width:  bot.width,
                height: bot.height,
              }}
            >
              Seleccionar
            </button>
          ))}
        </div>

        {/* ── Combo bot ─────────────────────────────────────────────── */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          marginTop: 48, width: "100%", maxWidth: 1100,
        }}>
          <div style={{
            position: "relative",
            width: "65%",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 0 80px rgba(99,102,241,0.3), 0 30px 80px rgba(0,0,0,0.6)",
          }}>
            <Image
              src="/bot-inte.png"
              alt="Combo Bot"
              width={700}
              height={400}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            {/* overlay button covering the full card */}
            <button
              onClick={() => select("combo")}
              className="bot-select-btn"
              style={{ position: "absolute", inset: 0 }}
            >
              Seleccionar
            </button>
          </div>

          <p style={{
            color: "rgba(255,255,255,0.55)", fontSize: 14,
            textAlign: "center", marginTop: 16, maxWidth: 480, lineHeight: 1.6,
          }}>
            Combinación inteligente de todos los bots — TrendMaster, Mean Reversion, Momentum, Breakout y SafeGuard operando juntos para máxima diversificación.
          </p>

          <button
            onClick={() => select("combo")}
            style={{
              marginTop: 18,
              padding: "12px 36px",
              background: "linear-gradient(135deg, #6366f1 0%, #0ea5e9 100%)",
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", letterSpacing: 0.4,
              boxShadow: "0 4px 24px rgba(99,102,241,0.4)",
            }}
            onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.15)")}
            onMouseLeave={e => (e.currentTarget.style.filter = "brightness(1)")}
          >
            Seleccionar →
          </button>
        </div>

        {/* sub-text */}
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 32, textAlign: "center" }}>
          Puedes cambiar de bot en cualquier momento desde tu panel de control.
        </p>
      </div>

      <style>{`
        @keyframes blob1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(40px,-30px) scale(1.08); }
          66%      { transform: translate(-20px,20px) scale(0.95); }
        }
        @keyframes blob2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-30px,40px) scale(1.05); }
          66%      { transform: translate(20px,-20px) scale(0.97); }
        }

        .bot-select-btn {
          background: transparent !important;
          border: none !important;
          color: transparent !important;
          cursor: pointer;
          outline: none !important;
          box-shadow: none !important;
          -webkit-appearance: none;
          appearance: none;
          padding: 0;
          margin: 0;
        }
        .bot-select-btn:hover,
        .bot-select-btn:focus,
        .bot-select-btn:active,
        .bot-select-btn:visited {
          background: transparent !important;
          color: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
