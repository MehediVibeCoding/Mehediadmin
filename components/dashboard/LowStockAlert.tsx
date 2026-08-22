import Link from 'next/link';
import type { LowStockItem } from '@/app/actions/dashboard';

function Thumb({ thumb }: { thumb: string }) {
  const isUrl = /^(https?:\/\/|\/)/.test(thumb);
  if (isUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={thumb} alt="" className="h-7 w-7 shrink-0 rounded-[5px] border border-black/[.08] object-cover" />;
  }
  return <span className="shrink-0 text-lg">{thumb || '📦'}</span>;
}

export default function LowStockAlert({ items }: { items: LowStockItem[] }) {
  if (!items.length) return null;

  return (
    <div className="glass-card-strong mt-4 rounded-brand p-4 shadow-glass md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-ink">⚠️ কম স্টক সতর্কতা (৫ বা কম)</span>
        <Link
          href="/products"
          className="rounded-brand border border-border-base px-3 py-1.5 text-xs font-semibold text-ink transition-brand hover:bg-surface-muted"
        >
          স্টক আপডেট →
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((p) => {
          const out = p.stock <= 0;
          return (
            <Link
              key={p.id}
              href="/products"
              title={`${p.name} — ক্লিক করুন স্টক এডিট করতে`}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-brand hover:shadow-sh1 ${
                out ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
              }`}
            >
              <Thumb thumb={p.thumb} />
              <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-ink">
                {p.name}
              </span>
              <span className={`whitespace-nowrap font-bold ${out ? 'text-red-600' : 'text-amber-700'}`}>
                {out ? 'শেষ' : `${p.stock} বাকি`}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
