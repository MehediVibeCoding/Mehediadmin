// অডিট §৩ ফিক্স — Security headers ────────────────────────────────
// আগে কোনো CSP/X-Frame-Options/Referrer-Policy/Permissions-Policy সেট
// করা ছিল না (Vercel কিছু default header দেয়, কিন্তু CSP নিজে থেকে
// বসাতে হয়)। browser সরাসরি Supabase REST + Realtime (websocket)-এর
// সাথে কানেক্ট করে (lib/supabase/client.ts, OrdersRealtimeProvider),
// তাই connect-src-এ Supabase-এর https ও wss দুটো অরিজিনই থাকা দরকার।
//
// 🌦️ ড্যাশবোর্ডের আবহাওয়া কার্ডের জন্য connect-src-এ open-meteo (আবহাওয়া) ও bigdatacloud (এলাকার নাম)
// অনুমোদিত, আর Permissions-Policy-তে geolocation=(self) — নইলে ব্রাউজার সরাসরি ব্লক করত।
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
  `connect-src 'self' ${supabaseUrl} ${supabaseWsUrl} https://api.open-meteo.com https://api.bigdatacloud.net`,
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
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next 15-এ ডিফল্ট staleTimes ০ — তাই আগের পেজে ফিরলেই সার্ভার থেকে নতুন করে আনত ও স্কেলেটন দেখাত।
  // এখন ভিজিট করা পেজ ক্লায়েন্টে ক্যাশ থাকে: ফিরলে সাথে সাথে খোলে, স্কেলেটন আসে না।
  // কোনো সার্ভার অ্যাকশন (সেভ/ডিলিট/স্ট্যাটাস বদল) revalidatePath চালালে এই ক্যাশ নিজে থেকেই মুছে যায়।
  //
  // 🩹 ফ্লিকার পলিশ: অর্ডার/ড্যাশবোর্ডে revalidatePath-এর রিডান্ডেন্ট কল সরানোর পর
  // (app/actions/orders.ts) এই ক্যাশ আর মিউটেশনে বিনা কারণে মোছে না — তাই ১২-১৩
  // ঘণ্টার সেশনে কম-ঘোরাফেরা করা পেজগুলোতেও (customers, coupons, offers-mgmt...)
  // স্কেলেটন আরও কম দেখানোর জন্য টাইমআউট বাড়ানো হলো। ডাটা সর্বোচ্চ ৭ মিনিট পুরনো
  // হতে পারে এখন (আগে ৩ মিনিট) — একজন অ্যাডমিনের প্যানেলে এটা নিরাপদ ট্রেড-অফ,
  // আর স্ট্যাটাস বদলের মতো জরুরি জায়গায় তাৎক্ষণিক আপডেট আগের মতোই হয় (ওই পেজ
  // নিজে client-side cache/realtime দিয়ে সাথে সাথে রিফ্রেশ করে নেয়)।
  experimental: {
    staleTimes: {
      dynamic: 420,
      static: 600,
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
