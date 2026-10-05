'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { mapOrderRow, isDiamondByDeliveredCount } from '@/lib/orders';
import { attachOrderRisk } from '@/lib/orderRisk';
import type { Order } from '@/types';

export type BkashFilter = 'all' | 'used' | 'unused';

export interface BkashPayment {
  id: number;
  trx_id: string;
  sender_number: string;
  sender_last4: string;
  amount: number;
  raw_sms: string;
  is_used: boolean;
  used_order_id: string | null;
  order_num: string | null;
  matched_at: string | null;
  created_at: string;
}

export interface BkashPageParams {
  page: number; // 1-based
  pageSize: number;
  filter: BkashFilter;
  search: string;
}

export interface BkashPageResult {
  rows: BkashPayment[];
  /** ফিল্টার ও সার্চ অনুযায়ী মোট (পেজিনেশনের জন্য) */
  total: number;
  /** ট্যাব চিপের কাউন্ট — সব সময়ের */
  counts: { all: number; used: number; unused: number };
  /** আজকের (বাংলাদেশ সময়) সারসংক্ষেপ */
  today: { count: number; amount: number; usedCount: number };
}

// PostgREST .or() ফিল্টারে কমা/বন্ধনী/ওয়াইল্ডকার্ড ভেঙে যায় — সেগুলো বাদ দেওয়া হয়
const SEARCH_UNSAFE = /[%_*\\,()"]/g;

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// বাংলাদেশ সময় অনুযায়ী আজকের দিনের শুরু (UTC ISO)
function dhakaDayStartIso(): string {
  const localMidnight = Math.floor((Date.now() + DHAKA_OFFSET_MS) / DAY_MS) * DAY_MS;
  return new Date(localMidnight - DHAKA_OFFSET_MS).toISOString();
}

interface RawBkashRow {
  id: number;
  trx_id: string | null;
  sender_number: string | null;
  sender_last4: string | null;
  amount: number | string | null;
  raw_sms: string | null;
  is_used: boolean | null;
  used_order_id: string | null;
  matched_at: string | null;
  created_at: string;
  orders: { order_num: string | null } | { order_num: string | null }[] | null;
}

function mapBkashRow(r: RawBkashRow): BkashPayment {
  const linked = Array.isArray(r.orders) ? r.orders[0] : r.orders;
  return {
    id: r.id,
    trx_id: r.trx_id || '',
    sender_number: r.sender_number || '',
    sender_last4: r.sender_last4 || '',
    amount: Number(r.amount) || 0,
    raw_sms: r.raw_sms || '',
    is_used: !!r.is_used,
    used_order_id: r.used_order_id || null,
    order_num: linked?.order_num || null,
    matched_at: r.matched_at || null,
    created_at: r.created_at,
  };
}

export async function listBkashPage(params: BkashPageParams): Promise<BkashPageResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();

  const pageSize = Math.min(Math.max(1, Math.floor(Number(params.pageSize)) || 14), 100);
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const term = String(params.search || '').replace(SEARCH_UNSAFE, '').trim();
  const phoneLike = /^[\d\s+-]+$/.test(term);
  const digits = term.replace(/\D/g, '');

  // সার্চ: TrxID, প্রেরক নম্বর (শুধু সংখ্যা-ধরনের সার্চে), এবং অর্ডার নম্বর (লিংকড অর্ডারের মাধ্যমে)
  const conds: string[] = [];
  if (term) {
    conds.push(`trx_id.ilike.*${term}*`);
    if (phoneLike && digits) conds.push(`sender_number.ilike.*${digits}*`);

    const { data: orderHits } = await supabase
      .from('orders')
      .select('id')
      .ilike('order_num', `%${term}%`)
      .limit(50);
    const ids = (orderHits || []).map((o: { id: string }) => o.id).filter(Boolean);
    if (ids.length > 0) conds.push(`used_order_id.in.(${ids.join(',')})`);
  }

  let query = supabase
    .from('bkash_inbox')
    .select(
      'id, trx_id, sender_number, sender_last4, amount, raw_sms, is_used, used_order_id, matched_at, created_at, orders:orders!bkash_inbox_used_order_id_fkey(order_num)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (params.filter === 'used') query = query.eq('is_used', true);
  if (params.filter === 'unused') query = query.eq('is_used', false);
  if (conds.length > 0) query = query.or(conds.join(','));

  const todayStart = dhakaDayStartIso();

  const [pageRes, allRes, usedRes, unusedRes, todayRes] = await Promise.all([
    query.range(from, to),
    supabase.from('bkash_inbox').select('id', { count: 'exact', head: true }),
    supabase.from('bkash_inbox').select('id', { count: 'exact', head: true }).eq('is_used', true),
    supabase.from('bkash_inbox').select('id', { count: 'exact', head: true }).eq('is_used', false),
    supabase.from('bkash_inbox').select('amount, is_used').gte('created_at', todayStart),
  ]);

  if (pageRes.error) throw new Error('বিকাশ লেনদেন লোড ব্যর্থ: ' + pageRes.error.message);

  const todayRows = (todayRes.data || []) as { amount: number | string | null; is_used: boolean | null }[];
  const today = {
    count: todayRows.length,
    amount: todayRows.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    usedCount: todayRows.filter((r) => r.is_used).length,
  };

  return {
    rows: ((pageRes.data || []) as unknown as RawBkashRow[]).map(mapBkashRow),
    total: pageRes.count || 0,
    counts: {
      all: allRes.count || 0,
      used: usedRes.count || 0,
      unused: unusedRes.count || 0,
    },
    today,
  };
}

// লিংকড অর্ডারের পূর্ণ মেমো খুলতে — Orders পেজের মোডালে যা লাগে সেই একই শেপ (ডায়মন্ড ট্যাগসহ)
export async function getBkashLinkedOrder(orderId: string): Promise<Order | null> {
  await requireAdmin();
  const id = String(orderId || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;

  const order = mapOrderRow(data);
  if (order.user_id) {
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'delivered')
      .eq('user_id', order.user_id);
    if (isDiamondByDeliveredCount(count || 0)) order.member_tier = 'diamond';
  }
  await attachOrderRisk(supabase, [order]);
  return order;
}
