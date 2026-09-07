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
  const hasActiveFilters = !!search || filterStatus !== 'all' || dateActive;

  return (
    /* ══ একক সুসংগঠিত ফ্রস্টেড গ্লাস টুলবার প্যানেল (ছড়ানো-ছিটানো ভাব সম্পূর্ণ দূরীকরণ) ══ */
    <div className="mb-4 overflow-hidden rounded-[22px] border border-border-base/80 bg-white p-3.5 shadow-sh1 backdrop-blur-xl sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* ১. সার্চ বার ক্যাপসুল */}
        <div className="relative min-w-[220px] flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-light"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>

          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="অর্ডার নম্বর, গ্রাহকের নাম বা ফোন দিয়ে খুঁজুন..."
            className="h-[40px] w-full rounded-full border border-border-base/80 bg-surface-muted/50 pl-10 pr-9 font-body text-[12.5px] text-ink placeholder:text-muted/70 shadow-xs outline-none transition-all duration-brand focus:border-brand-light focus:bg-white focus:shadow-sh1"
          />

          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="সার্চ মুছুন"
              className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-border-base/70 text-muted transition-colors hover:bg-brand-light hover:text-white"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ২. সুবিন্যস্ত ফিল্টার ও অ্যাকশন পিলস গ্রুপ */}
        <div className="flex flex-wrap items-center gap-2">
          {/* তারিখ নির্বাচন */}
          <DateRangePicker
            active={dateActive}
            range={dateRange}
            onApply={onDateApply}
            minDaysBack={364}
            allowClear
            inactiveLabel="সব তারিখ"
          />

          {/* স্ট্যাটাস ফিল্টার ড্রপডাউন */}
          <OrderStatusDropdown
            selectedCount={selectedCount}
            filterStatus={filterStatus}
            onSelectFilter={onSelectFilter}
            onSelectBulk={onSelectBulk}
          />

          {/* CSV রিপোর্ট এক্সপোর্ট ড্রপডাউন */}
          <CsvExportMenu onExportAll={onExportAll} onExportRange={onExportRange} />

          {/* রিফ্রেশ বাটন */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            title="রিফ্রেশ করুন"
            aria-label="রিফ্রেশ করুন"
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-border-base/80 bg-white text-ink shadow-xs transition-all duration-brand hover:border-brand-light hover:bg-brand-bg/30 hover:text-brand-light active:scale-90 disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 ${refreshing ? 'animate-spin text-brand-light' : ''}`}
            >
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v5h-5" />
            </svg>
          </button>

          {/* ফিল্টার পরিষ্কার বাটন */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="group flex h-[38px] shrink-0 items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50/70 px-3.5 font-body text-[11.5px] font-bold text-danger shadow-xs transition-all duration-brand hover:bg-red-100 active:scale-95"
              title="সব ফিল্টার পরিষ্কার করুন"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>রিসেট</span>
            </button>
          )}
        </div>
      </div>

      {/* ══ ৩. বাল্ক-অ্যাকশন বার (অর্ডার সিলেক্ট করা থাকলে প্যানেলের নিচে স্মুথলি দেখাবে) ══ */}
      {selectedCount > 0 && bulkPendingStatus && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-[16px] border border-brand-light/35 bg-brand-light/[0.07] px-3.5 py-2.5 shadow-xs">
          <div className="flex items-center gap-2 font-body text-[12px] font-bold text-ink">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-[11px] font-black text-white">
              {selectedCount}
            </span>
            <span>
              টি অর্ডারের স্ট্যাটাস পরিবর্তন হবে →{' '}
              <span
                className="font-black"
                style={{ color: ORDER_STATUS_META[bulkPendingStatus].dot }}
              >
                {ORDER_STATUS_META[bulkPendingStatus].label}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* কনফার্ম বাটন: সিগনেচার স্কাই-ব্লু (#44A7FC), কোনো গাঢ় নীল নেই */}
            <button
              type="button"
              onClick={onConfirmBulk}
              disabled={bulkBusy}
              className="flex h-[32px] items-center gap-1.5 rounded-full bg-brand-light px-4 font-body text-[12px] font-black text-white shadow-xs transition-all duration-brand hover:bg-brand-light-hover active:scale-95 disabled:opacity-60"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{bulkBusy ? 'পরিবর্তন হচ্ছে...' : 'নিশ্চিত করুন'}</span>
            </button>

            {/* বাতিল বাটন */}
            <button
              type="button"
              onClick={onCancelBulk}
              disabled={bulkBusy}
              className="flex h-[32px] items-center justify-center rounded-full border border-border-base/80 bg-white px-3 font-body text-[11.5px] font-bold text-muted transition-colors hover:bg-red-50 hover:text-danger active:scale-95"
            >
              বাতিল
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
