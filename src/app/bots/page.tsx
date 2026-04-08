"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ── Bot data ─────────────────────────────────────────────────────────────────

const BOTS = [
  {
    id: "trendmaster",
    name: "TrendMaster",
    desc: "Especialista en identificar y seguir tendencias alcistas y bajistas.",
    accent: "#0ea5e9",
    glow: "rgba(14,165,233,0.45)",
    bg: "linear-gradient(145deg,#0c1f3a 0%,#0a3a5c 100%)",
    border: "rgba(14,165,233,0.35)",
    Robot: RobotTrend,
  },
  {
    id: "scalperx",
    name: "ScalperX",
    desc: "Sigue movimientos rápidos para operaciones cortas y efectivas.",
    accent: "#a855f7",
    glow: "rgba(168,85,247,0.45)",
    bg: "linear-gradient(145deg,#1a0a3a 0%,#2d1565 100%)",
    border: "rgba(168,85,247,0.35)",
    Robot: RobotScalper,
  },
  {
    id: "cryptobot",
    name: "CryptoBot",
    desc: "Optimizado para el trading de diversas criptomonedas.",
    accent: "#6366f1",
    glow: "rgba(99,102,241,0.55)",
    bg: "linear-gradient(145deg,#0f0f2e 0%,#1e1b5e 100%)",
    border: "rgba(99,102,241,0.5)",
    featured: true,
    Robot: RobotCrypto,
  },
  {
    id: "piphunter",
    name: "PipHunter",
    desc: "Busca oportunidades rápidas y rentables en el mercado Forex.",
    accent: "#f97316",
    glow: "rgba(249,115,22,0.45)",
    bg: "linear-gradient(145deg,#2a0e00 0%,#4a1a00 100%)",
    border: "rgba(249,115,22,0.35)",
    Robot: RobotPip,
  },
  {
    id: "safeguard",
    name: "SafeGuard",
    desc: "Conservador y enfocado en la gestión del riesgo.",
    accent: "#22c55e",
    glow: "rgba(34,197,94,0.45)",
    bg: "linear-gradient(145deg,#052010 0%,#0a3a1a 100%)",
    border: "rgba(34,197,94,0.35)",
    Robot: RobotSafe,
  },
];

// ── Robot SVG illustrations ──────────────────────────────────────────────────

function RobotTrend({ glow }: { glow: string }) {
  return (
    <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="60" cy="120" rx="35" ry="8" fill={glow} style={{ filter: "blur(8px)" }} />
      {/* Body */}
      <rect x="28" y="55" width="64" height="55" rx="12" fill="#0c2a4a" stroke="#0ea5e9" strokeWidth="1.5" />
      {/* Head */}
      <rect x="32" y="22" width="56" height="38" rx="10" fill="#0a1f3a" stroke="#0ea5e9" strokeWidth="1.5" />
      {/* Eyes */}
      <rect x="42" y="32" width="14" height="10" rx="3" fill="#0ea5e9" opacity="0.9" />
      <rect x="64" y="32" width="14" height="10" rx="3" fill="#0ea5e9" opacity="0.9" />
      <circle cx="49" cy="37" r="3" fill="white" opacity="0.8" />
      <circle cx="71" cy="37" r="3" fill="white" opacity="0.8" />
      {/* Mouth */}
      <path d="M45 50 Q60 56 75 50" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Antenna */}
      <line x1="60" y1="22" x2="60" y2="10" stroke="#0ea5e9" strokeWidth="2" />
      <circle cx="60" cy="8" r="4" fill="#0ea5e9">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Chest screen - trend chart */}
      <rect x="36" y="63" width="48" height="30" rx="5" fill="#061525" stroke="#0ea5e9" strokeWidth="1" opacity="0.8" />
      <polyline points="40,85 50,78 60,82 70,70 80,74" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Arms */}
      <rect x="12" y="62" width="16" height="30" rx="8" fill="#0c2a4a" stroke="#0ea5e9" strokeWidth="1.5" />
      <rect x="92" y="62" width="16" height="30" rx="8" fill="#0c2a4a" stroke="#0ea5e9" strokeWidth="1.5" />
      {/* Legs */}
      <rect x="36" y="108" width="18" height="20" rx="6" fill="#0c2a4a" stroke="#0ea5e9" strokeWidth="1.5" />
      <rect x="66" y="108" width="18" height="20" rx="6" fill="#0c2a4a" stroke="#0ea5e9" strokeWidth="1.5" />
    </svg>
  );
}

