'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import type { ProductReview } from '@/types';

const TABLE = 'product_reviews';
const PRODUCTS_TABLE = 'custom_products';
const PATH = '/reviews-qa';

type SupabaseServiceClient = ReturnType<typeof createServiceRoleClient>;

// product_id → product name ম্যাপিং জয়েন করে দেয় (product_reviews টেবিলে
// প্রোডাক্টের নাম কলাম নেই, শুধু id — অ্যাডমিন প্যানেলে দেখানোর জন্য এখানে
// custom_products থেকে আলাদা করে আনতে হচ্ছে)।
async function attachProductNames(
  supabase: SupabaseServiceClient,
  rows: ProductReview[]
): Promise<ProductReview[]> {
  if (rows.length === 0) return rows;
  const ids = Array.from(new Set(rows.map((r) => r.product_id).filter((id) => id != null)));
  if (ids.length === 0) return rows;

  const { data } = await supabase.from(PRODUCTS_TABLE).select('id, name, name_bn').in('id', ids);
  const nameMap = new Map<number, string>();
  (data || []).forEach((p: { id: number; name: string; name_bn: string | null }) => {
    nameMap.set(p.id, p.name_bn || p.name);
  });

  return rows.map((r) => ({
    ...r,
    product_name: nameMap.get(r.product_id) || `প্রোডাক্ট #${r.product_id}`,
  }));
}

export async function listProductReviews(): Promise<ProductReview[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return attachProductNames(supabase, (data || []) as ProductReview[]);
}

export interface ReviewActionResult {
  ok: boolean;
  message?: string;
}

export async function approveReview(id: number): Promise<ReviewActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from(TABLE)
    .update({ is_approved: true, is_rejected: false, rejection_reason: null })
    .eq('id', id);
  if (error) return { ok: false, message: '❌ সমস্যা হয়েছে: ' + error.message };

  revalidatePath(PATH);
  return { ok: true };
}

export async function rejectReview(id: number, reason: string): Promise<ReviewActionResult> {
  await requireAdmin();
  const rejection_reason = reason.trim();
  if (!rejection_reason) return { ok: false, message: '❌ রিজেকশনের কারণ লিখুন' };

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from(TABLE)
    .update({ is_approved: false, is_rejected: true, rejection_reason })
    .eq('id', id);
  if (error) return { ok: false, message: '❌ সমস্যা হয়েছে: ' + error.message };

  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteProductReview(id: number): Promise<ReviewActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) return { ok: false, message: '❌ মুছতে সমস্যা: ' + error.message };

  revalidatePath(PATH);
  return { ok: true };
}
