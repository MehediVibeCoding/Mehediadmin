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
    <div className="mb-5 space-y-3">
      {/* ══ সারি ১ — অ্যাপল ফ্রস্টেড সার্চ ক্যাপসুল + ডেট + CSV + রিফ্রেশ ══ */}
      <div className="mx-auto flex max-w-full flex-wrap items-center justify-center gap-2.5">
        {/* ফ্রস্টেড গ্লাস সার্চ ক্যাপসুল */}
        <div className="relative min-w-[200px] max-w-[340px] flex-1 max-[640px]:max-w-full max-[640px]:basis-full">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-brand-light"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>

          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="অর্ডার নং / গ্রাহকের নাম / ফোন নম্বর..."
            className="h-[40px] w-full rounded-full border border-white/90 bg-white/80 pl-10 pr-9 font-body text-[12.5px] text-ink placeholder:text-muted/70 shadow-xs backdrop-blur-md outline-none transition-all duration-brand focus:border-brand-light focus:bg-white focus:shadow-sh1"
          />

          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="সার্চ মুছুন"
              className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-surface-muted text-muted transition-colors hover:bg-brand-light hover:text-white"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ডেট রেঞ্জ পিকার (ট্যাকটাইল পিল) */}
        <DateRangePicker
          active={dateActive}
          range={dateRange}
          onApply={onDateApply}
          minDaysBack={364}
          allowClear
          inactiveLabel="সব তারিখ"
        />

        {/* CSV রিপোর্ট এক্সপোর্ট ড্রপডাউন */}
        <CsvExportMenu onExportAll={onExportAll} onExportRange={onExportRange} />

        {/* রিফ্রেশ বাটন — ডেস্কটপ */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          title="রিফ্রেশ করুন"
          aria-label="রিফ্রেশ করুন"
          className="hidden h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border border-border-base/80 bg-white text-ink shadow-xs backdrop-blur-md transition-all duration-brand hover:border-brand-light hover:bg-brand-bg/30 hover:text-brand-light active:scale-90 disabled:opacity-50 sm:flex"
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
      </div>

      {/* ══ সারি ২ — স্ট্যাটাস ড্রপডাউন + পরিষ্কার বাটন + বাল্ক অ্যাকশন বার ══ */}
      <div className="mx-auto flex max-w-[760px] flex-wrap items-center justify-center gap-2">
        <OrderStatusDropdown
          selectedCount={selectedCount}
          filterStatus={filterStatus}
          onSelectFilter={onSelectFilter}
          onSelectBulk={onSelectBulk}
        />

        {/* পরিষ্কার করুন বাটন */}
        <button
          type="button"
          onClick={onClearFilters}
          className="group flex h-[38px] shrink-0 items-center gap-1.5 rounded-full border border-border-base/80 bg-white px-3.5 font-body text-[12px] font-bold text-ink shadow-xs backdrop-blur-md transition-all duration-brand hover:border-brand-light hover:bg-brand-bg/30 hover:text-brand-light active:scale-95"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted transition-colors group-hover:text-brand-light">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span>পরিষ্কার করুন</span>
        </button>

        {/* মোবাইলের জন্য রিফ্রেশ বাটন */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="রিফ্রেশ"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-border-base/80 bg-white text-ink shadow-xs transition-all duration-brand hover:border-brand-light hover:text-brand-light active:scale-90 disabled:opacity-50 sm:hidden"
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

        {/* ══ বাল্ক-কনফার্ম ফ্রস্টেড ক্যাপসুল বার (গাঢ় নীল সম্পূর্ণ বর্জন) ══ */}
        {selectedCount > 0 && bulkPendingStatus && (
          <div className="flex h-[38px] shrink-0 items-center gap-2 rounded-full border border-brand-light/40 bg-white px-3 shadow-sh1 backdrop-blur-md">
            <span className="font-body text-[12px] font-bold text-ink">
              <b className="text-brand-light">{selectedCount}</b>টি অর্ডার →{' '}
              <span style={{ color: ORDER_STATUS_META[bulkPendingStatus].dot }}>
                {ORDER_STATUS_META[bulkPendingStatus].label}
              </span>
            </span>

            {/* কনফার্ম বাটন: খাঁটি সিগনেচার স্কাই-ব্লু (#44A7FC), কোনো কড়া গাঢ় নীল নেই */}
            <button
              type="button"
              onClick={onConfirmBulk}
              disabled={bulkBusy}
              className="flex h-[28px] items-center gap-1 rounded-full bg-brand-light px-3 font-body text-[11.5px] font-extrabold text-white shadow-xs transition-all duration-brand hover:bg-brand-light-hover active:scale-95 disabled:opacity-60"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{bulkBusy ? 'হচ্ছে...' : 'পরিবর্তন করুন'}</span>
            </button>

            {/* বাতিল বাটন */}
            <button
              type="button"
              onClick={onCancelBulk}
              disabled={bulkBusy}
              aria-label="বাতিল করুন"
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-surface-muted text-muted transition-colors hover:bg-red-50 hover:text-danger active:scale-90"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
