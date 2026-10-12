import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

// 🔒 A2/A3 ফিক্স — Supabase JS ক্লায়েন্ট কোনো `.limit()`/`.range()` না দিলেও
// ডিফল্টে ১,০০০ সারির পর নীরবে কেটে দেয় (PostgREST-এর `max-rows` সেটিং)।
// Q&A/রিভিউ/প্রোডাক্ট-পিকারের মতো জায়গায় আগে এই সীমা ছোঁয়ার কথা কোথাও বলা হতো
// না — অ্যাডমিন টের পেত না যে পুরনো/নতুন কিছু ডেটা আসলে দেখাচ্ছেই না।
//
// এই হেল্পার `.range()` দিয়ে ১,০০০ সারির ব্যাচে বারবার টেনে সব সারি জোড়া
// লাগায় — তাই হাজার-খানেকের বেশি সারিতেও কিছু হারায় না। নিরাপত্তার জন্য একটা
// উচ্চ সর্বোচ্চ সীমা (`maxRows`) আছে, যা ছুঁলে নীরব না থেকে console.warn করে
// (যেমন কেউ স্প্যাম করে লক্ষ-লক্ষ সারি বানিয়ে ফেললে অ্যাডমিন পেজ যেন অন্তত
// লগে প্রমাণ রাখে, আটকে/ক্র্যাশ না করে)।
export async function fetchAllRows<T>(
  supabase: SupabaseClient,
  table: string,
  select: string,
  orderCol: string,
  ascending: boolean,
  maxRows = 20000,
): Promise<T[]> {
  const BATCH = 1000;
  const all: T[] = [];
  let from = 0;

  while (all.length < maxRows) {
    const to = from + BATCH - 1;
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .order(orderCol, { ascending })
      .range(from, to);
    if (error) {
      console.warn(`[fetchAllRows] ${table} থেকে পড়তে সমস্যা:`, error.message);
      break;
    }
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < BATCH) break; // শেষ ব্যাচ — আর পড়ার দরকার নেই
    from += BATCH;
  }

  if (all.length >= maxRows) {
    console.warn(
      `[fetchAllRows] ${table}-এ ${maxRows}+ সারি পাওয়া গেছে — তালিকা সেখানেই কাটা হলো। ` +
        `এত বড় হয়ে গেলে এই জায়গায় সত্যিকারের সার্ভার-পেজিনেশন দরকার হবে।`,
    );
  }

  return all;
}
