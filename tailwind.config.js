/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './example/src/**/*.{js,ts,jsx,tsx}', './packages/**/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {}
  },
  plugins: [require('@tailwindcss/typography')]
}
