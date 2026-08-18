'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { listProducts } from '@/app/actions/products';
import { mapOrderRow } from '@/lib/orders';
import type { Order, OrderStatus, Product } from '@/types';

const DEFAULT_UNIT_PROFIT = 200; // বেশিরভাগ প্রোডাক্টে ডিফল্ট প্রফিট ৳২০০, specs._profit না থাকলে

const CONFIRMED_STATUSES: OrderStatus[] = ['confirmed', 'shipped', 'delivered'];
const PAGE_VIEWS_LOOKBACK_DAYS = 90;

export interface DashboardStats {
  totalOrders: number;
  pendingCount: number;
  netProfit: number;
  confirmedRevenue: number;
  uniqueCustomers: number;
  todayVisitors: number;
  totalVisitors: number;
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

// প্রোডাক্ট নাম দিয়ে match করে প্রতি ইউনিটের প্রফিট বের করো (legacy getUnitProfitByName)
function getUnitProfitByName(name: string, products: Product[]): number {
  const key = (name || '').toLowerCase().trim();
  if (!key) return DEFAULT_UNIT_PROFIT;
  const p = products.find((x) => (x.name || '').toLowerCase().trim() === key);
  const profit = p?.specs?._profit;
  if (profit != null && !Number.isNaN(Number(profit))) return Number(profit);
  return DEFAULT_UNIT_PROFIT;
}

// একটা অর্ডারের সব আইটেমের মোট নেট প্রফিট (legacy computeOrderProfit)
function computeOrderProfit(order: Order, products: Product[]): number {
  return (order.items || []).reduce((sum, it) => {
    const unitProfit = getUnitProfitByName(it.name, products);
    const qty = Number(it.qty) || 0;
    return sum + unitProfit * qty;
  }, 0);
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createServiceRoleClient();

  const pvCutoff = new Date();
  pvCutoff.setDate(pvCutoff.getDate() - PAGE_VIEWS_LOOKBACK_DAYS);

  const [ordersRes, products, pageViewsRes] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    listProducts(),
    supabase
      .from('page_views')
      .select('visitor_id,created_at')
      .gte('created_at', pvCutoff.toISOString()),
  ]);

  if (ordersRes.error) {
    throw new Error('অর্ডার লোড ব্যর্থ: ' + ordersRes.error.message);
  }

  const orders: Order[] = (ordersRes.data || []).map(mapOrderRow);

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

  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const todaySet = new Set<string>();
  const totalSet = new Set<string>();
  if (!pageViewsRes.error && pageViewsRes.data) {
    pageViewsRes.data.forEach((row) => {
      if (row.visitor_id) {
        totalSet.add(row.visitor_id);
        const rowDate = new Date(row.created_at).toLocaleDateString('en-CA');
        if (rowDate === todayStr) todaySet.add(row.visitor_id);
      }
    });
  }

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
      todayVisitors: todaySet.size,
      totalVisitors: totalSet.size,
      deliveredCount,
      confirmedCount,
    },
    recentOrders: orders.slice(0, 5), // query আগেই created_at desc দিয়ে sort করা
    revenueByDate,
    lowStock,
  };
}
