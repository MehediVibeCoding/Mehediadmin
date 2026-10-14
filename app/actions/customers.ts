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

// ── কাস্টমার ডিটেইল (ভেতরে ঢুকলে) ─────────────────────────────────────────────
// শুধু পড়ার অ্যাকশন — ডাটাবেজে কিছু লেখে না। কাস্টমারের চাবি = তালিকার RPC-র মতোই:
// ফোন থাকলে ফোন (হুবহু মিল), না থাকলে নাম (ফোন ছাড়া অর্ডারগুলো)।
export interface CustomerDetailOrder {
  id: string;
  order_num: string;
  created_at: string;
  status: string;
  total: number;
  itemCount: number;
}

export interface CustomerDetailProduct {
  name: string;
  /** মোট কত পিস (বাতিল/রিজেক্ট বাদে) */
  qty: number;
  /** কয়টা অর্ডারে */
  orders: number;
  emoji: string;
}

export interface CustomerDetailResult {
  orders: CustomerDetailOrder[];
  products: CustomerDetailProduct[];
  addresses: { district: string; address: string }[];
  firstOrderAt: string;
}

const DETAIL_MAX_ORDERS = 200;

export async function getCustomerDetail(params: { phone: string; name: string }): Promise<CustomerDetailResult> {
  await requireAdmin();
  const phone = String(params.phone ?? '').trim().slice(0, 40);
  const name = String(params.name ?? '').trim().slice(0, 120);
  if (!phone && !name) return { orders: [], products: [], addresses: [], firstOrderAt: '' };

  const supabase = createServiceRoleClient();
  let q = supabase
    .from('orders')
    .select('id, order_num, created_at, status, total, items, customer_district, customer_address')
    .order('created_at', { ascending: false })
    .limit(DETAIL_MAX_ORDERS);
  q = phone ? q.eq('customer_phone', phone) : q.eq('customer_name', name).or('customer_phone.is.null,customer_phone.eq.');

  const { data, error } = await q;
  if (error) throw new Error('কাস্টমারের অর্ডার লোড ব্যর্থ: ' + error.message);

  const rows = (data || []) as Record<string, unknown>[];
  const prod = new Map<string, CustomerDetailProduct>();
  const addrSeen = new Set<string>();
  const addresses: { district: string; address: string }[] = [];

  const orders: CustomerDetailOrder[] = rows.map((r) => {
    const status = String(r.status ?? 'pending');
    const items = Array.isArray(r.items) ? (r.items as { name?: unknown; qty?: unknown; emoji?: unknown }[]) : [];
    const counted = status !== 'cancelled' && status !== 'rejected';
    for (const it of items) {
      const n = String(it?.name ?? '').trim();
      if (!n || !counted) continue;
      const cur = prod.get(n) || { name: n, qty: 0, orders: 0, emoji: String(it?.emoji ?? '') };
      cur.qty += Number(it?.qty) || 1;
      cur.orders += 1;
      prod.set(n, cur);
    }
    const district = String(r.customer_district ?? '').trim();
    const address = String(r.customer_address ?? '').trim();
    const key = (district + '|' + address).toLowerCase();
    if ((district || address) && !addrSeen.has(key) && addresses.length < 3) {
      addrSeen.add(key);
      addresses.push({ district, address });
    }
    return {
      id: String(r.id),
      order_num: String(r.order_num ?? ''),
      created_at: String(r.created_at ?? ''),
      status,
      total: Number(r.total) || 0,
      itemCount: items.reduce((a, it) => a + (Number(it?.qty) || 1), 0),
    };
  });

  return {
    orders,
    products: Array.from(prod.values()).sort((a, b) => b.qty - a.qty),
    addresses,
    firstOrderAt: orders.length ? orders[orders.length - 1].created_at : '',
  };
}
