import DOMPurify from 'isomorphic-dompurify';

// অডিট §২.১ ফিক্স ────────────────────────────────────────────────
// ক্যাটাগরি "icon" ফিল্ড admin free-text-এ টাইপ করে। এই ডেটা public site
// (Vangcur)-এ sanitize করে রেন্ডার হয়, কিন্তু আগে admin-এর
// CategoriesPageClient.tsx সরাসরি dangerouslySetInnerHTML-এ বসাত, আর
// সার্ভার অ্যাকশনে কোনো স্যানিটাইজেশন ছিল না — ফলে ডাটাবেজে ঢোকা
// malicious SVG সরাসরি স্টোর হতো।
//
// isomorphic-dompurify ব্যবহার করা হয়েছে যাতে একই sanitizer সার্ভার
// (Server Action, DB-তে লেখার আগে) এবং ক্লায়েন্ট (রেন্ডার) — দুই জায়গাতেই
// চলে। এখন থেকে ডাটাবেজে শুধু পরিষ্কার মান যাবে।
const SVG_OPTIONS = {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'style'],
};

export function sanitizeSvgHtml(raw: string): string {
  if (!raw) return '';
  return String(DOMPurify.sanitize(raw, SVG_OPTIONS)).trim();
}

// সার্ভারে স্টোর করার আগে — আইকন ফিল্ডের সর্বোচ্চ দৈর্ঘ্যও সীমিত রাখা হয়
export const MAX_ICON_LENGTH = 2000;
