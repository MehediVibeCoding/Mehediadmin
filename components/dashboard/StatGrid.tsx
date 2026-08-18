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
      className="h-5 w-5"
    >
      {children}
    </svg>
  );
}

interface CardProps {
  label: string;
  value: string;
  note?: string;
  accentBg: string;
  accentText: string;
  icon: React.ReactNode;
  isLive?: boolean;
  href?: string;
}

// stat card গুলোর টার্গেট পেজের (/orders, /traffic, /profit) মধ্যে যেগুলো
// এখনো তৈরি হয়নি সেগুলো non-clickable থাকে; যে module-এর route তৈরি হয়ে
// গেছে (যেমন /customers) সেটার card-এ href দিয়ে Link করা হয় — legacy
// stat-card-cust-এর `onclick="showPage('customers',null)"` আচরণের মতোই।
function StatCard({ label, value, note, accentBg, accentText, icon, isLive, href }: CardProps) {
  const content = (
    <>
      {isLive && (
        <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-warn shadow-[0_0_0_3px_rgba(245,158,11,.2)]" />
      )}
      <div className={`mb-2.5 flex h-[42px] w-[42px] items-center justify-center rounded-full ${accentBg} ${accentText}`}>
        {icon}
      </div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xl font-bold tracking-tight text-ink">
        {value}
      </div>
      {note && (
        <div className="mt-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-medium text-muted">
          {note}
        </div>
      )}
    </>
  );

  const className = `relative flex min-h-[148px] flex-col items-center justify-center rounded-2xl border bg-brand-surface p-5 text-center shadow-sh1 transition-brand hover:-translate-y-0.5 hover:shadow-sh2 ${
    isLive ? 'border-warn/50' : 'border-border-base'
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
      <StatCard
        label="মোট অর্ডার"
        value={String(stats.totalOrders)}
        accentBg="bg-warn/10"
        accentText="text-warn"
        isLive={stats.pendingCount > 0}
        icon={
          <Icon>
            <path d="M21 8 12 3 3 8l9 5 9-5Z" />
            <path d="M3 8v8l9 5 9-5V8" />
            <path d="M12 13v8" />
          </Icon>
        }
      />
      <StatCard
        label="পেন্ডিং"
        value={String(stats.pendingCount)}
        accentBg="bg-danger/10"
        accentText="text-danger"
        icon={
          <Icon>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
          </Icon>
        }
      />
      <StatCard
        label="নিট প্রফিট"
        value={`৳${Math.round(stats.netProfit).toLocaleString()}`}
        note={`মোট রেভিনিউ: ৳${stats.confirmedRevenue.toLocaleString()}`}
        accentBg="bg-success/10"
        accentText="text-success"
        icon={
          <Icon>
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
          </Icon>
        }
      />
      <StatCard
        label="কাস্টমার"
        value={String(stats.uniqueCustomers)}
        href="/customers"
        accentBg="bg-info/10"
        accentText="text-info"
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
        label="আজকের ভিজিটর"
        value={String(stats.todayVisitors)}
        note={stats.totalVisitors > 0 ? `+ ${stats.totalVisitors}টি Total` : undefined}
        href="/traffic"
        accentBg="bg-brand-accent/10"
        accentText="text-brand-accent"
        icon={
          <Icon>
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
            <circle cx="12" cy="12" r="3" />
          </Icon>
        }
      />
      <StatCard
        label="ডেলিভার্ড"
        value={String(stats.deliveredCount)}
        note={stats.confirmedCount > 0 ? `+ ${stats.confirmedCount}টি Confirmed` : undefined}
        accentBg="bg-brand-primary/10"
        accentText="text-brand-primary"
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
