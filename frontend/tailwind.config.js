/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Themed off the CSS variables defined in src/index.css so the
      // "warm paper + ink + one restrained accent" palette stays single-source.
      colors: {
        paper: "var(--paper)",
        "paper-raised": "var(--paper-raised)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        line: "var(--line)",
        accent: "var(--accent)",
        danger: "var(--danger)",
      },
      fontFamily: {
        display: ['"Fraunces"', "serif"],
        sans: ['"Hanken Grotesk"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      keyframes: {
        "reveal-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "reveal-up": "reveal-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};
