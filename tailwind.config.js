/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  corePlugins: {
    preflight: false, // Keep existing Kostku custom styles intact
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
