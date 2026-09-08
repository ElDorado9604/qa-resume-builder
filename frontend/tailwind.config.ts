import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F6F7F9",
        panel: "#FFFFFF",
        ink: {
          DEFAULT: "#12151B",
          soft: "#4B5160",
          faint: "#8A8F9C",
        },
        line: "#E2E5EA",
        pass: {
          DEFAULT: "#1F6F5C",
          soft: "#E7F1EE",
          strong: "#154D40",
        },
        signal: {
          DEFAULT: "#C77D2E",
          soft: "#F7ECDD",
          strong: "#9A5F1F",
        },
        fail: {
          DEFAULT: "#B4432F",
          soft: "#FBEAE7",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-data)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "check-in": {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "60%": { opacity: "1", transform: "scale(1.08)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "panel-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "check-in": "check-in 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "panel-in": "panel-in 0.28s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
