import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          400: 'rgb(var(--brand-400) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)'
        },
        ink: {
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)'
        },
        canvas: 'rgb(var(--bg-canvas) / <alpha-value>)',
        surface: 'rgb(var(--bg-surface) / <alpha-value>)',
        elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
        hairline: 'rgb(var(--border-hairline) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace']
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '22px' }],
        md: ['16px', { lineHeight: '24px' }],
        lg: ['20px', { lineHeight: '28px' }],
        xl: ['28px', { lineHeight: '36px' }],
        '2xl': ['40px', { lineHeight: '48px' }],
        '3xl': ['56px', { lineHeight: '64px' }]
      },
      spacing: {
        '4.5': '18px'
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px'
      },
      boxShadow: {
        sm: '0 1px 2px rgba(15,18,38,0.04)',
        md: '0 8px 24px -8px rgba(15,18,38,0.10)',
        lg: '0 24px 60px -16px rgba(124,92,255,0.18)',
        glow: '0 0 0 4px rgba(124,92,255,0.16)',
        ring: '0 0 0 1px rgba(15,18,38,0.06)'
      },
      backdropBlur: {
        glass: '20px'
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      },
      transitionDuration: {
        fast: '120ms',
        base: '220ms',
        slow: '420ms'
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7C5CFF 0%, #4FA8FF 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(124,92,255,0.12) 0%, rgba(79,168,255,0.12) 100%)'
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.04)', opacity: '1' }
        },
        beam: {
          '0%': { transform: 'translateX(-30%) translateY(-20%) rotate(20deg)' },
          '100%': { transform: 'translateX(40%) translateY(30%) rotate(20deg)' }
        }
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        'fade-in-up': 'fade-in-up 420ms cubic-bezier(0.22,1,0.36,1) both',
        breathe: 'breathe 2.4s ease-in-out infinite',
        beam: 'beam 14s ease-in-out infinite alternate'
      }
    }
  },
  plugins: []
} satisfies Config
