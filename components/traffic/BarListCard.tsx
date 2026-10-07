import SectionHeading from '@/components/common/SectionHeading';

export interface BarRow {
  key: string;
  label: string;
  sub?: string;
  value: number;
  valueLabel?: string; // না দিলে value-ই দেখাবে
  lead?: string; // ডাটার অংশ হিসেবে ছোট ইমোজি/ফ্ল্যাগ (হেডিংয়ে নয়)
}

interface Props {
  title: string;
  hint?: string;
  rows: BarRow[];
  unit?: string; // যেমন "জন", "ভিউ"
  emptyText?: string;
}

// দেশ/শহর/সোর্স/ডিভাইস/টপ-পেজ — সব জায়গায় একই স্কাই-ব্লু বার-লিস্ট।
export default function BarListCard({ title, hint, rows, unit = 'জন', emptyText = 'এই সময়ে কোনো ডাটা নেই' }: Props) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="min-w-0 rounded-[24px] border border-white/90 bg-white p-4 shadow-sh1 sm:p-5">
      <SectionHeading hint={hint}>{title}</SectionHeading>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border-base/70 bg-surface-muted/60 px-4 py-6 text-center font-body text-[12.5px] font-semibold text-muted">
          {emptyText}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.key} className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  {r.lead && <span className="shrink-0 text-[15px] leading-none">{r.lead}</span>}
                  <span className="truncate font-body text-[13px] font-extrabold text-ink">{r.label}</span>
                  {r.sub && <span className="hidden shrink-0 truncate font-body text-[11px] font-semibold text-muted sm:inline">· {r.sub}</span>}
                </span>
                <span className="shrink-0 font-body text-[12px] font-bold text-muted">
                  {r.valueLabel ?? r.value.toLocaleString('en-US')} {unit}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-brand-light/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-light/70 to-brand-light"
                  style={{ width: `${Math.max(3, Math.round((r.value / max) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
