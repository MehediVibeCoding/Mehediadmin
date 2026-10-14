'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listBkashPage, type BkashPageResult } from '@/app/actions/bkash';
import { useOrdersRealtime } from '@/components/admin/OrdersRealtimeProvider';
import InsightCard from '@/components/dashboard/insights/InsightCard';
import { fmtNum, fmtTaka } from '@/components/dashboard/insights/charts';

type Snap = Pick<BkashPageResult, 'counts' | 'today'>;

function Tile({ label, value, note, tone }: { label: string; value: string; note: string; tone: 'ok' | 'warn' }) {
  return (
    <div className={`min-w-0 rounded-2xl border px-3.5 py-3 ${tone === 'ok' ? 'border-emerald-200/80 bg-emerald-50/70' : 'border-amber-200/80 bg-amber-50/70'}`}>
      <div className="truncate font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 font-body text-[24px] font-black leading-tight tracking-tight text-ink">{value}</div>
      <div className="truncate font-body text-[10.5px] font-semibold text-muted">{note}</div>
    </div>
  );
}

// বিকাশ হিসাব — ড্যাশবোর্ডের ইনসাইট কার্ডের প্রথমটা। আজকের পেমেন্ট, কোনটা অর্ডারে লেগেছে, কোনটা বেওয়ারিশ।
// ডাটা বিকাশ পেজের একই সার্ভার অ্যাকশন (listBkashPage) থেকে — তাই দুই জায়গার সংখ্যা সবসময় মেলে।
export default function BkashCard() {
  const [snap, setSnap] = useState<Snap | null>(null);
  const [error, setError] = useState(false);
  const { ordersVersion } = useOrdersRealtime();

  useEffect(() => {
    let cancelled = false;
    listBkashPage({ page: 1, pageSize: 1, filter: 'all', search: '' })
      .then((r) => {
        if (cancelled) return;
        setSnap({ counts: r.counts, today: r.today });
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ordersVersion]);

  const today = snap?.today;
  const unusedToday = today ? Math.max(0, today.count - today.usedCount) : 0;
  const unusedAll = snap?.counts.unused ?? 0;

  return (
    <InsightCard
      title="বিকাশ হিসাব"
      subtitle="ফোনে আসা পেমেন্টের আজকের অবস্থা"
      tone="brand"
      href="/bkash-transactions"
      hrefLabel="সব দেখুন"
      icon={
        <>
          <path d="M20 12V8H6a2 2 0 0 1 0-4h12v4" />
          <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </>
      }
    >
      {error && !snap ? (
        <div className="flex flex-1 items-center justify-center py-6 text-center font-body text-[12.5px] font-bold text-muted">বিকাশের তথ্য আনা যায়নি</div>
      ) : !snap ? (
        <div className="space-y-3" aria-hidden="true">
          <div className="h-20 animate-pulse rounded-2xl bg-black/[.06]" />
          <div className="grid grid-cols-2 gap-2.5">
            <div className="h-24 animate-pulse rounded-2xl bg-black/[.06]" />
            <div className="h-24 animate-pulse rounded-2xl bg-black/[.06]" />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-brand-light to-brand-light-hover px-4 py-3.5 text-white">
            <div className="font-body text-[11px] font-extrabold uppercase tracking-wider text-white/90">আজকের মোট পেমেন্ট</div>
            <div className="mt-1 font-body text-[32px] font-black leading-none tracking-tight">{fmtTaka(today!.amount)}</div>
            <div className="mt-1.5 font-body text-[11.5px] font-semibold text-white/85">আজ {fmtNum(today!.count)}টি পেমেন্ট এসেছে</div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Tile label="অর্ডারে লেগেছে" value={`${fmtNum(today!.usedCount)}টি`} note="আজকের পেমেন্টে অর্ডার কনফার্ম" tone="ok" />
            <Tile label="অব্যবহৃত (আজ)" value={`${fmtNum(unusedToday)}টি`} note="এখনো কোনো অর্ডারে লাগেনি" tone="warn" />
          </div>

          {unusedAll > 0 ? (
            <Link
              href="/bkash-transactions"
              className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-rose-200/80 bg-rose-50 px-3.5 py-2.5 transition-all duration-brand active:scale-[0.98]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-rose-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </span>
              <span className="min-w-0 flex-1 font-body text-[12.5px] font-extrabold leading-snug text-rose-800">
                সব মিলিয়ে {fmtNum(unusedAll)}টি পেমেন্ট কোনো অর্ডারে লাগেনি — দেখে নিন
              </span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-rose-500" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ) : (
            <div className="flex min-h-[48px] items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50 px-3.5 py-2.5 font-body text-[12.5px] font-extrabold text-emerald-800">
              সব পেমেন্ট কোনো না কোনো অর্ডারে মিলেছে
            </div>
          )}
        </div>
      )}
    </InsightCard>
  );
}
