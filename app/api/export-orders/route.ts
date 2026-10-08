// ══════════════════════════════════════════════════════════════
//  GET /api/export-orders — বড় স্কেলের CSV এক্সপোর্ট (Route Handler, স্ট্রিমিং)
// ══════════════════════════════════════════════════════════════
// আগে exportAll()/exportRange() (OrdersPageClient.tsx) listOrders() নামের
// 'use server' অ্যাকশন কল করত — যেটা সব অর্ডার একসাথে মেমোরিতে এনে, একটা
// বিশাল JSON হিসেবে Server Action-এর রেসপন্স দিয়ে ব্রাউজারে ফেরত পাঠাত,
// তারপর ক্লায়েন্ট পুরো CSV স্ট্রিং বানিয়ে data: URI হিসেবে ডাউনলোড করত।
// ১৯টা অর্ডারে এটা কোনো সমস্যা না, কিন্তু ৫,০০০-৫০,০০০ অর্ডারে তিনটা জায়গায়
// আটকে যেতে পারত: (১) Server Action-এর রেসপন্স সাইজ/সময় সীমা, (২) পুরো
// অ্যারে + CSV স্ট্রিং একসাথে ব্রাউজার মেমোরিতে রাখা, (৩) ব্রাউজারের data: URI
// দৈর্ঘ্যের সীমা (বড় CSV-তে ডাউনলোডই ব্যর্থ হতে পারে)।
//
// এখন এটা একটা সাধারণ Route Handler যেটা:
//  - Supabase থেকে ১০০০ সারির ব্যাচে ব্যাচে টানে (listOrders()-এর মতোই),
//  - প্রতিটা ব্যাচ পাওয়ার সাথে সাথেই CSV লাইন হিসেবে স্ট্রিম করে ব্রাউজারে
//    পাঠিয়ে দেয় (ReadableStream) — পুরো ডাটাসেট কখনোই একসাথে মেমোরিতে
//    থাকে না, আর ব্রাউজার সরাসরি ফাইল ডাউনলোড হিসেবে সেভ করে (data: URI না)।
//  - ৫০,০০০ অর্ডারেও (৫০টা ব্যাচ) এই প্যাটার্নে কোনো সমস্যা হওয়ার কথা না।
//
// ব্যবহার: GET /api/export-orders?status=all&from=ISO&to=ISO&search=টার্ম
// (সবগুলোই ঐচ্ছিক — status বাদ দিলে/'all' দিলে সব স্ট্যাটাস, from/to বাদ
// দিলে সব সময়, search বাদ দিলে কোনো ফিল্টার ছাড়াই)।

import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-guard';
import { attachProfitSnapshots } from '@/lib/orderPrivate';
import { mapOrderRow, getOrderAdvance, getOrderDueCOD, ORDER_STATUS_ORDER } from '@/lib/orders';
import type { Order, OrderStatus } from '@/types';

export const dynamic = 'force-dynamic';
// Vercel-এর ডিফল্ট ফাংশন টাইমআউট অনেক সময় ১০-৬০ সেকেন্ড — বড় এক্সপোর্টে এটা বাড়িয়ে
// রাখা ভালো (প্ল্যান অনুযায়ী ৩০০ পর্যন্ত কাজ করবে, কম থাকলে Vercel নিজেই cap করে দেবে)।
export const maxDuration = 300;

const PAGE = 1000;
const MAX_ROWS = 100000; // অসীম লুপের বিরুদ্ধে সুরক্ষা (listOrders()-এর সাথে সামঞ্জস্যপূর্ণ)

