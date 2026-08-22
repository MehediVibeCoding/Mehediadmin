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

// legacy .trf-head-এর মতো কলাম-ভিত্তিক, center-aligned হেড + নিচে
// date picker/রিফ্রেশ — orchestrator, ডেরাইভড ডাটা সব lib/traffic.ts-এর
// pure helper দিয়ে useMemo-তে কম্পিউট করা হয় (OrdersPageClient.tsx-এর মতোই)।
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
      <div className="mb-5 flex flex-col items-center text-center">
        <h1 className="font-bold text-xl text-ink">ট্রাফিক অ্যানালিটিক্স</h1>
        <p className="mt-0.5 text-sm text-muted">ভিজিটর, পিক আওয়ার ও প্রোডাক্ট ভিউ — বিস্তারিত পরিসংখ্যান</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <DateRangePicker active={true} range={dateRange} onApply={setDateRange} minDaysBack={89} allowClear={false} />
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="রিফ্রেশ করুন"
            className="flex h-9 w-9 items-center justify-center rounded-brand border border-border-base bg-brand-surface text-ink transition-brand hover:bg-surface-muted disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            >
              <path d="M21 12a9 9 0 1 1-2.6-6.4" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>
        </div>
      </div>

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
