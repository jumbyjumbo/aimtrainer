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
      },
      animation: {
        fadeOutGain: 'fadeOut 500ms ease-out forwards',
        fadeOutLoss: 'fadeOut 1000ms ease-out forwards',
      },
      backgroundImage: {
        'bliss': "url('/bliss.jpg')",
      },
    },
  },
  plugins: [],
};
