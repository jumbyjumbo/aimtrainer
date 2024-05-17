/** @type {import('tailwindcss').Config} */

const shadowOpacity = 1;
const pixelSize = 8; // Variable for pixel size


module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        helvetica: ['helvetica', 'sans-serif'],
      },
      keyframes: {
        fadeOut: {
          '0%': { opacity: '0.9' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        flash: {
          '0%, 100%': { opacity: 0 },
          ' 10%, 90%': { opacity: 1 }
        },
      },
      animation: {
        fadeOutGain: 'fadeOut 500ms ease-out forwards',
        fadeOutLoss: 'fadeOut 1200ms ease-out forwards',
        slideUp: 'slideUp 150ms ease-in-out forwards',
        slideDown: 'slideDown 150ms ease-in-out forwards',
        slideLeft: 'slideLeft 300ms ease-in-out forwards',
        slideRight: 'slideRight 300ms ease-in-out forwards',
        flash: 'flash 5s infinite',
      },
      backgroundImage: {
        'bliss': "url('/bliss.jpg')",
        'daymoon': "url('/daymoon.png')",
        'sunset': "url('/sunset.png')",
        'xp': "linear-gradient(90deg, rgba(0,177,255,0.2) 0%, rgba(0,82,255,0.3) 100%)",
      },
      boxShadow: {
        'topshadow': `0px -${pixelSize}px ${pixelSize}px rgba(0, 0, 0, ${shadowOpacity})`,
        'bottomshadow': `0px ${pixelSize}px ${pixelSize}px rgba(0, 0, 0, ${shadowOpacity})`,
        'centershadow': `0px 0px ${pixelSize}px rgba(0, 0, 0, ${shadowOpacity})`,
      },
    },
  },
  plugins: [],
};
