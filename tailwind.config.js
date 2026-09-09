/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#34D399',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'serif'],
        body: ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
