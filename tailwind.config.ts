import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:     "#0a0a0c",
        surface: {
          DEFAULT: "#111113",
          2: "#18181b",
          3: "#222226",
          border: "#27272a",
        },
        gold: {
          DEFAULT: "#e8a33d",
          dim: "rgba(232,163,61,0.15)",
          500: "#e8a33d",
          600: "#c9821f",
        },
        zinc: {
          850: "#1e1e22",
          925: "#111113",
          950: "#0a0a0c",
        },
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"],
        sans:    ["Inter", "sans-serif"],
        grotesk: ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        "cell": "0 2px 8px rgba(0,0,0,0.5)",
        "popover": "0 16px 48px rgba(0,0,0,0.7)",
      },
      animation: {
        fadeIn:  "fadeIn 0.2s ease both",
        scaleIn: "scaleIn 0.2s cubic-bezier(.34,1.56,.64,1) both",
        slideUp: "slideUp 0.25s ease both",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity:"0", transform:"translateY(6px)" }, "100%": { opacity:"1", transform:"translateY(0)" } },
        scaleIn: { "0%": { opacity:"0", transform:"scale(0.94)" },     "100%": { opacity:"1", transform:"scale(1)" } },
        slideUp: { "0%": { opacity:"0", transform:"translateY(20px)" },"100%": { opacity:"1", transform:"translateY(0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
