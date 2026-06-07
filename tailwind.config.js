/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'accent-gold': '#d4af37',
        'accent-gold-hover': '#f1c944',
        'bg-color': '#0a0a0c',
        'surface-color': '#16161a',
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
