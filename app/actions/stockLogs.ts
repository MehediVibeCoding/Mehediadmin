'use server';

// ══════════════════════════════════════════════════════════════
//  stock_logs পড়া — কে/কখন/কেন স্টক বদলালো তার ইতিহাস
// ══════════════════════════════════════════════════════════════
// টেবিলটা + এটা লেখার লজিক (RPC ফাংশনে) ইতিমধ্যে Supabase-এ বসানো আছে।
// এই ফাইলটা শুধু পড়ার জন্য — কোনো UI এখনো এটা দেখায় না, কিন্তু
// প্রোডাক্ট এডিট মোডাল বা একটা আলাদা "স্টক হিস্ট্রি" পেজে বসাতে চাইলে
// এই দুটো ফাংশনই যথেষ্ট হবে।

import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { isValidPositiveIntId } from '@/lib/security';

export interface StockLogRow {
  id: number;
  product_id: number;
  change_qty: number;
  reason: string;
  changed_by: string | null;
  created_at: string;
}

/** একটা নির্দিষ্ট প্রোডাক্টের স্টক-হিস্ট্রি, নতুন থেকে পুরনো */
export async function listStockLogsForProduct(productId: number, limit = 50): Promise<StockLogRow[]> {
  await requireAdmin();
  if (!isValidPositiveIntId(productId)) return [];
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('stock_logs')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(1, limit), 200));
  if (error) throw new Error('স্টক হিস্ট্রি লোড ব্যর্থ: ' + error.message);
  return (data || []) as StockLogRow[];
}

/** সাম্প্রতিক সব স্টক-পরিবর্তন (প্রোডাক্ট নির্বিশেষে) — একটা ওভারভিউ/অডিট পেজের জন্য */
export async function listRecentStockLogs(limit = 100): Promise<StockLogRow[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('stock_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(1, limit), 500));
  if (error) throw new Error('স্টক হিস্ট্রি লোড ব্যর্থ: ' + error.message);
  return (data || []) as StockLogRow[];
}
