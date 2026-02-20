/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1", // Indigo 500
        "primary-foreground": "#ffffff",
        secondary: "#f1f5f9", // Slate 100
        "secondary-foreground": "#0f172a",
        accent: "#f8fafc", // Slate 50
        "accent-foreground": "#0f172a",
        background: "#ffffff",
        foreground: "#0f172a",
      },
      boxShadow: {
        'glass-card': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'glass-card-hover': '0 4px 12px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
