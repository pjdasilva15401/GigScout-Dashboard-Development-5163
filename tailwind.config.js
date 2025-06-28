/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2D5A5A',
        accent: '#FF6B6B',
        'primary-light': '#3A6E6E',
        'primary-dark': '#1F4040',
        'accent-light': '#FF8A8A',
        'accent-dark': '#E55555',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}