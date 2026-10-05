// অডিট §৩ ফিক্স — Security headers ────────────────────────────────
// আগে কোনো CSP/X-Frame-Options/Referrer-Policy/Permissions-Policy সেট
// করা ছিল না (Vercel কিছু default header দেয়, কিন্তু CSP নিজে থেকে
// বসাতে হয়)। browser সরাসরি Supabase REST + Realtime (websocket)-এর
// সাথে কানেক্ট করে (lib/supabase/client.ts, OrdersRealtimeProvider),
// তাই connect-src-এ Supabase-এর https ও wss দুটো অরিজিনই থাকা দরকার।
//
// ⚠️ deploy করার আগে staging-এ টেস্ট করে নাও — বিশেষ করে script-src-এ
// 'unsafe-inline' রাখা হয়েছে কারণ লাইভ পরিবেশে টেস্ট না করে সেটা বাদ
// দিলে Next.js হাইড্রেশন/ইনলাইন স্ক্রিপ্ট ভেঙে যাওয়ার ঝুঁকি আছে।
// পরবর্তীতে nonce-based CSP-তে টাইট করার পরামর্শ থাকবে (next.config.js-এর
// বদলে middleware.ts থেকে per-request nonce generate করে)।
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseWsUrl = supabaseUrl.replace(/^https:/, 'wss:');

const contentSecurityPolicy = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com`,
  `img-src 'self' data: blob: https://res.cloudinary.com ${supabaseUrl}`,
  `connect-src 'self' ${supabaseUrl} ${supabaseWsUrl}`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
]
  .filter(Boolean)
  .join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next 15-এ ডিফল্ট staleTimes ০ — তাই আগের পেজে ফিরলেই সার্ভার থেকে নতুন করে আনত ও স্কেলেটন দেখাত।
  // এখন ভিজিট করা পেজ ক্লায়েন্টে ক্যাশ থাকে: ফিরলে সাথে সাথে খোলে, স্কেলেটন আসে না।
  // কোনো সার্ভার অ্যাকশন (সেভ/ডিলিট/স্ট্যাটাস বদল) revalidatePath চালালে এই ক্যাশ নিজে থেকেই মুছে যায়।
  experimental: {
    staleTimes: {
      dynamic: 180,
      static: 300,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
