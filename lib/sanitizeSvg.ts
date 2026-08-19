import DOMPurify from 'dompurify';

// অডিট §২.২ ফিক্স ────────────────────────────────────────────────
// ক্যাটাগরি "icon" ফিল্ড admin free-text-এ টাইপ করে (কোনো fixed icon
// library থেকে না)। এই একই ডেটা public site (Vangcur)-এ sanitize করে
// রেন্ডার হয়, কিন্তু admin panel-এর CategoriesPageClient.tsx-এ আগে
// সরাসরি dangerouslySetInnerHTML-এ বসত — কেউ malicious SVG/HTML পেস্ট
// করলে admin-এর নিজের authenticated session-এই স্ক্রিপ্ট চলার ঝুঁকি
// ছিল (self/stored-XSS)।
//
// এই ফাইলটা DOMPurify ব্যবহার করে বলে ইচ্ছাকৃতভাবে lib/security.ts থেকে
// আলাদা রাখা হয়েছে — DOMPurify-এর জন্য browser `window`/`document` লাগে,
// আর lib/security.ts সার্ভার অ্যাকশনেও (offers.ts, products.ts) ইম্পোর্ট
// হয়। এই মডিউল শুধু client component (CategoriesPageClient, 'use client')
// থেকেই ইম্পোর্ট হয়, তাই এটা সবসময় client bundle-এ থাকবে, সার্ভারে না।
export function sanitizeSvgHtml(raw: string): string {
  if (!raw) return '';
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
}
