// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        meet: {
          bg: '#202124',
          surface: '#292a2d',
          elevated: '#3c4043',
          text: '#e8eaed',
          'text-secondary': '#9aa0a6',
          accent: '#8ab4f8',
          danger: '#ea4335',
          'danger-hover': '#d93025',
          border: '#5f6368',
        }
      }
    }
  },
  plugins: [],
};
