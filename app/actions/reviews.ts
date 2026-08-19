'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import type { Review } from '@/types';

const TABLE = 'customer_reviews';
const STORAGE_BUCKET = 'product-images'; // products/hero-cards module-এর bucket-ই পুনর্ব্যবহার, নতুন bucket তৈরি করা হয়নি

// legacy loadReviewGallery()
export async function listReviews(): Promise<Review[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, image_url, created_at')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []) as Review[];
}

export interface ReviewActionResult {
  ok: boolean;
  message?: string;
}

// legacy saveReview()-এর "নতুন" শাখা (insert)
export async function addReview(imageUrl: string): Promise<ReviewActionResult> {
  await requireAdmin();
  const image_url = imageUrl.trim();
  if (!image_url) return { ok: false, message: '❌ ছবির URL বা ফাইল দিন' };

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TABLE).insert({ image_url });
  if (error) return { ok: false, message: '❌ সমস্যা হয়েছে: ' + error.message };

  revalidatePath('/review-gallery');
  return { ok: true };
}

// legacy saveReview()-এর "এডিট" শাখা (update)
export async function updateReview(id: number, imageUrl: string): Promise<ReviewActionResult> {
  await requireAdmin();
  const image_url = imageUrl.trim();
  if (!image_url) return { ok: false, message: '❌ ছবির URL বা ফাইল দিন' };

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TABLE).update({ image_url }).eq('id', id);
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
  const supabase = createServiceRoleClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `reviews/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) return { ok: false, message: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { ok: true, url: publicUrl };
}
