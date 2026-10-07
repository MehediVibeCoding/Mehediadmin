'use client';

import { useMemo, useState } from 'react';
import { getTrafficData } from '@/app/actions/traffic';
import { findPeakWindow, peakHourLabels } from '@/lib/traffic';
import type { TrafficData } from '@/lib/analytics/types';
import {
  countryName,
  emptyHourCounts,
  flagEmoji,
  formatDuration,
  toDayRows,
  toSummary,
  toTopViewed,
  toTrendSeries,
} from '@/lib/analytics/derive';
import { useToast } from '@/components/admin/Toast';
import DateRangePicker, { type DateRange } from '@/components/common/DateRangePicker';
import TrafficStatCards from '@/components/traffic/TrafficStatCards';
import TrafficTrendChart from '@/components/traffic/TrafficTrendChart';
import TrafficDayTable from '@/components/traffic/TrafficDayTable';
import TopViewedProducts from '@/components/traffic/TopViewedProducts';
import PeakHoursChart from '@/components/traffic/PeakHoursChart';
import LiveVisitorsCard from '@/components/traffic/LiveVisitorsCard';
import BarListCard from '@/components/traffic/BarListCard';
import FunnelCard from '@/components/traffic/FunnelCard';
import CloudflareCard from '@/components/traffic/CloudflareCard';
import SourceStatusBanner from '@/components/traffic/SourceStatusBanner';

interface Props {
  initialData: TrafficData;
}

