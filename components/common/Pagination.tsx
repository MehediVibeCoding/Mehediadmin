'use client';

export const PAGE_SIZE = 14; // legacy PG_SIZE

interface Props {
  page: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

// legacy pgRenderBar() — "প্রেভ/নেক্সট + স্মার্ট পেজ-নম্বর (অনেক পেজ থাকলে ... দিয়ে সংক্ষিপ্ত)"
export default function Pagination({ page, total, pageSize = PAGE_SIZE, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-center py-3 text-xs text-muted">
        মোট <b className="mx-1 text-ink">{total}</b>টি
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

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-base px-1 py-3 text-xs">
      <div className="text-muted">
        <b className="text-ink">{from}–{to}</b> দেখাচ্ছে, মোট <b className="text-ink">{total}</b>টি
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="আগের পেজ"
          className="flex h-7 w-7 items-center justify-center rounded-brand border border-border-base text-ink transition-brand hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        {items.map((it, i) =>
          it === 'ellipsis' ? (
            <span key={`e${i}`} className="px-1 text-muted">…</span>
          ) : (
            <button
              key={it}
              type="button"
              onClick={() => onPageChange(it)}
              className={`flex h-7 min-w-7 items-center justify-center rounded-brand px-1.5 font-semibold transition-brand ${
                it === page ? 'bg-brand-primary text-white' : 'border border-border-base text-ink hover:bg-surface-muted'
              }`}
            >
              {it}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="পরের পেজ"
          className="flex h-7 w-7 items-center justify-center rounded-brand border border-border-base text-ink transition-brand hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
