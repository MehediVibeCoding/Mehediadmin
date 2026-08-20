'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { mapOrderRow } from '@/lib/orders';
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
  return (data || []).map(mapOrderRow);
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

// ══════════════════════════════════════════════════════════════
//  WRITE
// ══════════════════════════════════════════════════════════════

export interface OrderActionResult {
  status: 'ok' | 'error';
  message?: string;
}

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

  // 'rejected'-এ change হওয়ার সময় স্টক রিস্টোর করতে হবে — কিন্তু আগে
  // বর্তমান status/items জেনে নিতে হবে (already-rejected হলে আবার
  // restore না করার জন্য — double-credit ঠেকাতে)
  if (status === 'rejected') {
    const { data: current, error: fetchErr } = await supabase
      .from('orders')
      .select('status, items')
      .eq('id', id)
      .single();
    if (fetchErr) return { status: 'error', message: 'অর্ডার খুঁজে পাওয়া যায়নি: ' + fetchErr.message };

    if (current.status !== 'rejected') {
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
  const supabase = createServiceRoleClient();

  let targetIds = ids;

  // বাল্ক-এ reject করার সময়ও একই স্টক-রিস্টোর নিয়ম — প্রতিটা অর্ডারের
  // জন্য আলাদা করে (যেগুলো আগে থেকেই 'rejected' না, শুধু সেগুলোর জন্য)।
  // কোনো একটার restore ব্যর্থ হলে সেটাকে বাদ দিয়ে বাকিগুলো আপডেট হয়,
  // যাতে একটা fail হওয়ার কারণে পুরো বাল্ক অ্যাকশন আটকে না যায়।
  if (status === 'rejected') {
    const { data: rows, error: fetchErr } = await supabase
      .from('orders')
      .select('id, status, items')
      .in('id', ids);
    if (fetchErr) return { status: 'error', changed: 0, message: 'অর্ডার খুঁজে পাওয়া যায়নি: ' + fetchErr.message };

    const failedIds: string[] = [];
    for (const row of rows || []) {
      if (row.status === 'rejected') continue; // idempotent — আগেই rejected
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

  if (status === 'rejected' && targetIds.length < ids.length) {
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
