'use server';

import { after } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { mapOrderRow, isDiamondByDeliveredCount, ORDER_STATUS_ORDER } from '@/lib/orders';
import { syncConfirmedOrderToSheet } from '@/lib/googleSheet';
import { attachOrderRisk } from '@/lib/orderRisk';
import { adminCached, invalidateOrdersData, ORDERS_TAG } from '@/lib/adminCache';
import { isValidUuid } from '@/lib/security';
import type { Order, OrderStatus } from '@/types';

// ══════════════════════════════════════════════════════════════
//  READ
// ══════════════════════════════════════════════════════════════

// 🔒 A9 ফিক্স — legacy getOrdersAsync()-এর সমতুল্য listOrders() (সব অর্ডার
// select('*'), ১ লাখ সারি পর্যন্ত) এখানে ছিল কিন্তু কোথাও থেকে ডাকা হতো না
// (Orders পেজ অনেক আগেই listOrdersPage()-এ আর এক্সপোর্ট /api/export-orders
// route-এ সরে গেছে, দুটোই নিজেদের মতো সার্ভার-পেজিনেটেড)। মৃত কোড হিসেবে
// সরানো হলো — থাকলে ভবিষ্যতে ভুলে কল হলে পুরো অর্ডার টেবিল মেমোরিতে
// টেনে আনতে পারত।

// সাইডবারের পেন্ডিং ব্যাজের জন্য — পুরো লিস্ট না টেনে শুধু count
export async function getPendingOrdersCount(): Promise<number> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) return 0;
  return count || 0;
}

// ── সার্ভার-সাইড পেজিনেশন + ফিল্টার (অডিট §১.১) ─────────────────────────
// আগে অর্ডার পেজ সব অর্ডার আনত, ব্রাউজারে ফিল্টার/পেজ ভাগ করত। এখন ডাটাবেজ
// শুধু চাওয়া পেজের সারি, মোট সংখ্যা ও স্ট্যাটাস-কাউন্ট পাঠায়।
export interface OrdersPageParams {
  page: number; // 1-based
  pageSize: number;
  status: 'all' | OrderStatus;
  search: string;
  fromIso?: string | null;
  toIso?: string | null;
}

export interface OrdersPageResult {
  rows: Order[];
  /** ফিল্টার অনুযায়ী মোট (পেজিনেশনের জন্য) */
  total: number;
  /** সব অর্ডারের মোট (টুলবারের "সব" ট্যাবের জন্য) */
  grandTotal: number;
  statusCounts: Record<OrderStatus, number>;
}

