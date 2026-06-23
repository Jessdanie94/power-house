/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jdv-dark': '#09090b',
        'jdv-card': '#18181b',
        'jdv-border': '#27272a',
        'jdv-blue': '#38bdf8',
        'jdv-green': '#10b981',
        'jdv-gold': '#fbbf24',
        'jdv-red': '#ef4444',
      },
    },
  },
  plugins: [],
}
