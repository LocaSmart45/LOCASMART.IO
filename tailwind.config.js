/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2A74DA',
          light: '#4A8FED',
          dark: '#1A5AB8',
        },
        secondary: {
          DEFAULT: '#3EC48D',
          light: '#5ED4A3',
          dark: '#2BA573',
        },
        neutral: {
          light: '#FFFFFF',
          DEFAULT: '#F5F7FA',
          dark: '#4A4A4A',
          darker: '#2D3748',
        },
        success: '#3EC48D',
        error: '#EF4444',
        info: '#2A74DA',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'button': '0 2px 8px rgba(42, 116, 218, 0.2)',
        'card': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'hover': '0 6px 16px rgba(42, 116, 218, 0.25)',
      },
      borderRadius: {
        'button': '8px',
      },
    },
  },
  plugins: [],
};
