import Link from 'next/link';
import type { DashboardActionCounts } from '@/app/actions/dashboard';
import { fmtNum } from '@/components/dashboard/insights/charts';

// "আজ কী করতে হবে" — ড্যাশবোর্ডের সবচেয়ে জরুরি কার্ড, পেজে সবার আগে।
// প্রতিটা সারি সংশ্লিষ্ট পেজে নিয়ে যায়; সংখ্যা শূন্য হলে সবুজ টিক।
export default function TodoCard({ actions }: { actions: DashboardActionCounts }) {
  const rows = [
    {
      key: 'pending',
      label: 'পেন্ডিং অর্ডার',
      hint: 'কনফার্ম বা বাতিল করুন',
      count: actions.pendingOrders,
      href: '/orders?status=pending',
      chip: 'bg-amber-50 text-warn',
      pill: 'bg-amber-100 text-amber-800',
      icon: (
        <>
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 6 12 12 16 14" />
        </>
      ),
    },
    {
      key: 'adv',
      label: 'অ্যাডভান্স যাচাই বাকি',
      hint: 'বিকাশ পেমেন্ট মিলিয়ে নিন',
      count: actions.unverifiedAdvance,
      href: '/orders?status=pending',
      chip: 'bg-brand-light/15 text-brand-light',
      pill: 'bg-brand-light/20 text-[#0F6FC6]',
      icon: (
        <>
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <path d="M2 10h20" />
        </>
      ),
    },
    {
      key: 'bkash',
      label: 'অব্যবহৃত বিকাশ SMS',
      hint: 'গত ৭ দিনে কোনো অর্ডারে মেলেনি',
      count: actions.unusedBkash,
      href: '/bkash-transactions',
      chip: 'bg-rose-50 text-rose-500',
      pill: 'bg-rose-100 text-rose-700',
      icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    },
    {
      key: 'qna',
      label: 'উত্তরহীন প্রশ্ন',
      hint: 'কাস্টমার উত্তরের অপেক্ষায়',
      count: actions.unansweredQuestions,
      href: '/reviews-qa',
      chip: 'bg-violet-50 text-violet-600',
      pill: 'bg-violet-100 text-violet-700',
      icon: (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </>
      ),
    },
    {
      key: 'stock',
      label: 'স্টক সতর্কতা',
      hint: `${fmtNum(actions.outOfStock)}টি স্টক শেষ · ${fmtNum(actions.lowStock)}টি কম`,
      count: actions.outOfStock + actions.lowStock,
      href: '/products',
      chip: 'bg-orange-50 text-orange-500',
      pill: 'bg-orange-100 text-orange-800',
      icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />,
    },
  ];
  const open = rows.filter((r) => r.count > 0).length;
  const allClear = open === 0;

  return (
    <section aria-label="আজ কী করতে হবে" className="flex h-full flex-col overflow-hidden rounded-[24px] border border-white/90 bg-white shadow-sh1">
      {/* হেডার ব্যান্ড */}
      <div className={`flex items-center gap-3 px-5 py-4 sm:px-6 ${allClear ? 'bg-emerald-50' : 'bg-gradient-to-r from-amber-50 to-white'}`}>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${allClear ? 'bg-white text-success' : 'bg-white text-warn'}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-body text-[16px] font-black leading-tight tracking-tight text-ink">আজ কী করতে হবে</h2>
          <p className="truncate font-body text-[11.5px] font-semibold text-muted">
            {allClear ? 'এই মুহূর্তে কোনো কাজ বাকি নেই' : `${fmtNum(open)}টি বিষয়ে নজর দিন`}
          </p>
        </div>
      </div>

      <ul className="flex flex-1 flex-col divide-y divide-border-base/50 px-2 py-1.5 sm:px-3">
        {rows.map((r) => (
          <li key={r.key} className="flex-1">
            <Link
              href={r.href}
              className="flex h-full min-h-[56px] items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors duration-brand hover:bg-brand-bg/25 active:bg-brand-bg/40"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${r.chip}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {r.icon}
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-body text-[13.5px] font-extrabold text-ink">{r.label}</span>
                <span className="block truncate font-body text-[11px] font-medium text-muted">{r.hint}</span>
              </span>
              {r.count > 0 ? (
                <span className={`min-w-[34px] shrink-0 rounded-full px-3 py-1.5 text-center font-body text-[13px] font-black leading-none ${r.pill}`}>
                  {fmtNum(r.count)}
                </span>
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-success" aria-label="ঠিক আছে">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/70" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
