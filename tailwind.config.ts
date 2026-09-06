import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
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
          light: '#44A7FC',
          'light-hover': '#3C93DE',
          primary: '#0058C7',
          accent: '#005EFC',
          surface: '#FFFFFF',
          'dark-bg': '#0B111E',
          'dark-surface': '#131D31',
          'dark-card': '#182339',
          'dark-border': '#22324D',
        },
        ink: '#1A1A1A',
        muted: '#6B7280',
        'surface-muted': '#F3F4F6',
        'border-base': '#E5E7EB',
        gold: '#D4A853',
        success: '#10B981',
        info: '#3B82F6',
        danger: '#E63946',
        warn: '#F59E0B',
      },
      fontFamily: {
        display: ['var(--font-display)', '"Playfair Display"', 'serif'],
        body: ['var(--font-dm-sans)', '"DM Sans"', "'Noto Sans Bengali'", 'var(--font-bengali)', '"Hind Siliguri"', 'sans-serif'],
      },
      boxShadow: {
        sh1: '0 1px 4px rgba(0,0,0,.07)',
        sh2: '0 4px 18px rgba(0,0,0,.10)',
        sh3: '0 8px 36px rgba(0,0,0,.13)',
        glass: '0 8px 32px rgba(68,167,252,.12), 0 1.5px 4px rgba(68,167,252,.06)',
      },
      borderRadius: {
        brand: '12px',
      },
      backgroundImage: {
        'brand-grad': 'linear-gradient(135deg, #44A7FC 0%, #0058C7 100%)',
        'sidebar-grad': 'linear-gradient(165deg, rgba(255,255,255,0.92) 0%, rgba(243,248,255,0.85) 100%)',
        'topbar-grad': 'linear-gradient(135deg, #0058C7, #003D8F)',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(.4,0,.2,1)',
        brand: 'cubic-bezier(.4,0,.2,1)',
      },
      transitionDuration: {
        DEFAULT: '250ms',
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
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.04)' },
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
        liquidWobble: {
          '0%, 100%': { transform: 'scaleX(1)' },
          '25%': { transform: 'scaleX(.93)' },
          '50%': { transform: 'scaleX(1.06)' },
          '75%': { transform: 'scaleX(.97)' },
        },
        softFadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        statLiveSweep: {
          '0%': { transform: 'translateX(140%)' },
          '100%': { transform: 'translateX(-160%)' },
        },
        weatherFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(10px)' },
        },
        weatherIconBob: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-4px) rotate(-4deg)' },
        },
      },
      animation: {
        'cart-jiggle': 'cartJiggle .7s cubic-bezier(.36,.07,.19,.97) both',
        'section-reveal': 'sectionReveal .5s cubic-bezier(.4,0,.2,1) both',
        'badge-hot-glow': 'badgeHotGlow 2.2s ease-in-out infinite',
        heartbeat: 'heartbeat .45s ease forwards',
        ripple: 'ripple .55s linear forwards',
        'liquid-wobble': 'liquidWobble .65s ease-in-out',
        'soft-fade-in': 'softFadeIn .35s ease-out both',
        'stat-live-sweep': 'statLiveSweep 2.4s ease-in-out infinite',
        'weather-float': 'weatherFloat 6s ease-in-out infinite',
        'weather-icon-bob': 'weatherIconBob 3s ease-in-out infinite',
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('hover', '@media (hover: hover) and (pointer: fine) { &:hover }');
      addVariant('group-hover', '@media (hover: hover) and (pointer: fine) { :merge(.group):hover & }');
      addVariant('peer-hover', '@media (hover: hover) and (pointer: fine) { :merge(.peer):hover ~ & }');
    }),
  ],
};

export default config;
