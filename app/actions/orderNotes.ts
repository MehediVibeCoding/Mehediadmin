'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';

// 🔒 অর্ডার নোট শুধু অ্যাডমিন প্যানেলের ভেতরে। নোট থাকে `order_notes` টেবিলে — ওই টেবিলে
// ব্রাউজারের (কাস্টমার/মেইন সাইট) কোনো অনুমতি নেই, তাই সব পড়া-লেখা এই সার্ভার অ্যাকশন দিয়ে।
// প্রতি অর্ডারে একটাই নোট (ডাটাবেজে order_id-এ ইউনিক ইনডেক্স)। নোট এডিট করলে মেয়াদ আবার নতুন করে
// ৩০ দিন গোনা শুরু হয়; মেয়াদ পার হলে ডাটাবেজ নিজে মুছে ফেলে (pg_cron, প্রতিদিন), আর মেয়াদ পার হওয়া
// নোট মোছার আগেও এখানে দেখানো হয় না।
export interface OrderNote {
  id: string;
  note: string;
  created_at: string;
  expires_at: string;
}

export type OrderNoteResult =
  | { status: 'ok'; note: OrderNote }
  | { status: 'error'; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOTE_MAX = 1000;
const NOTE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const COLS = 'id, note, created_at, expires_at';

export async function getOrderNote(orderId: string): Promise<OrderNote | null> {
  await requireAdmin();
  if (!UUID_RE.test(orderId)) return null;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('order_notes')
    .select(COLS)
    .eq('order_id', orderId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error('নোট লোড ব্যর্থ: ' + error.message);
  return (data as OrderNote | null) ?? null;
}

// নোট না থাকলে তৈরি করে, থাকলে সেটাই নতুন লেখা দিয়ে বদলে দেয় (এডিট) এবং মেয়াদ আবার ৩০ দিন করে।
export async function saveOrderNote(orderId: string, text: string): Promise<OrderNoteResult> {
  await requireAdmin();
  if (!UUID_RE.test(orderId)) return { status: 'error', message: 'অর্ডার আইডি সঠিক নয়' };
  const note = String(text || '').trim();
  if (!note) return { status: 'error', message: 'নোট খালি রাখা যাবে না' };
  if (note.length > NOTE_MAX) {
    return { status: 'error', message: `নোট সর্বোচ্চ ${NOTE_MAX} অক্ষরের হতে পারে` };
  }
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('order_notes')
    .upsert(
      { order_id: orderId, note, expires_at: new Date(Date.now() + NOTE_TTL_MS).toISOString() },
      { onConflict: 'order_id' },
    )
    .select(COLS)
    .single();
  if (error || !data) {
    return { status: 'error', message: 'নোট সেভ হয়নি: ' + (error?.message || 'অজানা সমস্যা') };
  }
  return { status: 'ok', note: data as OrderNote };
}

export async function deleteOrderNote(orderId: string): Promise<{ status: 'ok' | 'error'; message?: string }> {
  await requireAdmin();
  if (!UUID_RE.test(orderId)) return { status: 'error', message: 'অর্ডার আইডি সঠিক নয়' };
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('order_notes').delete().eq('order_id', orderId);
  if (error) return { status: 'error', message: 'নোট মোছা যায়নি: ' + error.message };
  return { status: 'ok' };
}
