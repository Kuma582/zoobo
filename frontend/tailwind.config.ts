import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-black': '#09090b',
        'cyber-purple': '#b14bf4',
        'cyber-purple-glow': '#d18bff',
        'cyber-blue': '#00f0ff',
        'cyber-pink': '#ff007f',
        'cyber-gray': '#1f1f22',
        'cyber-gray-light': '#27272a',
        'casino-dark': '#0A0A0A',
        'casino-gold': '#FFC107',
        'casino-orange': '#FF8A00',
        'casino-red': '#FF3D00',
        'casino-green': '#00E676',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
      }
    },
  },
  plugins: [],
} satisfies Config
