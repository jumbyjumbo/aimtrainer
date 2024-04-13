/** @type {import('tailwindcss').Config} */

const shadowOpacity = 0.25;
const pixelSize = 15; // Variable for pixel size


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
          '0%': { opacity: '1' },
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
      },
      animation: {
        fadeOutGain: 'fadeOut 500ms ease-out forwards',
        fadeOutLoss: 'fadeOut 1000ms ease-out forwards',
        slideUp: 'slideUp 150ms ease-in-out forwards',
        slideDown: 'slideDown 150ms ease-in-out forwards',
      },
      backgroundImage: {
        'bliss': "url('/bliss.jpg')",
        'daymoon': "url('/daymoon.png')",
        'sunset': "url('/sunset.png')",
        'xp': "linear-gradient(90deg, rgba(0,177,255,0.2) 0%, rgba(0,82,255,0.3) 100%)",
      },
      boxShadow: {
        'circular': `0 0 ${pixelSize}px rgba(0, 0, 0, ${shadowOpacity})`,
        'simple': `0 0 ${pixelSize * 6}px rgba(0, 0, 0, ${shadowOpacity})`,
        'simpleinset': `inset 0 0 ${pixelSize}px rgba(0, 0, 0, ${shadowOpacity * 3})`,
        'topshadow': `0px -${pixelSize}px ${pixelSize}px rgba(0, 0, 0, ${shadowOpacity})`,
        'bottomshadow': `0px ${pixelSize}px ${pixelSize}px rgba(0, 0, 0, ${shadowOpacity})`,
        'leftshadow': `-${pixelSize}px 0px ${pixelSize}px rgba(0, 0, 0, ${shadowOpacity})`,
        'rightshadow': `${pixelSize}px 0px ${pixelSize}px rgba(0, 0, 0, ${shadowOpacity})`,
        'fullshadow': `0px -${pixelSize * 0.5}px ${pixelSize * 0.5}px rgba(0, 0, 0, ${shadowOpacity * 0.5}), 0px ${pixelSize * 0.5}px ${pixelSize * 0.5}px rgba(0, 0, 0, ${shadowOpacity * 0.5})`,
        'topinsetshadow': `inset 0px ${pixelSize}px ${pixelSize}px rgba(0, 0, 0, ${shadowOpacity})`,
        'bottominsetshadow': `inset 0px -${pixelSize}px ${pixelSize}px rgba(0, 0, 0, ${shadowOpacity})`,
        'doubleinsteshadow': `inset 0px ${pixelSize}px ${pixelSize}px rgba(0, 0, 0, ${shadowOpacity}), inset 0px -${pixelSize}px ${pixelSize}px rgba(0, 0, 0, ${shadowOpacity})`,
      },
    },
  },
  plugins: [],
};
