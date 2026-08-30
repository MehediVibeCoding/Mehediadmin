import type { Coupon, CouponStatus } from '@/types';

// legacy admin.html-এ কুপন মডিউল ছিল না — এটা সম্পূর্ণ নতুন ফিচার, তাই কোনো
// "legacy" রেফারেন্স কমেন্ট নেই। status তিনটা ভাগে ভাগ করা হয়েছে:
//   active   → is_active = true এবং (মেয়াদ নেই অথবা মেয়াদ এখনো বাকি)
//   expired  → expires_at অতীতে চলে গেছে (is_active true/false যাই হোক না কেন —
//              মেয়াদ শেষ মানেই কার্যত ব্যবহারযোগ্য না)
//   inactive → is_active = false, কিন্তু এখনো মেয়াদ শেষ হয়নি (এডমিন নিজে বন্ধ করেছেন)
export function getCouponStatus(coupon: Pick<Coupon, 'is_active' | 'expires_at'>): CouponStatus {
  const isExpired = !!coupon.expires_at && new Date(coupon.expires_at).getTime() <= Date.now();
  if (isExpired) return 'expired';
  return coupon.is_active ? 'active' : 'inactive';
}

export const STATUS_LABEL: Record<CouponStatus, string> = {
  active: 'সক্রিয়',
  expired: 'মেয়াদ শেষ',
  inactive: 'নিষ্ক্রিয়',
};

export const STATUS_BADGE_CLASS: Record<CouponStatus, string> = {
  active: 'bg-green-50 text-[#065F46]',
  expired: 'bg-red-50 text-danger',
  inactive: 'bg-surface-muted text-muted',
};

// কোড ইনপুটে টাইপ করার সাথে সাথেই sanitize — বড় হাতের অক্ষর + সংখ্যা +
// আন্ডারস্কোর/হাইফেন ছাড়া বাকি সব বাদ। DB-তে `coupons_code_uppercase`
// CHECK constraint দিয়ে এটা দ্বিতীয়বার সার্ভার-সাইডেও নিশ্চিত করা হয়।
export function sanitizeCouponCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

// টেবিলে "৳১০০ ফিক্সড" / "১৫% (সর্বোচ্চ ৳৩০০)" / "ফ্রি ডেলিভারি" — এই ফরম্যাটে দেখানোর জন্য
export function formatDiscount(coupon: Pick<Coupon, 'discount_type' | 'discount_value' | 'max_discount_amount'>): string {
  if (coupon.discount_type === 'free_shipping') return 'ফ্রি ডেলিভারি';
  if (coupon.discount_type === 'percent') {
    const cap = coupon.max_discount_amount ? ` (সর্বোচ্চ ৳${coupon.max_discount_amount.toLocaleString()})` : '';
    return `${coupon.discount_value}%${cap}`;
  }
  return `৳${coupon.discount_value.toLocaleString()} ফিক্সড`;
}

// এক্সপায়ারি কাউন্টডাউন — "৩ দিন বাকি" / "আজ শেষ হচ্ছে" / "মেয়াদ শেষ" / "কখনো শেষ হবে না"
export function formatExpiryCountdown(expiresAt: string | null): string {
  if (!expiresAt) return 'কখনো শেষ হবে না';
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'মেয়াদ শেষ';
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return 'আজ শেষ হচ্ছে';
  if (days === 1) return '১ দিন বাকি';
  if (days <= 30) return `${days} দিন বাকি`;
  const months = Math.floor(days / 30);
  return `${months} মাস বাকি`;
}

// ⚠️ ESTIMATE, exact না — `coupons` টেবিলে প্রতিটা অর্ডারে ঠিক কত টাকা ছাড়
// দেওয়া হয়েছিল তার হিসাব নেই (used_count শুধু কতবার ব্যবহার হয়েছে গুনে,
// টাকার অঙ্ক না)। সঠিক হিসাবের জন্য orders টেবিলে coupon_discount_amount
// কলাম যোগ করে প্রতি অর্ডারে actual ছাড়ের পরিমাণ সেভ করা এবং সেখান থেকে
// SUM করাই সবচেয়ে নির্ভুল পথ — এটা এখনকার স্কিমাতে নেই বলে best-effort
// হিসাব: fixed → discount_value × used_count, percent → cap (বা মান, cap
// না থাকলে) × used_count, free_shipping → শিপিং খরচ এই টেবিলে ট্র্যাক হয়
// না বলে ধরা হয়নি (০)।
export function estimateTotalDiscountGiven(coupons: Coupon[]): number {
  return coupons.reduce((sum, c) => {
    if (c.discount_type === 'fixed') return sum + c.discount_value * c.used_count;
    if (c.discount_type === 'percent') {
      const perUse = c.max_discount_amount ?? c.discount_value;
      return sum + perUse * c.used_count;
    }
    return sum; // free_shipping — এই স্কিমায় শিপিং খরচ ট্র্যাক হয় না
  }, 0);
}
