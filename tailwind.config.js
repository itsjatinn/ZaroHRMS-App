/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#14323F',
        gold: '#F1CE6C',
        cream: '#F4F2ED',
        // Universal page background used across every screen.
        canvas: '#F9F9F9',
      },
    },
  },
  plugins: [],
};
