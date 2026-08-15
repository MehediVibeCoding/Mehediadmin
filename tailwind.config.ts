import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      xs: '359px',
      sm2: '411px',
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1200px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        brand: {
          bg: '#C3DEFC',
          light: '#44A4FB',
          primary: '#0058C7',
          accent: '#005EFC',
          surface: '#FFFFFF',
        },
        ink: '#1A1A1A',
        muted: '#6B7280',
        'surface-muted': '#F3F4F6',
        'border-base': '#E5E7EB',
        gold: '#D4A853',
        success: '#10B981',
        info: '#3B82F6',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', '"Hind Siliguri"', 'sans-serif'],
      },
      boxShadow: {
        sh1: '0 1px 4px rgba(0,0,0,.07)',
        sh2: '0 4px 18px rgba(0,0,0,.10)',
        sh3: '0 8px 36px rgba(0,0,0,.13)',
      },
      borderRadius: {
        brand: '12px',
      },
      transitionTimingFunction: {
        brand: 'cubic-bezier(.4,0,.2,1)',
      },
      transitionDuration: {
        brand: '250ms',
      },
      keyframes: {
        cartJiggle: {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '10%': { transform: 'rotate(-12deg) scale(1.15)' },
          '25%': { transform: 'rotate(10deg) scale(1.12)' },
          '40%': { transform: 'rotate(-8deg) scale(1.08)' },
          '55%': { transform: 'rotate(6deg) scale(1.05)' },
          '70%': { transform: 'rotate(-4deg) scale(1.02)' },
          '85%': { transform: 'rotate(2deg) scale(1.01)' },
        },
        sectionReveal: {
          from: { opacity: '0', transform: 'translateX(-14px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        badgeHotGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,88,199,.45)' },
          '50%': { boxShadow: '0 0 8px 3px rgba(0,88,199,0)' },
        },
        heartbeat: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.35)' },
          '60%': { transform: 'scale(.9)' },
          '80%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      animation: {
        'cart-jiggle': 'cartJiggle .7s cubic-bezier(.36,.07,.19,.97) both',
        'section-reveal': 'sectionReveal .5s cubic-bezier(.4,0,.2,1) both',
        'badge-hot-glow': 'badgeHotGlow 2s ease-in-out infinite',
        heartbeat: 'heartbeat .45s ease forwards',
        ripple: 'ripple .55s linear forwards',
      },
    },
  },
  plugins: [],
};

export default config;