// PostgREST .or() ফিল্টারে কমা/বন্ধনী/ওয়াইল্ডকার্ড ভেঙে যায় — সেগুলো বাদ দেওয়া হয়
const SEARCH_UNSAFE = /[%_*\\,()"]/g;

// ভেতরের আসল কুয়েরি — cookies/requireAdmin ছাড়া (ক্যাশ-করা ফাংশনে সেগুলো চলে না)।
// এক্সপোর্টেড listOrdersPage আগে requireAdmin() ডেকে তবেই এটা ডাকে।
async function fetchOrdersPage(params: OrdersPageParams): Promise<OrdersPageResult> {
  const supabase = createServiceRoleClient();

  const pageSize = Math.min(Math.max(1, Math.floor(Number(params.pageSize)) || 14), 100);
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // সার্চ ম্যাচিং আগের client-side orderMatchesQuery-এর সাথে এক: অর্ডার নং, নাম
  // (case-insensitive substring) এবং ফোন (শুধু সংখ্যা দিয়ে, query-তে digit থাকলে)
  const term = params.search.replace(SEARCH_UNSAFE, '').trim();
  const digits = params.search.replace(/\D/g, '');

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (params.status !== 'all') query = query.eq('status', params.status);
  if (params.fromIso) query = query.gte('created_at', params.fromIso);
  if (params.toIso) query = query.lte('created_at', params.toIso);
  if (term) {
    const conds = [`order_num.ilike.*${term}*`, `customer_name.ilike.*${term}*`];
    if (digits) conds.push(`customer_phone.ilike.*${digits}*`);
    query = query.or(conds.join(','));
  }

  const [pageRes, grandRes, ...statusRes] = await Promise.all([
    query.range(from, to),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    ...ORDER_STATUS_ORDER.map((st) =>
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', st)
    ),
  ]);

  if (pageRes.error) throw new Error('অর্ডার লোড ব্যর্থ: ' + pageRes.error.message);

  const statusCounts = Object.fromEntries(
    ORDER_STATUS_ORDER.map((st, i) => [st, statusRes[i]?.count || 0])
  ) as Record<OrderStatus, number>;

  // ডায়মন্ড ট্যাগ: ওই পেজের ইউজারদের মোট ডেলিভার্ড অর্ডার (পুরো ডেটার উপর হিসাব, শুধু পেজের না)
  const rawRows = pageRes.data || [];
  const userIds = Array.from(new Set(rawRows.map((r) => r.user_id).filter(Boolean))) as string[];
  const deliveredByUser = new Map<string, number>();
  if (userIds.length > 0) {
    const { data: delivered } = await supabase
      .from('orders')
      .select('user_id')
      .eq('status', 'delivered')
      .in('user_id', userIds);
    (delivered || []).forEach((r: { user_id: string | null }) => {
      if (r.user_id) deliveredByUser.set(r.user_id, (deliveredByUser.get(r.user_id) || 0) + 1);
    });
  }

  const rows = rawRows.map((r) => {
    const order = mapOrderRow(r);
    const delivered = order.user_id ? deliveredByUser.get(order.user_id) || 0 : 0;
    if (isDiamondByDeliveredCount(delivered)) order.member_tier = 'diamond';
    return order;
  });
  await attachOrderRisk(supabase, rows);

  return {
    rows,
    total: pageRes.count || 0,
    grandTotal: grandRes.count || 0,
    statusCounts,
  };
}

// 🚀 ফিল্টার/পেজ অনুযায়ী ফলাফল সার্ভারে ক্যাশ হয় (ট্যাগ: অর্ডার বদলালে মুছে যায়, সর্বোচ্চ ২ মিনিট)।
// সার্চ-টার্ম যা-খুশি হতে পারে বলে সার্চসহ কুয়েরি ক্যাশ করা হয় না — ক্যাশ ফুলে যাওয়া ঠেকাতে।
const fetchOrdersPageCached = adminCached(fetchOrdersPage, ['admin-orders-page'], [ORDERS_TAG]);

export async function listOrdersPage(params: OrdersPageParams): Promise<OrdersPageResult> {
  await requireAdmin();
  const normalized: OrdersPageParams = {
    page: Math.max(1, Math.floor(Number(params.page)) || 1),
    pageSize: Math.min(Math.max(1, Math.floor(Number(params.pageSize)) || 14), 100),
    status: params.status,
    search: String(params.search ?? ''),
    fromIso: params.fromIso ?? null,
    toIso: params.toIso ?? null,
  };
  if (normalized.search.trim()) return fetchOrdersPage(normalized);
  return fetchOrdersPageCached(normalized);
}

// ══════════════════════════════════════════════════════════════
//  WRITE
// ══════════════════════════════════════════════════════════════

export interface OrderActionResult {
  status: 'ok' | 'error';
  message?: string;
}

// 🛡️ ফিক্স (audit P1-10): আগে শুধু 'rejected'-এ স্টক ফেরত যেত, 'cancelled'-এ
// যেত না — অথচ ড্রপডাউনে দুটোই সমান বৈধ "অর্ডার হয়নি" স্ট্যাটাস। ফলে কোনো
// pending/confirmed অর্ডার 'cancelled' করলে তার স্টক চিরতরে আটকে থাকত।
// দুটো স্ট্যাটাসকেই এখন একই নিয়মে (idempotent) স্টক-রিস্টোর ট্রিগার করে।
const STOCK_RESTORED_STATUSES: OrderStatus[] = ['rejected', 'cancelled'];

// ⚠️ ক্রিটিকাল ফিক্স — স্টক রিস্টোর অন রিজেক্ট/ক্যান্সেল, আর রি-কনফার্মে
// আবার কমানো (fail-closed, অপর্যাপ্ত হলে ব্লক) — এই পুরো লজিক এখন
// Supabase-এর admin_transition_order_status() DB ফাংশনে (দেখো নিচের
// updateOrderStatus) — আগে এখানে দুটো আলাদা JS হেল্পার ফাংশন
// (restoreStockForItems/decrementStockForItems) এই কাজ করত, কিন্তু
// status-পড়া ও status-লেখার মাঝে row-lock না থাকায় রেস কন্ডিশন ছিল
// (A6 দ্রষ্টব্য) — DB ফাংশনে সরানোর পর সেগুলো অপ্রয়োজনীয় হয়ে গেছে, সরিয়ে
// ফেলা হলো।

// 🔒 A6 ফিক্স — আগে এখানে তিনটা আলাদা ধাপ (status পড়া → restore/decrement RPC
// → status UPDATE) আলাদা আলাদা রাউন্ড-ট্রিপে হতো, মাঝে কোনো row-lock ছিল না।
// দুই ট্যাব/ডাবল-ক্লিকে দুটো রিকোয়েস্টই একসাথে প্রথম ধাপে একই পুরনো status
// পড়ে ফেলতে পারত, ফলে দুটোই স্টক restore/decrement চালিয়ে স্টক ডাবল-কাউন্ট
// হতো। এখন পুরো ট্রানজিশন একটা একক DB ফাংশনে (admin_transition_order_status,
// `SELECT ... FOR UPDATE` দিয়ে order row লক করে) — কনকারেন্ট কল সিরিয়ালাইজড,
// আর স্টক-ফাংশন exception দিলে (অপর্যাপ্ত স্টক) পুরো ট্রানজ্যাকশন rollback
// হয়ে status-ও বদলায় না (fail-closed)। Supabase-এ সরাসরি রোলব্যাক-সহ টেস্ট
// করে এই সবগুলো আচরণ যাচাই করা হয়েছে।
const ALLOWED_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'rejected', 'cancelled'];

