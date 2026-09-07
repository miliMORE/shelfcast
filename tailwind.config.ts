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
        brand: {
          50: "#f4f5fb",
          100: "#e8eaf6",
          200: "#cfd3eb",
          300: "#a8afd6",
          400: "#7c84b8",
          500: "#4f568f",
          600: "#1e3a5f",
          700: "#162d4a",
          800: "#0f172a",
          900: "#1e1b4b",
          950: "#0a0a1a",
        },
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px rgb(30 27 75 / 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;