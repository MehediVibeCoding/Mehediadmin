import Link from 'next/link';
import type { DashboardStats } from '@/app/actions/dashboard';

interface CardConfig {
  id: string;
  label: string;
  value: string;
  note?: string;
  href: string;
  isLive?: boolean;
  cardBg: string;
  borderColor: string;
  shadowColor: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  icon: React.ReactNode;
}

export default function StatGrid({ stats }: { stats: DashboardStats }) {
  const cards: CardConfig[] = [
    {
      id: 'orders',
      label: 'মোট অর্ডার',
      value: String(stats.totalOrders),
      href: '/orders',
      isLive: stats.pendingCount > 0,
      cardBg: 'bg-gradient-to-br from-[#EBF5FF] via-white to-white',
      borderColor: 'border-blue-200/70 hover:border-brand-light/60',
      shadowColor: 'shadow-[0_6px_24px_rgba(68,167,252,0.12)]',
      iconBg: 'bg-brand-light/15',
      iconColor: 'text-brand-light',
      valueColor: 'text-brand-light',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      id: 'pending',
      label: 'পেন্ডিং অর্ডার',
      value: String(stats.pendingCount),
      href: '/orders?status=pending',
      cardBg: 'bg-gradient-to-br from-[#FFFBEB] via-white to-white',
      borderColor: 'border-amber-200/70 hover:border-amber-300',
      shadowColor: 'shadow-[0_6px_24px_rgba(245,158,11,0.10)]',
      iconBg: 'bg-amber-100',
      iconColor: 'text-warn',
      valueColor: 'text-warn',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      id: 'profit',
      label: 'নিট প্রফিট',
      value: `৳${Math.round(stats.netProfit).toLocaleString('en-US')}`,
      note: `রেভিনিউ: ৳${Math.round(stats.confirmedRevenue).toLocaleString('en-US')}`,
      href: '/profit',
      cardBg: 'bg-gradient-to-br from-[#ECFDF5] via-white to-white',
      borderColor: 'border-emerald-200/70 hover:border-emerald-300',
      shadowColor: 'shadow-[0_6px_24px_rgba(16,185,129,0.10)]',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-success',
      valueColor: 'text-success',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      id: 'customers',
      label: 'মোট কাস্টমার',
      value: String(stats.uniqueCustomers),
      href: '/customers',
      cardBg: 'bg-gradient-to-br from-[#EEF2FF] via-white to-white',
      borderColor: 'border-indigo-200/70 hover:border-indigo-300',
      shadowColor: 'shadow-[0_6px_24px_rgba(99,102,241,0.10)]',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'visitors',
      label: 'আজকের ভিজিটর',
      value: String(stats.todayVisitors),
      note: stats.totalVisitors > 0 ? `+ ${stats.totalVisitors}টি সর্বমোট` : undefined,
      href: '/traffic',
      cardBg: 'bg-gradient-to-br from-[#FAF5FF] via-white to-white',
      borderColor: 'border-purple-200/70 hover:border-purple-300',
      shadowColor: 'shadow-[0_6px_24px_rgba(168,85,247,0.10)]',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      id: 'delivered',
      label: 'ডেলিভার্ড',
      value: String(stats.deliveredCount),
      note: stats.confirmedCount > 0 ? `+ ${stats.confirmedCount}টি কনফার্মড` : undefined,
      href: '/orders?status=confirmed',
      cardBg: 'bg-gradient-to-br from-[#F0FDFA] via-white to-white',
      borderColor: 'border-teal-200/70 hover:border-teal-300',
      shadowColor: 'shadow-[0_6px_24px_rgba(20,184,166,0.10)]',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={card.href}
          className={`group relative flex min-h-[138px] flex-col items-center justify-center rounded-[22px] border p-4 text-center backdrop-blur-xl transition-all duration-brand hover:-translate-y-1 md:min-h-[152px] md:p-5 ${card.cardBg} ${card.borderColor} ${card.shadowColor}`}
        >
          {card.isLive && (
            <span className="absolute right-3.5 top-3.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warn opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-warn" />
            </span>
          )}

          <div
            className={`mb-2.5 flex h-10 w-10 items-center justify-center rounded-[14px] shadow-xs transition-transform duration-brand group-hover:scale-110 ${card.iconBg} ${card.iconColor}`}
          >
            {card.icon}
          </div>

          <div className="mb-0.5 font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted/85">
            {card.label}
          </div>

          <div className={`w-full truncate font-body text-[20px] font-black tracking-tight text-ink md:text-[22px] ${card.valueColor ? 'group-hover:' + card.valueColor : ''}`}>
            {card.value}
          </div>

          {card.note && (
            <div className="mt-1 w-full truncate font-body text-[10px] font-semibold text-muted/75">
              {card.note}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
