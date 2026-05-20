/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Rajdhani", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.16)",
        card: "0 18px 60px rgba(15, 23, 42, 0.08)",
      },
      colors: {
        cricket: {
          grass: "#10b981",
          pitch: "#d97706",
          leather: "#be123c",
          night: "#020617",
          sky: "#0284c7",
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
