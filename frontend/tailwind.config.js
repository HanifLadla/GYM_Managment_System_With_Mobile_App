/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
      },
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        // Dark mode base — low specificity, won't override any utility class
        '.dark': {
          'color': '#f3f4f6',
          'background-color': '#111827',
        },
        '.dark h1, .dark h2, .dark h3, .dark h4, .dark h5, .dark h6': {
          'color': '#ffffff',
        },
        '.dark p': {
          'color': '#e5e7eb',
        },
        '.dark label': {
          'color': '#d1d5db',
        },
        '.dark th': {
          'color': '#e5e7eb',
        },
        '.dark td': {
          'color': '#f3f4f6',
        },
        '.dark input, .dark select, .dark textarea': {
          'color': '#ffffff',
        },
        '.dark input::placeholder, .dark textarea::placeholder': {
          'color': '#6b7280',
        },
      });
    },
  ],
}
