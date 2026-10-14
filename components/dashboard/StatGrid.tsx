'use client';

import Link from 'next/link';
import type { DashboardStats } from '@/app/actions/dashboard';
import type { DashboardInsights } from '@/lib/dashboardInsights';
import { useDashboardTraffic } from '@/components/dashboard/TrafficProvider';
import { DeltaPill, Sparkline, fmtNum, fmtTaka, pctChange } from '@/components/dashboard/insights/charts';

interface Metric {
  id: string;
  label: string;
  value: string;
  note: React.ReactNode;
  href: string;
  tone: string; // আইকন চিপের রং
  dot?: boolean; // অ্যাকশন লাগলে ছোট স্থির ডট
  icon: React.ReactNode;
}

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export default function StatGrid({ stats, insights }: { stats: DashboardStats; insights: DashboardInsights }) {
  const { status, data, live } = useDashboardTraffic();

  // ── আজকের ভিজিটর: GA4/Cloudflare থেকে; না এলে কারণসহ ফাঁকা অবস্থা ──
  let visitorValue = '—';
  let visitorNote: React.ReactNode = 'লোড হচ্ছে...';
  if (status === 'ready' && data) {
    if (data.source === null) {
      visitorNote = 'অ্যানালিটিক্স সংযুক্ত নয়';
    } else {
      visitorValue = fmtNum(data.todayUsers ?? 0);
      const delta = data.yesterdayUsers !== null && data.todayUsers !== null ? pctChange(data.todayUsers, data.yesterdayUsers) : null;
      visitorNote =
        data.source === 'ga4' && live?.ok ? (
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
            <span className="truncate">এখন {fmtNum(live.last30)} জন অনলাইনে</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <DeltaPill value={delta} /> <span className="truncate">গতকালের তুলনায়</span>
          </span>
        );
    }
  } else if (status === 'error') {
    visitorNote = 'ডাটা আনা যায়নি';
  }

  const orderDelta = insights.today.orders - insights.today.yesterdayOrders;

  const metrics: Metric[] = [
    {
      id: 'orders',
      label: 'মোট অর্ডার',
      value: fmtNum(stats.totalOrders),
      note: insights.today.orders > 0 ? `আজ ${fmtNum(insights.today.orders)}টি নতুন` : 'আজ এখনো নতুন নেই',
      href: '/orders',
      tone: 'bg-brand-light/15 text-brand-light',
      icon: (
        <Icon>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </Icon>
      ),
    },
    {
      id: 'pending',
      label: 'পেন্ডিং অর্ডার',
      value: fmtNum(stats.pendingCount),
      note: stats.pendingCount > 0 ? 'কনফার্ম করা বাকি' : 'সব ঠিক আছে',
      href: '/orders?status=pending',
      tone: 'bg-amber-50 text-warn',
      dot: stats.pendingCount > 0,
      icon: (
        <Icon>
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 6 12 12 16 14" />
        </Icon>
      ),
    },
    {
      id: 'today',
      label: 'আজকের অর্ডার',
      value: fmtNum(insights.today.orders),
      note: (
        <span className="flex items-center gap-1.5">
          <DeltaPill value={orderDelta} suffix="টি" />
          <span className="truncate">{fmtTaka(insights.today.revenue)}</span>
        </span>
      ),
      href: '/orders',
      tone: 'bg-orange-50 text-orange-500',
      icon: (
        <Icon>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </Icon>
      ),
    },
    {
      id: 'visitors',
      label: 'আজকের ভিজিটর',
      value: visitorValue,
      note: visitorNote,
      href: '/traffic',
      tone: 'bg-violet-50 text-violet-600',
      icon: (
        <Icon>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </Icon>
      ),
    },
    {
      id: 'customers',
      label: 'মোট কাস্টমার',
      value: fmtNum(stats.uniqueCustomers),
      note: insights.customers.total > 0 ? `৩০ দিনে ${fmtNum(insights.customers.total)} জন কিনেছে` : 'কাস্টমার তালিকা দেখুন',
      href: '/customers',
      tone: 'bg-rose-50 text-rose-500',
      icon: (
        <Icon>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Icon>
      ),
    },
    {
      id: 'delivered',
      label: 'ডেলিভার্ড',
      value: fmtNum(stats.deliveredCount),
      note: stats.confirmedCount > 0 ? `+ ${fmtNum(stats.confirmedCount)}টি কনফার্মড` : 'কনফার্মড অর্ডার নেই',
      href: '/orders?status=delivered',
      tone: 'bg-emerald-50 text-success',
      icon: (
        <Icon>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </Icon>
      ),
    },
  ];

  // নতুন ক্রম: আজকের কাজের সংখ্যাগুলো আগে, সারাজীবনের মোট সংখ্যা পরে
  const ORDER = ['today', 'pending', 'visitors', 'orders', 'customers', 'delivered'];
  metrics.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

  const weekDelta = pctChange(insights.week.revenue, insights.week.prevRevenue);
  const revenueSeries = insights.daily14.map((d) => d.revenue);

  return (
    <div className="grid grid-cols-1 gap-3">
      {/* ═ হিরো: নিট প্রফিট — কোনো শ্যাডো নেই, সলিড স্কাই-ব্লু গ্রেডিয়েন্ট + রেভিনিউ স্পার্কলাইন ═ */}
      <Link
        href="/profit"
        className="group relative flex min-h-[148px] flex-col justify-between overflow-hidden rounded-[24px] bg-gradient-to-br from-brand-light to-brand-light-hover p-5 transition-transform duration-brand active:scale-[0.99] sm:p-6"
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(255,255,255,0.30),transparent_55%)]" />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
              <Icon>
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </Icon>
            </span>
            <span className="font-body text-[12px] font-extrabold uppercase tracking-wider text-white/90">নিট প্রফিট</span>
          </div>
          {weekDelta !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 font-body text-[10.5px] font-extrabold text-white">
              {weekDelta > 0 ? '▲' : weekDelta < 0 ? '▼' : '•'} {Math.abs(weekDelta)}% এই সপ্তাহে
            </span>
          )}
        </div>

        <div className="relative z-10 mt-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="font-body text-[30px] font-black leading-none tracking-tight text-white sm:text-[34px]">
              {fmtTaka(stats.netProfit)}
            </div>
            <div className="mt-1.5 font-body text-[11.5px] font-semibold text-white/85">
              রেভিনিউ: {fmtTaka(stats.confirmedRevenue)}
            </div>
          </div>
          <div className="w-[42%] max-w-[150px] shrink-0 opacity-95">
            <Sparkline values={revenueSeries} stroke="#FFFFFF" className="h-11 w-full" strokeWidth={2.2} />
            <div className="text-right font-body text-[9.5px] font-bold uppercase tracking-wide text-white/75">১৪ দিনের বিক্রি</div>
          </div>
        </div>
      </Link>

      {/* ═ মেট্রিক বোর্ড: ছয়টা মেট্রিক একটাই ফলকে, সরু বিভাজনরেখায়। প্রতিটা টাইল = আইকন+লেবেল (উপরে), বড় সংখ্যা, ছোট নোট ═ */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border border-white/90 bg-border-base/60 shadow-sh1 sm:grid-cols-3">
        {metrics.map((m) => (
          <Link
            key={m.id}
            href={m.href}
            className="group relative flex min-h-[112px] flex-col justify-between gap-2 bg-white px-3.5 py-3.5 transition-colors duration-brand active:bg-brand-bg/30 sm:px-4 lg:hover:bg-brand-bg/20"
          >
            <span className="flex items-center gap-2">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${m.tone}`}>{m.icon}</span>
              <span className="min-w-0 truncate font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">{m.label}</span>
            </span>
            <span className="block">
              <span className="block truncate font-body text-[28px] font-black leading-none tracking-tight text-ink">{m.value}</span>
              <span className="mt-1.5 block truncate font-body text-[11px] font-semibold text-muted">{m.note}</span>
            </span>
            {m.dot && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-warn ring-4 ring-amber-100" aria-hidden="true" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