// legacy setOrderStatus() — শুধু Supabase আপডেট অংশ। sound legacy-তেও
// client-side, তাই OrdersPageClient.tsx-এই আছে (এখানে না)।
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderActionResult> {
  const { email: adminEmail } = await requireAdmin();
  // 🛡️ অডিট ফিক্স: service-role client-এ যাওয়ার আগে id ফরম্যাট যাচাই
  if (!isValidUuid(id)) return { status: 'error', message: 'অর্ডার আইডি সঠিক নয়' };
  // 🔒 A6 ফিক্স — রানটাইম allowlist (DB-তেও orders_status_chk CHECK constraint
  // আছে, এটা শুধু ভুল কল হলে দ্রুত স্পষ্ট বার্তা দেওয়ার জন্য — ডাটাবেজ এমনিতেই
  // অচেনা status ভ্যালু গ্রহণ করত না)
  if (!ALLOWED_STATUSES.includes(status)) return { status: 'error', message: 'অজানা স্ট্যাটাস' };
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc('admin_transition_order_status', {
    p_order_id: id,
    p_new_status: status,
    p_admin_email: adminEmail,
  });

  if (error) {
    const insufficient = error.message?.includes('INSUFFICIENT_STOCK');
    const notFound = error.message?.includes('ORDER_NOT_FOUND');
    return {
      status: 'error',
      message: insufficient
        ? 'স্টক অপর্যাপ্ত — এই অর্ডার আবার কনফার্ম করার মতো পর্যাপ্ত স্টক নেই। আগে স্টক বাড়িয়ে নিন।'
        : notFound
        ? 'অর্ডার খুঁজে পাওয়া যায়নি'
        : 'স্ট্যাটাস বদলাতে ব্যর্থ (' + error.message + ')',
    };
  }
  void data; // { ok, previous_status } — এখানে ব্যবহার হচ্ছে না, শুধু error-ই চেক করা হচ্ছে

  // legacy setOrderStatus()-এর addConfirmed sync — status 'confirmed' হলেই
  // ট্রিগার হয় (bulkUpdateOrderStatus-এ হয় না, legacy-তেও হতো না)। `after()`
  // ব্যবহার করা হচ্ছে যাতে response আটকে না থেকেও কাজটা নিশ্চিতভাবে শেষ
  // পর্যন্ত চলে (serverless-এ response পাঠানোর পর সাধারণ un-awaited
  // fetch মাঝপথে থেমে যেতে পারে — after() সেই ঝুঁকি ছাড়াই ব্যাকগ্রাউন্ডে চালায়)।
  if (status === 'confirmed') {
    after(async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', id).single();
      if (data) await syncConfirmedOrderToSheet(mapOrderRow(data));
    });
  }

  // 🩹 ফিক্স (স্কেলেটন ফ্লিকার): আগে এখানে revalidatePath('/orders') +
  // revalidatePath('/') কল হতো, যা প্রতিটা স্ট্যাটাস বদলে ক্লায়েন্টের
  // Router Cache (next.config.js-এর staleTimes) জোর করে মুছে দিত —
  // ফলে অর্ডার/ড্যাশবোর্ড পেজে পরের নেভিগেশনেই আবার পুরো loading.tsx
  // স্কেলেটন দেখাত, staleTimes যতই বড় রাখা হোক না কেন। listOrdersPage
  // ও getDashboardData দুটোই আগে থেকেই ORDERS_TAG দিয়ে adminCached()
  // (lib/adminCache.ts, unstable_cache + ADMIN_CACHE_SECONDS=120s)
  // ব্যবহার করে — তাই invalidateOrdersData() একাই যথেষ্ট: ডাটা সর্বোচ্চ
  // ~২ মিনিট পুরনো থাকতে পারে, কিন্তু Router Cache অক্ষত থাকায় পেজ
  // সুইচে কোনো স্কেলেটন ফ্ল্যাশ হয় না। বর্তমান ট্যাব নিজেই status বদলের
  // পর load(..., true)/clearOrdersCache() দিয়ে সাথে সাথে নিজের ডাটা
  // রিফ্রেশ করে নেয় (OrdersPageClient.tsx), তাই তাৎক্ষণিক ফিডব্যাকও মিস হয় না।
  invalidateOrdersData();

  return { status: 'ok' };
}

