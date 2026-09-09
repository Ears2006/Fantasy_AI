/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#08090b',
          900: '#0c0e11',
          850: '#101317',
          800: '#14181d',
          750: '#191e24',
          700: '#1e242b',
          600: '#283039',
          500: '#3a444f',
        },
        neon: {
          50: '#fff1f1',
          100: '#ffdcdc',
          200: '#ffb3b3',
          300: '#ff8585',
          400: '#ff5a5a',
          500: '#e63946',
          600: '#cc2f3b',
          700: '#a82630',
          800: '#7d1c24',
          900: '#521216',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-quick': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'fade-in-quick': 'fade-in-quick 0.2s ease-out both',
        'slide-in-left': 'slide-in-left 0.25s ease-out both',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
};
