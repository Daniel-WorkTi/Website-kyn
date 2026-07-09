import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#22c55e",
          dim: "rgba(34, 197, 94, 0.12)",
          glow: "rgba(34, 197, 94, 0.35)"
        }
      },
      boxShadow: {
        sidebar: "inset -1px 0 0 rgba(255,255,255,0.06), 4px 0 24px rgba(0,0,0,0.4)"
      }
    }
  },
  plugins: []
};

export default config;
