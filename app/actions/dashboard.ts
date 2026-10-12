'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { adminCached, ORDERS_TAG, PRODUCTS_TAG } from '@/lib/adminCache';
import { mapOrderRow } from '@/lib/orders';
import { computeInsights, EMPTY_INSIGHTS, type DashboardInsights, type InsightOrderRow } from '@/lib/dashboardInsights';
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

// "করণীয় তালিকা" কার্ডের কাউন্ট — প্রতিটা সংখ্যা সংশ্লিষ্ট পেজের দিকে নিয়ে যায়
export interface DashboardActionCounts {
  pendingOrders: number;
  unverifiedAdvance: number; // পেন্ডিং অর্ডার, যার অ্যাডভান্স এখনো যাচাই হয়নি
  unusedBkash: number; // গত ৭ দিনে আসা, কোনো অর্ডারে ব্যবহার না হওয়া বিকাশ SMS
  unansweredQuestions: number; // সাম্প্রতিক প্রশ্ন, যার কোনো উত্তর নেই
  lowStock: number;
  outOfStock: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentOrders: Order[];
  revenueByDate: Record<string, number>; // YYYY-MM-DD → confirmed/shipped/delivered মোট total
  lowStock: LowStockItem[];
  insights: DashboardInsights;
  actions: DashboardActionCounts;
}

// কম স্টকের সীমা (আগের মতোই: ৫ বা কম)
const LOW_STOCK_LIMIT = 5;

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


// ইনসাইট কার্ডের কাঁচা ডাটা: গত ৯০ দিনের অর্ডার (শুধু দরকারি কলাম), ব্যাচে ব্যাচে।
// এখানকার কোনো ব্যর্থতা ড্যাশবোর্ড ভাঙে না — ইনসাইট কার্ড ফাঁকা অবস্থায় দেখায়।
const INSIGHT_DAYS = 90;
const INSIGHT_BATCH = 1000;
const INSIGHT_MAX_ROWS = 5000;

async function loadInsightRows(): Promise<InsightOrderRow[]> {
  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - INSIGHT_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const all: InsightOrderRow[] = [];
  let from = 0;
  while (all.length < INSIGHT_MAX_ROWS) {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at, status, total, customer_phone, customer_district, items, coupon_code, discount_amount, payment_verified')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .range(from, from + INSIGHT_BATCH - 1);
    if (error || !data || data.length === 0) break;
    all.push(...(data as InsightOrderRow[]));
    if (data.length < INSIGHT_BATCH) break;
    from += INSIGHT_BATCH;
  }
  return all;
}

async function loadUnusedBkash(): Promise<number> {
  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('bkash_inbox')
    .select('id', { count: 'exact', head: true })
    .eq('is_used', false)
    .gte('created_at', since);
  return count || 0;
}

async function loadUnansweredQuestions(): Promise<number> {
  const supabase = createServiceRoleClient();
  const { data: qs } = await supabase
    .from('product_questions')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(200);
  const ids = (qs || []).map((q) => q.id as number);
  if (ids.length === 0) return 0;
  const { data: ans } = await supabase.from('product_question_answers').select('question_id').in('question_id', ids);
  const answered = new Set((ans || []).map((a) => a.question_id as number));
  return ids.filter((id) => !answered.has(id)).length;
}

async function safe<T>(job: Promise<T>, fallback: T): Promise<T> {
  try {
    return await job;
  } catch {
    return fallback;
  }
}

// 🚀 আগে: সব অর্ডার + সব প্রোডাক্ট টেনে এনে এখানে গুনত। এখন ডাটাবেজের admin_dashboard_summary()
// ফাংশন স্ট্যাট/প্রফিট/রেভিনিউ-চার্ট হিসাব করে দেয়; শুধু সর্বশেষ ৫টি অর্ডার ও কম-স্টক প্রোডাক্ট আলাদা আসে।
// ফলাফল সার্ভারে ক্যাশ থাকে (ট্যাগ: অর্ডার/প্রোডাক্ট বদলালে মুছে যায়, সর্বোচ্চ ২ মিনিট)।
// 🆕 (প্রোডাক্ট লিস্ট স্কেল ফিক্স, ২০২৬-১০): কাস্টম সাজানো ক্রম আগে আলাদা করে store_settings-এর
// vc_prod_order JSON array থেকে পড়তে হতো (readProductOrder — এখন সরানো হয়েছে)। এখন প্রোডাক্ট
// টেবিলেই sort_order কলাম আছে, তাই একই কুয়েরিতে সরাসরি সেই কলাম ধরে সাজানো যায় — আলাদা নেটওয়ার্ক
// কলই লাগে না।
const loadDashboardCached = adminCached(
  async (): Promise<DashboardData> => {
    const supabase = createServiceRoleClient();

    const [summaryRes, recentRes, lowRes, insightRows, unusedBkash, unansweredQuestions] = await Promise.all([
      supabase.rpc('admin_dashboard_summary'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
      supabase
        .from('custom_products')
        .select('id, name, stock, imgs, sort_order')
        .or(`stock.is.null,stock.lte.${LOW_STOCK_LIMIT}`)
        .order('sort_order', { ascending: true }),
      safe(loadInsightRows(), [] as InsightOrderRow[]),
      safe(loadUnusedBkash(), 0),
      safe(loadUnansweredQuestions(), 0),
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
      .sort((a, b) => a.stock - b.stock); // কুয়েরিতেই sort_order ধরা, এখানে শুধু স্টক কম থেকে বেশি (Array.sort স্থিতিশীল)

    const insights = insightRows.length > 0 ? computeInsights(insightRows) : EMPTY_INSIGHTS;

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
      insights,
      actions: {
        pendingOrders: Number(s.pendingCount) || 0,
        unverifiedAdvance: insights.unverifiedAdvance,
        unusedBkash,
        unansweredQuestions,
        lowStock: lowStock.filter((p) => p.stock > 0).length,
        outOfStock: lowStock.filter((p) => p.stock <= 0).length,
      },
    };
  },
  ['admin-dashboard-v2'],
  [ORDERS_TAG, PRODUCTS_TAG]
);

export async function getDashboardData(): Promise<DashboardData> {
  await requireAdmin();
  return loadDashboardCached();
}
