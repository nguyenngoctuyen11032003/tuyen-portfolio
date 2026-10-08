/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#34D399',
        ink: '#F4F1EA',
      },
      // Mirrors the type tokens in src/index.css (:root).
      fontFamily: {
        serif: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
        wordmark: ['var(--font-wordmark)'],
      },
    },
  },
  plugins: [],
};
