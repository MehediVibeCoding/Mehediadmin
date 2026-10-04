// সার্ভার-সেফ আইকন স্যানিটাইজার (DOM/jsdom ছাড়া)।
// ক্যাটাগরি আইকন ডাটাবেজে লেখার আগে এখানে পরিষ্কার হয়। সার্ভার অ্যাকশনে
// DOMPurify/jsdom ইম্পোর্ট করলে বান্ডলিংয়ে ভেঙে পেজে 500 আসতে পারে, তাই
// এখানে শুধু বিপজ্জনক ট্যাগ/অ্যাট্রিবিউট সরানো হয়। রেন্ডারের সময় ক্লায়েন্ট
// (DOMPurify) এবং পাবলিক সাইট আলাদাভাবে আবার স্যানিটাইজ করে।
export const MAX_ICON_LENGTH = 2000;

const DANGEROUS_TAGS =
  /<\/?\s*(script|iframe|object|embed|foreignobject|style|link|meta|base|form|input|button|textarea|select|svg:script)\b[^>]*>/gi;
const EVENT_ATTRS = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi;
const URL_ATTRS = /\b(href|xlink:href|src|action|formaction|data)\s*=\s*("|')?\s*(javascript|vbscript|data)\s*:[^"'>\s]*/gi;

export function sanitizeIcon(raw: string | null | undefined): string {
  let s = String(raw ?? '').trim().slice(0, MAX_ICON_LENGTH);
  if (!s) return '';
  if (!s.includes('<')) return s; // ইমোজি বা সাধারণ টেক্সট
  s = s.replace(DANGEROUS_TAGS, '');
  s = s.replace(EVENT_ATTRS, '');
  s = s.replace(URL_ATTRS, '');
  return s.trim();
}
