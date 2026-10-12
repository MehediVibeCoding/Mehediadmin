'use client';

import Link from 'next/link';
import type { DashboardActionCounts } from '@/app/actions/dashboard';
import type { DashboardInsights } from '@/lib/dashboardInsights';
import { bnHourLabel } from '@/lib/traffic';
import { useDashboardTraffic } from '@/components/dashboard/TrafficProvider';
import InsightCard, { InsightEmpty } from './InsightCard';
import { BarRow, ColumnChart, DeltaPill, Ring, Sparkline, fmtNum, fmtTaka, pctChange } from './charts';

const WEEKDAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
const WEEKDAYS_FULL_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

const CHANNEL_BN: Record<string, string> = {
  direct: 'ডাইরেক্ট',
  'organic search': 'অর্গানিক সার্চ',
  'organic social': 'সোশ্যাল (ফ্রি)',
  'paid social': 'সোশ্যাল (পেইড)',
  'paid search': 'সার্চ (পেইড)',
  referral: 'রেফারেল',
  email: 'ইমেইল',
  unassigned: 'অন্যান্য',
  display: 'ডিসপ্লে',
  'organic video': 'ভিডিও',
};
const DEVICE_BN: Record<string, { label: string; color: string }> = {
  mobile: { label: 'মোবাইল', color: '#44A7FC' },
  desktop: { label: 'ডেস্কটপ', color: '#10B981' },
  tablet: { label: 'ট্যাবলেট', color: '#8B5CF6' },
};

const dayLabel = (ymd: string): string => WEEKDAYS_BN[new Date(ymd + 'T00:00:00Z').getUTCDay()];

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-1 flex-col gap-3" aria-busy="true" aria-label="লোড হচ্ছে">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="sk h-10 rounded-2xl" />
      ))}
    </div>
  );
}

