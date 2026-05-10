/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15110d',
        paper: '#f7f3ea',
        steel: '#53616f',
        line: '#d8d0c2',
        signal: '#0f766e',
        ember: '#b45309',
      },
      boxShadow: {
        panel: '0 18px 50px rgba(21, 17, 13, 0.08)',
      },
    },
  },
  plugins: [],
}
