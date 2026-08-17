import DOMPurify from 'isomorphic-dompurify';

// প্রতিটা admin ফর্মের free-text ইনপুট (প্রোডাক্ট নাম/বিবরণ/স্পেসিফিকেশন,
// রিভিউ, FAQ, হেডার কপি ইত্যাদি) এই ফাংশন দিয়ে সেভ করার আগে sanitize করতে
// হবে — কোনো HTML/script ইনজেকশন যেন Supabase-এ গিয়ে পরে মেইন সাইটে বা
// admin panel-এই render না হয়।
export function sanitizeInput(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

// একই fields-এর array (features, FAQ answers ইত্যাদি) sanitize করতে
export function sanitizeInputArray(values: unknown[]): string[] {
  return values.map(sanitizeInput).filter(Boolean);
}
