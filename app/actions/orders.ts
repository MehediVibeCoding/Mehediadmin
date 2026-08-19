'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { mapOrderRow } from '@/lib/orders';
import { syncConfirmedOrderToSheet } from '@/lib/googleSheet';
import type { Order, OrderStatus } from '@/types';

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

// legacy setOrderStatus() — শুধু Supabase আপডেট অংশ। sound legacy-তেও
// client-side, তাই OrdersPageClient.tsx-এই আছে (এখানে না)।
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
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
  const { error, count } = await supabase
    .from('orders')
    .update({ status }, { count: 'exact' })
    .in('id', ids);
  if (error) return { status: 'error', changed: 0, message: error.message };
  revalidatePath('/orders');
  revalidatePath('/');
  return { status: 'ok', changed: count ?? ids.length };
}
