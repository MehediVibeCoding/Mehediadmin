import type { Customer } from '@/types';
import { formatDateBn } from '@/lib/dateFormat';

interface Props {
  customers: Customer[];
  onSelect: (c: Customer) => void;
  selectedKey?: string | null;
}

export const customerKey = (c: Customer) => c.phone || c.name;

const HEADERS = ['কাস্টমার', 'ফোন', 'ইমেইল', 'শেষ অর্ডার', 'মোট অর্ডার', 'মোট খরচ'];

const fmtDate = (d?: string) => formatDateBn(d);

function Avatar({ name, size }: { name: string; size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-light/15 font-body font-black text-brand-light"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

// অর্ডার-সংখ্যা পিল — স্কাই-ব্লু (আগের গাঢ় নীল #1E40AF বাদ)
function OrderCountPill({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-brand-light/15 px-2.5 py-1 font-body text-[11px] font-black leading-none text-ink">
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-brand-light" />
      {count}টি
    </span>
  );
}

export default function CustomersTable({ customers, onSelect, selectedKey = null }: Props) {
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 text-center shadow-sh1 lg:rounded-none lg:border-0 lg:shadow-none">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/[0.12] text-brand-light">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        <span className="font-body text-[14px] font-extrabold text-ink">কোনো কাস্টমার নেই</span>
        <span className="font-body text-[12px] font-medium text-muted">অর্ডার আসলে এখানে দেখাবে</span>
      </div>
    );
  }

  return (
    <>
      {/* ═══════════ মোবাইল + ট্যাবলেট: চিকন সারি (<1024px) — এক স্ক্রিনে অনেক কাস্টমার; ট্যাপ করলে বিস্তারিত ═══════════ */}
      <div className="overflow-hidden rounded-[22px] border border-white/90 bg-white shadow-sh1 lg:hidden">
        <ul className="divide-y divide-border-base/60">
          {customers.map((c, i) => (
            <li key={customerKey(c) + i}>
              <button
                type="button"
                onClick={() => onSelect(c)}
                aria-label={`${c.name || c.phone} — বিস্তারিত দেখুন`}
                className="flex min-h-[60px] w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors duration-brand active:bg-brand-bg/30"
              >
                <Avatar name={c.name} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body text-[14px] font-extrabold leading-tight text-ink">{c.name || '—'}</span>
                  <span className="mt-0.5 block truncate font-body text-[12px] font-semibold text-muted">{c.phone || 'ফোন নেই'}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-body text-[14px] font-black leading-tight text-ink">৳{(c.total_spent || 0).toLocaleString('en-US')}</span>
                  <span className="mt-0.5 block font-body text-[11px] font-extrabold text-muted">{c.order_count}টি অর্ডার</span>
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/70" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ═══════════ ডেস্কটপ: টেবিল (≥1024px) — সারিতে ক্লিক করলে ডান পাশে প্যানেল ═══════════ */}
      <div className="hidden lg:block">
        <div className="sleek-scrollbar overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-border-base/60 bg-brand-bg/30 font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
                {HEADERS.map((h, i) => (
                  <th key={h} className={`px-3 py-3.5 ${i === 0 ? 'pl-5' : ''} ${i === HEADERS.length - 1 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
                <th className="w-[44px] py-3.5 pr-5" aria-label="বিস্তারিত" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
              {customers.map((c, i) => {
                const active = selectedKey === customerKey(c);
                return (
                  <tr
                    key={customerKey(c) + i}
                    onClick={() => onSelect(c)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(c);
                      }
                    }}
                    className={`cursor-pointer transition-colors duration-brand hover:bg-brand-bg/25 ${active ? 'bg-brand-light/10' : ''}`}
                  >
                    <td className="py-3 pl-5 pr-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={c.name} size={36} />
                        <span className="max-w-[200px] truncate font-extrabold text-ink">{c.name || '—'}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink">{c.phone || '—'}</td>
                    <td className="px-3 py-3 font-medium text-muted">
                      <span className="block max-w-[220px] truncate">{c.email || '—'}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-muted">{fmtDate(c.last_order_date)}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <OrderCountPill count={c.order_count} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-black text-ink">৳{(c.total_spent || 0).toLocaleString('en-US')}</td>
                    <td className="py-3 pr-5 text-muted/70">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
