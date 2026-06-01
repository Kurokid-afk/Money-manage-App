/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        surface: "#f6f8fb",
        ink: "#0f172a",
        muted: "#64748b"
      },
      borderRadius: {
        card: "20px"
      }
    }
  },
  plugins: []
};
