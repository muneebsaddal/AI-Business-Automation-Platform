/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#06235f',
        paper: '#f8fbff',
        steel: '#5d6f8f',
        line: '#bfd4ff',
        signal: '#1f5cff',
        panel: '#eef5ff',
        ember: '#b45309',
      },
      boxShadow: {
        panel: '0 18px 50px rgba(31, 92, 255, 0.09)',
      },
    },
  },
  plugins: [],
}