function RobotScalper({ glow }: { glow: string }) {
  return (
    <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="60" cy="120" rx="35" ry="8" fill={glow} style={{ filter: "blur(8px)" }} />
      <rect x="26" y="53" width="68" height="57" rx="14" fill="#1a0a3a" stroke="#a855f7" strokeWidth="1.5" />
      <rect x="30" y="20" width="60" height="38" rx="10" fill="#120828" stroke="#a855f7" strokeWidth="1.5" />
      {/* Visor eyes */}
      <rect x="36" y="30" width="48" height="14" rx="4" fill="#a855f7" opacity="0.25" />
      <rect x="38" y="32" width="20" height="10" rx="3" fill="#a855f7" opacity="0.8" />
      <rect x="62" y="32" width="20" height="10" rx="3" fill="#a855f7" opacity="0.8" />
      <circle cx="48" cy="37" r="3" fill="white" opacity="0.9" />
      <circle cx="72" cy="37" r="3" fill="white" opacity="0.9" />
      <path d="M44 50 L60 54 L76 50" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Lightning bolt antenna */}
      <line x1="60" y1="20" x2="60" y2="8" stroke="#a855f7" strokeWidth="2" />
      <polygon points="56,8 64,8 60,3 56,8" fill="#a855f7">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />
      </polygon>
      {/* Chest: speed lines */}
      <rect x="34" y="61" width="52" height="32" rx="5" fill="#0d0520" stroke="#a855f7" strokeWidth="1" opacity="0.8" />
      <line x1="40" y1="70" x2="76" y2="70" stroke="#a855f7" strokeWidth="2" opacity="0.8" />
      <line x1="44" y1="77" x2="76" y2="77" stroke="#a855f7" strokeWidth="1.5" opacity="0.6" />
      <line x1="48" y1="84" x2="76" y2="84" stroke="#a855f7" strokeWidth="1" opacity="0.4" />
      <polygon points="36,72 44,77 36,82" fill="#f59e0b" />
      <rect x="10" y="60" width="16" height="32" rx="8" fill="#1a0a3a" stroke="#a855f7" strokeWidth="1.5" />
      <rect x="94" y="60" width="16" height="32" rx="8" fill="#1a0a3a" stroke="#a855f7" strokeWidth="1.5" />
      <rect x="34" y="108" width="18" height="20" rx="6" fill="#1a0a3a" stroke="#a855f7" strokeWidth="1.5" />
      <rect x="68" y="108" width="18" height="20" rx="6" fill="#1a0a3a" stroke="#a855f7" strokeWidth="1.5" />
    </svg>
  );
}

function RobotCrypto({ glow }: { glow: string }) {
  return (
    <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="60" cy="122" rx="38" ry="9" fill={glow} style={{ filter: "blur(10px)" }} />
      {/* Glow halo */}
      <circle cx="60" cy="58" r="46" fill="rgba(99,102,241,0.08)" />
      <rect x="24" y="52" width="72" height="60" rx="16" fill="#0f0f2e" stroke="#6366f1" strokeWidth="2" />
      <rect x="28" y="18" width="64" height="40" rx="12" fill="#0a0a25" stroke="#6366f1" strokeWidth="2" />
      {/* Eyes with glow */}
      <circle cx="46" cy="36" r="9" fill="#6366f1" opacity="0.25" />
      <circle cx="74" cy="36" r="9" fill="#6366f1" opacity="0.25" />
      <circle cx="46" cy="36" r="6" fill="#6366f1" opacity="0.8" />
      <circle cx="74" cy="36" r="6" fill="#6366f1" opacity="0.8" />
      <circle cx="46" cy="36" r="3" fill="white" />
      <circle cx="74" cy="36" r="3" fill="white" />
      <path d="M44 52 Q60 58 76 52" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" fill="none" />
      <line x1="60" y1="18" x2="60" y2="5" stroke="#6366f1" strokeWidth="2.5" />
      <circle cx="60" cy="4" r="5" fill="#6366f1">
        <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Bitcoin symbol on chest */}
      <rect x="32" y="60" width="56" height="36" rx="8" fill="#07071a" stroke="#6366f1" strokeWidth="1.5" opacity="0.9" />
      <text x="60" y="84" textAnchor="middle" fill="#f7931a" fontSize="22" fontWeight="bold" fontFamily="monospace">₿</text>
      <rect x="8" y="58" width="16" height="36" rx="8" fill="#0f0f2e" stroke="#6366f1" strokeWidth="1.5" />
      <rect x="96" y="58" width="16" height="36" rx="8" fill="#0f0f2e" stroke="#6366f1" strokeWidth="1.5" />
      <rect x="32" y="110" width="20" height="22" rx="7" fill="#0f0f2e" stroke="#6366f1" strokeWidth="1.5" />
      <rect x="68" y="110" width="20" height="22" rx="7" fill="#0f0f2e" stroke="#6366f1" strokeWidth="1.5" />
    </svg>
  );
}

