'use client';

import { useMemo, useState } from 'react';
import { getProfitData, type ProfitData } from '@/app/actions/profit';
import {
  filterProfitOrders,
  buildProfitDayMap,
  computeProfitSummary,
  buildProfitDayTable,
  buildProfitChartSeries,
} from '@/lib/profit';
import { useToast } from '@/components/admin/Toast';
import DateRangePicker, { type DateRange } from '@/components/common/DateRangePicker';
import ProfitStatCards from '@/components/profit/ProfitStatCards';
import ProfitChart from '@/components/profit/ProfitChart';
import ProfitDayTable from '@/components/profit/ProfitDayTable';

interface Props {
  initialData: ProfitData;
}

// legacy CAL_DEFAULT_DAYS.prf — প্রফিট পেজের ডিফল্ট রেঞ্জ গত ৭ দিন (আজ সহ)।
// ক্যালেন্ডারে সর্বোচ্চ পেছনে যাওয়া যায় CAL_MIN_DAYS.prf = ৩৬৪ দিন (ট্রাফিকের
// ৮৯ দিনের চেয়ে অনেক বেশি — অর্ডার ডাটা page_views-এর মতো ৯০-দিন lookback-এ
// সীমাবদ্ধ না)।
const DEFAULT_RANGE_DAYS = 7;
const MIN_DAYS_BACK = 364;

function defaultRange(): DateRange {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (DEFAULT_RANGE_DAYS - 1));
  return { start, end };
}

// legacy .trf-head-এর মতো কলাম-ভিত্তিক, center-aligned হেড + নিচে date
// picker/রিফ্রেশ — orchestrator, ডেরাইভড ডাটা সব lib/profit.ts-এর pure
// helper দিয়ে useMemo-তে কম্পিউট করা হয় (TrafficPageClient.tsx-এর মতোই)।
export default function ProfitPageClient({ initialData }: Props) {
  const [profitData, setProfitData] = useState<ProfitData>(initialData);
  // prf namespace-এ 'সব তারিখ দেখাও' ক্লিয়ার অপশন নেই (allowClear={false}
  // নিচে), তাই dateRange বাস্তবে কখনো null হয় না।
  const [dateRange, setDateRange] = useState<DateRange | null>(() => defaultRange());
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  const range = dateRange ?? defaultRange();

  const filtered = useMemo(
    () => filterProfitOrders(profitData.orders, range),
    [profitData.orders, range]
  );
  const dayMap = useMemo(() => buildProfitDayMap(filtered, profitData.products), [filtered, profitData.products]);
  const summary = useMemo(() => computeProfitSummary(filtered, profitData.products), [filtered, profitData.products]);
  const dayTable = useMemo(() => buildProfitDayTable(dayMap), [dayMap]);
  const chartSeries = useMemo(() => buildProfitChartSeries(dayMap, range), [dayMap, range]);

  // legacy calResetToToday('prf') — রিফ্রেশে নতুন অর্ডার ডাটা আনার পাশাপাশি
  // date range ডিফল্ট গত ৭ দিনে রিসেট হয়।
  async function handleRefresh() {
    setRefreshing(true);
    try {
      const data = await getProfitData();
      setProfitData(data);
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
        <h1 className="font-display text-xl text-ink">নিট প্রফিট</h1>
        <p className="mt-0.5 text-sm text-muted">কোন দিন কত টাকা আসল প্রফিট হয়েছে — বিস্তারিত পরিসংখ্যান</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <DateRangePicker
            active={true}
            range={dateRange}
            onApply={setDateRange}
            minDaysBack={MIN_DAYS_BACK}
            allowClear={false}
          />
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

      <ProfitStatCards summary={summary} />

      <ProfitChart series={chartSeries} />

      <ProfitDayTable rows={dayTable} />
    </div>
  );
}
