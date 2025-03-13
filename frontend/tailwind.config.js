/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        Main: "#948F78",
        Main_hover: "#86816b",
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
      },
      animation: {
        "slide-up": "slide-up 2s cubic-bezier(0.22, 1, 0.36, 1)",
        "spin-once": "rotate-360 0.3s ease-in-out",
      },
    },
  },
  plugins: [],
};
