/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          DEFAULT: '#f1e6c8',
          dark: '#e8d9b0',
        },
        ink: '#2b1d13',
        maroon: {
          DEFAULT: '#9e1b2e',
          dark: '#5c0f1a',
          darker: '#3a0910',
        },
        gold: '#a9862f',
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        deco: ['"Cinzel Decorative"', 'Georgia', 'serif'],
        body: ['"EB Garamond"', 'Garamond', 'serif'],
      },
    },
  },
  plugins: [],
};
