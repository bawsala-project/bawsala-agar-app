import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        heading: ["var(--font-display)"],
        body: ["var(--font-body)"],
        sans: ["var(--font-body)"],
        wordmark: ["var(--font-wordmark)"],
      },
      lineHeight: {
        headline: "1.15",
        tight: "1.25",
        body: "1.75",
      },
      colors: {
        // Bawsala Visual Redesign Tokens (Dark Theme Only)
        "deep-navy": "var(--deep-navy)",
        "midnight": "var(--midnight)",
        "dusty-blue": "var(--dusty-blue)",
        "mist": "var(--mist)",
        "buttercream": "var(--buttercream)",

        // Preserved compatibility tokens
        bone: {
          DEFAULT: "var(--bone)",
          soft: "var(--bone-soft)",
          deep: "var(--bone-deep)",
        },
        paper: "var(--paper)",
        charcoal: {
          DEFAULT: "var(--charcoal)",
          soft: "var(--charcoal-soft)",
        },
        ink: "var(--ink)",
        bronze: {
          DEFAULT: "var(--bronze)",
          light: "var(--bronze-light)",
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
        },
        ok: "var(--ok)",
        warn: "var(--warn)",
        danger: "var(--danger)",
        brand: {
          50: "var(--midnight)",
          100: "var(--midnight)",
          900: "var(--buttercream)",
          accent: "var(--buttercream)",
          accentHover: "var(--mist)",
        },
      },
      borderRadius: {
        "r-sm": "var(--r-sm, 12px)",
        "r-md": "var(--r-md, 16px)",
        "r-lg": "var(--r-lg, 24px)",
        sm: "var(--r-sm, 12px)",
        md: "var(--r-md, 16px)",
        lg: "var(--r-lg, 24px)",
        card: "var(--radius-card, 28px)",
        pill: "var(--radius-pill, 999px)",
      },
      spacing: {
        "section-gap": "var(--section-gap, 80px)",
        "card-padding": "var(--card-padding, 40px)",
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        card: "var(--shadow-card)",
        soft: "var(--shadow-soft)",
        "shadow-soft": "var(--shadow-soft)",
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      },
      transitionTimingFunction: {
        entrance: "cubic-bezier(0.22, 1, 0.36, 1)",
        transition: "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      transitionDuration: {
        micro: "200ms",
        standard: "600ms",
        hero: "1200ms",
      },
    },
  },
  plugins: [],
};

export default config;

