"use client";

import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import pcguyAnimation from "@/data/pcguy.json";
import {
  AlertTriangle,
  ShieldCheck,
  BookOpen,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const WARNINGS = [
  {
    icon: AlertTriangle,
    color: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/[0.06]",
    title: "Riesgo de pérdida de capital",
    body: "El trading con dinero real conlleva riesgo significativo. Puedes perder parte o la totalidad de tu inversión.",
  },
  {
    icon: ShieldCheck,
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/[0.06]",
    title: "Practica primero con paper trading",
    body: "Te recomendamos entrenar con dinero ficticio antes de operar con fondos reales. Desarrolla tu estrategia sin riesgo.",
  },
  {
    icon: BookOpen,
    color: "text-purple-400",
    border: "border-purple-500/20",
    bg: "bg-purple-500/[0.06]",
    title: "Sin garantía de ganancias",
    body: "Los resultados pasados no garantizan rendimientos futuros. Los mercados financieros son volátiles e impredecibles.",
  },
  {
    icon: TrendingUp,
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/[0.06]",
    title: "Opera con responsabilidad",
    body: "Solo invierte lo que estás dispuesto a perder. Gestiona tu riesgo con stops y tamaño de posición adecuado.",
  },
];

export default function ManualTradingPage() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-start py-10 px-4">

      {/* ── Two-column layout on large screens ────────────────────────── */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* LEFT — Animation + headline */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/[0.08] border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-blue-400 tracking-wide uppercase">
              Manual Trading
            </span>
          </div>

          {/* Lottie */}
          <div className="w-72 h-72 select-none">
            <Lottie
              animationData={pcguyAnimation}
              loop
              autoplay
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-100 leading-tight tracking-tight">
              Toma el control
              <br />
              <span className="text-blue-400">de tus trades</span>
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              Operas tú directamente. Sin bots, sin automatización.
              Elige el activo, define el monto y ejecuta al instante.
            </p>
          </div>
        </div>

        {/* RIGHT — Warnings + CTA */}
        <div className="flex flex-col gap-4">

          {/* Warning cards */}
          {WARNINGS.map(({ icon: Icon, color, border, bg, title, body }) => (
            <div
              key={title}
              className={`flex items-start gap-4 px-4 py-3.5 rounded-xl border ${border} ${bg} transition-colors`}
            >
              <div className={`mt-0.5 shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200 mb-0.5">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}

          {/* Disclaimer fine print */}
          <p className="text-[11px] text-slate-600 leading-relaxed px-1">
            Al presionar <span className="text-slate-400 font-medium">Iniciar Trading</span> confirmas
            que tienes experiencia en mercados financieros, entiendes los riesgos descritos y
            operas bajo tu propia responsabilidad. Esta plataforma no provee asesoría financiera.
          </p>

          {/* CTA */}
          <button
            onClick={() => router.push("/trade")}
            className="group w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-base font-bold shadow-2xl shadow-blue-600/30 transition-all duration-150 ring-1 ring-blue-500/40 mt-2"
          >
            Iniciar Trading
            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <p className="text-center text-[11px] text-slate-700">
            Tus operaciones manuales están separadas de los bots
          </p>
        </div>
      </div>
    </div>
  );
}
