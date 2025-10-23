/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './example/**/*.{js,ts,jsx,tsx}',
    './packages/**/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: [require('@tailwindcss/typography')]
}
