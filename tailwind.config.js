/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a0f',
          900: '#121218',
          800: '#1f1f2b',
          700: '#2d2d3d',
          600: '#4b4b63',
          500: '#6e6e8f',
          400: '#9898b0',
          300: '#c5c5d2',
          200: '#e1e1e8',
          100: '#f4f4f7',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#e1e1e8',
            a: {
              color: '#60a5fa',
              '&:hover': {
                color: '#93c5fd',
              },
            },
          },
        },
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
      },
      animation: {
        gradient: 'gradient 8s ease infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};