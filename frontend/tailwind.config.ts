import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        primary: {
          DEFAULT: '#2563EB',
          dark: '#3B82F6',
        },
        success: {
          DEFAULT: '#16A34A',
          dark: '#22C55E',
        },
        warning: {
          DEFAULT: '#D97706',
          dark: '#F59E0B',
        },
        danger: {
          DEFAULT: '#DC2626',
          dark: '#EF4444',
        },
        status: {
          active: '#16A34A',
          deprecated: '#D97706',
          orphaned: '#7C3AED',
          shadow: '#DC2626',
          zombie: '#7F1D1D',
        },
        risk: {
          critical: '#DC2626',
          high: '#EA580C',
          medium: '#D97706',
          low: '#16A34A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'page-title': ['24px', { fontWeight: '700' }],
        'section-title': ['18px', { fontWeight: '600' }],
        'body': ['14px', { fontWeight: '400' }],
        'label': ['12px', { fontWeight: '500' }],
      },
      borderRadius: {
        card: '12px',
        badge: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
      },
      animation: {
        'pulse-border': 'pulse-border 2s infinite',
      },
      keyframes: {
        'pulse-border': {
          '0%, 100%': { borderColor: 'rgba(220, 38, 38, 0.3)' },
          '50%': { borderColor: 'rgba(220, 38, 38, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
