import type { CouponStats } from '@/types';

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[17px] w-[17px] md:h-5 md:w-5"
    >
      {children}
    </svg>
  );
}

interface CardProps {
  label: string;
  value: string;
  note?: string;
  iconBg: string;
  iconText: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, note, iconBg, iconText, icon }: CardProps) {
  return (
    <div className="glass-card relative flex min-h-[126px] flex-col items-center justify-center rounded-2xl p-4 text-center shadow-glass transition-brand hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(0,61,143,.14)] md:min-h-[148px] md:p-5">
      <div
        className="mb-2 flex h-9 w-9 items-center justify-center rounded-full md:mb-2.5 md:h-[42px] md:w-[42px]"
        style={{ background: iconBg, color: iconText }}
      >
        {icon}
      </div>
      <div className="mb-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted md:mb-1 md:text-[11px]">
        {label}
      </div>
      <div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[18px] font-bold tracking-tight text-[#111] md:text-[21px]">
        {value}
      </div>
      {note && (
        <div className="mt-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-medium text-muted">
          {note}
        </div>
      )}
    </div>
  );
}

export default function CouponStatCards({ stats }: { stats: CouponStats }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
      <StatCard
        label="মোট কুপন"
        value={String(stats.totalCoupons)}
        iconBg="rgba(59,130,246,.14)"
        iconText="#2563EB"
        icon={
          <Icon>
            <rect x="3" y="7" width="18" height="10" rx="2" />
            <path d="M3 11h18" strokeDasharray="2 2" />
            <circle cx="8" cy="14" r="0.5" />
          </Icon>
        }
      />
      <StatCard
        label="সক্রিয় কুপন"
        value={String(stats.activeCoupons)}
        iconBg="rgba(16,185,129,.14)"
        iconText="#059669"
        icon={
          <Icon>
            <path d="M20 6 9 17l-5-5" />
          </Icon>
        }
      />
      <StatCard
        label="মোট ব্যবহার"
        value={String(stats.totalUsedCount)}
        iconBg="rgba(139,92,246,.14)"
        iconText="#7C3AED"
        icon={
          <Icon>
            <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </Icon>
        }
      />
      <StatCard
        label="মোট ছাড় (আনুমানিক)"
        value={`৳${Math.round(stats.totalDiscountGiven).toLocaleString()}`}
        note="সঠিক অঙ্কের জন্য অর্ডার-লিংকড ট্র্যাকিং লাগবে"
        iconBg="rgba(245,158,11,.14)"
        iconText="#B45309"
        icon={
          <Icon>
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </Icon>
        }
      />
    </div>
  );
}
