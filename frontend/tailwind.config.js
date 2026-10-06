/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)'],
        display: ['var(--font-display)'],
        sans: ['var(--font-body)'],
      },
      colors: {
        arena: {
          void:    'var(--c-void)',
          panel:   'var(--c-panel)',
          panel2:  'var(--c-panel2)',
          border:  'var(--c-border)',
          border2: 'var(--c-border2)',
          red:     'var(--c-red)',
          blue:    'var(--c-blue)',
          gold:    'var(--c-gold)',
          green:   'var(--c-green)',
          text:    'var(--c-text)',
          dim:     'var(--c-text-dim)',
          mute:    'var(--c-text-mute)',
        },
      },
    },
  },
  plugins: [],
}
