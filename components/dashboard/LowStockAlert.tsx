import Link from 'next/link';
import type { LowStockItem } from '@/app/actions/dashboard';

function Thumb({ thumb }: { thumb: string }) {
  const isUrl = /^(https?:\/\/|\/)/.test(thumb);
  if (isUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumb}
        alt=""
        className="h-8 w-8 shrink-0 rounded-lg border border-black/[0.06] object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    </div>
  );
}

export default function LowStockAlert({ items }: { items: LowStockItem[] }) {
  if (!items.length) return null;

  return (
    <div className="card-hover-glow mt-5 overflow-hidden rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-sh1 backdrop-blur-xl sm:p-6">
      {/* হেডার ও অ্যাকশন পিল বাটন */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border-base/50 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-warn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2 className="font-body text-[15px] font-black tracking-tight text-ink">কম স্টক সতর্কতা</h2>
            <p className="font-body text-[11px] font-medium text-muted">৫টি বা তার কম পরিমাণের পণ্যসমূহ</p>
          </div>
        </div>

        <Link
          href="/products"
          className="group inline-flex items-center gap-1.5 rounded-full border border-border-base/80 bg-white px-3.5 py-1.5 font-body text-[11.5px] font-bold text-ink shadow-xs transition-all duration-brand hover:border-brand-light hover:bg-brand-bg/30 hover:text-brand-primary active:scale-95"
        >
          <span>স্টক আপডেট</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-brand group-hover:translate-x-0.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {/* ট্যাকটাইল পিল চিপস গ্রিড (ইমেজ ৩ ইন্সপায়ারেশন) */}
      <div className="flex flex-wrap gap-2.5">
        {items.map((p) => {
          const isOut = p.stock <= 0;
          return (
            <Link
              key={p.id}
              href="/products"
              title={`${p.name} — স্টক এডিট করতে ক্লিক করুন`}
              className={`group flex items-center gap-2 rounded-[14px] border p-1.5 pr-3 shadow-xs transition-all duration-brand hover:-translate-y-0.5 hover:shadow-sh1 active:scale-95 ${
                isOut
                  ? 'border-red-200/80 bg-red-50/70 hover:border-red-300 hover:bg-red-50'
                  : 'border-amber-200/80 bg-amber-50/70 hover:border-amber-300 hover:bg-amber-50'
              }`}
            >
              <Thumb thumb={p.thumb} />
              <span className="max-w-[140px] truncate font-body text-[12.5px] font-bold text-ink sm:max-w-[170px]">
                {p.name}
              </span>
              <span
                className={`ml-auto whitespace-nowrap rounded-full px-2 py-0.5 font-body text-[10px] font-extrabold ${
                  isOut ? 'bg-danger text-white' : 'bg-warn/20 text-[#92400E]'
                }`}
              >
                {isOut ? 'স্টক শেষ' : `${p.stock} পিস বাকি`}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
