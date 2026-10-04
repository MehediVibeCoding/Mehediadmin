'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { mapOrderRow, isDiamondByDeliveredCount, ORDER_STATUS_ORDER } from '@/lib/orders';
import { syncConfirmedOrderToSheet } from '@/lib/googleSheet';
import type { Order, OrderItem, OrderStatus } from '@/types';

// ══════════════════════════════════════════════════════════════
//  READ
// ══════════════════════════════════════════════════════════════

// legacy getOrdersAsync() — সব অর্ডার, created_at DESC (Supabase-ই সর্ট করে দেয়)
export async function listOrders(): Promise<Order[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error('অর্ডার লোড ব্যর্থ: ' + error.message);

  // প্রতিটা লগইন-ইউজারের ডেলিভার্ড অর্ডার গুনে ডায়মন্ড মেম্বার চিহ্নিত করা
  // (একই fetch থেকেই — আলাদা কোনো DB কল লাগে না)
  const rows = data || [];
  const deliveredByUser = new Map<string, number>();
  for (const r of rows) {
    if (r.user_id && r.status === 'delivered') {
      deliveredByUser.set(r.user_id, (deliveredByUser.get(r.user_id) || 0) + 1);
    }
  }
  return rows.map((r) => {
    const order = mapOrderRow(r);
    const delivered = order.user_id ? deliveredByUser.get(order.user_id) || 0 : 0;
    if (isDiamondByDeliveredCount(delivered)) order.member_tier = 'diamond';
    return order;
  });
}

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

