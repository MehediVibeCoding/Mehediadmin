import type { TopViewedEntry } from '@/lib/traffic';
import SectionHeading from '@/components/common/SectionHeading';

interface Props {
  entries: TopViewedEntry[] | null;
}

// buildTopViewed() ইমেজ URL পেলে thumb-এ বসায়, নইলে null — তখন নিচের স্কাই-ব্লু আইকন বক্স।
function Thumb({ thumb }: { thumb: string | null }) {
  if (thumb) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={thumb} alt="" className="h-11 w-11 shrink-0 rounded-xl border border-border-base/70 object-cover" />;
  }
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light/15 text-brand-light">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      </svg>
    </span>
  );
}

// entries === null মানে page_views টেবিলে প্রোডাক্ট আইডি/পেজ-URL কলাম পাওয়া যায়নি (ট্র্যাকিং সেটআপ নেই)।
export default function TopViewedProducts({ entries }: Props) {
  return (
    <div className="rounded-[24px] border border-white/90 bg-white p-4 shadow-sh1 sm:p-5">
      <SectionHeading hint="এই সময়সীমায় সবচেয়ে বেশি দেখা প্রোডাক্ট">সর্বাধিক দেখা প্রোডাক্ট</SectionHeading>

      {entries === null ? (
        <div className="rounded-2xl border border-brand-light/25 bg-brand-light/10 px-4 py-5 text-center">
          <p className="font-body text-[13px] font-extrabold text-ink">প্রোডাক্ট-ভিত্তিক ভিউ ট্র্যাকিং এখনো সেটআপ নেই</p>
          <p className="mt-1 font-body text-[11.5px] font-medium text-muted">
            page_views টেবিলে কোনো প্রোডাক্ট আইডি বা পেজ-URL কলাম পাওয়া যায়নি, তাই এখানে
            প্রোডাক্ট-ভিত্তিক ভিউ দেখানো সম্ভব হচ্ছে না।
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2.5 px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/15 text-brand-light">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
          <span className="font-body text-[14px] font-extrabold text-ink">কোনো প্রোডাক্ট ভিউ পাওয়া যায়নি</span>
          <span className="font-body text-[12px] font-medium text-muted">অন্য তারিখ রেঞ্জ বেছে দেখুন</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {entries.map((e) => (
            <div key={e.key} className="flex items-center gap-3">
              <Thumb thumb={e.thumb} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-body text-[13px] font-extrabold text-ink">{e.name}</span>
                  <span className="shrink-0 font-body text-[11.5px] font-bold text-muted">{e.count} ভিউ</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-brand-light/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-light/70 to-brand-light"
                    style={{ width: `${e.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
