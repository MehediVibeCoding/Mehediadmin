'use client';

import type { OrderStatus } from '@/types';
import { ORDER_STATUS_META } from '@/lib/orders';
import type { DateRange } from '@/components/common/DateRangePicker';
import DateRangePicker from '@/components/common/DateRangePicker';
import OrderStatusDropdown from '@/components/orders/OrderStatusDropdown';
import CsvExportMenu from '@/components/orders/CsvExportMenu';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;

  filterStatus: 'all' | OrderStatus;
  onSelectFilter: (s: 'all' | OrderStatus) => void;

  selectedCount: number;
  bulkPendingStatus: OrderStatus | null;
  onSelectBulk: (s: OrderStatus) => void;
  onConfirmBulk: () => void;
  onCancelBulk: () => void;
  bulkBusy: boolean;

  dateActive: boolean;
  dateRange: DateRange | null;
  onDateApply: (r: DateRange | null) => void;

  onExportAll: () => void;
  onExportRange: (r: DateRange) => void;

  onRefresh: () => void;
  refreshing: boolean;

  onClearFilters: () => void;
}

export default function OrdersToolbar({
  search,
  onSearchChange,
  filterStatus,
  onSelectFilter,
  selectedCount,
  bulkPendingStatus,
  onSelectBulk,
  onConfirmBulk,
  onCancelBulk,
  bulkBusy,
  dateActive,
  dateRange,
  onDateApply,
  onExportAll,
  onExportRange,
  onRefresh,
  refreshing,
  onClearFilters,
}: Props) {
  return (
    <>
      {/* সারি ১ — legacy .trf-controls (হেডারের অংশ, সেন্টার্ড): সার্চ + তারিখ + CSV + রিফ্রেশ (ডেস্কটপ) */}
      <div className="mx-auto mb-3.5 flex max-w-full flex-wrap items-center justify-center gap-2.5 max-[640px]:w-full">
        <div className="relative min-w-[180px] max-w-[320px] flex-1 max-[640px]:max-w-full max-[640px]:basis-full">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-brand-accent"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="অর্ডার নম্বর / গ্রাহকের নাম / ফোন নম্বর..."
            className="h-[38px] w-full rounded-[10px] border border-border-base bg-brand-surface pl-9 pr-8 text-xs text-ink outline-none transition-brand placeholder:text-muted focus:border-brand-accent"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="মুছুন"
              className="absolute right-1.5 top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-full bg-surface-muted text-muted transition-brand hover:bg-border-base"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <DateRangePicker
          active={dateActive}
          range={dateRange}
          onApply={onDateApply}
          minDaysBack={364}
          allowClear
          inactiveLabel="সব তারিখ"
        />

        <CsvExportMenu onExportAll={onExportAll} onExportRange={onExportRange} />

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          title="রিফ্রেশ"
          aria-label="রিফ্রেশ"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-border-base bg-brand-surface text-brand-accent transition-brand hover:bg-surface-muted disabled:opacity-50 max-[640px]:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          >
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v5h-5" />
          </svg>
        </button>
      </div>

      {/* সারি ২ — legacy .ord-toolbar (নিজস্ব আলাদা সারি, কার্ডের বাইরে, সেন্টার্ড, max-width:760px):
          স্ট্যাটাস ফিল্টার + পরিষ্কার করুন + (মোবাইলে) রিফ্রেশ + বাল্ক-কনফার্ম পিল */}
      <div className="mx-auto mb-4.5 flex max-w-[760px] flex-wrap items-center justify-center gap-2.5">
        <OrderStatusDropdown
          selectedCount={selectedCount}
          filterStatus={filterStatus}
          onSelectFilter={onSelectFilter}
          onSelectBulk={onSelectBulk}
        />

        <button
          type="button"
          onClick={onClearFilters}
          className="flex h-[38px] shrink-0 items-center gap-2 whitespace-nowrap rounded-[10px] border border-border-base bg-brand-surface py-0 pl-2 pr-3.5 text-xs font-semibold text-[#374151] transition-brand hover:bg-surface-muted"
        >
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-surface-muted text-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="h-2.5 w-2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </span>
          পরিষ্কার করুন
        </button>

        {/* মোবাইলে হেডারে জায়গা না থাকায় রিফ্রেশ বাটনের দ্বিতীয় কপি এখানে (ডেস্কটপে লুকানো) */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="রিফ্রেশ"
          className="hidden h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-border-base bg-brand-surface text-brand-accent transition-brand hover:bg-surface-muted disabled:opacity-50 max-[640px]:flex"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          >
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v5h-5" />
          </svg>
        </button>

        {selectedCount > 0 && bulkPendingStatus && (
          <div className="flex h-[38px] shrink-0 items-center gap-2 rounded-[10px] border border-border-base bg-brand-surface py-0 pl-3.5 pr-1.5 shadow-sh1">
            <span className="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold text-[#374151]">
              <b>{selectedCount}</b>টি অর্ডারের স্ট্যাটাস{' '}
              <b style={{ color: ORDER_STATUS_META[bulkPendingStatus].dot }}>{ORDER_STATUS_META[bulkPendingStatus].label}</b>
            </span>
            <button
              type="button"
              onClick={onConfirmBulk}
              disabled={bulkBusy}
              className="flex h-[30px] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-brand-grad px-3.5 text-xs font-bold text-white transition-brand hover:brightness-110 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {bulkBusy ? 'হচ্ছে…' : 'ওকে, পরিবর্তন করুন'}
            </button>
            <button
              type="button"
              onClick={onCancelBulk}
              disabled={bulkBusy}
              aria-label="বাতিল"
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border border-border-base bg-surface-muted text-muted transition-brand hover:border-danger/30 hover:bg-danger/[.12] hover:text-danger disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
