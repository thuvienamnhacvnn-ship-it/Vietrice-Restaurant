import type { Config } from 'tailwindcss'

/**
 * VIET RICE design system.
 * Token values are the single source of truth and are mirrored into CSS
 * custom properties in `src/styles/globals.css`.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--c-background) / <alpha-value>)',
        'background-soft': 'rgb(var(--c-background-soft) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        gold: {
          DEFAULT: 'rgb(var(--c-gold) / <alpha-value>)',
          light: 'rgb(var(--c-gold-light) / <alpha-value>)',
          dark: 'rgb(var(--c-gold-dark) / <alpha-value>)',
        },
        cream: 'rgb(var(--c-cream) / <alpha-value>)',
        ink: 'rgb(var(--c-text) / <alpha-value>)',
        muted: 'rgb(var(--c-text-muted) / <alpha-value>)',
        success: 'rgb(var(--c-success) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        warning: 'rgb(var(--c-warning) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        script: ['var(--font-script)', 'cursive'],
      },
      borderColor: {
        gold: 'rgb(var(--c-gold) / <alpha-value>)',
      },
      boxShadow: {
        gold: '0 0 0 1px rgb(var(--c-gold) / 0.25), 0 8px 32px -8px rgb(var(--c-gold) / 0.28)',
        'gold-lg': '0 0 0 1px rgb(var(--c-gold) / 0.4), 0 16px 60px -12px rgb(var(--c-gold) / 0.45)',
        card: '0 20px 60px -24px rgba(0,0,0,0.9)',
      },
      backgroundImage: {
        'gold-gradient':
          'linear-gradient(135deg, rgb(var(--c-gold-dark)) 0%, rgb(var(--c-gold-light)) 45%, rgb(var(--c-gold)) 100%)',
        'dark-fade': 'linear-gradient(180deg, rgba(8,8,6,0) 0%, rgba(8,8,6,0.92) 78%, rgb(8,8,6) 100%)',
      },
      letterSpacing: {
        luxe: '0.18em',
        wide2: '0.3em',
      },
      screens: {
        xs: '420px',
        '3xl': '1800px',
        /**
         * Height-based breakpoint. The 16:9 mockups are 941px tall, but a real
         * browser at that window size only exposes ~800-890px of viewport, so
         * the hero compresses on short screens and keeps full mockup scale on
         * tall ones rather than overflowing.
         */
        short: { raw: '(max-height: 1040px)' },
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'gold-pulse': {
          '0%,100%': { boxShadow: '0 0 0 0 rgb(var(--c-gold) / 0.45)' },
          '50%': { boxShadow: '0 0 0 10px rgb(var(--c-gold) / 0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        /* Never fully off. A true 0 reads as a rendering fault on a dark
           banner; dipping to a quarter still pulls the eye. */
        blink: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
        /* The ticker track holds two copies of the list, so translating by
           exactly -50% lands back on an identical frame — a seamless loop with
           no JS width measuring. */
        ticker: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .6s cubic-bezier(.22,1,.36,1) both',
        'gold-pulse': 'gold-pulse 2.4s ease-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        blink: 'blink 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
