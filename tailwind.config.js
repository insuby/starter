import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#ffb443',
          white: '#fff',
          purpule: '#876aff',
          'violet-60': '#9159e0',
          'violet-50': '#a565ff',
          'violet-20': '#e9e0ff',
          'violet-10': '#f3f1ff',
          'green-50': '#5bb678',
          'green-40': '#51d079',
          'green-10': '#dffde9',
          'red-50': '#ff495f',
          'red-10': '#ffe9eb',
          'gray-95': '#232325',
          'gray-80': '#323036',
          'gray-70': '#4d4d52',
          'gray-50': '#929399',
          'gray-40': '#afb1b8',
          'gray-20': '#e6e8ed',
          'gray-15': '#eef0f5',
          'gray-10': '#f5f7fc',
        },
      },
      borderRadius: {
        'brand-16': '16px',
        'brand-32': '32px',
        'brand-100': '100px',
      },
    },
  },
  plugins: [
    plugin(({ addUtilities, addComponents }) => {
      addUtilities({
        '.flex-center': {
          '@apply flex items-center justify-center': '',
        },
      });
    }),
  ],
};
