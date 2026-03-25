import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        surface: {
          DEFAULT: "#060D18",
          card: "#0D1626",
          elevated: "#112035",
          border: "rgba(255,255,255,0.07)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-inter)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
