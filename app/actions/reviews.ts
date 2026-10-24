'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { ALLOWED_IMAGE_MIME, verifyImageMagicBytes, MAGIC_BYTE_MISMATCH_MESSAGE } from '@/lib/uploadValidation';
import { uploadToR2 } from '@/lib/r2';
import type { Review } from '@/types';

const TABLE = 'customer_reviews';

// 🆕 alt text পরিষ্কার করা — কন্ট্রোল ক্যারেক্টার বাদ, সর্বোচ্চ ১২৫ অক্ষর; খালি হলে null (মূল সাইট সাধারণ ফলব্যাক নেয়)
function cleanAlt(v: string | undefined): string | null {
  const t = (v || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 125);
  return t || null;
}

// legacy loadReviewGallery()
export async function listReviews(): Promise<Review[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, image_url, alt_text, created_at, is_active')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []) as Review[];
}

export interface ReviewActionResult {
  ok: boolean;
  message?: string;
}

// legacy saveReview()-এর "নতুন" শাখা (insert)
export async function addReview(imageUrl: string, altText?: string): Promise<ReviewActionResult> {
  await requireAdmin();
  const image_url = imageUrl.trim();
  if (!image_url) return { ok: false, message: '❌ ছবির URL বা ফাইল দিন' };

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TABLE).insert({ image_url, alt_text: cleanAlt(altText) });
  if (error) return { ok: false, message: '❌ সমস্যা হয়েছে: ' + error.message };

  revalidatePath('/review-gallery');
  return { ok: true };
}

// legacy saveReview()-এর "এডিট" শাখা (update)
export async function updateReview(id: number, imageUrl: string, altText?: string): Promise<ReviewActionResult> {
  await requireAdmin();
  const image_url = imageUrl.trim();
  if (!image_url) return { ok: false, message: '❌ ছবির URL বা ফাইল দিন' };

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TABLE).update({ image_url, alt_text: cleanAlt(altText) }).eq('id', id);
  if (error) return { ok: false, message: '❌ সমস্যা হয়েছে: ' + error.message };

  revalidatePath('/review-gallery');
  return { ok: true };
}

// legacy deleteReview()
export async function deleteReview(id: number): Promise<ReviewActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) return { ok: false, message: '❌ মুছতে সমস্যা: ' + error.message };

  revalidatePath('/review-gallery');
  return { ok: true };
}

// 🆕 (audit A7) — ড্রাফট/স্টেজিং টগল: is_active=false করলে RLS-এর কারণে
// স্টোরফ্রন্টে সাথে সাথে লুকিয়ে যাবে, মোছার দরকার নেই
export async function toggleReviewActive(id: number, isActive: boolean): Promise<ReviewActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TABLE).update({ is_active: isActive }).eq('id', id);
  if (error) return { ok: false, message: '❌ সমস্যা হয়েছে: ' + error.message };

  revalidatePath('/review-gallery');
  return { ok: true };
}

// legacy handleReviewImgUpload() — কিন্তু legacy ফাইলকে সরাসরি base64 বানিয়ে
// image_url কলামেই বসিয়ে দিত (প্রতিটা রিভিউ রো ভারী হয়ে উঠত)। এখানে hero-cards
// module-এর মতোই আসল Supabase Storage-এ আপলোড হয়, কলামে শুধু ছোট URL string
// থাকে — ইচ্ছাকৃত bug-fix, ফিচার পাল্টায়নি (URL অথবা আপলোড দুটো অপশনই আগের মতো আছে)
export async function uploadReviewImage(
  formData: FormData
): Promise<{ ok: boolean; url?: string; message?: string }> {
  await requireAdmin();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'কোনো ফাইল পাওয়া যায়নি' };
  }
  if (file.size > 3 * 1024 * 1024) {
    return { ok: false, message: '⚠️ ছবির সাইজ ৩MB এর বেশি — ছোট করে দিন' };
  }
  // 🛡️ অডিট ফিক্স: ফাইলের নাম না, আসল MIME টাইপ চেক করে ext বসানো হচ্ছে
  const ext = ALLOWED_IMAGE_MIME[file.type];
  if (!ext) {
    return { ok: false, message: 'শুধুমাত্র JPG, PNG বা WebP ছবি আপলোড করা যাবে' };
  }
  // 🛡️ অডিট ফিক্স: file.type স্পুফ করা সম্ভব, তাই আসল ফাইল-বাইট দিয়েও যাচাই
  if (!(await verifyImageMagicBytes(file, file.type))) {
    return { ok: false, message: MAGIC_BYTE_MISMATCH_MESSAGE };
  }
  // 🆕 ফর্মে লেখা alt থেকে URL-এর নাম বানানো হয় — খালি থাকলে আগের মতো র‍্যান্ডম নাম
  const alt = (formData.get('alt') as string | null) || '';
  return uploadToR2(file, 'reviews', ext, alt);
}
