'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';

export interface InvoiceUsage {
  used: number;
  limit: number;
  resetCount: number;
  lastDownloadedAt: string | null;
  lastResetAt: string | null;
}

export type InvoiceResetResult =
  | { status: 'ok'; usage: InvoiceUsage }
  | { status: 'error'; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INVOICE_LIMIT = 3;

type Row = {
  download_count: number;
  reset_count: number;
  last_downloaded_at: string | null;
  last_reset_at: string | null;
};

function toUsage(row: Row | null): InvoiceUsage {
  return {
    used: Math.min(row?.download_count ?? 0, INVOICE_LIMIT),
    limit: INVOICE_LIMIT,
    resetCount: row?.reset_count ?? 0,
    lastDownloadedAt: row?.last_downloaded_at ?? null,
    lastResetAt: row?.last_reset_at ?? null,
  };
}

const COLS = 'download_count, reset_count, last_downloaded_at, last_reset_at';

export async function getInvoiceUsage(orderId: string): Promise<InvoiceUsage | null> {
  await requireAdmin();
  if (!UUID_RE.test(orderId)) return null;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('invoice_downloads')
    .select(COLS)
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw new Error('ইনভয়েস তথ্য লোড ব্যর্থ: ' + error.message);
  return toUsage(data as Row | null);
}

export async function resetInvoiceDownloads(orderId: string): Promise<InvoiceResetResult> {
  await requireAdmin();
  if (!UUID_RE.test(orderId)) return { status: 'error', message: 'অর্ডার আইডি সঠিক নয়' };
  const supabase = createServiceRoleClient();
  const { error } = await supabase.rpc('reset_invoice_downloads', { p_order_id: orderId });
  if (error) return { status: 'error', message: 'রিসেট হয়নি: ' + error.message };
  const { data, error: readError } = await supabase
    .from('invoice_downloads')
    .select(COLS)
    .eq('order_id', orderId)
    .maybeSingle();
  if (readError) return { status: 'error', message: 'রিসেট হয়েছে, কিন্তু নতুন অবস্থা পড়া যায়নি' };
  return { status: 'ok', usage: toUsage(data as Row | null) };
}
