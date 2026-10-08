// 🛡️ অডিট ফিক্স — ইমেজ আপলোড ভ্যালিডেশন (MIME + Magic Bytes)
// ধাপ ১ (আগের ফিক্স): file.type (ব্রাউজার-পাঠানো MIME) whitelist-চেক করা হয়,
// extension-ও সেই অনুযায়ী normalize হয় (photo.jpg.html নাম দিয়ে পাঠালেও আসল
// MIME অনুযায়ী ext বসে)।
// ধাপ ২ (এই ফিক্স): শুধু file.type যথেষ্ট না — এটা ব্রাউজার/ক্লায়েন্ট যা দাবি করে
// তাই, কেউ চাইলে স্পুফ করতে পারে (যেমন .svg বা .html ফাইলকে
// Content-Type: image/jpeg হিসেবে পাঠানো)। তাই ফাইলের প্রথম কয়েক বাইট
// (file signature / magic number) পড়ে দেখা হয় সেটা আসলেই ঘোষিত ফরম্যাটের
// ছবি কিনা — এই বাইটগুলো স্পুফ করা ব্যবহারিকভাবে অনেক কঠিন।

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

/**
 * ফাইলের প্রথম ১২ বাইট পড়ে দেখে সেটা ঘোষিত mime-এর real file signature-এর
 * সাথে মেলে কিনা। শুধু products/reviews/hero-cards মডিউলে ব্যবহৃত ৩টা
 * ফরম্যাট (JPEG/PNG/WebP) সাপোর্ট করে — অন্য যেকোনো মিলে false।
 */
export async function verifyImageMagicBytes(file: File, mime: string): Promise<boolean> {
  try {
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (mime === 'image/jpeg') {
      // FF D8 FF
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    }
    if (mime === 'image/png') {
      // 89 50 4E 47 0D 0A 1A 0A
      const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      return sig.every((b, i) => head[i] === b);
    }
    if (mime === 'image/webp') {
      // "RIFF" ... "WEBP" (bytes 0-3 এবং 8-11)
      const riff = [0x52, 0x49, 0x46, 0x46];
      const webp = [0x57, 0x45, 0x42, 0x50];
      return riff.every((b, i) => head[i] === b) && webp.every((b, i) => head[8 + i] === b);
    }
    return false;
  } catch {
    // ফাইল পড়তে ব্যর্থ হলে নিরাপদ পাশে থাকা — ছবি হিসেবে গ্রহণ না করা
    return false;
  }
}

export const MAGIC_BYTE_MISMATCH_MESSAGE =
  'ফাইলের ভেতরের ডাটা ঘোষিত ফরম্যাটের সাথে মেলেনি — আসল JPG/PNG/WebP ছবি আপলোড করুন';

export async function validateImageUpload(file: File): Promise<UploadValidationResult> {
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
  const magicOk = await verifyImageMagicBytes(file, file.type);
  if (!magicOk) {
    return { ok: false, message: MAGIC_BYTE_MISMATCH_MESSAGE };
  }
  return { ok: true, ext };
}
