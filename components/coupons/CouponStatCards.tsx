import type { CouponStats } from '@/types';

interface StatItemProps {
  label: string;
  value: string;
  note?: string;
  iconBg: string;
  iconText: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, note, iconBg, iconText, icon }: StatItemProps) {
  return (
    <div className="flex min-w-0 flex-col justify-between rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1 transition-all duration-brand hover:border-brand-light/40 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted sm:text-[11px]">
          {label}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 ${iconBg} ${iconText}`}
        >
          {icon}
        </span>
      </div>

      <div className="mt-2.5">
        <div className="truncate font-body text-[18px] font-black leading-tight tracking-tight text-ink sm:text-[22px]">
          {value}
        </div>
        {note && (
          <div
            className="mt-1 truncate font-body text-[10px] font-medium text-muted"
            title={note}
          >
            {note}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CouponStatCards({ stats }: { stats: CouponStats }) {
  const totalCoupons = stats.totalCoupons || 0;
  const activeCoupons = stats.activeCoupons || 0;
  const totalUsed = stats.totalUsedCount || 0;
  const totalDiscount = Math.round(stats.totalDiscountGiven || 0);

  return (
    <div className="mb-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {/* ১. মোট কুপন */}
      <StatCard
        label="মোট কুপন"
        value={totalCoupons.toLocaleString('en-US')}
        iconBg="bg-brand-light/15"
        iconText="text-brand-light"
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px]"
          >
            <rect x="3" y="6" width="18" height="12" rx="3" />
            <path d="M3 10h18" strokeDasharray="3 3" />
            <circle cx="8" cy="14" r="1" fill="currentColor" />
          </svg>
        }
      />

      {/* ২. সক্রিয় কুপন */}
      <StatCard
        label="সক্রিয় কুপন"
        value={activeCoupons.toLocaleString('en-US')}
        iconBg="bg-emerald-50"
        iconText="text-success"
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px]"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        }
      />

      {/* ৩. মোট ব্যবহার */}
      <StatCard
        label="মোট ব্যবহার"
        value={totalUsed.toLocaleString('en-US')}
        iconBg="bg-purple-50"
        iconText="text-purple-700"
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px]"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
      />

      {/* ৪. মোট ছাড় */}
      <StatCard
        label="মোট ছাড় (আনুমানিক)"
        value={'৳' + totalDiscount.toLocaleString('en-US')}
        note="অর্ডার-লিংকড হিসেব"
        iconBg="bg-amber-50"
        iconText="text-[#92400E]"
        icon={
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px]"
          >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      />
    </div>
  );
}
