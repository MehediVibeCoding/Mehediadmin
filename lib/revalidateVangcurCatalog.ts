// ফাইলের পাথ: lib/revalidateVangcurCatalog.ts
// [NEW] প্রোডাক্ট/ক্যাটাগরি/হিরো কার্ড/অফার সেভ হওয়ার পর এটা কল করলে Vangcur-এর
// /api/revalidate-catalog এন্ডপয়েন্ট হিট হয় — লাইভ সাইটের ক্যাশ করা পেজ সাথে সাথে নতুন হয়।
// (revalidateGuidePage.ts-এর মতোই: env না থাকলে বা ব্যর্থ হলে চুপচাপ স্কিপ, অ্যাডমিনের সেভ
// কখনো আটকায় না; ৫ সেকেন্ডের হার্ড টাইমআউট।) একই env ব্যবহার হয়:
// VANGCUR_SITE_URL ও GUIDE_REVALIDATE_SECRET_KEY।

export async function revalidateVangcurCatalog(): Promise<void> {
  const base = process.env.VANGCUR_SITE_URL;
  const secret = process.env.GUIDE_REVALIDATE_SECRET_KEY;

  if (!base || !secret) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    await fetch(`${base.replace(/\/$/, '')}/api/revalidate-catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
      body: '{}',
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch {
    // best-effort
  } finally {
    clearTimeout(timeout);
  }
}
