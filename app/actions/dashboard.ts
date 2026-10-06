'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { listProducts } from '@/app/actions/products';
import { mapOrderRow } from '@/lib/orders';
import { attachProfitSnapshots } from '@/lib/orderPrivate';
import { computeOrderProfit, PROFIT_STATUSES } from '@/lib/profit';
import type { Order } from '@/types';

// অডিট §৭.২: প্রফিট লজিক lib/profit.ts-এ একটাই উৎস। CONFIRMED_STATUSES = PROFIT_STATUSES
const CONFIRMED_STATUSES = PROFIT_STATUSES;

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

export async function getDashboardData(): Promise<DashboardData> {
  await requireAdmin();
  const supabase = createServiceRoleClient();

  const [ordersRes, products] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    listProducts(),
  ]);

  if (ordersRes.error) {
    throw new Error('অর্ডার লোড ব্যর্থ: ' + ordersRes.error.message);
  }

  const orderRows = ordersRes.data || [];
  // 🔒 প্রফিট স্ন্যাপশট গোপন `order_private` টেবিল থেকে
  await attachProfitSnapshots(supabase, orderRows);
  const orders: Order[] = orderRows.map(mapOrderRow);

  // ── স্ট্যাট গ্রিড ──
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const confirmedOrders = orders.filter((o) => CONFIRMED_STATUSES.includes(o.status));
  const confirmedRevenue = confirmedOrders.reduce((s, o) => s + (o.total || 0), 0);
  const netProfit = confirmedOrders.reduce((s, o) => s + computeOrderProfit(o, products), 0);

  const uniqueCustomers = new Set<string>();
  orders.forEach((o) => {
    const key = (o.customer_phone || o.customer_name || '').trim();
    if (key) uniqueCustomers.add(key);
  });

  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const confirmedCount = orders.filter((o) => o.status === 'confirmed').length;

  // ── রেভিনিউ চার্ট ডাটা (confirmed/shipped/delivered, তারিখ অনুযায়ী গ্রুপ করা) ──
  const revenueByDate: Record<string, number> = {};
  confirmedOrders.forEach((o) => {
    const key = (o.created_at || '').slice(0, 10);
    if (!key) return;
    revenueByDate[key] = (revenueByDate[key] || 0) + (o.total || 0);
  });

  // ── কম স্টক (custom_products, stock ৫ বা কম) ──
  const lowStock: LowStockItem[] = products
    .filter((p) => (p.stock ?? 0) <= 5)
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
    .map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock ?? 0,
      thumb: p.imgs?.[0] || '📦',
    }));

  return {
    stats: {
      totalOrders: orders.length,
      pendingCount,
      netProfit,
      confirmedRevenue,
      uniqueCustomers: uniqueCustomers.size,
      todayVisitors: null,
      totalVisitors: null,
      deliveredCount,
      confirmedCount,
    },
    recentOrders: orders.slice(0, 5), // query আগেই created_at desc দিয়ে sort করা
    revenueByDate,
    lowStock,
  };
}
