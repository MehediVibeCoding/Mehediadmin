'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { adminCached, ORDERS_TAG, PRODUCTS_TAG } from '@/lib/adminCache';
import type { ProfitDay } from '@/lib/profit';

// 🚀 আগে প্রফিট পেজ সব অর্ডার + সব প্রোডাক্ট টেনে ব্রাউজারে হিসাব করত। এখন ডাটাবেজের
// admin_profit_days() ফাংশন দিনওয়ারি {অর্ডার, রেভিনিউ, প্রফিট} দেয় — প্রতিদিন একটা ছোট সারি।
// তারিখ রেঞ্জ ফিল্টার, স্ট্যাট কার্ড, চার্ট ও টেবিল ব্রাউজারেই এই তালিকা থেকে বানানো হয়।
// ক্যাশ: অর্ডার বা প্রোডাক্টের প্রফিট বদলালে মুছে যায়, সর্বোচ্চ ২ মিনিট।
export interface ProfitData {
  days: ProfitDay[];
}

const loadProfitDaysCached = adminCached(
  async (): Promise<ProfitData> => {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc('admin_profit_days');
    if (error) throw new Error('প্রফিট হিসাব ব্যর্থ: ' + error.message);
    const rows = Array.isArray(data) ? data : [];
    const days: ProfitDay[] = rows.map((r: Record<string, unknown>) => ({
      day: String(r.day ?? ''),
      orders: Number(r.orders) || 0,
      revenue: Number(r.revenue) || 0,
      profit: Number(r.profit) || 0,
    }));
    return { days };
  },
  ['admin-profit-days'],
  [ORDERS_TAG, PRODUCTS_TAG]
);

export async function getProfitData(): Promise<ProfitData> {
  await requireAdmin();
  return loadProfitDaysCached();
}
