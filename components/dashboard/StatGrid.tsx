import Link from 'next/link';
import type { DashboardStats } from '@/app/actions/dashboard';

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
  iconBg: string; // legacy exact rgba() — inline hex, tailwind token দিয়ে approximate করা হয়নি
  iconText: string;
  icon: React.ReactNode;
  isLive?: boolean;
  href?: string;
}

// legacy .stat-card — glassmorphism card, প্রতিটার icon রঙ legacy admin.html
// থেকে হুবহু (rgba bg + hex text), কোনো generic token দিয়ে approximate করা
// হয়নি যাতে ৬টা কার্ডের রঙ exactly আগের মতোই থাকে।
function StatCard({ label, value, note, iconBg, iconText, icon, isLive, href }: CardProps) {
  const content = (
    <>
      {isLive && (
        <span className="absolute right-3 top-3 h-[7px] w-[7px] rounded-full bg-warn shadow-[0_0_0_3px_rgba(245,158,11,.2)]" />
      )}
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
    </>
  );

  const className = `glass-card relative flex min-h-[126px] flex-col items-center justify-center rounded-2xl p-4 text-center shadow-glass transition-brand hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(0,61,143,.14)] md:min-h-[148px] md:p-5 ${
    isLive ? 'stat-card-live animate-stat-live-sweep' : ''
  } ${href ? 'cursor-pointer' : ''}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export default function StatGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-6 md:gap-3">
      {/* ১. মোট অর্ডার — pending থাকলে live sweep + dot দেখায়, /orders-এ যায় */}
      <StatCard
        label="মোট অর্ডার"
        value={String(stats.totalOrders)}
        href="/orders"
        isLive={stats.pendingCount > 0}
        iconBg="rgba(245,158,11,.14)"
        iconText="#B45309"
        icon={
          <Icon>
            <path d="M21 8 12 3 3 8l9 5 9-5Z" />
            <path d="M3 8v8l9 5 9-5V8" />
            <path d="M12 13v8" />
          </Icon>
        }
      />
      {/* ২. পেন্ডিং — /orders?status=pending */}
      <StatCard
        label="পেন্ডিং"
        value={String(stats.pendingCount)}
        href="/orders?status=pending"
        iconBg="rgba(230,57,70,.12)"
        iconText="#E63946"
        icon={
          <Icon>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
          </Icon>
        }
      />
      {/* ৩. নিট প্রফিট — /profit */}
      <StatCard
        label="নিট প্রফিট"
        value={`৳${Math.round(stats.netProfit).toLocaleString()}`}
        note={`মোট রেভিনিউ: ৳${stats.confirmedRevenue.toLocaleString()}`}
        href="/profit"
        iconBg="rgba(16,185,129,.14)"
        iconText="#059669"
        icon={
          <Icon>
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
          </Icon>
        }
      />
      {/* ৪. কাস্টমার — /customers */}
      <StatCard
        label="কাস্টমার"
        value={String(stats.uniqueCustomers)}
        href="/customers"
        iconBg="rgba(59,130,246,.14)"
        iconText="#2563EB"
        icon={
          <Icon>
            <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </Icon>
        }
      />
      {/* ৫. আজকের ভিজিটর — /traffic */}
      <StatCard
        label="আজকের ভিজিটর"
        value={String(stats.todayVisitors)}
        note={stats.totalVisitors > 0 ? `+ ${stats.totalVisitors}টি Total` : undefined}
        href="/traffic"
        iconBg="rgba(139,92,246,.14)"
        iconText="#7C3AED"
        icon={
          <Icon>
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
            <circle cx="12" cy="12" r="3" />
          </Icon>
        }
      />
      {/* ৬. ডেলিভার্ড — /orders?status=confirmed (legacy goToOrdersFiltered('confirmed')) */}
      <StatCard
        label="ডেলিভার্ড"
        value={String(stats.deliveredCount)}
        note={stats.confirmedCount > 0 ? `+ ${stats.confirmedCount}টি Confirmed` : undefined}
        href="/orders?status=confirmed"
        iconBg="rgba(13,148,136,.14)"
        iconText="#0D9488"
        icon={
          <Icon>
            <path d="M1 3h13v11H1z" />
            <path d="M14 8h4l3 3v3h-7V8z" />
            <circle cx="5.5" cy="18" r="1.6" />
            <circle cx="18" cy="18" r="1.6" />
          </Icon>
        }
      />
    </div>
  );
}
