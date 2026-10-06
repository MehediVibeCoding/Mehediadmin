import { unstable_cache, revalidateTag } from 'next/cache';

// ══════════════════════════════════════════════════════════════
//  অ্যাডমিনের সার্ভার-সাইড ক্যাশ (ট্যাগসহ)
// ══════════════════════════════════════════════════════════════
// হিসাবের ফলাফল সার্ভারে জমা থাকে — পেজ খুললেই প্রতিবার ডাটাবেজে যায় না।
// ক্যাশ মুছে যায় (১) অ্যাডমিন নিজে কিছু বদলালে, (২) রিয়েলটাইম ইভেন্টে
// (নতুন অর্ডার / বিকাশ ওয়েবহুক / অটো-ক্যান্সেল), (৩) সর্বোচ্চ ২ মিনিট পর
// নিজে থেকে — কোনো ইভেন্ট মিস হলেও ডাটা বেশিক্ষণ পুরনো থাকে না।
//
// ⚠️ এই ফাইলের ফাংশন কখনো cookies()/requireAdmin() ভেতরে ডাকে না — ক্যাশ হওয়া
// ফাংশনে সেগুলো চলে না। তাই প্রতিটা এক্সপোর্টেড অ্যাকশন আগে নিজে requireAdmin()
// ডেকে তবেই ক্যাশ-করা ফাংশন ডাকে। অ্যাডমিন একজনই (ADMIN_EMAIL), তাই
// ক্যাশে অনুমতি-ভিত্তিক আলাদা ভার্সন লাগে না।

export const ADMIN_CACHE_SECONDS = 120;

/** অর্ডার বদলালে মুছতে হবে: ড্যাশবোর্ড, প্রফিট, কাস্টমার, অর্ডার তালিকা */
export const ORDERS_TAG = 'admin-orders';
/** প্রোডাক্ট/স্টক/প্রফিট বদলালে মুছতে হবে: ড্যাশবোর্ড (কম স্টক), প্রফিট */
export const PRODUCTS_TAG = 'admin-products';

// কোড বা ডাটা-আকৃতি বদলালে এটা বাড়ালে পুরনো আকৃতির ক্যাশ আর পড়া হয় না
const CACHE_VERSION = 'v1';

export function adminCached<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  keyParts: string[],
  tags: string[]
): (...args: A) => Promise<R> {
  return unstable_cache(fn, [CACHE_VERSION, ...keyParts], {
    revalidate: ADMIN_CACHE_SECONDS,
    tags,
  });
}

export function invalidateOrdersData(): void {
  revalidateTag(ORDERS_TAG);
}

export function invalidateProductsData(): void {
  revalidateTag(PRODUCTS_TAG);
}
