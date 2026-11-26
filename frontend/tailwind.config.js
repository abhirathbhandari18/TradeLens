/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: "#0B0F19",
          surface: "#111827",
          card: "#161F30",
          cardHover: "#1C273C",
          border: "#1F293D",
          borderLight: "#2E3D59",
          gain: "#10B981",
          gainMuted: "rgba(16, 185, 129, 0.12)",
          loss: "#EF4444",
          lossMuted: "rgba(239, 68, 68, 0.12)",
          primary: "#3B82F6",
          text: "#F9FAFB",
          muted: "#94A3B8"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
