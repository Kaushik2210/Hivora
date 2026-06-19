import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: 'var(--color-brand)',
        'brand-dark': 'var(--color-brand-dark)',
        'brand-light': 'var(--color-brand-light)',
      },
      backgroundColor: {
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
      },
      borderColor: {
        DEFAULT: 'var(--color-border)',
      },
      textColor: {
        DEFAULT: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
      },
    },
  },
  plugins: [],
} satisfies Config
