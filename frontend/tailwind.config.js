/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        "paper-raised": "var(--paper-raised)",
        "paper-card": "var(--paper-card)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        line: "var(--line)",
        accent: "var(--accent)",
        "accent-dark": "var(--accent-dark)",
        danger: "var(--danger)",
        success: "var(--success)",
        warning: "var(--warning)",
        purple: "var(--purple)",
      },
      fontFamily: {
        display: ['"Inter"', '"Fraunces"', "serif"],
        sans:    ['"Inter"', '"Hanken Grotesk"', "sans-serif"],
        mono:    ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      keyframes: {
        "reveal-up": {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "reveal-up": "reveal-up 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in":   "fade-in 0.4s ease-out forwards",
        "spin-slow": "spin 3s linear infinite",
      },
      backgroundImage: {
        "gradient-blue": "linear-gradient(135deg, #1f6feb 0%, #4493f8 100%)",
      },
    },
  },
  plugins: [],
};
