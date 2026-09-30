/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['Oswald', '"Arial Narrow"', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        arena: {
          void:    '#05070F',
          panel:   '#0B1120',
          panel2:  '#121A2E',
          border:  '#1B2540',
          border2: '#243356',
          red:     '#E11D48',
          blue:    '#38BDF8',
          gold:    '#F5B942',
          green:   '#10b981',
          text:    '#E2E8F4',
          dim:     '#8B9ABB',
          mute:    '#4A5878',
        },
      },
    },
  },
  plugins: [],
}