// 'YYYY-MM-DD' ⇄ লোকাল Date (ব্রাউজার বাংলাদেশ সময়ে থাকলে দিন ঠিক থাকে)
function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function toYmd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ট্রাফিক পেজ: ডাটা আসে GA4 + Cloudflare থেকে (মেইন সাইটের ডাটাবেজে কোনো লোড পড়ে না)।
// বিদ্যমান কম্পোনেন্টগুলো (স্ট্যাট কার্ড, ট্রেন্ড চার্ট, দৈনিক টেবিল, পিক আওয়ার) আগের মতোই —
// শুধু ডাটার সোর্স বদলেছে; তার নিচে লাইভ ভিজিটর, দেশ/শহর, সোর্স, ডিভাইস, ফানেল ও Cloudflare যোগ হয়েছে।
export default function TrafficPageClient({ initialData }: Props) {
  const [data, setData] = useState<TrafficData>(initialData);
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    start: parseYmd(initialData.range.start),
    end: parseYmd(initialData.range.end),
  }));
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const ga = data.ga4;
  const isSingleDay = data.range.start === data.range.end;

  const summary = useMemo(() => toSummary(ga), [ga]);
  const hourCounts = useMemo(() => ga?.hourly.views ?? emptyHourCounts(), [ga]);
  const peak = useMemo(() => findPeakWindow(hourCounts), [hourCounts]);
  const labels = useMemo(() => peakHourLabels(peak), [peak]);
  const dayRows = useMemo(() => toDayRows(ga?.daily ?? []), [ga]);
  const trend = useMemo(() => toTrendSeries(ga, isSingleDay), [ga, isSingleDay]);
  const topViewed = useMemo(() => toTopViewed(ga?.products ?? []), [ga]);

  async function load(range: DateRange, fresh: boolean) {
    setLoading(true);
    try {
      const next = await getTrafficData({ start: toYmd(range.start), end: toYmd(range.end) }, { fresh });
      setData(next);
      setDateRange({ start: parseYmd(next.range.start), end: parseYmd(next.range.end) });
      if (fresh) showToast('🔄 রিফ্রেশ হয়েছে');
    } catch {
      showToast('❌ ডাটা আনা ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  }

  const anyConnected = data.ga4Status.ok || data.cloudflareStatus.ok;

  return (
    <div className={loading ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'}>
      {/* ══ ১. টুলবার কার্ড: তারিখ রেঞ্জ + রিফ্রেশ ══ */}
      <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light/15 text-brand-light sm:h-10 sm:w-10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <div className="min-w-0">
              <div className="font-body text-[14px] font-black text-ink">কত ভিজিটর, কোথা থেকে, কী করছে</div>
              <div className="font-body text-[11px] font-semibold text-muted">
                GA4 ও Cloudflare থেকে · ডাটা ৫ মিনিট পরপর আপডেট
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker
              active={true}
              range={dateRange}
              onApply={(r) => {
                if (r) load(r, false);
              }}
              minDaysBack={89}
              allowClear={false}
              className="min-w-0 flex-1 sm:flex-none"
            />
            <button
              type="button"
              onClick={() => load(dateRange, true)}
              disabled={loading}
              title="রিফ্রেশ করুন"
              aria-label="রিফ্রেশ করুন"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-base/80 bg-white text-ink transition-all duration-brand hover:border-brand-light hover:text-brand-light active:scale-90 disabled:opacity-50 lg:h-10 lg:w-10"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`h-[18px] w-[18px] ${loading ? 'animate-spin' : ''}`}>
                <path d="M21 12a9 9 0 1 1-2.6-6.4" />
                <path d="M21 3v6h-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <SourceStatusBanner
        items={[
          { name: 'Google Analytics (GA4)', status: data.ga4Status },
          { name: 'Cloudflare', status: data.cloudflareStatus },
        ]}
      />

      {data.ga4Status.ok && <LiveVisitorsCard />}

      {ga && (
        <>
          <TrafficStatCards summary={summary} peakHourShort={labels.short} />

          <div className="mt-2.5 grid grid-cols-3 gap-2.5">
            <MiniStat label="সেশন" value={ga.totals.sessions.toLocaleString('en-US')} />
            <MiniStat label="নতুন ভিজিটর" value={ga.totals.newUsers.toLocaleString('en-US')} />
            <MiniStat label="গড় সময়" value={formatDuration(ga.totals.avgSessionSec)} />
          </div>

          <TrafficTrendChart series={trend} />

          <TrafficDayTable rows={dayRows} />

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TopViewedProducts entries={topViewed} />
            <PeakHoursChart hourCounts={hourCounts} peakStart={peak.start} labels={labels} />
          </div>

          <div className="mt-4">
            <FunnelCard steps={ga.funnel} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BarListCard
              title="কোন দেশ থেকে এসেছে"
              hint="ইউনিক ভিজিটর অনুযায়ী"
              rows={ga.countries.map((c) => ({
                key: c.key,
                label: c.code ? countryName(c.code) : c.name,
                lead: flagEmoji(c.code),
                value: c.users,
              }))}
            />
            <BarListCard
              title="কোন শহর থেকে এসেছে"
              hint="ইউনিক ভিজিটর অনুযায়ী"
              rows={ga.cities.map((c) => ({ key: c.key, label: c.name, sub: c.sub, value: c.users }))}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BarListCard
              title="কিভাবে এসেছে"
              hint="Facebook, Google, সরাসরি ইত্যাদি (চ্যানেল)"
              rows={ga.channels.map((c) => ({ key: c.key, label: c.name, value: c.users }))}
            />
            <BarListCard
              title="কোন লিংক থেকে এসেছে"
              hint="সোর্স / মিডিয়াম (যেমন facebook / referral)"
              rows={ga.sources.map((c) => ({ key: c.key, label: c.name, value: c.users }))}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BarListCard
              title="কোন ডিভাইসে"
              hint="মোবাইল, ডেস্কটপ, ট্যাবলেট"
              rows={ga.devices.map((c) => ({
                key: c.key,
                label: { mobile: 'মোবাইল', desktop: 'ডেস্কটপ', tablet: 'ট্যাবলেট' }[c.name.toLowerCase()] ?? c.name,
                value: c.users,
              }))}
            />
            <BarListCard
              title="সবচেয়ে বেশি দেখা পেজ"
              hint="পেজভিউ অনুযায়ী"
              unit="ভিউ"
              rows={ga.topPages.map((p) => ({ key: p.path, label: p.path, value: p.views }))}
            />
          </div>

          <p className="mt-3 px-1 font-body text-[11px] font-medium leading-relaxed text-muted">
            ঘণ্টার হিসাব GA4 প্রপার্টির টাইমজোন অনুযায়ী। নতুন ডাটা GA4-এ আসতে ১–২ ঘণ্টা সময় নিতে পারে; &quot;এখন সাইটে&quot; অংশ প্রায় লাইভ।
          </p>
        </>
      )}

      {data.cloudflare && <CloudflareCard data={data.cloudflare} />}

      {!anyConnected && (
        <div className="rounded-[24px] border border-white/90 bg-white px-6 py-14 text-center shadow-sh1">
          <div className="font-body text-[14px] font-extrabold text-ink">এখনো কোনো ডাটা সোর্স সংযুক্ত নয়</div>
          <div className="mt-1 font-body text-[12px] font-medium text-muted">
            উপরের নির্দেশনা অনুযায়ী Vercel-এ ভেরিয়েবল বসিয়ে আবার ডিপ্লয় করুন, তারপর এই পেজে ডাটা আসবে।
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[20px] border border-white/90 bg-white px-3.5 py-3 shadow-sh1">
      <div className="font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 truncate font-body text-[16px] font-black text-ink">{value}</div>
    </div>
  );
}
