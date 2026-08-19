'use client';

import { useState } from 'react';
import Link from 'next/link';
import { listOrders } from '@/app/actions/orders';
import { downloadCsvRows, ordersToCsvRows } from '@/lib/csv';
import { useToast } from '@/components/admin/Toast';

export default function QuickActions() {
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  // legacy quickExportCsv() — Orders পেজে না গিয়েই সব অর্ডারের CSV সরাসরি
  // ডাউনলোড (Orders পেজের exportAll()-এর একই lib/csv.ts হেল্পার পুনর্ব্যবহার)
  async function handleExport() {
    setExporting(true);
    try {
      const orders = await listOrders();
      downloadCsvRows(ordersToCsvRows(orders), 'orders_all');
      showToast('⬇️ CSV ডাউনলোড শুরু হয়েছে');
    } catch {
      showToast('❌ CSV এক্সপোর্ট ব্যর্থ হয়েছে');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rounded-brand bg-brand-surface p-5 shadow-sh1">
      <div className="mb-4 text-sm font-bold text-ink">দ্রুত কাজ</div>
      <div className="flex flex-col gap-2">
        <Link
          href="/products"
          className="flex items-center justify-center rounded-brand bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90"
        >
          + নতুন প্রোডাক্ট
        </Link>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center rounded-brand border border-border-base px-4 py-2.5 text-sm font-semibold text-ink transition-brand hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting ? 'ডাউনলোড হচ্ছে...' : '📊 CSV Export'}
        </button>

        {/* Orders পেজে গিয়ে status=pending ফিল্টার প্রি-সিলেক্ট করে দেয় (?status=pending) */}
        <Link
          href="/orders?status=pending"
          className="flex items-center justify-center rounded-brand border border-border-base px-4 py-2.5 text-sm font-semibold text-ink transition-brand hover:bg-surface-muted"
        >
          📦 পেন্ডিং অর্ডার
        </Link>
      </div>
    </div>
  );
}
