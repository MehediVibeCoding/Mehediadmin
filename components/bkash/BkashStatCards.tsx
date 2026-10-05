'use client';

import type { BkashFilter, BkashPageResult } from '@/app/actions/bkash';

interface StatItemProps {
  label: string;
  value: string;
  note: string;
  iconBg: string;
  iconText: string;
  icon: React.ReactNode;
  active: boolean;
  highlight?: boolean;
  className?: string;
  onClick: () => void;
}

function StatCard({ label, value, note, iconBg, iconText, icon, active, highlight, className = '', onClick }: StatItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-w-0 flex-col justify-between rounded-[20px] border bg-white p-3.5 text-left shadow-sh1 transition-all duration-brand active:scale-[0.98] sm:p-4 ${
        active
          ? 'border-brand-light ring-2 ring-brand-light/25'
          : highlight
            ? 'border-amber-300/80 hover:border-amber-400'
            : 'border-white/90 hover:border-brand-light/40'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted sm:text-[11px]">
          {label}
        </span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${iconBg} ${iconText}`}>
          {icon}
        </span>
      </div>

      <div className="mt-2.5">
        <div className="truncate font-body text-[18px] font-black leading-tight tracking-tight text-ink sm:text-[22px]">
          {value}
        </div>
        <div className="mt-1 truncate font-body text-[10px] font-medium text-muted" title={note}>
          {note}
        </div>
      </div>
    </button>
  );
}

interface Props {
  today: BkashPageResult['today'];
  unusedCount: number;
  activeFilter: BkashFilter;
  onSelectFilter: (f: BkashFilter) => void;
}

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'h-[18px] w-[18px]',
};

export default function BkashStatCards({ today, unusedCount, activeFilter, onSelectFilter }: Props) {
  const amount = Math.round(today.amount * 100) / 100;

  return (
    <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
      {/* ১. আজকের মোট পেমেন্ট */}
      <StatCard
        label="আজকের মোট পেমেন্ট"
        value={'৳' + amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        note={`আজ ${today.count.toLocaleString('en-US')}টি পেমেন্ট এসেছে`}
        iconBg="bg-brand-light/15"
        iconText="text-brand-light"
        active={activeFilter === 'all'}
        className="col-span-2 sm:col-span-1"
        onClick={() => onSelectFilter('all')}
        icon={
          <svg {...svgProps}>
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </svg>
        }
      />

      {/* ২. ব্যবহৃত (Matched) */}
      <StatCard
        label="ব্যবহৃত (Matched)"
        value={`${today.usedCount.toLocaleString('en-US')}টি`}
        note="আজকের যে পেমেন্টে অর্ডার কনফার্ম হয়েছে"
        iconBg="bg-emerald-50"
        iconText="text-success"
        active={activeFilter === 'used'}
        onClick={() => onSelectFilter('used')}
        icon={
          <svg {...svgProps}>
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12.5 2.5 2.5 4.5-5" />
          </svg>
        }
      />

      {/* ৩. অব্যবহৃত (Unused) — সব সময়ের; ক্লিক করলে বেওয়ারিশ টাকাগুলো আলাদা হয় */}
      <StatCard
        label="অব্যবহৃত (Unused)"
        value={`${unusedCount.toLocaleString('en-US')}টি`}
        note="এখনো কোনো অর্ডারে লাগেনি (সব সময়ের)"
        iconBg="bg-amber-50"
        iconText="text-warn"
        active={activeFilter === 'unused'}
        highlight={unusedCount > 0}
        onClick={() => onSelectFilter('unused')}
        icon={
          <svg {...svgProps}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5V12l3 2" />
          </svg>
        }
      />
    </div>
  );
}
