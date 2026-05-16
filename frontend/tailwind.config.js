/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'oklch(18% 0.012 250)',
        paper: 'oklch(99% 0.002 240)',
        steel: 'oklch(54% 0.012 250)',
        line: 'oklch(92% 0.005 250)',
        signal: 'oklch(56% 0.16 252)',
        panel: 'oklch(97% 0.004 250)',
        ember: 'oklch(57% 0.18 35)',
        cobalt: 'oklch(56% 0.16 252)',
        amber: 'oklch(70% 0.14 82)',
        mint: 'oklch(64% 0.13 170)',
      },
      boxShadow: {
        panel: '0 18px 54px oklch(18% 0.012 250 / 0.055)',
        focus: '0 0 0 4px oklch(56% 0.16 252 / 0.13)',
      },
    },
  },
  plugins: [],
}
