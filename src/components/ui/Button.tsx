import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "success" | "ghost" | "outline" | "subtle";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses = {
  primary:
    "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-600/40 text-white shadow-sm shadow-blue-900/30",
  danger:
    "bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-red-600/40 text-white shadow-sm shadow-red-900/30",
  success:
    "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-emerald-600/40 text-white shadow-sm shadow-emerald-900/30",
  ghost:
    "bg-transparent hover:bg-white/[0.06] active:bg-white/[0.04] text-slate-400 hover:text-slate-200",
  outline:
    "bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/[0.04] text-slate-300 hover:text-slate-100",
  subtle:
    "bg-white/[0.06] hover:bg-white/[0.09] active:bg-white/[0.05] text-slate-300 hover:text-slate-100",
};

const sizeClasses = {
  xs: "px-2.5 py-1 text-xs",
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-lg",
          "transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1 focus:ring-offset-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
