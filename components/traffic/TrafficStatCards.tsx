import type { TrafficSummary } from '@/lib/traffic';

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
  icon: React.ReactNode;
}

function StatTile({ label, value, sub, chip, icon }: CardProps) {
  return (
    <div className="min-w-0 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${chip}`}>{icon}</span>
        <span className="font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">{label}</span>
      </div>
      <div className="mt-2.5 truncate font-body text-[22px] font-black tracking-tight text-ink">{value}</div>
      {sub && <div className="mt-0.5 font-body text-[11px] font-semibold text-muted">{sub}</div>}
    </div>
  );
}

interface Props {
  summary: TrafficSummary;
  peakHourShort: string;
}

// নিট প্রফিট পেজের ProfitStatCards-এর মতো একই টাইল প্যাটার্ন (মোবাইলে ২×২, ডেস্কটপে ৪ কলাম)।
// রং: স্কাই-ব্লু চিপ; শুধু "পিক সময়" অ্যাম্বার (সতর্কতা/হাইলাইট টোকেন)।
// আগের violet/teal/info রং বাদ — অ্যাডমিন UI-তে শুধু স্কাই-ব্লু ব্র্যান্ড।
export default function TrafficStatCards({ summary, peakHourShort }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      <StatTile
        label="ইউনিক ভিজিটর"
        value={summary.uniqueVisitors.toLocaleString('en-US')}
        sub="নির্বাচিত সময়"
        chip="bg-brand-light/15 text-brand-light"
        icon={
          <Icon>
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
            <circle cx="12" cy="12" r="3" />
          </Icon>
        }
      />
      <StatTile
        label="মোট পেজভিউ"
        value={summary.totalViews.toLocaleString('en-US')}
        sub="সব ভিজিট মিলিয়ে"
        chip="bg-brand-light/15 text-brand-light"
        icon={
          <Icon>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" />
          </Icon>
        }
      />
      <StatTile
        label="পিক সময়"
        value={peakHourShort}
        sub="সবচেয়ে বেশি ভিজিটর"
        chip="bg-amber-50 text-[#92400E]"
        icon={
          <Icon>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
          </Icon>
        }
      />
      <StatTile
        label="গড় ভিউ"
        value={summary.avgViews}
        sub="প্রতি ভিজিটরে"
        chip="bg-surface-muted text-ink"
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
