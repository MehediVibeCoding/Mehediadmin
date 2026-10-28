'use client';

import { useEffect, useState } from 'react';
import { getInvoiceUsage, resetInvoiceDownloads, type InvoiceUsage } from '@/app/actions/invoiceDownloads';
import { useToast } from '@/components/admin/Toast';
import SectionHeading from '@/components/common/SectionHeading';
import ConfirmDialog from '@/components/common/ConfirmDialog';

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function InvoiceUsageBox({ orderId }: { orderId: string }) {
  const { showToast } = useToast();
  const [usage, setUsage] = useState<InvoiceUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    setUsage(null);
    getInvoiceUsage(orderId)
      .then((row) => {
        if (!cancelled) setUsage(row);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function handleReset() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await resetInvoiceDownloads(orderId);
      if (res.status === 'ok') {
        setUsage(res.usage);
        showToast('✅ ইনভয়েস গণনা রিসেট হয়েছে');
        setConfirmOpen(false);
      } else {
        showToast('❌ ' + res.message);
      }
    } catch {
      showToast('❌ রিসেট হয়নি, আবার চেষ্টা করুন');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <SectionHeading hint="কাস্টমার প্রতি অর্ডারে আজীবন ৩ বার ইনভয়েস ডাউনলোড করতে পারেন। শেষ হলে সে WhatsApp-এ চলে যায়; এখান থেকে গণনা ০ করে আবার ৩ বার দেওয়া যায়।">
        ইনভয়েস ডাউনলোড
      </SectionHeading>

      {loading && <p className="font-body text-[12.5px] font-semibold text-muted">লোড হচ্ছে...</p>}
      {!loading && loadFailed && (
        <p className="font-body text-[12.5px] font-semibold text-danger">ইনভয়েস তথ্য লোড করা যায়নি।</p>
      )}

      {!loading && !loadFailed && usage && (
        <div className="rounded-2xl border border-border-base/60 bg-white p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="font-body text-[13px] font-bold text-ink">
              ব্যবহৃত: {usage.used}/{usage.limit} বার
            </div>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={usage.used === 0 || busy}
              className="cursor-pointer rounded-full border border-border-base bg-white px-3.5 py-1.5 font-body text-[12px] font-bold text-ink transition-colors enabled:hover:bg-surface-muted disabled:cursor-default disabled:opacity-40"
            >
              ইনভয়েস গণনা রিসেট
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-body text-[11.5px] font-semibold text-muted">
            <span>শেষ ডাউনলোড: {formatWhen(usage.lastDownloadedAt)}</span>
            {usage.resetCount > 0 && (
              <span>
                রিসেট: {usage.resetCount} বার (শেষ: {formatWhen(usage.lastResetAt)})
              </span>
            )}
          </div>
        </div>
      )}

      {confirmOpen && (
        <ConfirmDialog
          title="ইনভয়েস গণনা রিসেট করবেন?"
          message="এই অর্ডারের ইনভয়েস ডাউনলোড গণনা ০ হয়ে যাবে, কাস্টমার আবার ৩ বার ডাউনলোড করতে পারবেন।"
          confirmLabel="রিসেট করুন"
          busyLabel="রিসেট হচ্ছে..."
          busy={busy}
          tone="brand"
          onConfirm={handleReset}
          onCancel={() => !busy && setConfirmOpen(false)}
        />
      )}
    </section>
  );
}
