import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", preload: false, display: "swap" });

export const metadata: Metadata = {
  title: "TradePaper - Paper Trading Platform",
  description: "Professional paper trading platform with real-time market data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#0F172A] text-slate-200 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
