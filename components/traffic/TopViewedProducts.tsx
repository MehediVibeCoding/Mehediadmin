import type { TopViewedEntry } from '@/lib/traffic';

interface Props {
  entries: TopViewedEntry[] | null;
}

// LowStockAlert.tsx-এর Thumb প্যাটার্ন reuse করা — buildTopViewed() ইমেজ URL
// হলেই thumb-এ বসায় (imgs[0].startsWith('http')), নাহলে null রাখে, তাই
// এখানে fallback সবসময় একটা emoji আইকন।
function Thumb({ thumb }: { thumb: string | null }) {
  if (thumb) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={thumb} alt="" className="h-10 w-10 shrink-0 rounded-[8px] border border-black/[.08] object-cover" />;
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-surface-muted text-lg">
      📦
    </span>
  );
}

// buildTopViewed() null রিটার্ন করলে trackingField ডিটেক্ট হয়নি (page_views
// টেবিলে product_id/page_url ধরনের কোনো কলাম নেই) — legacy admin.html-এর
// exact এই fallback-এর কপি এখানে নেই (owner-এর দেওয়া লাইন রেঞ্জ ~3789-3799
// এই সেশনে সোর্স হিসেবে সরাসরি পড়া যায়নি), তাই নিচের মেসেজ/ব্যাখ্যা
// অনুমান করে লেখা — owner ভেরিফাই করে exact কপি দিলে বসিয়ে দেওয়া হবে।
export default function TopViewedProducts({ entries }: Props) {
  return (
    <div className="rounded-brand bg-brand-surface p-5 shadow-sh1">
      <div className="mb-3 text-sm font-bold text-ink">🔥 সর্বাধিক দেখা প্রোডাক্ট</div>

      {entries === null ? (
        <div className="rounded-[10px] bg-brand-bg/40 px-3.5 py-4 text-center">
          <p className="text-[12.5px] font-semibold text-ink">প্রোডাক্ট-ভিত্তিক ভিউ ট্র্যাকিং এখনো সেটআপ নেই</p>
          <p className="mt-1 text-[11px] text-muted">
            page_views টেবিলে কোনো প্রোডাক্ট আইডি বা পেজ-URL কলাম পাওয়া যায়নি, তাই এখানে
            প্রোডাক্ট-ভিত্তিক ভিউ দেখানো সম্ভব হচ্ছে না।
          </p>
        </div>
      ) : entries.length === 0 ? (
        <p className="py-6 text-center text-[12.5px] text-muted">এই সময়সীমায় কোনো প্রোডাক্ট ভিউ পাওয়া যায়নি</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {entries.map((e) => (
            <div key={e.key} className="flex items-center gap-3">
              <Thumb thumb={e.thumb} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12.5px] font-semibold text-ink">{e.name}</span>
                  <span className="shrink-0 text-[11px] font-bold text-muted">{e.count} ভিউ</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-light"
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
