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

  hasActiveFilters: boolean;
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
  hasActiveFilters,
  onClearFilters,
}: Props) {
  return (
    <div className="mb-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="অর্ডার নং, নাম বা ফোন দিয়ে খুঁজুন…"
            className="h-9 w-full rounded-brand border border-border-base bg-brand-surface pl-9 pr-3 text-xs text-ink outline-none transition-brand placeholder:text-muted focus:border-brand-primary"
          />
        </div>

        <OrderStatusDropdown
          selectedCount={selectedCount}
          filterStatus={filterStatus}
          onSelectFilter={onSelectFilter}
          onSelectBulk={onSelectBulk}
        />

        <DateRangePicker active={dateActive} range={dateRange} onApply={onDateApply} minDaysBack={364} allowClear />

        <CsvExportMenu onExportAll={onExportAll} onExportRange={onExportRange} />

        <button
          type="button"
          onClick={onRefresh}
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

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="h-9 rounded-brand border border-border-base bg-brand-surface px-3 text-xs font-semibold text-muted transition-brand hover:bg-surface-muted"
          >
            ফিল্টার মুছুন
          </button>
        )}
      </div>

      {selectedCount > 0 && bulkPendingStatus && (
        <div className="flex flex-wrap items-center gap-3 rounded-brand bg-brand-bg/50 px-4 py-2.5 text-xs">
          <span className="text-ink">
            <b>{selectedCount}</b>টি অর্ডারের স্ট্যাটাস{' '}
            <b style={{ color: ORDER_STATUS_META[bulkPendingStatus].dot }}>{ORDER_STATUS_META[bulkPendingStatus].label}</b>-এ
            পরিবর্তন করবেন?
          </span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onCancelBulk}
              disabled={bulkBusy}
              className="rounded-brand border border-border-base px-3 py-1.5 font-semibold text-ink transition-brand hover:bg-surface-muted disabled:opacity-50"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={onConfirmBulk}
              disabled={bulkBusy}
              className="rounded-brand bg-brand-primary px-3 py-1.5 font-semibold text-white transition-brand hover:brightness-110 disabled:opacity-50"
            >
              {bulkBusy ? 'হচ্ছে…' : 'নিশ্চিত করুন'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