export interface BulkOrderActionResult {
  status: 'ok' | 'error';
  changed: number;
  message?: string;
}

// legacy confirmBulkStatus() — সিলেক্টেড সব অর্ডারের স্ট্যাটাস একসাথে আপডেট
export async function bulkUpdateOrderStatus(
  ids: string[],
  status: OrderStatus
): Promise<BulkOrderActionResult> {
  const { email: adminEmail } = await requireAdmin();
  if (!ids.length) return { status: 'error', changed: 0, message: 'অন্তত একটি অর্ডার সিলেক্ট করুন' };
  // 🛡️ অডিট ফিক্স: ভুল-ফরম্যাট id থাকলে পুরো বাল্ক রিকোয়েস্ট বাতিল (চুপচাপ বাদ না দিয়ে,
  // যাতে caller বুঝতে পারে কোনো একটা id গড়বড়)
  if (!ids.every(isValidUuid)) {
    return { status: 'error', changed: 0, message: 'একটি বা একাধিক অর্ডার আইডি সঠিক নয়' };
  }
  // 🔒 ফিক্স (audit P1-20): আগে ids-এর আকারে কোনো সীমা ছিল না — UI থেকে সবসময়
  // যুক্তিসঙ্গত সংখ্যা আসে, কিন্তু server action সরাসরি কল করা গেলে (বা ভবিষ্যতে
  // UI বদলালে) অনেক বড় অ্যারে দিয়ে DB-তে চাপ ফেলা যেত। ২০০-এ ক্যাপ করলাম।
  const MAX_BULK_IDS = 200;
  if (ids.length > MAX_BULK_IDS) {
    return { status: 'error', changed: 0, message: `একসাথে সর্বোচ্চ ${MAX_BULK_IDS}টি অর্ডার আপডেট করা যাবে` };
  }
  if (!ALLOWED_STATUSES.includes(status)) return { status: 'error', changed: 0, message: 'অজানা স্ট্যাটাস' };
  const supabase = createServiceRoleClient();
  const enteringRestored = STOCK_RESTORED_STATUSES.includes(status);

  // 🔒 A6 ফিক্স — আগে এখানে আলাদা করে (১) সব অর্ডারের status/items একসাথে
  // পড়া, (২) প্রতিটার জন্য আলাদা করে restore/decrement, (৩) সবশেষে একটা
  // ব্যাচ UPDATE — এই ক্রমে হতো। ধাপ (১)-এর read আর ধাপ (৩)-এর write-এর
  // মাঝে অনেকটা সময় থাকায় কনকারেন্ট রিকোয়েস্ট (যেমন কেউ একই মুহূর্তে একই
  // অর্ডার একা একা status বদলালে) race তৈরি করতে পারত — single-এর মতোই।
  // এখন প্রতিটা অর্ডারের জন্য আলাদাভাবে admin_transition_order_status()
  // কল হয় (প্রতিটা নিজের মধ্যে atomic ও row-locked) — একটা ব্যর্থ হলে
  // (যেমন অপর্যাপ্ত স্টক) শুধু সেটাই বাদ পড়ে, বাকিগুলো চলতে থাকে।
  const failedIds: string[] = [];
  let changed = 0;
  for (const id of ids) {
    const { error } = await supabase.rpc('admin_transition_order_status', {
      p_order_id: id,
      p_new_status: status,
      p_admin_email: adminEmail,
    });
    if (error) {
      failedIds.push(id);
      continue;
    }
    changed++;
  }

  invalidateOrdersData();

  if (!changed && failedIds.length) {
    return {
      status: 'error',
      changed: 0,
      message: enteringRestored
        ? 'কোনো অর্ডারেরই স্টক রিস্টোর করা যায়নি — restore_product_stock ফাংশন চেক করো।'
        : 'কোনো অর্ডারেই পর্যাপ্ত স্টক নেই — রি-কনফার্ম করা যায়নি।',
    };
  }

  if (failedIds.length) {
    return {
      status: 'ok',
      changed,
      message: enteringRestored
        ? `${failedIds.length}টি অর্ডারের স্টক রিস্টোর ব্যর্থ হওয়ায় সেগুলো reject হয়নি`
        : `${failedIds.length}টি অর্ডারে পর্যাপ্ত স্টক না থাকায় সেগুলো রি-কনফার্ম হয়নি`,
    };
  }

  return { status: 'ok', changed };
}
