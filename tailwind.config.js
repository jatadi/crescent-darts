/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        flash: {
          '0%, 100%': { opacity: 0 },
          '50%': { opacity: 1 },
        },
        firework: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: 1 },
          '100%': { transform: 'translateY(-100vh) scale(0)', opacity: 0 },
        },
        'victory-particle': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: 1 },
          '100%': { transform: 'translateY(-100vh) scale(0)', opacity: 0 },
        },
      },
      animation: {
        flash: 'flash 1s ease-in-out',
        firework: 'firework 1s ease-out forwards',
        'victory-particle': 'victory-particle 2s ease-out infinite',
      },
    },
  },
  plugins: [],
} 