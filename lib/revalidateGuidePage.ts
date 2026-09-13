// ফাইলের পাথ: lib/revalidateGuidePage.ts
// [NEW] guide_pages টেবিলে কোনো write (create/update/publish/delete) হওয়ার পর এটা কল
// করে Vangcur-এর /api/revalidate-guide এন্ডপয়েন্ট হিট করা হয়, যাতে লাইভ সাইটের
// ISR ক্যাশ সাথে সাথে রিফ্রেশ হয়। কারণ এই রিপো (Mehediadmin) আর Vangcur সম্পূর্ণ
// আলাদা Next.js ডিপ্লয়মেন্ট — এখান থেকে সরাসরি revalidatePath('/guides') কল করলে
// সেটা Vangcur-এর ক্যাশ ছুঁতে পারে না, নিজের (অস্তিত্বহীন) রুট রিভ্যালিডেট করে মাত্র।
//
// env-এ VANGCUR_SITE_URL আর GUIDE_REVALIDATE_SECRET_KEY সেট না থাকলে চুপচাপ স্কিপ করে — এতে
// ব্যর্থ হলেও অ্যাডমিনের সেভ/পাবলিশ ফ্লো আটকে যাবে না, শুধু লাইভ পেজ আপডেট হতে
// Vangcur-এর নিজস্ব ৫ মিনিটের সময়-ভিত্তিক ISR রিফ্রেশ পর্যন্ত অপেক্ষা করতে হবে।
//
// প্যারামিটার হিসেবে বেয়ার slug না, পুরো resolved path (যেমন '/compare/xyz')
// পাঠানো হয় — কারণ টেমপ্লেট-ভিত্তিক url_prefix থাকায় সব guide page-এর URL আর
// একই প্যাটার্নে হয় না। কলার সাইটে guidePageUrlPath() দিয়ে path বানিয়ে দিতে হবে।

export async function revalidateGuidePage(path?: string | null): Promise<void> {
  const base = process.env.VANGCUR_SITE_URL;
  const secret = process.env.GUIDE_REVALIDATE_SECRET_KEY;

  if (!base || !secret) return;

  try {
    await fetch(`${base.replace(/\/$/, '')}/api/revalidate-guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
      body: JSON.stringify({ path: path ?? undefined }),
      cache: 'no-store',
    });
  } catch {
    // best-effort — নেটওয়ার্ক ব্যর্থতায়ও অ্যাডমিনের সেভ/পাবলিশ ফ্লো ব্লক করব না
  }
}
