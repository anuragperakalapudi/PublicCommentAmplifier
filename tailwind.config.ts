import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F7F2E8",
          50: "#FBF8F1",
          100: "#F7F2E8",
          200: "#EFE7D4",
        },
        ink: {
          DEFAULT: "#0E1B33",
          50: "#F2F4F8",
          100: "#E2E6EF",
          400: "#5A647A",
          600: "#2A3553",
          900: "#0E1B33",
        },
        accent: {
          DEFAULT: "#B45309",
          50: "#FEF6E7",
          100: "#FCEAC4",
          500: "#D97706",
          600: "#B45309",
          700: "#92400E",
        },
        forest: {
          DEFAULT: "#15803D",
          50: "#ECFDF3",
          600: "#15803D",
        },
        paper: "#FFFFFF",
        rule: "#E5DDC9",
        muted: "#6B6457",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "Menlo", "monospace"],
      },
      letterSpacing: {
        tightish: "-0.012em",
        tighter: "-0.02em",
      },
      boxShadow: {
        card: "0 1px 0 rgba(14, 27, 51, 0.04), 0 8px 24px -16px rgba(14, 27, 51, 0.08)",
        cardHover:
          "0 1px 0 rgba(14, 27, 51, 0.06), 0 16px 36px -18px rgba(14, 27, 51, 0.18)",
        ring: "0 0 0 4px rgba(180, 83, 9, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 400ms ease-out forwards",
        "fade-up": "fadeUp 500ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
