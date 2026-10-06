import type { SupabaseClient } from '@supabase/supabase-js';

// 🔒 অর্ডারের প্রফিট স্ন্যাপশট এখন `orders` টেবিলে নয় — গোপন `order_private` টেবিলে থাকে।
// ওই টেবিলে ব্রাউজারের (anon/authenticated) কোনো অনুমতি নেই; শুধু সার্ভিস-রোল (এই অ্যাডমিন সার্ভার) পড়তে পারে।
// এই ফাংশন অর্ডারের সারিগুলোতে (mapOrderRow-এর আগে) `item_profit_snapshot` বসিয়ে দেয়,
// তাই প্রফিট পেজ/ড্যাশবোর্ডের হিসাব আগের মতোই কাজ করে।
//
// কখনো throw করে না — টেবিল না পাওয়া বা কুয়েরি ব্যর্থ হলে অর্ডার-লিস্ট আগের মতোই লোড হয়
// (প্রফিট তখন প্রোডাক্টের বর্তমান প্রফিট থেকে হিসাব হয়, lib/profit.ts-এর ফলব্যাক অনুযায়ী)।
const CHUNK = 200;

export async function attachProfitSnapshots(
  supabase: SupabaseClient,
  rows: { id?: string; item_profit_snapshot?: unknown }[]
): Promise<void> {
  try {
    const ids = rows.map((r) => r?.id).filter(Boolean) as string[];
    if (ids.length === 0) return;

    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));

    const results = await Promise.all(
      chunks.map((c) =>
        supabase.from('order_private').select('order_id, item_profit_snapshot').in('order_id', c)
      )
    );

    const byId = new Map<string, unknown>();
    for (const res of results) {
      if (res.error || !res.data) continue;
      for (const r of res.data as { order_id: string; item_profit_snapshot: unknown }[]) {
        byId.set(r.order_id, r.item_profit_snapshot);
      }
    }

    for (const row of rows) {
      if (row.id && byId.has(row.id)) row.item_profit_snapshot = byId.get(row.id);
    }
  } catch {
    // নীরবে ফলব্যাক
  }
}
