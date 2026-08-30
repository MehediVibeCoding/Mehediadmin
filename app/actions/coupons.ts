'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { sanitizeCouponCode, estimateTotalDiscountGiven } from '@/lib/coupons';
import type { Coupon, CouponDiscountType, CouponStats } from '@/types';

const TABLE = 'coupons';
const PATH = '/coupons';

export interface CouponActionResult {
  status: 'ok' | 'duplicate' | 'error';
  message?: string;
  coupon?: Coupon;
}

// ══════════════════════════════════════════════════════════════
//  READ
// ══════════════════════════════════════════════════════════════

export async function listCoupons(): Promise<Coupon[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw new Error('কুপন লোড ব্যর্থ: ' + error.message);
  return (data || []) as Coupon[];
}

// stat card গুলোর জন্য — listCoupons() থেকেই ডেরাইভ করা হয় (আলাদা কোনো
// এক্সট্রা DB কল লাগে না, একই fetch-এ কাজ চলে)
export async function getCouponStats(coupons: Coupon[]): Promise<CouponStats> {
  const now = Date.now();
  const activeCoupons = coupons.filter(
    (c) => c.is_active && (!c.expires_at || new Date(c.expires_at).getTime() > now)
  ).length;
  return {
    totalCoupons: coupons.length,
    activeCoupons,
    totalUsedCount: coupons.reduce((sum, c) => sum + (c.used_count || 0), 0),
    totalDiscountGiven: estimateTotalDiscountGiven(coupons),
  };
}

// ══════════════════════════════════════════════════════════════
//  CREATE / UPDATE
// ══════════════════════════════════════════════════════════════

export interface CouponFormInput {
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number;
  max_uses_total: number | null;
  max_uses_per_user: number;
  expires_at: string | null; // ISO string, নাল মানে মেয়াদহীন
  is_active: boolean;
}

// Postgres unique_violation — DB-র `coupons_code_key` constraint ভাঙলে এই
// কোড আসে। ম্যানুয়াল pre-check (products.ts-এর মতো) না করে সরাসরি DB
// constraint-এর উপর ভরসা করা হলো, কারণ কোড ইউনিকনেস race-condition-প্রুফভাবে
// শুধু DB-ই নিশ্চিত করতে পারে।
const UNIQUE_VIOLATION = '23505';

function validate(input: CouponFormInput): string | null {
  if (!input.code.trim()) return 'কুপন কোড আবশ্যক';
  if (!/^[A-Z0-9_-]+$/.test(input.code)) return 'কোডে শুধু বড় হাতের অক্ষর, সংখ্যা, - ও _ চলবে';
  if (!input.discount_value || input.discount_value <= 0) return 'ছাড়ের মান ০-এর বেশি হতে হবে';
  if (input.discount_type === 'percent' && input.discount_value > 100) return 'পার্সেন্টেজ ১০০-এর বেশি হতে পারবে না';
  if (input.max_discount_amount != null && input.max_discount_amount <= 0) return 'সর্বোচ্চ ছাড়ের পরিমাণ ০-এর বেশি হতে হবে';
  if (input.min_order_amount < 0) return 'সর্বনিম্ন অর্ডার মূল্য ঋণাত্মক হতে পারবে না';
  if (input.max_uses_total != null && input.max_uses_total <= 0) return 'মোট ব্যবহারসীমা ০-এর বেশি হতে হবে';
  if (!input.max_uses_per_user || input.max_uses_per_user <= 0) return 'প্রতি গ্রাহক ব্যবহারসীমা ০-এর বেশি হতে হবে';
  return null;
}

// DB row shape — free_shipping-এর জন্য discount_value-এর কোনো বাস্তব অর্থ
// নেই কিন্তু `discount_value > 0` CHECK constraint সবসময় মানতে হয়, তাই
// এখানে নীরবে ১ বসানো হয় (types/index.ts-এ এই সিদ্ধান্তের ব্যাখ্যা আছে)
function toRow(input: CouponFormInput) {
  return {
    code: sanitizeCouponCode(input.code),
    discount_type: input.discount_type,
    discount_value: input.discount_type === 'free_shipping' ? 1 : input.discount_value,
    max_discount_amount: input.discount_type === 'percent' ? input.max_discount_amount : null,
    min_order_amount: input.min_order_amount || 0,
    max_uses_total: input.max_uses_total || null,
    max_uses_per_user: input.max_uses_per_user || 1,
    expires_at: input.expires_at || null,
    is_active: input.is_active,
  };
}

export async function createCoupon(input: CouponFormInput): Promise<CouponActionResult> {
  await requireAdmin();
  const validationError = validate(input);
  if (validationError) return { status: 'error', message: validationError };

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from(TABLE).insert(toRow(input)).select().single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { status: 'duplicate', message: 'এই কোডে ইতিমধ্যে একটা কুপন আছে' };
    return { status: 'error', message: error.message };
  }
  revalidatePath(PATH);
  return { status: 'ok', coupon: data as Coupon };
}

export async function updateCoupon(id: string, input: CouponFormInput): Promise<CouponActionResult> {
  await requireAdmin();
  const validationError = validate(input);
  if (validationError) return { status: 'error', message: validationError };

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from(TABLE).update(toRow(input)).eq('id', id).select().single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { status: 'duplicate', message: 'এই কোডে ইতিমধ্যে একটা কুপন আছে' };
    return { status: 'error', message: error.message };
  }
  revalidatePath(PATH);
  return { status: 'ok', coupon: data as Coupon };
}

// টেবিলের রিয়েলটাইম টগল সুইচ থেকে কল হয় — শুধু is_active বদলায়, বাকি ফিল্ড ছোঁয় না
export async function toggleCouponActive(id: string, isActive: boolean): Promise<CouponActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from(TABLE).update({ is_active: isActive }).eq('id', id).select().single();
  if (error) return { status: 'error', message: error.message };
  revalidatePath(PATH);
  return { status: 'ok', coupon: data as Coupon };
}

export async function deleteCoupon(id: string): Promise<CouponActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) return { status: 'error', message: error.message };
  revalidatePath(PATH);
  return { status: 'ok' };
}