function RobotPip({ glow }: { glow: string }) {
  return (
    <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="60" cy="120" rx="35" ry="8" fill={glow} style={{ filter: "blur(8px)" }} />
      <rect x="26" y="55" width="68" height="55" rx="12" fill="#1a0800" stroke="#f97316" strokeWidth="1.5" />
      <rect x="30" y="22" width="60" height="38" rx="10" fill="#130600" stroke="#f97316" strokeWidth="1.5" />
      {/* Visor */}
      <rect x="34" y="30" width="52" height="16" rx="5" fill="#f97316" opacity="0.15" stroke="#f97316" strokeWidth="1" />
      <circle cx="48" cy="38" r="7" fill="#f97316" opacity="0.7" />
      <circle cx="72" cy="38" r="7" fill="#f97316" opacity="0.7" />
      <circle cx="48" cy="38" r="3.5" fill="white" opacity="0.9" />
      <circle cx="72" cy="38" r="3.5" fill="white" opacity="0.9" />
      <path d="M46 52 Q60 56 74 52" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <line x1="60" y1="22" x2="60" y2="9" stroke="#f97316" strokeWidth="2" />
      <circle cx="60" cy="7" r="4" fill="#f97316">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
      </circle>
      {/* Magnifying glass on chest */}
      <rect x="34" y="63" width="52" height="32" rx="5" fill="#0d0400" stroke="#f97316" strokeWidth="1" />
      <circle cx="54" cy="79" r="10" fill="none" stroke="#f97316" strokeWidth="2" />
      <circle cx="54" cy="79" r="6" fill="rgba(249,115,22,0.1)" />
      <line x1="61" y1="86" x2="70" y2="93" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
      <rect x="10" y="62" width="16" height="30" rx="8" fill="#1a0800" stroke="#f97316" strokeWidth="1.5" />
      <rect x="94" y="62" width="16" height="30" rx="8" fill="#1a0800" stroke="#f97316" strokeWidth="1.5" />
      <rect x="34" y="108" width="18" height="20" rx="6" fill="#1a0800" stroke="#f97316" strokeWidth="1.5" />
      <rect x="68" y="108" width="18" height="20" rx="6" fill="#1a0800" stroke="#f97316" strokeWidth="1.5" />
    </svg>
  );
}

function RobotSafe({ glow }: { glow: string }) {
  return (
    <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="60" cy="120" rx="35" ry="8" fill={glow} style={{ filter: "blur(8px)" }} />
      <rect x="26" y="55" width="68" height="55" rx="12" fill="#021a08" stroke="#22c55e" strokeWidth="1.5" />
      <rect x="30" y="22" width="60" height="38" rx="10" fill="#011205" stroke="#22c55e" strokeWidth="1.5" />
      {/* Square eyes */}
      <rect x="38" y="30" width="16" height="12" rx="3" fill="#22c55e" opacity="0.8" />
      <rect x="66" y="30" width="16" height="12" rx="3" fill="#22c55e" opacity="0.8" />
      <circle cx="46" cy="36" r="3" fill="white" />
      <circle cx="74" cy="36" r="3" fill="white" />
      <path d="M44 50 Q60 56 76 50" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <line x1="60" y1="22" x2="60" y2="10" stroke="#22c55e" strokeWidth="2" />
      <polygon points="56,10 64,10 64,4 60,2 56,4" fill="#22c55e">
        <animate attributeName="opacity" values="1;0.4;1" dur="2.5s" repeatCount="indefinite" />
      </polygon>
      {/* Shield on chest */}
      <rect x="34" y="63" width="52" height="32" rx="5" fill="#010f03" stroke="#22c55e" strokeWidth="1" />
      <path d="M60 68 L76 74 L76 86 Q76 93 60 97 Q44 93 44 86 L44 74 Z" fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth="2" />
      <path d="M53 82 L58 87 L68 76" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="10" y="62" width="16" height="30" rx="8" fill="#021a08" stroke="#22c55e" strokeWidth="1.5" />
      <rect x="94" y="62" width="16" height="30" rx="8" fill="#021a08" stroke="#22c55e" strokeWidth="1.5" />
      <rect x="34" y="108" width="18" height="20" rx="6" fill="#021a08" stroke="#22c55e" strokeWidth="1.5" />
      <rect x="68" y="108" width="18" height="20" rx="6" fill="#021a08" stroke="#22c55e" strokeWidth="1.5" />
    </svg>
  );
}

