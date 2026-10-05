'use client';

import type { BkashFilter } from '@/app/actions/bkash';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  filter: BkashFilter;
  onSelectFilter: (f: BkashFilter) => void;
  counts: { all: number; used: number; unused: number };
  onRefresh: () => void;
  refreshing: boolean;
  onClearFilters: () => void;
}

const TABS: { key: BkashFilter; label: string; dot?: string }[] = [
  { key: 'all', label: 'সব পেমেন্ট' },
  { key: 'used', label: 'ব্যবহৃত পেমেন্ট', dot: '#10B981' },
  { key: 'unused', label: 'অব্যবহৃত / খালি', dot: '#F59E0B' },
];

export default function BkashToolbar({
  search,
  onSearchChange,
  filter,
  onSelectFilter,
  counts,
  onRefresh,
  refreshing,
  onClearFilters,
}: Props) {
  const hasActiveFilters = !!search || filter !== 'all';

  return (
    <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
      <div className="flex items-center gap-2.5">
        {/* সার্চ */}
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
            placeholder="ফোন নম্বর, TrxID বা অর্ডার নম্বর (#VC-1080)..."
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

        {/* রিফ্রেশ */}
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

      {/* ট্যাব ফিল্টার চিপ (কাউন্ট সহ) */}
      <div className="no-scrollbar -mx-3.5 mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 sm:-mx-4 sm:px-4">
        {TABS.map((t) => {
          const active = filter === t.key;
          const count = counts[t.key] || 0;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onSelectFilter(t.key)}
              className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 font-body text-[12px] font-extrabold transition-all duration-brand active:scale-95 ${
                active
                  ? 'border-brand-light bg-brand-light text-white shadow-[0_4px_14px_rgba(68,167,252,0.36)]'
                  : 'border-border-base/80 bg-white text-ink hover:border-brand-light hover:text-brand-light'
              }`}
            >
              {t.dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: active ? '#fff' : t.dot }} />}
              <span>{t.label}</span>
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
  );
}
