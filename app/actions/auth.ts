'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getClientIp, slidingWindowLimit } from '@/lib/limiter';
import { verifyTurnstileServer } from '@/lib/turnstileServer';
import { sendAdminLoginAlert } from '@/lib/telegramAlert';

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export interface LoginResult {
  error?: string;
}

// ইচ্ছাকৃতভাবে generic — কোনো হিন্ট দেওয়া হয় না (ইমেইল ভুল নাকি পাসওয়ার্ড, রেট-লিমিট
// নাকি captcha — আক্রমণকারীকে এসব আলাদা করে জানানো হয় না)।
const GENERIC_ERROR = 'ভুল ইমেইল বা পাসওয়ার্ড।';
const RATE_LIMITED_ERROR = 'অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
const CAPTCHA_ERROR = 'যাচাই সম্পন্ন হয়নি। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।';

// 🔒 A1 ফিক্স — লগইন এখন ব্রাউজার থেকে সরাসরি Supabase Auth API কল করে না
// (আগে app/login/page.tsx নিজেই supabase.auth.signInWithPassword() ডাকত, মাঝে
// কোনো সার্ভার কোড ছিল না — তাই রেট-লিমিট/CAPTCHA/এলার্ট কিছুই সম্ভব ছিল না)।
// এখন email+password+turnstileToken এই Server Action-এ আসে, এখানে:
//   ১. প্রতি IP-তে ১০ মিনিটে ৫ বার চেষ্টার সীমা (lib/limiter.ts — Upstash না থাকলে
//      ইনস্ট্যান্স-মেমোরি ফলব্যাক, এডমিন লগইনের কম ট্রাফিকে যথেষ্ট)
//   ২. Cloudflare Turnstile টোকেন যাচাই (সিক্রেট কী না বসানো পর্যন্ত স্কিপ হয়)
//   ৩. Supabase sign-in (সার্ভার ক্লায়েন্ট, cookie-based session — browser client
//      যেভাবে কুকি বসাতো, এটাও একইভাবে বসায়)
//   ৪. সফল ও আসল অ্যাডমিন ইমেইল হলে ব্যাকগ্রাউন্ডে (after()) Telegram এলার্ট —
//      IP, ডিভাইস (User-Agent), সময়, best-effort IP→শহর/দেশ
export async function login(email: string, password: string, turnstileToken: string): Promise<LoginResult> {
  const hdrs = await headers();
  const ip = getClientIp(hdrs);

  const rl = await slidingWindowLimit(`admin-login:${ip}`, 5, 600);
  if (!rl.allowed) {
    return { error: RATE_LIMITED_ERROR };
  }

  const captchaOk = await verifyTurnstileServer(turnstileToken);
  if (!captchaOk) {
    return { error: CAPTCHA_ERROR };
  }

  if (!email || !password) {
    return { error: GENERIC_ERROR };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user || !data.user.email) {
    return { error: GENERIC_ERROR };
  }

  // এই Supabase Auth ইউজার-পুল মূল সাইটের সাথে শেয়ার্ড (অডিট A14) — তাই যেকোনো বৈধ
  // কাস্টমার-ক্রেডেনশিয়াল দিয়ে sign-in "সফল" হতে পারে, কিন্তু আসল অ্যাডমিন ইমেইল না
  // মিললে middleware তাকে আবার /login-এ ফেরত পাঠাবে। এলার্ট শুধু প্রকৃত অ্যাডমিন
  // ইমেইলের বেলাতেই পাঠানো হয় — অন্য কারো শুধু sign-in করার চেষ্টায় না (স্কোপ যা
  // জিজ্ঞেস করা হয়েছিল তার বাইরে, পরে চাইলে আলাদাভাবে যোগ করা যাবে)।
  const isAdmin = data.user.email === process.env.ADMIN_EMAIL;
  if (isAdmin) {
    const userAgent = hdrs.get('user-agent') || '';
    const adminEmail = data.user.email;
    after(async () => {
      await sendAdminLoginAlert({ ip, userAgent, email: adminEmail });
    });
  }

  redirect('/');
}