// PostgREST .or() ফিল্টারে কমা/বন্ধনী/ওয়াইল্ডকার্ড ভেঙে যায় — fetchOrdersPage()-এর
// সাথে হুবহু একই স্যানিটাইজেশন, যাতে টেবিলের সার্চ আর এক্সপোর্টের সার্চ একই ফলাফল দেয়।
const SEARCH_UNSAFE = /[%_*\\,()"]/g;

const CSV_HEADERS = [
  'Order#',
  'Date',
  'Name',
  'Phone',
  'District',
  'Address',
  'Items',
  'Subtotal',
  'Coupon',
  'Discount',
  'Shipping',
  'Total',
  'Advance Paid',
  'COD Due',
  'Status',
  'TXN',
  'IP',
];

function csvEscape(v: unknown): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

function orderToCsvLine(o: Order): string {
  return [
    o.order_num,
    o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
    o.customer_name,
    o.customer_phone,
    o.customer_district,
    o.customer_address,
    (o.items || []).map((i) => `${i.name}×${i.qty}`).join('; '),
    o.subtotal ?? '',
    o.coupon_code || '',
    o.discount_amount ?? 0,
    o.shipping,
    o.total ?? '',
    getOrderAdvance(o),
    getOrderDueCOD(o),
    o.status,
    o.payment_txn || o.payment_last4 || '',
    o.ip || '',
  ]
    .map(csvEscape)
    .join(',');
}

export async function GET(req: NextRequest) {
  // 🔒 এই Route Handler middleware-এর বাইরে, তাই এখানেও নিজে থেকেই
  // requireAdmin() ডাকা আবশ্যক — বাকি অ্যাকশনগুলোর মতোই independent auth check।
  try {
    await requireAdmin();
  } catch (err) {
    const message = err instanceof UnauthorizedError ? err.message : 'অনুমতি নেই';
    return new Response(message, { status: 401 });
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get('status');
  const status: 'all' | OrderStatus =
    statusParam && (ORDER_STATUS_ORDER as string[]).includes(statusParam) ? (statusParam as OrderStatus) : 'all';
  const fromIso = url.searchParams.get('from') || null;
  const toIso = url.searchParams.get('to') || null;
  const rawSearch = url.searchParams.get('search') || '';
  const term = rawSearch.replace(SEARCH_UNSAFE, '').trim();
  const digits = rawSearch.replace(/\D/g, '');

  const supabase = createServiceRoleClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // BOM দিয়ে শুরু — Excel-এ বাংলা/ইউনিকোড ঠিকভাবে দেখানোর জন্য (downloadCsvRows()-এর মতোই)
      controller.enqueue(encoder.encode('\uFEFF' + CSV_HEADERS.map(csvEscape).join(',') + '\r\n'));

      let from = 0;
      let rowCount = 0;
      try {
        while (from < MAX_ROWS) {
          let q = supabase.from('orders').select('*');
          if (status !== 'all') q = q.eq('status', status);
          if (fromIso) q = q.gte('created_at', fromIso);
          if (toIso) q = q.lte('created_at', toIso);
          if (term) {
            const conds = [`order_num.ilike.*${term}*`, `customer_name.ilike.*${term}*`];
            if (digits) conds.push(`customer_phone.ilike.*${digits}*`);
            q = q.or(conds.join(','));
          }

          const { data, error } = await q
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .range(from, from + PAGE - 1);

          if (error) throw new Error(error.message);
          if (!data || data.length === 0) break;

          // প্রফিট স্ন্যাপশট CSV কলামে দরকার না, কিন্তু mapOrderRow() আগে
          // item_profit_snapshot আশা করে কোনো কোনো জায়গায় — নিরাপদে রাখা হলো,
          // ভবিষ্যতে কলাম যোগ করলে কাজে লাগবে (ব্যর্থ হলেও এক্সপোর্ট থামে না)।
          await attachProfitSnapshots(supabase, data);

          for (const row of data) {
            const order = mapOrderRow(row);
            controller.enqueue(encoder.encode(orderToCsvLine(order) + '\r\n'));
            rowCount++;
          }

          from += data.length;
          if (data.length < PAGE) break; // শেষ ব্যাচ
        }

        if (rowCount === 0) {
          controller.enqueue(encoder.encode('এই ফিল্টারে কোনো অর্ডার পাওয়া যায়নি\r\n'));
        }
      } catch (err) {
        // স্ট্রিম শুরু হয়ে গেলে HTTP status আর বদলানো যায় না — তাই এরর
        // ফাইলের ভেতরেই একটা মন্তব্য-সারি হিসেবে লেখা হচ্ছে, যাতে অ্যাডমিন
        // বুঝতে পারে এক্সপোর্ট অসম্পূর্ণ থেকে গেছে (silent truncation না)।
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`\r\n"--- এক্সপোর্ট মাঝপথে থেমে গেছে: ${message.replace(/"/g, "'")} ---"\r\n`));
      } finally {
        controller.close();
      }
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders_export_${today}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
