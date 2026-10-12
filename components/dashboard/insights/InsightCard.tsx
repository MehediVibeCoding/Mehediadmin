import Link from 'next/link';

export type InsightTone = 'brand' | 'emerald' | 'amber' | 'violet' | 'rose' | 'teal' | 'orange';

const TONE: Record<InsightTone, string> = {
  brand: 'bg-brand-light/15 text-brand-light',
  emerald: 'bg-emerald-50 text-success',
  amber: 'bg-amber-50 text-warn',
  violet: 'bg-violet-50 text-violet-600',
  rose: 'bg-rose-50 text-rose-500',
  teal: 'bg-teal-50 text-teal-600',
  orange: 'bg-orange-50 text-orange-500',
};

/**
 * "অর্ডার অবস্থা" কার্ডের হুবহু খোল (বর্ডার, রেডিয়াস, প্যাডিং, হেডার-লাইন) —
 * ক্যারাউসেলের সব কার্ড একই চেহারা পায়।
 */
export default function InsightCard({
  title,
  subtitle,
  icon,
  tone = 'brand',
  href,
  hrefLabel,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone?: InsightTone;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-hover-glow flex h-full flex-col overflow-hidden rounded-[24px] border border-white/90 bg-white p-5 shadow-sh1 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5 border-b border-border-base/50 pb-3.5">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE[tone]}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icon}
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-body text-[15px] font-black tracking-tight text-ink">{title}</h2>
          <p className="truncate font-body text-[11px] font-medium text-muted">{subtitle}</p>
        </div>
        {href && (
          <Link
            href={href}
            className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-border-base/80 bg-white px-3 font-body text-[11px] font-bold text-ink transition-all duration-brand hover:border-brand-light hover:text-brand-light active:scale-95"
          >
            {hrefLabel || 'বিস্তারিত'}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/** ডাটা নেই / সংযুক্ত নয় — একই চেহারার খালি অবস্থা */
export function InsightEmpty({
  title,
  message,
  href,
  hrefLabel,
}: {
  title: string;
  message: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light/15 text-brand-light">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 3v18h18" />
          <path d="m7 15 4-4 3 3 5-6" />
        </svg>
      </span>
      <span className="font-body text-[13.5px] font-extrabold text-ink">{title}</span>
      <span className="max-w-[260px] font-body text-[11.5px] font-medium leading-relaxed text-muted">{message}</span>
      {href && (
        <Link
          href={href}
          className="mt-1 flex h-11 items-center rounded-full border border-brand-light/40 bg-brand-light/10 px-5 font-body text-[12.5px] font-extrabold text-ink transition-all duration-brand active:scale-95"
        >
          {hrefLabel || 'দেখুন'}
        </Link>
      )}
    </div>
  );
}
