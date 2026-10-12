'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/admin/Toast';

export default function QuickActions() {
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  // 🚀 স্কেল ফিক্স: Orders পেজের মতোই, এটাও এখন সরাসরি স্ট্রিমিং
  // /api/export-orders Route Handler-এ নেভিগেট করে (listOrders() দিয়ে সব
  // অর্ডার মেমোরিতে এনে data: URI বানানোর বদলে) — অর্ডার অনেক বেড়ে গেলেও
  // (৫০,০০০+) ডাউনলোড আটকাবে না।
  function handleExport() {
    setExporting(true);
    window.location.href = '/api/export-orders?status=all';
    showToast('CSV ফাইল ডাউনলোড শুরু হয়েছে');
    setTimeout(() => setExporting(false), 1500);
  }

  return (
    <div className="card-hover-glow flex h-full flex-col overflow-hidden rounded-[24px] border border-white/90 bg-white p-5 shadow-sh1 sm:p-6">
      {/* হেডার */}
      <div className="mb-4 flex items-center gap-2.5 border-b border-border-base/50 pb-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light/15 text-brand-light">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div>
          <h2 className="font-body text-[15px] font-black tracking-tight text-ink">দ্রুত কাজ</h2>
          <p className="font-body text-[11px] font-medium text-muted">প্রয়োজনীয় শর্টকাট অ্যাকশনসমূহ</p>
        </div>
      </div>

      {/* অ্যাকশন লিস্ট (রেফারেন্স ডিজাইনের লিস্ট-আইটেম স্টাইল) */}
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <Link
          href="/products"
          className="group flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-brand hover:bg-brand-bg/25 active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-brand-light text-white">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[13.5px] font-extrabold text-ink">নতুন প্রোডাক্ট যোগ করুন</span>
            <span className="block font-body text-[11px] font-medium text-muted">প্রোডাক্ট পেজে যান</span>
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/60 transition-transform duration-brand group-hover:translate-x-0.5 group-hover:text-brand-light">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="group flex items-center gap-3 rounded-2xl p-2.5 text-left transition-all duration-brand hover:bg-brand-bg/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-brand-light/10 text-brand-light">
            {exporting ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.75" opacity="0.2" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[13.5px] font-extrabold text-ink">
              {exporting ? 'ডাউনলোড হচ্ছে...' : 'CSV রিপোর্ট ডাউনলোড'}
            </span>
            <span className="block font-body text-[11px] font-medium text-muted">সব অর্ডার এক্সপোর্ট করুন</span>
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/60 transition-transform duration-brand group-hover:translate-x-0.5 group-hover:text-brand-light">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <Link
          href="/orders?status=pending"
          className="group flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-brand hover:bg-brand-bg/25 active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-amber-50 text-warn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[13.5px] font-extrabold text-ink">পেন্ডিং অর্ডারসমূহ</span>
            <span className="block font-body text-[11px] font-medium text-muted">রিভিউর অপেক্ষায় থাকা অর্ডার</span>
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/60 transition-transform duration-brand group-hover:translate-x-0.5 group-hover:text-brand-light">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        <Link
          href="/traffic"
          className="group flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-brand hover:bg-brand-bg/25 active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-violet-50 text-violet-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[13.5px] font-extrabold text-ink">ভিজিটর ও ট্রাফিক রিপোর্ট</span>
            <span className="block font-body text-[11px] font-medium text-muted">কারা আসছে, কোথা থেকে</span>
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/60 transition-transform duration-brand group-hover:translate-x-0.5 group-hover:text-brand-light">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        <Link
          href="/coupons"
          className="group flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-brand hover:bg-brand-bg/25 active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-orange-50 text-orange-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82Z" /><circle cx="7.5" cy="7.5" r="1.5" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[13.5px] font-extrabold text-ink">কুপন ম্যানেজ করুন</span>
            <span className="block font-body text-[11px] font-medium text-muted">ছাড় তৈরি ও বন্ধ করুন</span>
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/60 transition-transform duration-brand group-hover:translate-x-0.5 group-hover:text-brand-light">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        <Link
          href="/bkash-transactions"
          className="group flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-brand hover:bg-brand-bg/25 active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-rose-50 text-rose-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[13.5px] font-extrabold text-ink">বিকাশ লেনদেন</span>
            <span className="block font-body text-[11px] font-medium text-muted">অব্যবহৃত SMS মিলিয়ে নিন</span>
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/60 transition-transform duration-brand group-hover:translate-x-0.5 group-hover:text-brand-light">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>

        <Link
          href="/reviews-qa"
          className="group flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-brand hover:bg-brand-bg/25 active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-emerald-50 text-success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-body text-[13.5px] font-extrabold text-ink">রিভিউ ও প্রশ্নোত্তর</span>
            <span className="block font-body text-[11px] font-medium text-muted">কাস্টমারের প্রশ্নের উত্তর দিন</span>
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/60 transition-transform duration-brand group-hover:translate-x-0.5 group-hover:text-brand-light">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