export async function listOrdersPage(params: OrdersPageParams): Promise<OrdersPageResult> {
  await requireAdmin();
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

  return {
    rows,
    total: pageRes.count || 0,
    grandTotal: grandRes.count || 0,
    statusCounts,
  };
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

// ⚠️ ক্রিটিকাল ফিক্স — স্টক রিস্টোর অন রিজেক্ট ────────────────────────
// bKash manual-verify ফ্লোতে অর্ডার বসানোর সাথে সাথেই প্রোডাক্টের স্টক
// কমে যায় (admin approve করার আগেই)। আগে admin panel-এ "reject" বলে
// কোনো UI/status-ই ছিল না, তাই fake/ভুল TxnID-র অর্ডার cancel করলেও
// (যেটাই একমাত্র বিকল্প ছিল) কমে যাওয়া স্টক কখনো ফেরত যেত না — বহু
// fake অর্ডার জমলে real stock ভুলভাবে কমতেই থাকত।
//
// এখন 'rejected' status যোগ হয়েছে, আর status 'rejected'-এ change হওয়ার
// মুহূর্তেই (অন্য কোনো status থেকে, শুধু একবার — idempotent) Supabase-এর
// `restore_product_stock` RPC কল হয় যাতে সেই অর্ডারের প্রতিটা item-এর
// qty আবার stock-এ ফেরত যোগ হয়।
//
// ⚠️ owner-কে verify করতে হবে: `restore_product_stock(p_items jsonb)`
// নামে Postgres function Supabase-এ আছে কিনা। না থাকলে এই SQL Supabase
// SQL Editor-এ রান করো:
//
//   create or replace function public.restore_product_stock(p_items jsonb)
//   returns void
//   language plpgsql
//   security definer
//   set search_path = public
//   as $$
//   declare
//     item jsonb;
//   begin
//     for item in select * from jsonb_array_elements(p_items)
//     loop
//       if (item->>'id') is not null then
//         update custom_products
//         set stock = stock + coalesce((item->>'qty')::int, 0)
//         where id = (item->>'id')::bigint;
//       end if;
//     end loop;
//   end;
//   $$;
//
//   grant execute on function public.restore_product_stock(jsonb) to service_role;
//
// যদি Supabase-এ ইতিমধ্যে এই নামে (বা stock decrement-এর সাথে যুক্ত
// আলাদা কোনো নামে) function থাকে ভিন্ন parameter শেপে, সেই signature
// জানালে এই কোড মিলিয়ে দেওয়া যাবে।
async function restoreStockForItems(
  supabase: SupabaseClient,
  items: OrderItem[]
): Promise<{ ok: boolean; message?: string }> {
  const restorable = (items || []).filter((it) => it && it.id !== undefined && it.id !== null && it.qty > 0);
  if (!restorable.length) return { ok: true };

  const { error } = await supabase.rpc('restore_product_stock', {
    p_items: restorable.map((it) => ({ id: it.id, qty: it.qty })),
  });

  if (error) {
    return {
      ok: false,
      message:
        'স্টক রিস্টোর ব্যর্থ (' +
        error.message +
        ') — Supabase-এ restore_product_stock ফাংশন আছে কিনা যাচাই করো। অর্ডার reject হয়নি।',
    };
  }
  return { ok: true };
}

// legacy setOrderStatus() — শুধু Supabase আপডেট অংশ। sound legacy-তেও
// client-side, তাই OrdersPageClient.tsx-এই আছে (এখানে না)।
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();

  // 'rejected' বা 'cancelled'-এ change হওয়ার সময় স্টক রিস্টোর করতে হবে —
  // কিন্তু আগে বর্তমান status/items জেনে নিতে হবে (আগে থেকেই এই দুই
  // স্ট্যাটাসের একটায় থাকলে আবার restore না করার জন্য — double-credit ঠেকাতে)
  if (STOCK_RESTORED_STATUSES.includes(status)) {
    const { data: current, error: fetchErr } = await supabase
      .from('orders')
      .select('status, items')
      .eq('id', id)
      .single();
    if (fetchErr) return { status: 'error', message: 'অর্ডার খুঁজে পাওয়া যায়নি: ' + fetchErr.message };

    if (!STOCK_RESTORED_STATUSES.includes(current.status)) {
      const restore = await restoreStockForItems(supabase, current.items as OrderItem[]);
      if (!restore.ok) return { status: 'error', message: restore.message };
    }
  }

  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) return { status: 'error', message: error.message };

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

  revalidatePath('/orders');
  revalidatePath('/');
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
  await requireAdmin();
  if (!ids.length) return { status: 'error', changed: 0, message: 'অন্তত একটি অর্ডার সিলেক্ট করুন' };
  // 🔒 ফিক্স (audit P1-20): আগে ids-এর আকারে কোনো সীমা ছিল না — UI থেকে সবসময়
  // যুক্তিসঙ্গত সংখ্যা আসে, কিন্তু server action সরাসরি কল করা গেলে (বা ভবিষ্যতে
  // UI বদলালে) অনেক বড় অ্যারে দিয়ে DB-তে চাপ ফেলা যেত। ২০০-এ ক্যাপ করলাম।
  const MAX_BULK_IDS = 200;
  if (ids.length > MAX_BULK_IDS) {
    return { status: 'error', changed: 0, message: `একসাথে সর্বোচ্চ ${MAX_BULK_IDS}টি অর্ডার আপডেট করা যাবে` };
  }
  const supabase = createServiceRoleClient();

  let targetIds = ids;

  // বাল্ক-এ reject/cancel করার সময়ও একই স্টক-রিস্টোর নিয়ম — প্রতিটা অর্ডারের
  // জন্য আলাদা করে (যেগুলো আগে থেকেই rejected/cancelled না, শুধু সেগুলোর জন্য)।
  // কোনো একটার restore ব্যর্থ হলে সেটাকে বাদ দিয়ে বাকিগুলো আপডেট হয়,
  // যাতে একটা fail হওয়ার কারণে পুরো বাল্ক অ্যাকশন আটকে না যায়।
  if (STOCK_RESTORED_STATUSES.includes(status)) {
    const { data: rows, error: fetchErr } = await supabase
      .from('orders')
      .select('id, status, items')
      .in('id', ids);
    if (fetchErr) return { status: 'error', changed: 0, message: 'অর্ডার খুঁজে পাওয়া যায়নি: ' + fetchErr.message };

    const failedIds: string[] = [];
    for (const row of rows || []) {
      if (STOCK_RESTORED_STATUSES.includes(row.status)) continue; // idempotent — আগেই rejected/cancelled
      const restore = await restoreStockForItems(supabase, row.items as OrderItem[]);
      if (!restore.ok) failedIds.push(row.id);
    }
    targetIds = ids.filter((id) => !failedIds.includes(id));

    if (!targetIds.length) {
      return { status: 'error', changed: 0, message: 'কোনো অর্ডারেরই স্টক রিস্টোর করা যায়নি — restore_product_stock ফাংশন চেক করো।' };
    }
  }

  const { error, count } = await supabase
    .from('orders')
    .update({ status }, { count: 'exact' })
    .in('id', targetIds);
  if (error) return { status: 'error', changed: 0, message: error.message };

  if (STOCK_RESTORED_STATUSES.includes(status) && targetIds.length < ids.length) {
    revalidatePath('/orders');
    revalidatePath('/');
    return {
      status: 'ok',
      changed: count ?? targetIds.length,
      message: `${ids.length - targetIds.length}টি অর্ডারের স্টক রিস্টোর ব্যর্থ হওয়ায় সেগুলো reject হয়নি`,
    };
  }

  revalidatePath('/orders');
  revalidatePath('/');
  return { status: 'ok', changed: count ?? targetIds.length };
}
