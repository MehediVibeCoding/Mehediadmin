import type { TrafficSummary } from '@/lib/traffic';

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
  summary: TrafficSummary;
  peakHourShort: string;
}

// legacy stat-card-visitors/orders/revenue/cust চারটার ট্রাফিক-পেজ ভ্যারিয়েন্ট।
// icon accent রঙ — legacy hex ঠিক এই টোকেনগুলোর সাথেই মেলে: পিক-আওয়ার card
// warn (#F59E0B, exact), পেজভিউ card info (#3B82F6 family, Dashboard-এর
// "কাস্টমার" card-এও একই ব্যবহার)। কিন্তু legacy-র ভিজিটর (violet #7C3AED)
// আর গড়-ভিউ (teal #0D9488) রঙের কোনো নাম করা token DESIGN_SYSTEM.md-এ নেই —
// এই দুটোর hex ঠিক Tailwind-এর built-in violet-600/teal-600-এর সাথে exact
// মিলে যাওয়ায় নতুন hardcoded hex না বসিয়ে সেই built-in utility ক্লাস ব্যবহার
// করা হয়েছে। এটা DESIGN_SYSTEM.md-এর ঘোষিত token তালিকার বাইরে একটা ছোট
// সিদ্ধান্ত — owner-কে জানানো হয়েছে, চাইলে tailwind.config.ts-এ নতুন
// named token (যেমন brand-violet/brand-teal) হিসেবে formalize করা যায়।
export default function TrafficStatCards({ summary, peakHourShort }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        label="ইউনিক ভিজিটর"
        value={String(summary.uniqueVisitors)}
        accentBg="bg-violet-600/10"
        accentText="text-violet-600"
        icon={
          <Icon>
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
            <circle cx="12" cy="12" r="3" />
          </Icon>
        }
      />
      <StatCard
        label="মোট পেজভিউ"
        value={String(summary.totalViews)}
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
        label="পিক সময়"
        value={peakHourShort}
        accentBg="bg-warn/10"
        accentText="text-warn"
        icon={
          <Icon>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
          </Icon>
        }
      />
      <StatCard
        label="গড় ভিউ"
        value={summary.avgViews}
        accentBg="bg-teal-600/10"
        accentText="text-teal-600"
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
