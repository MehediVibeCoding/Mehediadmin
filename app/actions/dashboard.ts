'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { adminCached, ORDERS_TAG, PRODUCTS_TAG } from '@/lib/adminCache';
import { mapOrderRow } from '@/lib/orders';
import type { Order } from '@/types';

export interface DashboardStats {
  totalOrders: number;
  pendingCount: number;
  netProfit: number;
  confirmedRevenue: number;
  uniqueCustomers: number;
  // null = ভিজিটর ডাটার সোর্স সংযুক্ত নয় (Cloudflare Analytics ভবিষ্যতে যুক্ত হবে)
  todayVisitors: number | null;
  totalVisitors: number | null;
  deliveredCount: number;
  confirmedCount: number;
}

export interface LowStockItem {
  id: number;
  name: string;
  stock: number;
  thumb: string; // প্রথম img entry — URL অথবা emoji fallback
}

export interface DashboardData {
  stats: DashboardStats;
  recentOrders: Order[];
  revenueByDate: Record<string, number>; // YYYY-MM-DD → confirmed/shipped/delivered মোট total
  lowStock: LowStockItem[];
}

// কম স্টকের সীমা (আগের মতোই: ৫ বা কম)
const LOW_STOCK_LIMIT = 5;
const PRODUCT_ORDER_KEY = 'vc_prod_order';

interface SummaryRpc {
  totalOrders?: number;
  pendingCount?: number;
  confirmedCount?: number;
  deliveredCount?: number;
  confirmedRevenue?: number;
  netProfit?: number;
  uniqueCustomers?: number;
  revenueByDate?: Record<string, number>;
}

// প্রোডাক্ট তালিকার কাস্টম সাজানো ক্রম (ড্র্যাগ-সর্ট) — products.ts-এর applyOrder-এর সাথে একই নিয়ম,
// যাতে স্টক সমান হলে আগের মতোই একই ক্রমে দেখায়
async function readProductOrder(): Promise<Map<number, number>> {
  const supabase = createServiceRoleClient();
  const map = new Map<number, number>();
  const { data } = await supabase
    .from('store_settings')
    .select('setting_value')
    .eq('setting_key', PRODUCT_ORDER_KEY)
    .maybeSingle();
  if (!data?.setting_value) return map;
  try {
    const raw = data.setting_value;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) parsed.forEach((id: number, i: number) => map.set(Number(id), i));
  } catch {
    // নষ্ট মান হলে ক্রম ছাড়াই চলবে
  }
  return map;
}

// 🚀 আগে: সব অর্ডার + সব প্রোডাক্ট টেনে এনে এখানে গুনত। এখন ডাটাবেজের admin_dashboard_summary()
// ফাংশন স্ট্যাট/প্রফিট/রেভিনিউ-চার্ট হিসাব করে দেয়; শুধু সর্বশেষ ৫টি অর্ডার ও কম-স্টক প্রোডাক্ট আলাদা আসে।
// ফলাফল সার্ভারে ক্যাশ থাকে (ট্যাগ: অর্ডার/প্রোডাক্ট বদলালে মুছে যায়, সর্বোচ্চ ২ মিনিট)।
const loadDashboardCached = adminCached(
  async (): Promise<DashboardData> => {
    const supabase = createServiceRoleClient();

    const [summaryRes, recentRes, lowRes, order] = await Promise.all([
      supabase.rpc('admin_dashboard_summary'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
      supabase
        .from('custom_products')
        .select('id, name, stock, imgs')
        .or(`stock.is.null,stock.lte.${LOW_STOCK_LIMIT}`)
        .order('id', { ascending: true }),
      readProductOrder(),
    ]);

    if (summaryRes.error) throw new Error('ড্যাশবোর্ড হিসাব ব্যর্থ: ' + summaryRes.error.message);
    if (recentRes.error) throw new Error('অর্ডার লোড ব্যর্থ: ' + recentRes.error.message);
    if (lowRes.error) throw new Error('প্রোডাক্ট লোড ব্যর্থ: ' + lowRes.error.message);

    const s = (summaryRes.data || {}) as SummaryRpc;

    // ── কম স্টক: কাস্টম ক্রম আগে, তারপর স্টক কম থেকে বেশি (সমান হলে ওই ক্রমই থাকে) ──
    const lowStock: LowStockItem[] = (lowRes.data || [])
      .map((p) => ({
        id: p.id as number,
        name: (p.name as string) || '',
        stock: (p.stock as number | null) ?? 0,
        thumb: ((p.imgs as string[] | null) || [])[0] || '📦',
      }))
      .sort((a, b) => {
        const ia = order.has(a.id) ? order.get(a.id)! : 99999;
        const ib = order.has(b.id) ? order.get(b.id)! : 99999;
        if (ia !== ib) return ia - ib;
        return a.id - b.id;
      })
      .sort((a, b) => a.stock - b.stock); // Array.sort স্থিতিশীল — আগের ক্রম সমান স্টকে বজায় থাকে

    return {
      stats: {
        totalOrders: Number(s.totalOrders) || 0,
        pendingCount: Number(s.pendingCount) || 0,
        netProfit: Number(s.netProfit) || 0,
        confirmedRevenue: Number(s.confirmedRevenue) || 0,
        uniqueCustomers: Number(s.uniqueCustomers) || 0,
        todayVisitors: null,
        totalVisitors: null,
        deliveredCount: Number(s.deliveredCount) || 0,
        confirmedCount: Number(s.confirmedCount) || 0,
      },
      recentOrders: (recentRes.data || []).map(mapOrderRow),
      revenueByDate: s.revenueByDate || {},
      lowStock,
    };
  },
  ['admin-dashboard'],
  [ORDERS_TAG, PRODUCTS_TAG]
);

export async function getDashboardData(): Promise<DashboardData> {
  await requireAdmin();
  return loadDashboardCached();
}
