'use client';

import { PAGE_SIZE } from '@/lib/constants/pagination';

export { PAGE_SIZE };

interface Props {
  page: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  /** true হলে বাইরের বর্ডার/প্যাডিং থাকবে না — কলার নিজের কার্ডের ভেতরে বসাবে (অর্ডার/কাস্টমার পেজ) */
  bare?: boolean;
}

// legacy pgRenderBar() — "প্রেভ/নেক্সট + স্মার্ট পেজ-নম্বর (অনেক পেজ থাকলে ... দিয়ে সংক্ষিপ্ত)"
// ডিজাইন: সিগনেচার স্কাই-ব্লু অ্যাকটিভ পেজ (গাঢ় নীল গ্র্যাডিয়েন্ট বাদ), মোবাইলে ৩৬px টাচ টার্গেট,
// ছোট স্ক্রিনে তথ্য ও বাটন উপর-নিচে মাঝখানে সারিবদ্ধ।
export default function Pagination({ page, total, pageSize = PAGE_SIZE, onPageChange, bare = false }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-center py-3 font-body text-xs font-medium text-muted">
        মোট <b className="mx-1 font-black text-ink">{total}</b>টি
      </div>
    );
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const nums = new Set<number>([1, totalPages]);
  for (let n = page - 1; n <= page + 1; n++) if (n >= 1 && n <= totalPages) nums.add(n);
  const sorted = [...nums].sort((a, b) => a - b);

  const items: (number | 'ellipsis')[] = [];
  let prev = 0;
  sorted.forEach((n) => {
    if (prev && n - prev > 1) items.push('ellipsis');
    items.push(n);
    prev = n;
  });

  const arrowCls =
    'flex h-9 min-w-9 items-center justify-center rounded-xl border border-border-base/80 bg-white text-ink transition-all duration-brand hover:border-brand-light hover:text-brand-light active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border-base/80 disabled:hover:text-ink';

  return (
    <div
      className={`flex flex-col items-center gap-3 font-body text-[12px] sm:flex-row sm:justify-between ${
        bare ? '' : 'border-t border-border-base px-1 pb-1 pt-3.5'
      }`}
    >
      <div className="font-medium text-muted">
        <b className="font-black text-ink">
          {from}–{to}
        </b>{' '}
        দেখাচ্ছে, মোট <b className="font-black text-ink">{total}</b>টি
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="আগের পেজ" className={arrowCls}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-[14px] w-[14px]">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        {items.map((it, i) =>
          it === 'ellipsis' ? (
            <span key={`e${i}`} className="px-0.5 text-sm font-bold text-muted">
              …
            </span>
          ) : (
            <button
              key={it}
              type="button"
              onClick={() => onPageChange(it)}
              aria-current={it === page ? 'page' : undefined}
              className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-[12.5px] font-extrabold transition-all duration-brand active:scale-95 ${
                it === page
                  ? 'bg-brand-light text-white shadow-[0_4px_12px_rgba(68,167,252,0.38)]'
                  : 'border border-border-base/80 bg-white text-ink hover:border-brand-light hover:text-brand-light'
              }`}
            >
              {it}
            </button>
          )
        )}
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="পরের পেজ" className={arrowCls}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-[14px] w-[14px]">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
