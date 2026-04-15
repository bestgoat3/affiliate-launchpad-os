/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E5C46A',
          dark: '#A8863C',
        },
        dark: {
          DEFAULT: '#0A0A0A',
          card: '#1A1A1A',
          border: '#2A2A2A',
          hover: '#252525',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.4)',
        gold: '0 0 20px rgba(201,168,76,0.15)',
      },
    },
  },
  plugins: [],
};
