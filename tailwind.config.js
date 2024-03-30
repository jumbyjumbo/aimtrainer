/** @type {import('tailwindcss').Config} */
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
        'xp': "linear-gradient(90deg, rgba(0,177,255,0.45) 0%, rgba(0,82,255,0.75) 100%)",
      },
    },
  },
  plugins: [],
};