/* ══════════ ১. করণীয় তালিকা ══════════ */
export function ActionCenterCard({ actions }: { actions: DashboardActionCounts }) {
  const rows = [
    {
      key: 'pending',
      label: 'পেন্ডিং অর্ডার',
      hint: 'কনফার্ম বা বাতিল করুন',
      count: actions.pendingOrders,
      href: '/orders?status=pending',
      tone: 'bg-amber-50 text-warn',
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
      hint: 'পেমেন্ট মিলিয়ে নিন',
      count: actions.unverifiedAdvance,
      href: '/orders?status=pending',
      tone: 'bg-brand-light/15 text-brand-light',
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
      tone: 'bg-rose-50 text-rose-500',
      icon: (
        <>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </>
      ),
    },
    {
      key: 'qna',
      label: 'উত্তরহীন প্রশ্ন',
      hint: 'কাস্টমার উত্তরের অপেক্ষায়',
      count: actions.unansweredQuestions,
      href: '/reviews-qa',
      tone: 'bg-violet-50 text-violet-600',
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
      tone: 'bg-orange-50 text-orange-500',
      icon: (
        <>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </>
      ),
    },
  ];
  const allClear = rows.every((r) => r.count === 0);

  return (
    <InsightCard
      title="করণীয় তালিকা"
      subtitle={allClear ? 'এই মুহূর্তে কোনো কাজ বাকি নেই' : 'আজ যেসব কাজে নজর দিন'}
      tone="amber"
      icon={
        <>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </>
      }
    >
      <div className="flex flex-1 flex-col justify-center gap-1">
        {rows.map((r) => (
          <Link
            key={r.key}
            href={r.href}
            className="group flex min-h-[48px] items-center gap-3 rounded-2xl px-2 py-1.5 transition-all duration-brand hover:bg-brand-bg/25 active:scale-[0.98]"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${r.tone}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {r.icon}
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body text-[13px] font-extrabold text-ink">{r.label}</span>
              <span className="block truncate font-body text-[10.5px] font-medium text-muted">{r.hint}</span>
            </span>
            {r.count > 0 ? (
              <span className="min-w-[30px] shrink-0 rounded-full bg-ink px-2.5 py-1 text-center font-body text-[12px] font-black leading-none text-white">
                {fmtNum(r.count)}
              </span>
            ) : (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-success" aria-label="ঠিক আছে">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
          </Link>
        ))}
      </div>
    </InsightCard>
  );
}

/* ══════════ ২. ভিজিটর ট্র্যাকিং ══════════ */
export function VisitorsCard() {
  const { status, data, live } = useDashboardTraffic();
  const icon = (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  );

  if (status === 'loading') {
    return (
      <InsightCard title="ভিজিটর ট্র্যাকিং" subtitle="লোড হচ্ছে..." tone="violet" icon={icon} href="/traffic" hrefLabel="রিপোর্ট">
        <Skeleton rows={4} />
      </InsightCard>
    );
  }
  if (status === 'error' || !data || data.source === null) {
    return (
      <InsightCard title="ভিজিটর ট্র্যাকিং" subtitle="লাইভ ও সাপ্তাহিক ভিজিটর" tone="violet" icon={icon}>
        <InsightEmpty
          title="ভিজিটর ট্র্যাকিং সংযুক্ত নয়"
          message={data?.hint || 'Google Analytics (GA4) বা Cloudflare সংযুক্ত করলে এখানে লাইভ ভিজিটর, ডিভাইস ও ট্রাফিক সোর্স দেখা যাবে।'}
          href="/traffic"
          hrefLabel="ট্রাফিক পেজে যান"
        />
      </InsightCard>
    );
  }

  const todayDelta = data.yesterdayUsers !== null && data.todayUsers !== null ? pctChange(data.todayUsers, data.yesterdayUsers) : null;
  const hasLive = data.source === 'ga4' && live?.ok;

  return (
    <InsightCard title="ভিজিটর ট্র্যাকিং" subtitle={hasLive ? 'এই মুহূর্তে সাইটে কারা আছে' : 'গত ৭ দিনের ভিজিটর'} tone="violet" icon={icon} href="/traffic" hrefLabel="রিপোর্ট">
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-emerald-50 px-3.5 py-2.5">
          <div className="flex items-center gap-1.5 font-body text-[10px] font-extrabold uppercase tracking-wide text-[#065F46]">
            {hasLive && <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />}
            {hasLive ? 'এখন অনলাইনে' : '৭ দিনে ভিজিটর'}
          </div>
          <div className="font-body text-[26px] font-black leading-tight tracking-tight text-ink">
            {hasLive ? fmtNum(live!.last30) : fmtNum(data.weekUsers)}
          </div>
          <div className="font-body text-[10.5px] font-semibold text-[#065F46]/80">
            {hasLive ? `গত ৫ মিনিটে ${fmtNum(live!.last5)} জন` : `${fmtNum(data.weekViews)}টি পেজ ভিউ`}
          </div>
        </div>
        <div className="rounded-2xl bg-surface-muted/70 px-3.5 py-2.5">
          <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">আজকের ভিজিটর</div>
          <div className="flex items-center gap-2">
            <span className="font-body text-[26px] font-black leading-tight tracking-tight text-ink">{fmtNum(data.todayUsers ?? 0)}</span>
            <DeltaPill value={todayDelta} />
          </div>
          <div className="font-body text-[10.5px] font-semibold text-muted">{fmtNum(data.todayViews ?? 0)}টি পেজ ভিউ</div>
        </div>
      </div>

      <div className="mt-3 flex-1">
        <ColumnChart height={64} items={data.daily.map((d) => ({ label: dayLabel(d.date), value: d.users }))} />
      </div>

      {data.source === 'ga4' && (
        <div className="mt-2 grid grid-cols-3 divide-x divide-border-base/60 border-t border-border-base/50 pt-3 text-center">
          <div>
            <div className="font-body text-[14px] font-black text-ink">{fmtNum(data.weekViews)}</div>
            <div className="font-body text-[10px] font-bold text-muted">পেজ ভিউ (৭ দিন)</div>
          </div>
          <div>
            <div className="font-body text-[14px] font-black text-ink">{fmtNum(data.weekSessions)}</div>
            <div className="font-body text-[10px] font-bold text-muted">সেশন</div>
          </div>
          <div>
            <div className="font-body text-[14px] font-black text-ink">{fmtNum(data.weekNewUsers)}</div>
            <div className="font-body text-[10px] font-bold text-muted">নতুন ভিজিটর</div>
          </div>
        </div>
      )}
    </InsightCard>
  );
}

/* ══════════ ৩. কনভার্শন ফানেল ══════════ */
export function FunnelCard() {
  const { status, data } = useDashboardTraffic();
  const icon = (
    <>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </>
  );

  if (status === 'loading') {
    return (
      <InsightCard title="কনভার্শন ফানেল" subtitle="লোড হচ্ছে..." tone="teal" icon={icon}>
        <Skeleton rows={4} />
      </InsightCard>
    );
  }
  const steps = data?.funnel || [];
  const first = steps[0]?.users || 0;
  if (status === 'error' || !data || data.source !== 'ga4' || steps.length === 0 || first === 0) {
    return (
      <InsightCard title="কনভার্শন ফানেল" subtitle="ভিজিটর থেকে অর্ডার পর্যন্ত যাত্রা" tone="teal" icon={icon}>
        <InsightEmpty
          title="ফানেলের ডাটা নেই"
          message="GA4 সংযুক্ত থাকলে এখানে দেখা যাবে কতজন প্রোডাক্ট দেখে, কার্টে রাখে, চেকআউট শুরু করে ও অর্ডার করে।"
          href="/traffic"
          hrefLabel="ট্রাফিক পেজ"
        />
      </InsightCard>
    );
  }

  const last = steps[steps.length - 1].users;
  const rate = first > 0 ? Math.round((last / first) * 1000) / 10 : 0;
  const colors = ['#44A7FC', '#38BDF8', '#14B8A6', '#10B981'];

  return (
    <InsightCard title="কনভার্শন ফানেল" subtitle="গত ৭ দিন · ভিজিটর থেকে অর্ডার" tone="teal" icon={icon} href="/traffic" hrefLabel="রিপোর্ট">
      <div className="flex flex-1 flex-col justify-center gap-3">
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].users : 0;
          const keep = i > 0 && prev > 0 ? Math.round((s.users / prev) * 100) : null;
          return (
            <BarRow
              key={s.key}
              label={s.label}
              value={s.users}
              max={first}
              color={colors[i] || '#10B981'}
              delay={i * 70}
              sub={keep !== null ? `আগের ধাপ থেকে ${keep}% এসেছে` : undefined}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-2.5">
        <span className="font-body text-[11.5px] font-extrabold text-[#065F46]">ভিজিটর → অর্ডার কনভার্শন</span>
        <span className="font-body text-[18px] font-black text-ink">{rate}%</span>
      </div>
    </InsightCard>
  );
}

/* ══════════ ৪. ট্রাফিক উৎস ও ডিভাইস ══════════ */
export function SourcesCard() {
  const { status, data } = useDashboardTraffic();
  const icon = (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  );

  if (status === 'loading') {
    return (
      <InsightCard title="ট্রাফিক উৎস ও ডিভাইস" subtitle="লোড হচ্ছে..." tone="brand" icon={icon}>
        <Skeleton rows={4} />
      </InsightCard>
    );
  }
  if (status === 'error' || !data || data.source !== 'ga4' || data.channels.length === 0) {
    return (
      <InsightCard title="ট্রাফিক উৎস ও ডিভাইস" subtitle="ভিজিটর কোথা থেকে আসছে" tone="brand" icon={icon}>
        <InsightEmpty
          title="উৎসের ডাটা নেই"
          message="GA4 সংযুক্ত থাকলে এখানে দেখা যাবে ফেসবুক/সার্চ/ডাইরেক্ট — কোথা থেকে কত ভিজিটর আসছে, আর কোন ডিভাইসে।"
          href="/traffic"
          hrefLabel="ট্রাফিক পেজ"
        />
      </InsightCard>
    );
  }

  const chMax = Math.max(...data.channels.map((c) => c.users), 1);
  const devTotal = data.devices.reduce((s, d) => s + d.users, 0);

  return (
    <InsightCard title="ট্রাফিক উৎস ও ডিভাইস" subtitle="গত ৭ দিন · ভিজিটর কোথা থেকে আসছে" tone="brand" icon={icon} href="/traffic" hrefLabel="রিপোর্ট">
      <div className="flex flex-col gap-2.5">
        {data.channels.slice(0, 4).map((c, i) => (
          <BarRow key={c.name} label={CHANNEL_BN[c.name.toLowerCase()] || c.name} value={c.users} max={chMax} delay={i * 60} />
        ))}
      </div>

      {devTotal > 0 && (
        <div className="mt-4 border-t border-border-base/50 pt-3.5">
          <div className="mb-2 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
            {data.devices.map((d) => (
              <div
                key={d.name}
                title={`${DEVICE_BN[d.name.toLowerCase()]?.label || d.name}: ${fmtNum(d.users)}`}
                style={{ width: `${(d.users / devTotal) * 100}%`, backgroundColor: DEVICE_BN[d.name.toLowerCase()]?.color || '#9CA3AF' }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {data.devices.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5 font-body text-[11.5px] font-bold text-ink/85">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DEVICE_BN[d.name.toLowerCase()]?.color || '#9CA3AF' }} />
                {DEVICE_BN[d.name.toLowerCase()]?.label || d.name}
                <span className="font-black text-ink">{Math.round((d.users / devTotal) * 100)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {data.countries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.countries.slice(0, 3).map((c) => (
            <span key={c.name} className="rounded-full bg-surface-muted px-2.5 py-1 font-body text-[11px] font-bold text-ink/85">
              {c.name} · <span className="font-black text-ink">{fmtNum(c.users)}</span>
            </span>
          ))}
        </div>
      )}
    </InsightCard>
  );
}

/* ══════════ ৫. বিক্রয় পারফরম্যান্স ══════════ */
export function PerformanceCard({ insights }: { insights: DashboardInsights }) {
  const { week, daily14, coupon } = insights;
  const weekDelta = pctChange(week.revenue, week.prevRevenue);
  const cancelHigh = insights.cancelRate >= 15;

  const tile = (label: string, value: React.ReactNode, sub: React.ReactNode) => (
    <div className="min-w-0 rounded-2xl border border-border-base/70 px-3 py-2.5">
      <div className="truncate font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">{label}</div>
      <div className="truncate font-body text-[19px] font-black leading-tight tracking-tight text-ink">{value}</div>
      <div className="truncate font-body text-[10.5px] font-semibold text-muted">{sub}</div>
    </div>
  );

  return (
    <InsightCard
      title="বিক্রয় পারফরম্যান্স"
      subtitle="গত ৩০ দিনের হিসাব"
      tone="emerald"
      icon={
        <>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </>
      }
      href="/profit"
      hrefLabel="প্রফিট"
    >
      <div className="grid grid-cols-2 gap-2.5">
        {tile('গড় অর্ডার মূল্য', fmtTaka(insights.aov), 'প্রতি অর্ডারে')}
        {tile(
          'বাতিল / রিজেক্ট',
          <span className={cancelHigh ? 'text-danger' : ''}>{insights.cancelRate}%</span>,
          `${fmtNum(insights.cancelledCount)}টি / ${fmtNum(insights.totalCount30)}টি অর্ডার`,
        )}
        {tile('কুপন ব্যবহার', `${fmtNum(coupon.orders)}টি`, coupon.discount > 0 ? `মোট ছাড় ${fmtTaka(coupon.discount)}` : 'কোনো ছাড় নেই')}
        {tile(
          'এই সপ্তাহের বিক্রি',
          fmtTaka(week.revenue),
          <span className="flex items-center gap-1.5">
            <DeltaPill value={weekDelta} /> গত সপ্তাহের তুলনায়
          </span>,
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col justify-end">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-body text-[10.5px] font-extrabold uppercase tracking-wide text-muted">গত ১৪ দিনের বিক্রি</span>
          <span className="font-body text-[10.5px] font-bold text-muted">{fmtNum(daily14.reduce((s, d) => s + d.orders, 0))}টি অর্ডার</span>
        </div>
        <Sparkline values={daily14.map((d) => d.revenue)} className="h-14 w-full" stroke="#10B981" />
      </div>
    </InsightCard>
  );
}

/* ══════════ ৬. সেরা বিক্রিত প্রোডাক্ট ══════════ */
export function TopProductsCard({ insights }: { insights: DashboardInsights }) {
  const items = insights.topProducts;
  const icon = (
    <>
      <path d="M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
      <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
    </>
  );
  if (items.length === 0) {
    return (
      <InsightCard title="সেরা বিক্রিত প্রোডাক্ট" subtitle="গত ৩০ দিনে" tone="orange" icon={icon}>
        <InsightEmpty title="এখনো কোনো বিক্রি নেই" message="অর্ডার আসতে শুরু করলে এখানে সবচেয়ে বেশি বিক্রি হওয়া প্রোডাক্টগুলো দেখা যাবে।" />
      </InsightCard>
    );
  }
  const max = Math.max(...items.map((i) => i.qty), 1);
  return (
    <InsightCard title="সেরা বিক্রিত প্রোডাক্ট" subtitle="গত ৩০ দিনে সবচেয়ে বেশি পিস" tone="orange" icon={icon} href="/products" hrefLabel="প্রোডাক্ট">
      <div className="flex flex-1 flex-col justify-center gap-3">
        {items.map((p, i) => (
          <div key={p.name} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-body text-[11px] font-black ${
                i === 0 ? 'bg-amber-100 text-[#92400E]' : 'bg-surface-muted text-muted'
              }`}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <BarRow
                label={p.name}
                value={p.qty}
                max={max}
                display={`${fmtNum(p.qty)} পিস`}
                color={i === 0 ? '#F59E0B' : '#44A7FC'}
                delay={i * 60}
                sub={`${fmtTaka(p.revenue)} বিক্রি`}
              />
            </div>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

/* ══════════ ৭. অর্ডারের সময় ══════════ */
export function TimingCard({ insights }: { insights: DashboardInsights }) {
  const total = insights.weekday.reduce((s, n) => s + n, 0);
  const icon = (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  );
  if (total === 0) {
    return (
      <InsightCard title="অর্ডারের সময়" subtitle="কোন দিন ও সময়ে বেশি অর্ডার আসে" tone="rose" icon={icon}>
        <InsightEmpty title="ডাটা জমছে" message="কিছু অর্ডার জমলে এখানে সপ্তাহের কোন দিন ও দিনের কোন সময়ে অর্ডার বেশি আসে তা দেখা যাবে।" />
      </InsightCard>
    );
  }
  const bestDay = insights.weekday.reduce((b, n, i) => (n > insights.weekday[b] ? i : b), 0);
  const peak = insights.peak;
  return (
    <InsightCard title="অর্ডারের সময়" subtitle="গত ৩০ দিনে কোন দিন ও সময়ে বেশি অর্ডার" tone="rose" icon={icon}>
      <div className="flex-1">
        <ColumnChart height={88} items={insights.weekday.map((v, i) => ({ label: WEEKDAYS_BN[i], value: v }))} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-brand-light/10 px-3.5 py-2.5">
          <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">সেরা দিন</div>
          <div className="font-body text-[14px] font-black text-ink">{WEEKDAYS_FULL_BN[bestDay]}</div>
          <div className="font-body text-[10.5px] font-semibold text-muted">{fmtNum(insights.weekday[bestDay])}টি অর্ডার</div>
        </div>
        <div className="rounded-2xl bg-amber-50 px-3.5 py-2.5">
          <div className="font-body text-[10px] font-extrabold uppercase tracking-wide text-muted">ব্যস্ততম সময়</div>
          <div className="font-body text-[13px] font-black leading-snug text-ink">
            {peak ? `${bnHourLabel(peak.start)} – ${bnHourLabel((peak.start + 2) % 24)}` : '—'}
          </div>
          <div className="font-body text-[10.5px] font-semibold text-muted">{peak ? `${fmtNum(peak.sum)}টি অর্ডার` : ''}</div>
        </div>
      </div>
    </InsightCard>
  );
}

/* ══════════ ৮. কাস্টমার ও এলাকা ══════════ */
export function CustomersCard({ insights }: { insights: DashboardInsights }) {
  const { customers, districts } = insights;
  const icon = (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  );
  if (customers.total === 0 && districts.length === 0) {
    return (
      <InsightCard title="কাস্টমার ও এলাকা" subtitle="রিপিট কাস্টমার ও সেরা জেলা" tone="violet" icon={icon}>
        <InsightEmpty title="ডাটা জমছে" message="অর্ডার জমলে এখানে রিপিট কাস্টমারের হার ও কোন জেলা থেকে বেশি অর্ডার আসে তা দেখা যাবে।" />
      </InsightCard>
    );
  }
  const dMax = Math.max(...districts.map((d) => d.orders), 1);
  return (
    <InsightCard title="কাস্টমার ও এলাকা" subtitle="গত ৩০ দিন · রিপিট কাস্টমার ও সেরা জেলা" tone="violet" icon={icon} href="/customers" hrefLabel="কাস্টমার">
      <div className="flex items-center gap-4">
        <Ring percent={customers.repeatRate} size={92} stroke={11} color="#8B5CF6">
          <span className="font-body text-[20px] font-black leading-none tracking-tight text-ink">{customers.repeatRate}%</span>
          <span className="mt-0.5 font-body text-[9px] font-bold uppercase tracking-wide text-muted">রিপিট</span>
        </Ring>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500" />
            <span className="font-body text-[12px] font-semibold text-ink/85">পুরনো কাস্টমার</span>
            <span className="ml-auto font-body text-[12.5px] font-black text-ink">{fmtNum(customers.returning)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-surface-muted ring-1 ring-border-base" />
            <span className="font-body text-[12px] font-semibold text-ink/85">নতুন কাস্টমার</span>
            <span className="ml-auto font-body text-[12.5px] font-black text-ink">{fmtNum(customers.fresh)}</span>
          </div>
        </div>
      </div>

      {districts.length > 0 && (
        <div className="mt-4 flex flex-1 flex-col justify-end gap-2.5 border-t border-border-base/50 pt-3.5">
          <div className="font-body text-[10.5px] font-extrabold uppercase tracking-wide text-muted">অর্ডার বেশি যে জেলা থেকে</div>
          {districts.slice(0, 4).map((d, i) => (
            <BarRow key={d.name} label={d.name} value={d.orders} max={dMax} display={`${fmtNum(d.orders)}টি`} color="#8B5CF6" delay={i * 60} />
          ))}
        </div>
      )}
    </InsightCard>
  );
}
