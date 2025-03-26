/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        Main: "#a7a28f",
        Main_hover: "#8f8a7a",
      },
      keyframes: {
        "slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(100px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "rotate-360": {
          "0%": {
            transform: "rotate(0deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
          },
        },
        "bounce-diagonal": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(4px, -4px)" },
        },
      },
      animation: {
        "slide-up": "slide-up 2s cubic-bezier(0.22, 1, 0.36, 1)",
        "spin-once": "rotate-360 0.3s ease-in-out",
        "bounce-diagonal": "bounce-diagonal 0.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
