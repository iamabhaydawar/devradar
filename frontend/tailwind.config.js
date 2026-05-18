/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
      colors: {
        // ── Necto Mono palette ──────────────────────
        bg:      '#0f0f0f',
        s1:      '#1c1c1c',
        s2:      '#252525',
        s3:      '#2e2e2e',
        txt:     '#f0f0ee',
        muted:   '#888880',
        dim:     '#555550',
        lime:    '#d4f53c',
        'lime-bg':  '#1a2200',
        'lime-dim': '#8aaa18',
        warn:    '#ea9d34',
        'warn-bg':  '#2a1500',
        err:     '#e08080',
        'err-bg':   '#2a0808',
        bd:      'rgba(255,255,255,0.07)',
        bd2:     'rgba(255,255,255,0.12)',
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
        btn:  '30px',
      },
    },
  },
  plugins: [],
}
