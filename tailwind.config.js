module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        brand: { light: '#f0fdf4', DEFAULT: '#16a34a', dark: '#14532d' },
        surface: { light: '#ffffff', dark: '#121212' }
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: { 'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)' }
    },
  },
  plugins: [],
}
