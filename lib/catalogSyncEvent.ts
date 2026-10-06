// ফাইলের পাথ: lib/catalogSyncEvent.ts
// প্রোডাক্ট/ক্যাটাগরি/হিরো/অফার সেভের পর কল করলে CatalogSyncBanner সাথে সাথে স্ট্যাটাস আবার পড়ে।
// ব্রাউজার ছাড়া (SSR) বা ইভেন্ট ব্যর্থ হলে কিছুই হয় না — সেভের লজিকে কোনো প্রভাব নেই।

export const CATALOG_SYNC_CHECK_EVENT = 'vc:catalog-sync-check';

export function notifyCatalogSyncCheck(): void {
  try {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(CATALOG_SYNC_CHECK_EVENT));
  } catch {
    // উপেক্ষা
  }
}
