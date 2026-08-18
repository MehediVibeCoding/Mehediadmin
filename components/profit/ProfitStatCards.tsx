import type { ProfitSummary } from '@/lib/profit';

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
  accentBg: string;
  accentText: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, accentBg, accentText, icon }: CardProps) {
  return (
    <div className="flex min-h-[148px] flex-col items-center justify-center rounded-2xl border border-border-base bg-brand-surface p-5 text-center shadow-sh1 transition-brand hover:-translate-y-0.5 hover:shadow-sh2">
      <div className={`mb-2.5 flex h-[42px] w-[42px] items-center justify-center rounded-full ${accentBg} ${accentText}`}>
        {icon}
      </div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xl font-bold tracking-tight text-ink">
        {value}
      </div>
    </div>
  );
}

interface Props {
  summary: ProfitSummary;
}

// legacy stat-card চারটার profit-পেজ ভ্যারিয়েন্ট (prfTotal/prfRevenue/prfOrders/prfAvg)।
// accent রঙ — legacy hex থেকে: নিট প্রফিট #059669 ও রেভিনিউ #2563EB দুটোই
// এই অ্যাপে আগে থেকেই named token আছে এমন hue-এর কাছাকাছি (green→success,
// blue→info) — Dashboard-এর StatGrid.tsx-এ ঠিক এই একই দুটো concept
// (netProfit/customers card) আগেই success/info token দিয়ে ম্যাপ করা হয়েছে,
// তাই এখানেও সেই সিদ্ধান্তের ধারাবাহিকতা রাখা হলো (একই অ্যাপে একই concept-এর
// জন্য দুই রকম রঙ না)। অর্ডার-সংখ্যা #B45309(amber) → warn token
// (Dashboard-এর "মোট অর্ডার" কার্ডেও warn ব্যবহৃত)। গড়-প্রফিট #7C3AED —
// এই hue-এর কোনো named token নেই (TrafficStatCards.tsx-এর ভিজিটর কার্ডের
// একই সিদ্ধান্ত), তাই Tailwind built-in violet-600 (hex হুবহু মিলে যায়)।
export default function ProfitStatCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        label="নিট প্রফিট (নির্বাচিত সময়)"
        value={`৳${Math.round(summary.totalProfit).toLocaleString()}`}
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
        label="টোটাল রেভিনিউ"
        value={`৳${Math.round(summary.totalRevenue).toLocaleString()}`}
        accentBg="bg-info/10"
        accentText="text-info"
        icon={
          <Icon>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" />
          </Icon>
        }
      />
      <StatCard
        label="অর্ডার সংখ্যা"
        value={String(summary.totalOrders)}
        accentBg="bg-warn/10"
        accentText="text-warn"
        icon={
          <Icon>
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5A5.5 5.5 0 0 1 20 14.5v0A5.5 5.5 0 0 1 14.5 20H11" />
          </Icon>
        }
      />
      <StatCard
        label="গড় প্রফিট/অর্ডার"
        value={`৳${Math.round(summary.avgProfit).toLocaleString()}`}
        accentBg="bg-violet-600/10"
        accentText="text-violet-600"
        icon={
          <Icon>
            <path d="M3 17l6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
          </Icon>
        }
      />
    </div>
  );
}
