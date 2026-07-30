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
        // Universal page background used across every screen — matches the
        // web dashboard's --background (#f7f6fc).
        canvas: '#F7F6FC',
      },
    },
  },
  plugins: [],
};
