// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm light palette aligned with the landing page
        ll: {
          bg: '#fdf8f4',           // warm off-white page background
          surface: '#ffffff',       // card/panel surfaces
          'surface-alt': '#fff7f0', // subtle warm tinted surface
          elevated: '#f3ece5',      // input backgrounds, hover fills
          text: '#1a1a1a',          // primary text (near black)
          'text-secondary': '#6b6b6b', // secondary/muted text
          accent: '#FF9839',        // primary orange accent (from landing)
          'accent-hover': '#e88a2d', // accent hover
          'accent-dark': '#D97500', // deeper orange for CTA buttons (from landing)
          danger: '#dc3545',        // error/danger red
          'danger-hover': '#c82333',
          border: '#e8ddd4',        // subtle warm border
          'border-strong': '#d4c5b5', // stronger borders
        }
      }
    }
  },
  plugins: [],
};
