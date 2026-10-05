import type { ProfitSummary } from '@/lib/profit';

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      {children}
    </svg>
  );
}

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  chip: string; // আইকন-চিপের bg + text ক্লাস
  valueCls?: string;
  icon: React.ReactNode;
  className?: string;
}

function StatTile({ label, value, sub, chip, valueCls = 'text-ink', icon, className = '' }: CardProps) {
  return (
    <div className={`min-w-0 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1 ${className}`}>
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${chip}`}>{icon}</span>
        <span className="font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">{label}</span>
      </div>
      <div className={`mt-2.5 truncate font-body text-[22px] font-black tracking-tight ${valueCls}`}>{value}</div>
      {sub && <div className="mt-0.5 font-body text-[11px] font-semibold text-muted">{sub}</div>}
    </div>
  );
}

const fmt = (n: number) => '৳' + Math.round(n).toLocaleString('en-US');

interface Props {
  summary: ProfitSummary;
}

// নিট প্রফিট কার্ডটা মোবাইলে পুরো প্রস্থ নেয় (মূল সংখ্যা) — বাকি তিনটা ছোট টাইল।
// মার্জিন = প্রফিট ÷ রেভিনিউ (শুধু প্রদর্শন; হিসাবের লজিক lib/profit.ts-এ অপরিবর্তিত)।
export default function ProfitStatCards({ summary }: Props) {
  const margin = summary.totalRevenue > 0 ? (summary.totalProfit / summary.totalRevenue) * 100 : null;
  const isLoss = summary.totalProfit < 0;

  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      <StatTile
        className="col-span-2 md:col-span-1"
        label="নিট প্রফিট"
        value={fmt(summary.totalProfit)}
        sub={margin === null ? 'নির্বাচিত সময়' : `মার্জিন ${margin.toFixed(1)}% · নির্বাচিত সময়`}
        chip={isLoss ? 'bg-red-50 text-danger' : 'bg-success/15 text-success'}
        valueCls={isLoss ? 'text-danger' : 'text-success'}
        icon={
          <Icon>
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
          </Icon>
        }
      />
      <StatTile
        label="রেভিনিউ"
        value={fmt(summary.totalRevenue)}
        chip="bg-brand-light/15 text-brand-light"
        icon={
          <Icon>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" />
          </Icon>
        }
      />
      <StatTile
        label="অর্ডার"
        value={summary.totalOrders.toLocaleString('en-US')}
        chip="bg-amber-50 text-[#92400E]"
        icon={
          <Icon>
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
          </Icon>
        }
      />
      <StatTile
        label="গড়/অর্ডার"
        value={fmt(summary.avgProfit)}
        sub="প্রতি অর্ডারে প্রফিট"
        chip="bg-surface-muted text-ink"
        icon={
          <Icon>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8M12 8v8" />
          </Icon>
        }
      />
    </div>
  );
}
