import 'server-only';

// এডমিন লগইনের জন্য Cloudflare Turnstile টোকেন সার্ভার-সাইড যাচাই।
// Vangcur-এর মতো আলাদা পাবলিক /api/verify-turnstile রুট লাগেনি — এডমিনে
// একমাত্র ব্যবহার লগইন ফর্মে, আর সেটা এমনিতেই একটা Server Action
// (app/actions/auth.ts-এর login()), তাই সরাসরি এখান থেকেই Cloudflare-কে
// কল করা হয় (ব্রাউজার কখনো TURNSTILE_SECRET_KEY দেখে না)।
//
// Graceful degrade: TURNSTILE_SECRET_KEY সেট করা না থাকলে (যেমন Vercel এনভে
// এখনো না বসানো থাকলে) verify স্কিপ করে true ফেরত দেয় — ঠিক Vangcur-এর
// ENV_VARIABLES.md-তে ডকুমেন্টেড আচরণের মতোই ("কী কনফিগার করা না থাকলে
// লগইন স্বাভাবিকভাবে কাজ করবে")। কী বসানোর সাথে সাথেই এটা বাধ্যতামূলক হয়ে যাবে।
export async function verifyTurnstileServer(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return true;
  }

  if (!token || typeof token !== 'string' || token.length > 2048) {
    return false;
  }

  try {
    const form = new URLSearchParams();
    form.append('secret', secret);
    form.append('response', token);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn('[Turnstile] Cloudflare API responded with status:', res.status);
      return false;
    }

    const data = await res.json();
    if (!data.success) {
      console.warn('[Turnstile] admin login যাচাই প্রত্যাখ্যাত:', JSON.stringify(data['error-codes'] || []));
    }
    return !!data.success;
  } catch (e) {
    console.warn('[Turnstile] admin login verify error:', e);
    return false;
  }
}
