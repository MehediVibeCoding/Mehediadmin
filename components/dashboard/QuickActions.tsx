'use client';

import { useState } from 'react';
import Link from 'next/link';
import { listOrders } from '@/app/actions/orders';
import { downloadCsvRows, ordersToCsvRows } from '@/lib/csv';
import { useToast } from '@/components/admin/Toast';

export default function QuickActions() {
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  async function handleExport() {
    setExporting(true);
    try {
      const orders = await listOrders();
      downloadCsvRows(ordersToCsvRows(orders), 'orders_all');
      showToast('CSV ফাইল ডাউনলোড শুরু হয়েছে');
    } catch {
      showToast('CSV এক্সপোর্ট সম্পন্ন করা যায়নি');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="card-hover-glow flex flex-col justify-between overflow-hidden rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-sh1 backdrop-blur-xl sm:p-6">
      {/* হেডার */}
      <div className="mb-4 flex items-center gap-2.5 border-b border-border-base/50 pb-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-bg/50 text-brand-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div>
          <h2 className="font-body text-[15px] font-black tracking-tight text-ink">দ্রুত কাজ</h2>
          <p className="font-body text-[11px] font-medium text-muted">প্রয়োজনীয় শর্টকাট অ্যাকশনসমূহ</p>
        </div>
      </div>

      {/* অ্যাকশন বাটন গ্রুপ (ইমেজ ৩, ৪ ও ৫ ইন্সপায়ারেশন) */}
      <div className="flex flex-col gap-2.5">
        {/* ১. সিগনেচার শিমার প্রাইমারি বাটন */}
        <Link
          href="/products"
          className="shimmer-sheen group flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-light to-brand-primary font-body text-[13.5px] font-extrabold text-white shadow-sh2 transition-all duration-brand hover:brightness-105 active:scale-[0.97]"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>নতুন প্রোডাক্ট যোগ করুন</span>
        </Link>

        {/* ২. ট্যাকটাইল সফট বাটন: CSV Export */}
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="group flex h-[44px] w-full items-center justify-center gap-2 rounded-full border border-border-base/80 bg-white font-body text-[13px] font-bold text-ink shadow-xs transition-all duration-brand hover:border-brand-light hover:bg-brand-bg/30 hover:text-brand-primary active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exporting ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin text-brand-primary">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.75" opacity="0.2" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" />
              </svg>
              <span>ডাউনলোড হচ্ছে...</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted transition-colors group-hover:text-brand-primary">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>CSV রিপোর্ট ডাউনলোড</span>
            </>
          )}
        </button>

        {/* ৩. ট্যাকটাইল সফট বাটন: পেন্ডিং অর্ডার */}
        <Link
          href="/orders?status=pending"
          className="group flex h-[44px] w-full items-center justify-center gap-2 rounded-full border border-border-base/80 bg-white font-body text-[13px] font-bold text-ink shadow-xs transition-all duration-brand hover:border-brand-light hover:bg-brand-bg/30 hover:text-brand-primary active:scale-[0.97]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted transition-colors group-hover:text-brand-primary">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>পেন্ডিং অর্ডারসমূহ</span>
        </Link>
      </div>
    </div>
  );
}
