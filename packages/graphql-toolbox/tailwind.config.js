module.exports = {
  content: ["./src/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      height: {
        "content-container": "calc(100vh - 4rem)",
        "favorite": "30rem",
      },
      width: {
        "editor-container": "calc(100% - (24rem + 24rem))",
        "login": "30rem",
      },
      colors: {
        draculaDark: "#282A36",
        contentBlue: "#F6F7FA",
      },
    },
  },
  plugins: [],
}