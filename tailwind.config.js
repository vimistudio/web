/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "#fbfafa",
        foreground: "#111111",
        primary: {
          DEFAULT: "#909af7",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#111111",
          foreground: "#ffffff",
        },
      },
      fontSize: {
        "8xl": "160px",
      },
      padding: {
        safe: "env(safe-area-inset-bottom)",
      },
    },
  },
}

