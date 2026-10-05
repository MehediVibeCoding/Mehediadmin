'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TrafficDayRow } from '@/lib/traffic';
import Pagination from '@/components/common/Pagination';
import SectionHeading from '@/components/common/SectionHeading';
import { PAGE_SIZE } from '@/lib/constants/pagination';

interface Props {
  rows: TrafficDayRow[];
}

// নিট প্রফিট পেজের ProfitDayTable-এর মতো: মোবাইলে কার্ড, ডেস্কটপে (≥1024px) টেবিল।
// দিন-সংখ্যা ৮৯ পর্যন্ত হতে পারে — তাই ক্লায়েন্ট-সাইড পেজিনেশন।
// "সর্বমোট" সারি নেই: দৈনিক ইউনিক ভিজিটর যোগ করলে রেঞ্জের আসল ইউনিক সংখ্যা মেলে না।
export default function TrafficDayTable({ rows }: Props) {
  const [page, setPage] = useState(1);

  // রেঞ্জ বদলালে প্রথম পেজে ফিরে যাও
  useEffect(() => setPage(1), [rows]);

  const slice = useMemo(() => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [rows, page]);

  return (
    <div className="mt-4">
      <SectionHeading hint={`${rows.length}টি দিনের পরিসংখ্যান`}>দৈনিক পরিসংখ্যান</SectionHeading>

      <div className="lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-white/90 lg:bg-white lg:shadow-sh1">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 text-center shadow-sh1 lg:rounded-none lg:border-0 lg:shadow-none">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/15 text-brand-light">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </span>
            <span className="font-body text-[14px] font-extrabold text-ink">এই সময়ে কোনো ভিজিটর ডাটা নেই</span>
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
                      {r.totalViews.toLocaleString('en-US')} পেজভিউ · গড় {r.avgViews}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">ইউনিক ভিজিটর</div>
                    <div className="font-body text-[16px] font-black text-ink">{r.uniqueVisitors.toLocaleString('en-US')}</div>
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
                      <th className="px-3 py-3.5">ইউনিক ভিজিটর</th>
                      <th className="px-3 py-3.5">মোট পেজভিউ</th>
                      <th className="px-5 py-3.5 text-right">গড় ভিউ/ভিজিটর</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
                    {slice.map((r) => (
                      <tr key={r.key} className="transition-colors duration-brand hover:bg-brand-bg/25">
                        <td className="whitespace-nowrap px-5 py-3 font-extrabold text-ink">{r.label}</td>
                        <td className="whitespace-nowrap px-3 py-3 font-black text-ink">{r.uniqueVisitors.toLocaleString('en-US')}</td>
                        <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink">{r.totalViews.toLocaleString('en-US')}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-black text-[#0F6FC6]">{r.avgViews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
