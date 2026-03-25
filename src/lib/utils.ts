import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number, symbol = "$"): string {
  return `${symbol}${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPct(value: number): string {
  const n = Number(value);
  const sign = n >= 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(2)}%`;
}

export function formatPctDirect(value: number): string {
  const n = Number(value);
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatNumber(value: number, decimals = 2): string {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
