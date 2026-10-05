// 🛡️ অডিট ফিক্স — ইমেজ আপলোড MIME ভ্যালিডেশন
// আগে শুধু file.name থেকে extension নেওয়া হতো, ফাইলের আসল MIME টাইপ চেক হতো না।
// ফলে কেউ .svg (XSS পেলোডসহ) বা .html ফাইল .jpg নাম দিয়ে আপলোড করলে সেটা
// পাবলিক বাকেটে এক্সিকিউটেবল অবস্থায় বসে যেত। এখন থেকে file.type
// whitelist-চেক করা হয়, আর extension-ও সেই অনুযায়ী normalize করা হয়
// (যাতে কেউ photo.jpg.html নাম দিয়ে পাঠালেও আসল MIME অনুযায়ী ext বসে)।

export const ALLOWED_IMAGE_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB

export interface UploadValidationResult {
  ok: boolean;
  message?: string;
  ext?: string;
}

export function validateImageUpload(file: File): UploadValidationResult {
  if (!file || file.size === 0) {
    return { ok: false, message: 'কোনো ফাইল পাওয়া যায়নি' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: 'ফাইল সাইজ সর্বোচ্চ 8MB হতে পারবে' };
  }
  const ext = ALLOWED_IMAGE_MIME[file.type];
  if (!ext) {
    return { ok: false, message: 'শুধুমাত্র JPG, PNG বা WebP ছবি আপলোড করা যাবে' };
  }
  return { ok: true, ext };
}