// ── Animated background particles ────────────────────────────────────────────

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,255,${p.alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ── Bot card ──────────────────────────────────────────────────────────────────

function BotCard({
  bot,
  onSelect,
}: {
  bot: typeof BOTS[0];
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(bot.id)}
      style={{
        background: bot.bg,
        border: `1.5px solid ${hovered ? bot.accent : bot.border}`,
        boxShadow: hovered
          ? `0 0 32px ${bot.glow}, 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)`
          : `0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transform: hovered
          ? bot.featured
            ? "translateY(-14px) scale(1.03)"
            : "translateY(-10px) scale(1.02)"
          : bot.featured
          ? "translateY(-6px) scale(1.01)"
          : "translateY(0) scale(1)",
        transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        cursor: "pointer",
        borderRadius: "20px",
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        position: "relative",
        overflow: "hidden",
        flex: bot.featured ? "0 0 210px" : "0 0 190px",
        minHeight: bot.featured ? "380px" : "350px",
      }}
    >
      {/* Corner glow */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          right: "-30px",
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: bot.accent,
          opacity: hovered ? 0.15 : 0.07,
          filter: "blur(30px)",
          transition: "opacity 0.4s",
          pointerEvents: "none",
        }}
      />

      {/* Featured badge */}
      {bot.featured && (
        <div
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: `linear-gradient(90deg,${bot.accent},#818cf8)`,
            borderRadius: "20px",
            padding: "3px 10px",
            fontSize: "10px",
            fontWeight: 700,
            color: "white",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Popular
        </div>
      )}

      {/* Robot illustration */}
      <div
        style={{
          width: bot.featured ? "130px" : "110px",
          height: bot.featured ? "160px" : "140px",
          position: "relative",
          filter: hovered ? `drop-shadow(0 0 16px ${bot.accent})` : `drop-shadow(0 0 6px ${bot.accent}80)`,
          transition: "filter 0.4s",
          animation: "float 3s ease-in-out infinite",
        }}
      >
        <bot.Robot glow={bot.glow} />
      </div>

      {/* Name */}
      <h3
        style={{
          color: bot.accent,
          fontSize: bot.featured ? "20px" : "17px",
          fontWeight: 700,
          margin: 0,
          letterSpacing: "0.02em",
          textShadow: `0 0 20px ${bot.glow}`,
        }}
      >
        {bot.name}
      </h3>

      {/* Description */}
      <p
        style={{
          color: "rgba(200,210,230,0.8)",
          fontSize: "12px",
          lineHeight: 1.6,
          textAlign: "center",
          margin: 0,
          flex: 1,
        }}
      >
        {bot.desc}
      </p>

      {/* Select button */}
      <button
        style={{
          background: hovered
            ? `linear-gradient(90deg,#16a34a,#22c55e)`
            : `linear-gradient(90deg,#15803d,#16a34a)`,
          color: "white",
          border: "none",
          borderRadius: "10px",
          padding: "10px 28px",
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
          width: "100%",
          boxShadow: hovered ? "0 4px 20px rgba(34,197,94,0.4)" : "none",
          transition: "all 0.3s",
          letterSpacing: "0.04em",
        }}
      >
        Seleccionar
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BotsPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSelect = (id: string) => {
    router.push(`/login?bot=${id}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#020818 0%,#0a0f2e 40%,#0d0a2e 70%,#050c1a 100%)",
        fontFamily: "'Inter','Segoe UI',sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background blobs */}
      <style>{`
        @keyframes blob1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(40px,-30px) scale(1.1); }
          66% { transform: translate(-20px,20px) scale(0.95); }
        }
        @keyframes blob2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(-30px,40px) scale(1.08); }
          66% { transform: translate(20px,-20px) scale(0.92); }
        }
        @keyframes blob3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(20px,30px) scale(1.05); }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes titleGlow {
          0%,100% { text-shadow: 0 0 30px rgba(99,102,241,0.4), 0 0 60px rgba(99,102,241,0.2); }
          50% { text-shadow: 0 0 50px rgba(99,102,241,0.7), 0 0 100px rgba(99,102,241,0.3); }
        }
        @keyframes navGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
          50% { box-shadow: 0 0 20px rgba(99,102,241,0.2); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      {/* Blob 1 */}
      <div style={{
        position: "fixed", top: "10%", left: "15%", width: "500px", height: "500px",
        borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)",
        animation: "blob1 12s ease-in-out infinite", filter: "blur(40px)", pointerEvents: "none", zIndex: 0,
      }} />
      {/* Blob 2 */}
      <div style={{
        position: "fixed", top: "40%", right: "10%", width: "400px", height: "400px",
        borderRadius: "50%", background: "radial-gradient(circle,rgba(168,85,247,0.15) 0%,transparent 70%)",
        animation: "blob2 15s ease-in-out infinite", filter: "blur(40px)", pointerEvents: "none", zIndex: 0,
      }} />
      {/* Blob 3 */}
      <div style={{
        position: "fixed", bottom: "10%", left: "30%", width: "350px", height: "350px",
        borderRadius: "50%", background: "radial-gradient(circle,rgba(14,165,233,0.12) 0%,transparent 70%)",
        animation: "blob3 18s ease-in-out infinite", filter: "blur(40px)", pointerEvents: "none", zIndex: 0,
      }} />

      {/* Grid overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)`,
        backgroundSize: "40px 40px",
        animation: "gridMove 8s linear infinite",
      }} />

      <Particles />

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <header style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 48px",
        borderBottom: "1px solid rgba(99,102,241,0.12)",
        backdropFilter: "blur(10px)",
        background: "rgba(2,8,24,0.6)",
        animation: "navGlow 4s ease-in-out infinite",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg,#6366f1,#a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(99,102,241,0.5)",
          }}>
            <span style={{ color: "white", fontWeight: 900, fontSize: "18px" }}>T</span>
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: "16px", letterSpacing: "0.02em" }}>
            TradePaper
          </span>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {["Inicio", "Planes", "Soporte"].map((item) => (
            <a
              key={item}
              href="#"
              style={{
                color: "rgba(200,210,230,0.7)", textDecoration: "none",
                fontSize: "14px", fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(200,210,230,0.7)")}
            >
              {item}
            </a>
          ))}
          <button
            onClick={() => router.push("/login")}
            style={{
              background: "linear-gradient(90deg,#16a34a,#22c55e)",
              color: "white", border: "none", borderRadius: "10px",
              padding: "9px 22px", fontSize: "14px", fontWeight: 700,
              cursor: "pointer", boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(34,197,94,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(34,197,94,0.3)"; }}
          >
            Registrarse
          </button>
        </nav>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative", zIndex: 5,
        textAlign: "center", padding: "72px 24px 48px",
        opacity: visible ? 1 : 0,
        animation: visible ? "fadeUp 0.8s ease forwards" : "none",
      }}>
        {/* Decorative top line */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "20px", padding: "6px 16px", marginBottom: "24px",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 8px #22c55e" }}>
          </span>
          <span style={{ color: "rgba(180,190,220,0.9)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.1em" }}>
            TRADING AUTOMATIZADO · LIVE
          </span>
        </div>

        <h1 style={{
          color: "white",
          fontSize: "clamp(32px,5vw,58px)",
          fontWeight: 900,
          margin: "0 0 16px",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          animation: "titleGlow 3s ease-in-out infinite",
        }}>
          Escoge tu bot{" "}
          <span style={{
            background: "linear-gradient(90deg,#6366f1,#a855f7,#0ea5e9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            preferido
          </span>
        </h1>

        <p style={{
          color: "rgba(180,195,220,0.75)",
          fontSize: "clamp(14px,2vw,18px)",
          maxWidth: "520px",
          margin: "0 auto",
          lineHeight: 1.7,
        }}>
          Selecciona entre varios bots para operar en Forex y criptomonedas automáticamente
        </p>
      </section>

      {/* ── BOT CARDS ────────────────────────────────────────────────────────── */}
      <section style={{
        position: "relative", zIndex: 5,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: "16px",
        padding: "0 24px 80px",
        flexWrap: "wrap",
        opacity: visible ? 1 : 0,
        animation: visible ? "fadeUp 1s ease 0.3s forwards" : "none",
      }}>
        {BOTS.map((bot) => (
          <BotCard key={bot.id} bot={bot} onSelect={handleSelect} />
        ))}
      </section>

      {/* Bottom gradient fade */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: "120px",
        background: "linear-gradient(to top,rgba(2,8,24,0.8),transparent)",
        pointerEvents: "none", zIndex: 1,
      }} />
    </div>
  );
}
