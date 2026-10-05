'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProfitDayRow } from '@/lib/profit';
import Pagination from '@/components/common/Pagination';
import SectionHeading from '@/components/common/SectionHeading';
import { PAGE_SIZE } from '@/lib/constants/pagination';

interface Props {
  rows: ProfitDayRow[];
}

const fmt = (n: number) => (n < 0 ? '−৳' : '৳') + Math.abs(Math.round(n)).toLocaleString('en-US');
const profitCls = (n: number) => (n < 0 ? 'text-danger' : 'text-success');

// মোবাইলে কার্ড, ডেস্কটপে (≥1024px) টেবিল। দিন-সংখ্যা ৩৬৪ পর্যন্ত হতে পারে — তাই ক্লায়েন্ট-সাইড পেজিনেশন।
export default function ProfitDayTable({ rows }: Props) {
  const [page, setPage] = useState(1);

  // রেঞ্জ বদলালে প্রথম পেজে ফিরে যাও
  useEffect(() => setPage(1), [rows]);

  const slice = useMemo(() => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [rows, page]);
  const totals = useMemo(
    () => rows.reduce((a, r) => ({ orders: a.orders + r.orders, revenue: a.revenue + r.revenue, profit: a.profit + r.profit }), { orders: 0, revenue: 0, profit: 0 }),
    [rows]
  );

  return (
    <div className="mt-4">
      <SectionHeading hint={`${rows.length}টি দিনের হিসাব`}>দিন অনুযায়ী প্রফিট</SectionHeading>

      <div className="lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-white/90 lg:bg-white lg:shadow-sh1">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 text-center shadow-sh1 lg:rounded-none lg:border-0 lg:shadow-none">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/15 text-brand-light">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </span>
            <span className="font-body text-[14px] font-extrabold text-ink">এই সময়ে কোনো নিশ্চিত অর্ডার নেই</span>
            <span className="font-body text-[12px] font-medium text-muted">অন্য তারিখ রেঞ্জ বেছে দেখুন</span>
          </div>
        ) : (
          <>
            {/* মোবাইল কার্ড */}
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:hidden">
              {slice.map((r) => (
                <article key={r.key} className="flex items-center justify-between gap-3 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1">
                  <div className="min-w-0">
                    <div className="truncate font-body text-[13.5px] font-extrabold text-ink">{r.label}</div>
                    <div className="mt-1 truncate font-body text-[11px] font-semibold text-muted">
                      {r.orders}টি অর্ডার · রেভিনিউ {fmt(r.revenue)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">নিট প্রফিট</div>
                    <div className={`font-body text-[16px] font-black ${profitCls(r.profit)}`}>{fmt(r.profit)}</div>
                  </div>
                </article>
              ))}
            </div>

            {/* ডেস্কটপ টেবিল */}
            <div className="hidden lg:block">
              <div className="sleek-scrollbar overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b border-border-base/60 bg-brand-bg/30 font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
                      <th className="px-5 py-3.5">তারিখ</th>
                      <th className="px-3 py-3.5">অর্ডার</th>
                      <th className="px-3 py-3.5">রেভিনিউ</th>
                      <th className="px-5 py-3.5 text-right">নিট প্রফিট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
                    {slice.map((r) => (
                      <tr key={r.key} className="transition-colors duration-brand hover:bg-brand-bg/25">
                        <td className="whitespace-nowrap px-5 py-3 font-extrabold text-ink">{r.label}</td>
                        <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink">{r.orders}</td>
                        <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink">{fmt(r.revenue)}</td>
                        <td className={`whitespace-nowrap px-5 py-3 text-right font-black ${profitCls(r.profit)}`}>{fmt(r.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* সর্বমোট — সব দিনের যোগফল */}
            <div className="mt-3 flex items-center justify-between gap-3 rounded-[20px] border border-brand-light/30 bg-brand-light/[0.07] px-4 py-3 lg:mt-0 lg:rounded-none lg:border-0 lg:border-t lg:border-border-base/60">
              <div className="min-w-0 font-body text-[12px] font-extrabold text-ink">
                সর্বমোট
                <span className="ml-1.5 font-semibold text-muted">
                  {totals.orders}টি অর্ডার · {fmt(totals.revenue)}
                </span>
              </div>
              <div className={`shrink-0 font-body text-[16px] font-black ${profitCls(totals.profit)}`}>{fmt(totals.profit)}</div>
            </div>

            <div className="mt-3 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1 lg:mt-0 lg:rounded-none lg:border-0 lg:border-t lg:border-border-base/60 lg:px-5 lg:shadow-none">
              <Pagination page={page} total={rows.length} onPageChange={setPage} bare />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
