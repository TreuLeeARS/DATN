/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cream:    '#FAF7F2',
          blush:    '#F2C4CE',
          charcoal: '#2C2C2C',
          muted:    '#8C8C8C',
          dark:     '#1A1A1A',
          light:    '#FFFFFF',
        },
      },
      fontFamily: {
        sans:    ['"Inter"', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
        '160': '40rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      screens: {
        xs: '475px',
      },
    },
  },
  plugins: [],
}
