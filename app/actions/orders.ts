'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { mapOrderRow } from '@/lib/orders';
import type { Order, OrderStatus } from '@/types';

// ══════════════════════════════════════════════════════════════
//  READ
// ══════════════════════════════════════════════════════════════

// legacy getOrdersAsync() — সব অর্ডার, created_at DESC (Supabase-ই সর্ট করে দেয়)
export async function listOrders(): Promise<Order[]> {
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

// legacy setOrderStatus() — শুধু Supabase আপডেট অংশ। sound/Google-Sheet-sync
// side effect client-side-এই হ্যান্ডেল হয় (sync-sheet proxy route Phase C-তে
// তৈরি হবে, তখন এখানে ওয়্যার করা হবে — TODO নিচে)।
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderActionResult> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) return { status: 'error', message: error.message };
  revalidatePath('/orders');
  revalidatePath('/');
  return { status: 'ok' };
  // TODO(Phase C): status==='confirmed' হলে legacy /api/sync-sheet (addConfirmed)
  // এখানেও কল করতে হবে — route তৈরি হওয়ার পর।
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
