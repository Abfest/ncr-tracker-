import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── SQS Brand Colors ──────────────────────────────────────────
      colors: {
        sqs: {
          // Primary blues from brand kit
          bright:  "#00B2FF",   // Primary sky blue
          mid:     "#2684FF",   // Medium blue
          deep:    "#0D47A1",   // Deep navy
          // Backgrounds
          dark:    "#0B1320",   // Main dark bg
          darker:  "#070D17",   // Deeper bg
          surface: "#0F1C30",   // Card/surface
          border:  "#1A2E4A",   // Border color
          // Text
          muted:   "#A8B3C7",   // Muted text
          white:   "#FFFFFF",   // Primary text
        },
      },
      // ── Poppins Font ──────────────────────────────────────────────
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      // ── Background gradients ──────────────────────────────────────
      backgroundImage: {
        "sqs-gradient": "linear-gradient(135deg, #00B2FF 0%, #2684FF 50%, #0D47A1 100%)",
        "sqs-dark": "linear-gradient(135deg, #0B1320 0%, #0F1C30 100%)",
        "sqs-glow": "radial-gradient(ellipse at top, rgba(0, 178, 255, 0.15) 0%, transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
