import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        casino: {
          dark: "#080b11",
          card: "#0f1422",
          cardHover: "#151b2e",
          border: "#1e293b",
          gold: "#f59e0b",
          goldLight: "#fbbf24",
          emerald: "#10b981",
        },
      },
      boxShadow: {
        "gold-glow": "0 0 20px rgba(245, 158, 11, 0.35)",
        "emerald-glow": "0 0 20px rgba(16, 185, 129, 0.35)",
        "rose-glow": "0 0 20px rgba(244, 63, 94, 0.35)",
        "cyan-glow": "0 0 20px rgba(6, 182, 212, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
