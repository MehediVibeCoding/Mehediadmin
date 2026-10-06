'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { adminCached, ORDERS_TAG } from '@/lib/adminCache';
import type { Customer } from '@/types';

// 🚀 আগে কাস্টমার পেজ সব অর্ডার টেনে ব্রাউজার/সার্ভারে ফোন ধরে গ্রুপ করত, সার্চ ও পেজ ভাগও
// সেখানেই হতো। এখন ডাটাবেজের admin_customers_page() ফাংশন গ্রুপ (ফোন, না থাকলে নাম),
// সার্চ (নাম/ইমেইল/ফোনের অঙ্ক) ও পেজ ভাগ করে — শুধু চাওয়া পেজের সারি আসে।
export interface CustomersPageParams {
  search: string;
  page: number; // 1-based
  pageSize: number;
}

export interface CustomersPageResult {
  rows: Customer[];
  /** সার্চ অনুযায়ী মোট কাস্টমার (পেজিনেশনের জন্য) */
  total: number;
  /** সব কাস্টমারের সারাংশ (সার্চ নির্বিশেষে — উপরের তিনটি টাইল) */
  totals: { customers: number; orders: number; spent: number };
}

const MAX_SEARCH_LENGTH = 80;

async function fetchCustomersPage(search: string, limit: number, offset: number): Promise<CustomersPageResult> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc('admin_customers_page', {
    p_search: search,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw new Error('কাস্টমার লোড ব্যর্থ: ' + error.message);

  const d = (data || {}) as {
    rows?: Record<string, unknown>[];
    total?: number;
    totals?: { customers?: number; orders?: number; spent?: number };
  };
  return {
    rows: (d.rows || []).map((r) => ({
      name: String(r.name ?? ''),
      phone: String(r.phone ?? ''),
      email: String(r.email ?? ''),
      order_count: Number(r.order_count) || 0,
      total_spent: Number(r.total_spent) || 0,
      last_order_date: String(r.last_order_date ?? ''),
    })),
    total: Number(d.total) || 0,
    totals: {
      customers: Number(d.totals?.customers) || 0,
      orders: Number(d.totals?.orders) || 0,
      spent: Number(d.totals?.spent) || 0,
    },
  };
}

// সার্চ ছাড়া পেজগুলো ক্যাশ হয় (অর্ডার বদলালে মুছে যায়, সর্বোচ্চ ২ মিনিট)।
// সার্চ-টার্ম যা-খুশি হতে পারে বলে সেগুলো ক্যাশ করা হয় না — ক্যাশ ফুলে যাওয়া ঠেকাতে।
const fetchCustomersPageCached = adminCached(fetchCustomersPage, ['admin-customers-page'], [ORDERS_TAG]);

export async function getCustomersPage(params: CustomersPageParams): Promise<CustomersPageResult> {
  await requireAdmin();
  const pageSize = Math.min(Math.max(1, Math.floor(Number(params.pageSize)) || 14), 100);
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const search = String(params.search ?? '').slice(0, MAX_SEARCH_LENGTH).trim();
  const offset = (page - 1) * pageSize;
  return search ? fetchCustomersPage(search, pageSize, offset) : fetchCustomersPageCached('', pageSize, offset);
}
