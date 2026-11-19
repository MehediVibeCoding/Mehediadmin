'use server';

// ফাইলের পাথ: app/actions/catalogSync.ts
// লাইভ সাইটের ক্যাশ রিফ্রেশ (revalidateVangcurCatalog) সফল হয়েছিল কিনা — অ্যাডমিন ব্যানার এটা পড়ে,
// আর "আবার চেষ্টা করুন" বোতাম এখান থেকেই রিফ্রেশ আবার চালায়।

import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { CATALOG_SYNC_KEY, getPendingCount, publishCatalogNow } from '@/lib/revalidateVangcurCatalog';

export interface CatalogSyncStatus {
  /** false = শেষ রিফ্রেশ ব্যর্থ হয়েছিল */
  ok: boolean;
  message: string;
  updatedAt: string | null;
  /** লাইভে এখনো পাঠানো হয়নি এমন সেভের সংখ্যা ("পেন্ডিং পরিবর্তন") */
  pending: number;
}

const UNKNOWN_OK: CatalogSyncStatus = { ok: true, message: '', updatedAt: null, pending: 0 };

export async function getCatalogSyncStatus(): Promise<CatalogSyncStatus> {
  await requireAdmin();
  const pending = await getPendingCount();
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('admin_sync_status')
      .select('ok, message, updated_at')
      .eq('key', CATALOG_SYNC_KEY)
      .maybeSingle();
    // কিছু রেকর্ড না থাকলে বা পড়া ব্যর্থ হলে ব্যানার দেখাবো না (ভুল সতর্কতার চেয়ে নীরবতা ভালো)
    if (error || !data) return { ...UNKNOWN_OK, pending };
    return { ok: !!data.ok, message: data.message || '', updatedAt: data.updated_at || null, pending };
  } catch {
    return { ...UNKNOWN_OK, pending };
  }
}

// "এখনই প্রকাশ করুন" ও "আবার চেষ্টা করুন" — দুটোই একই কাজ: লাইভ সাইটের ISR + এজ ক্যাশ একবার মুছে নতুন পেজ চালু।
export async function publishCatalog(): Promise<CatalogSyncStatus> {
  await requireAdmin();
  const res = await publishCatalogNow();
  return {
    ok: res.ok,
    message: res.ok ? '' : res.message,
    updatedAt: new Date().toISOString(),
    pending: await getPendingCount(),
  };
}

export async function retryCatalogSync(): Promise<CatalogSyncStatus> {
  return publishCatalog();
}
