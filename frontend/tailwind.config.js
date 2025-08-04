/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'finance-dark': '#0f172a',
        'finance-card': '#1e293b',
        'finance-accent': '#3b82f6',
        'finance-green': '#10b981',
        'finance-red': '#ef4444',
        'finance-yellow': '#f59e0b',
        'finance-purple': '#8b5cf6',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
