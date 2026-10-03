'use client';

import type { OrderStatus } from '@/types';
import { ORDER_STATUS_META, ORDER_STATUS_ORDER } from '@/lib/orders';
import type { DateRange } from '@/components/common/DateRangePicker';
import DateRangePicker from '@/components/common/DateRangePicker';
import OrderStatusDropdown from '@/components/orders/OrderStatusDropdown';
import CsvExportMenu from '@/components/orders/CsvExportMenu';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;

  filterStatus: 'all' | OrderStatus;
  onSelectFilter: (s: 'all' | OrderStatus) => void;
  /** প্রতিটা স্ট্যাটাসে মোট কয়টা অর্ডার (ফিল্টার চিপের কাউন্ট) */
  statusCounts: Record<OrderStatus, number>;
  totalCount: number;

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
  statusCounts,
  totalCount,
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
  const chips: ('all' | OrderStatus)[] = ['all', ...ORDER_STATUS_ORDER];

  return (
    <>
      {/* ══ একক সাদা টুলবার কার্ড — overflow-hidden/backdrop-blur নেই, তাই ড্রপডাউন বা ক্যালেন্ডার কখনো কাটা পড়ে না ══ */}
      <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          {/* ১. সার্চ */}
          <div className="relative min-w-0 flex-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-light"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="অর্ডার নম্বর, নাম বা ফোন দিয়ে খুঁজুন..."
              className="h-11 w-full rounded-full border border-border-base/80 bg-surface-muted/50 pl-11 pr-10 font-body text-[13px] font-medium text-ink transition-all duration-brand placeholder:text-muted/70 focus:bg-white lg:h-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="সার্চ মুছুন"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-border-base/70 text-muted transition-colors hover:bg-brand-light hover:text-white"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* ২. অ্যাকশন পিল: তারিখ | CSV | রিফ্রেশ | রিসেট */}
          <div className="flex items-center gap-2">
            <DateRangePicker
              active={dateActive}
              range={dateRange}
              onApply={onDateApply}
              minDaysBack={364}
              allowClear
              inactiveLabel="সব তারিখ"
              className="min-w-0 flex-1 lg:flex-none"
            />
            <CsvExportMenu onExportAll={onExportAll} onExportRange={onExportRange} className="shrink-0" />
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              title="রিফ্রেশ করুন"
              aria-label="রিফ্রেশ করুন"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-base/80 bg-white text-ink transition-all duration-brand hover:border-brand-light hover:text-brand-light active:scale-90 disabled:opacity-60 lg:h-10 lg:w-10"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-[18px] w-[18px] ${refreshing ? 'animate-spin text-brand-light' : ''}`}
              >
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 4v5h-5" />
              </svg>
            </button>
          </div>
        </div>

        {/* ৩. স্ট্যাটাস ফিল্টার চিপ (কাউন্ট সহ) — মোবাইলে সাইড-স্ক্রল, স্ক্রলবার লুকানো */}
        <div className="no-scrollbar -mx-3.5 mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 sm:-mx-4 sm:px-4">
          {chips.map((s) => {
            const active = filterStatus === s;
            const meta = s === 'all' ? null : ORDER_STATUS_META[s];
            const count = s === 'all' ? totalCount : statusCounts[s] || 0;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onSelectFilter(s)}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 font-body text-[12px] font-extrabold transition-all duration-brand active:scale-95 ${
                  active
                    ? 'border-brand-light bg-brand-light text-white shadow-[0_4px_14px_rgba(68,167,252,0.36)]'
                    : 'border-border-base/80 bg-white text-ink hover:border-brand-light hover:text-brand-light'
                }`}
              >
                {meta && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: active ? '#fff' : meta.dot }} />}
                <span>{meta ? meta.label : 'সব'}</span>
                <span
                  className={`min-w-[22px] rounded-full px-1.5 text-center text-[10.5px] font-black leading-[18px] ${
                    active ? 'bg-white/25 text-white' : 'bg-surface-muted text-muted'
                  }`}
                >
                  {count.toLocaleString('en-US')}
                </span>
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3.5 font-body text-[12px] font-extrabold text-danger transition-all duration-brand hover:bg-red-100 active:scale-95"
              title="সব ফিল্টার পরিষ্কার করুন"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              রিসেট
            </button>
          )}
        </div>
      </div>

      {/* ══ ৪. সিলেকশন/বাল্ক বার — মোবাইলে ট্যাব বারের ঠিক উপরে ভাসমান (স্ক্রল করে উপরে যেতে হয় না),
             ডেস্কটপে টুলবারের নিচে ইনলাইন ══ */}
      {selectedCount > 0 && (
        <div
          className="animate-sheet-up fixed inset-x-3 z-[45] mx-auto max-w-[420px] rounded-[22px] border border-brand-light/35 bg-white p-3 shadow-[0_10px_36px_rgba(68,167,252,0.28)] lg:static lg:mb-4 lg:max-w-none lg:animate-none lg:shadow-sh1"
          style={{ bottom: 'calc(92px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-brand-light px-2 font-body text-[12px] font-black text-white">
              {selectedCount}
            </span>
            <span className="min-w-0 flex-1 truncate font-body text-[12.5px] font-extrabold text-ink">টি অর্ডার সিলেক্টেড</span>
            <OrderStatusDropdown
              selectedCount={selectedCount}
              filterStatus={filterStatus}
              onSelectFilter={onSelectFilter}
              onSelectBulk={onSelectBulk}
              className="shrink-0"
            />
            <button
              type="button"
              onClick={onCancelBulk}
              disabled={bulkBusy}
              aria-label="সিলেকশন বাতিল"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-base/80 bg-white text-muted transition-all duration-brand hover:bg-red-50 hover:text-danger active:scale-90 md:h-10 md:w-10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {bulkPendingStatus && (
            <div className="mt-2.5 flex items-center justify-between gap-2 rounded-2xl bg-brand-light/10 px-3 py-2">
              <div className="min-w-0 font-body text-[12px] font-bold text-ink">
                পরিবর্তন হবে →{' '}
                <span className="font-black" style={{ color: ORDER_STATUS_META[bulkPendingStatus].text }}>
                  {ORDER_STATUS_META[bulkPendingStatus].label}
                </span>
              </div>
              <button
                type="button"
                onClick={onConfirmBulk}
                disabled={bulkBusy}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand-light px-4 font-body text-[12px] font-black text-white shadow-[0_4px_12px_rgba(68,167,252,0.38)] transition-all duration-brand hover:bg-brand-light-hover active:scale-95 disabled:opacity-60"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {bulkBusy ? 'হচ্ছে...' : 'নিশ্চিত করুন'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
