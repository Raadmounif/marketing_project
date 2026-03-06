/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tobacco: {
          950: '#1A0F0A',
          900: '#2D1B13',
          800: '#3D2B1F',
          700: '#5C3D2E',
          600: '#7A5140',
          500: '#9A6652',
        },
        gold: {
          400: '#E8C97A',
          500: '#C9A84C',
          600: '#A8892E',
        },
        cream: {
          50: '#FDF6EC',
          100: '#F5E6D3',
          200: '#EDD4B5',
        },
        forest: {
          600: '#4A7C59',
          700: '#2D5A3E',
        },
      },
      fontFamily: {
        arabic: ['Tajawal', 'Cairo', 'sans-serif'],
        latin: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
