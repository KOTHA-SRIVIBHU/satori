/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        satori: {
          dark: "#0a0a0c",     // Deep Charcoal
          card: "#121217",     // Card Background
          accent: "#8b5cf6",   // Vibrant Purple (Neon)
          text: "#f3f4f6",     // Soft White
          muted: "#9ca3af"     // Gray text
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
