import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",   /* used as dark-mode highlight text      */
          400: "#4ade80",   /* used as dark-mode brand text ~7.7:1    */
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",   /* used as dark-mode border (brand-800)   */
          900: "#14532d",   /* used as dark-mode highlight bg         */
          950: "#052e16",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":       "fadeIn 0.3s ease-in-out",
        "slide-up":      "slideUp 0.3s ease-out",
        "marquee":       "marquee 35s linear infinite",
        "ticker-left":   "ticker-left 25s linear infinite",
        "ticker-right":  "ticker-right 25s linear infinite",
        "ping-slow":     "ping 2s cubic-bezier(0,0,0.2,1) infinite",
        "countdown-pulse": "countdown-pulse 1s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        marquee: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "ticker-left": {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "ticker-right": {
          "0%":   { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        "countdown-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.75" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
