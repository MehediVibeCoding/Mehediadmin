'use client';

import { useMemo, useState } from 'react';
import { getTrafficData, type TrafficData } from '@/app/actions/traffic';
import {
  filterByRange,
  computeSummary,
  computeHourCounts,
  findPeakWindow,
  peakHourLabels,
  buildDayTable,
  buildTrendSeries,
  buildTopViewed,
} from '@/lib/traffic';
import { useToast } from '@/components/admin/Toast';
import DateRangePicker, { type DateRange } from '@/components/common/DateRangePicker';
import TrafficStatCards from '@/components/traffic/TrafficStatCards';
import TrafficTrendChart from '@/components/traffic/TrafficTrendChart';
import TrafficDayTable from '@/components/traffic/TrafficDayTable';
import TopViewedProducts from '@/components/traffic/TopViewedProducts';
import PeakHoursChart from '@/components/traffic/PeakHoursChart';

interface Props {
  initialData: TrafficData;
}

// legacy CAL_DEFAULT_DAYS.trf — ট্রাফিক পেজের ডিফল্ট রেঞ্জ গত ৭ দিন
// (আজ সহ)। ক্যালেন্ডারে সর্বোচ্চ পেছনে যাওয়া যায় CAL_MIN_DAYS.trf = ৮৯ দিন
// (DateRangePicker-এ minDaysBack হিসেবে নিচে পাস করা হয়েছে)।
const DEFAULT_RANGE_DAYS = 7;

function defaultRange(): DateRange {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (DEFAULT_RANGE_DAYS - 1));
  return { start, end };
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

// নতুন ডিজাইন: পেজ সরাসরি টুলবার কার্ড দিয়ে শুরু (নিট প্রফিট পেজের মতো) —
// orchestrator, ডেরাইভড ডাটা সব lib/traffic.ts-এর pure helper দিয়ে useMemo-তে
// কম্পিউট করা হয় (OrdersPageClient.tsx-এর মতোই)।
export default function TrafficPageClient({ initialData }: Props) {
  const [trafficData, setTrafficData] = useState<TrafficData>(initialData);
  // trf namespace-এ 'সব তারিখ দেখাও' ক্লিয়ার অপশন নেই (allowClear={false}
  // নিচে), তাই dateRange বাস্তবে কখনো null হয় না — টাইপ তবু DateRangePicker-এর
  // contract অনুযায়ী nullable রাখা হয়েছে।
  const [dateRange, setDateRange] = useState<DateRange | null>(() => defaultRange());
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  const range = dateRange ?? defaultRange();
  const isSingleDay = isSameDay(range.start, range.end);

  const filtered = useMemo(() => filterByRange(trafficData.pageViews, range), [trafficData.pageViews, range]);
  const summary = useMemo(() => computeSummary(filtered), [filtered]);
  const hourCounts = useMemo(() => computeHourCounts(filtered), [filtered]);
  const peak = useMemo(() => findPeakWindow(hourCounts), [hourCounts]);
  const labels = useMemo(() => peakHourLabels(peak), [peak]);
  const dayTable = useMemo(() => buildDayTable(filtered), [filtered]);
  const trendSeries = useMemo(
    () => buildTrendSeries(filtered, range, isSingleDay),
    [filtered, range, isSingleDay]
  );
  const topViewed = useMemo(
    () => buildTopViewed(filtered, trafficData.products, trafficData.trackingField),
    [filtered, trafficData.products, trafficData.trackingField]
  );

  // legacy calResetToToday('trf') — রিফ্রেশে নতুন ডাটা আনার পাশাপাশি
  // date range ডিফল্ট গত ৭ দিনে রিসেট হয়।
  async function handleRefresh() {
    setRefreshing(true);
    try {
      const data = await getTrafficData();
      setTrafficData(data);
      setDateRange(defaultRange());
      showToast('🔄 রিফ্রেশ হয়েছে');
    } catch {
      showToast('❌ রিফ্রেশ ব্যর্থ হয়েছে');
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div>
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
              <div className="font-body text-[14px] font-black text-ink">কত ভিজিটর, কখন বেশি আসে</div>
              <div className="font-body text-[11px] font-semibold text-muted">ভিজিটর, পিক আওয়ার ও প্রোডাক্ট ভিউ</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker
              active={true}
              range={dateRange}
              onApply={setDateRange}
              minDaysBack={89}
              allowClear={false}
              className="min-w-0 flex-1 sm:flex-none"
            />
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="রিফ্রেশ করুন"
              aria-label="রিফ্রেশ করুন"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-base/80 bg-white text-ink transition-all duration-brand hover:border-brand-light hover:text-brand-light active:scale-90 disabled:opacity-50 lg:h-10 lg:w-10"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-[18px] w-[18px] ${refreshing ? 'animate-spin' : ''}`}
              >
                <path d="M21 12a9 9 0 1 1-2.6-6.4" />
                <path d="M21 3v6h-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {!trafficData.connected && (
        <div className="mb-4 flex items-start gap-3 rounded-[20px] border border-amber-200/80 bg-amber-50 p-3.5 sm:p-4">
          <span className="mt-0.5 text-[18px] leading-none" aria-hidden="true">ℹ️</span>
          <div className="min-w-0">
            <div className="font-body text-[13px] font-black text-ink">ট্রাফিক ডাটা সোর্স এখনো সংযুক্ত নয়</div>
            <div className="mt-0.5 font-body text-[12px] font-semibold leading-relaxed text-muted">
              Cloudflare Web Analytics API যুক্ত হলে ভিজিটর, পিক আওয়ার ও প্রোডাক্ট ভিউ এখানে দেখা যাবে। এখন নিচের সব সংখ্যা শূন্য দেখানো স্বাভাবিক।
            </div>
          </div>
        </div>
      )}

      <TrafficStatCards summary={summary} peakHourShort={labels.short} />

      <TrafficTrendChart series={trendSeries} />

      <TrafficDayTable rows={dayTable} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopViewedProducts entries={topViewed} />
        <PeakHoursChart hourCounts={hourCounts} peakStart={peak.start} labels={labels} />
      </div>
    </div>
  );
}
