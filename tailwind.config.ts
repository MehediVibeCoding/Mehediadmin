import type { Config } from 'tailwindcss';

const config: Config = {
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
        // ── ব্র্যান্ড কালার — vangcurweb-এর নতুন নীল/ফ্রেশ আইডেন্টিটি ──
        // (এটাই ইচ্ছাকৃতভাবে বেছে নেওয়া নতুন ব্র্যান্ড কালার — পুরনো
        // legacy admin.html-এর বেগুনি/ইন্ডিগো --brand থেকে সরে এসে এটা করা
        // হয়েছিল, তাই এখানে legacy hex বসানো হয়নি। dark/black — গ্রেডিয়েন্টের
        // (সাইডবার ইত্যাদি) জন্য দরকার হওয়ায় একই নীল hue-তে যোগ করা হলো,
        // legacy-তে যেগুলোর সমতুল্য কোনো টোকেন ছিল না।)
        brand: {
          bg: '#C3DEFC',
          light: '#44A4FB',
          primary: '#0058C7',
          accent: '#005EFC',
          dark: '#003D8F',
          black: '#001229',
          surface: '#FFFFFF',
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
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', '"Hind Siliguri"', 'sans-serif'],
      },
      boxShadow: {
        // legacy-র মতোই brand-tinted শ্যাডো টেকনিক, শুধু টিন্ট এখন নীল
        sh1: '0 1px 4px rgba(0,61,143,.07)',
        sh2: '0 4px 16px rgba(0,61,143,.10)',
        sh3: '0 8px 36px rgba(0,61,143,.16)',
        glass: '0 8px 32px rgba(0,42,110,.10), 0 1.5px 4px rgba(0,42,110,.06)',
      },
      backgroundImage: {
        // legacy .weather-card / active-nav / primary বাটনের গ্র্যাডিয়েন্ট — একই টেকনিক, নীল টোনে
        'brand-grad': 'linear-gradient(135deg, #44A4FB 0%, #0058C7 45%, #003D8F 100%)',
        // legacy .sidebar ব্যাকগ্রাউন্ড গ্র্যাডিয়েন্ট — নীল-নেভি টোনে
        'sidebar-grad': 'linear-gradient(165deg, #003D8F 0%, #002C66 45%, #001229 100%)',
        // legacy .mob-topbar ব্যাকগ্রাউন্ড
        'topbar-grad': 'linear-gradient(135deg, #003D8F, #001229)',
      },
      borderRadius: {
        brand: '14px', // legacy --r
      },
      transitionProperty: {
        // legacy --tr:all .2s ease — এই টোকেনটাই পুরো সাইটে সব হোভার/ইন্টারঅ্যাকশনে
        // ব্যবহৃত হয়। আগে শুধু duration/timing টোকেন ছিল, property টোকেন ছিল না —
        // ফলে `transition-brand` ক্লাসটা (২৬টা ফাইলে ব্যবহৃত) আসলে কোনো CSS
        // জেনারেট করত না, তাই সব হোভার/স্টেট বদল আচমকা "snap" করত, স্মুথ হতো না।
        brand: 'all',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease',
        brand: 'ease',
      },
      transitionDuration: {
        DEFAULT: '200ms',
        brand: '200ms',
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
        // legacy @keyframes statLiveSweep — pending-attention শাইন সুইপ
        statLiveSweep: {
          '0%': { transform: 'translateX(140%)' },
          '100%': { transform: 'translateX(-160%)' },
        },
        // legacy @keyframes weatherFloat
        weatherFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(10px)' },
        },
        // legacy @keyframes weatherIconBob
        weatherIconBob: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-4px) rotate(-4deg)' },
        },
      },
      animation: {
        'cart-jiggle': 'cartJiggle .7s cubic-bezier(.36,.07,.19,.97) both',
        'section-reveal': 'sectionReveal .5s cubic-bezier(.4,0,.2,1) both',
        'badge-hot-glow': 'badgeHotGlow 2s ease-in-out infinite',
        heartbeat: 'heartbeat .45s ease forwards',
        ripple: 'ripple .55s linear forwards',
        'stat-live-sweep': 'statLiveSweep 2.4s ease-in-out infinite',
        'weather-float': 'weatherFloat 6s ease-in-out infinite',
        'weather-icon-bob': 'weatherIconBob 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
