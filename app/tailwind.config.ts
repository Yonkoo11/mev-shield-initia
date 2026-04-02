import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        shield: {
          bg: "#0a0b10",
          "bg-light": "#12141a",
          card: "#12121a",
          border: "#1e1e2e",
          accent: "#00d4aa",
          accentDim: "#00d4aa33",
          cyan: "#06b6d4",
          "cyan-dim": "rgba(6, 182, 212, 0.15)",
          coral: "#f97316",
          "coral-dim": "rgba(249, 115, 22, 0.15)",
          red: "#ff4757",
          yellow: "#ffa502",
          text: "#e4e4e7",
          muted: "#71717a",
        },
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
      },
      animation: {
        "ring-draw": "ring-draw 1s ease-out forwards",
      },
      keyframes: {
        "ring-draw": {
          "0%": { strokeDashoffset: "283" },
          "100%": { strokeDashoffset: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
