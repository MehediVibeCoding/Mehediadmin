import type { Customer } from '@/types';

interface Props {
  customers: Customer[];
}

const HEADERS = ['কাস্টমার', 'ফোন', 'ইমেইল', 'শেষ অর্ডার', 'মোট অর্ডার', 'মোট খরচ'];

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

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

export default function CustomersTable({ customers }: Props) {
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 text-center shadow-sh1 lg:rounded-none lg:border-0 lg:shadow-none">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/12 text-brand-light">
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
      {/* ═══════════ মোবাইল + ট্যাবলেট: কাস্টমার কার্ড (<1024px) ═══════════ */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
        {customers.map((c, i) => (
          <article key={(c.phone || c.name) + i} className="rounded-[22px] border border-white/90 bg-white p-3.5 shadow-sh1">
            <div className="flex items-center gap-3">
              <Avatar name={c.name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-[15px] font-extrabold leading-tight text-ink">{c.name || '—'}</div>
                {c.phone ? (
                  <a
                    href={`tel:${c.phone}`}
                    className="mt-1 inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-muted transition-colors active:text-brand-light"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
                    </svg>
                    {c.phone}
                  </a>
                ) : (
                  <div className="mt-1 font-body text-[12.5px] font-semibold text-muted">—</div>
                )}
              </div>
              <OrderCountPill count={c.order_count} />
            </div>

            {c.email && (
              <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-surface-muted/70 px-3 py-2 font-body text-[12px] font-semibold text-muted">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-light">
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <path d="m22 7-10 6L2 7" />
                </svg>
                <span className="truncate">{c.email}</span>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="min-w-0 rounded-xl border border-border-base/70 px-3 py-2">
                <div className="font-body text-[10px] font-bold uppercase tracking-wide text-muted">শেষ অর্ডার</div>
                <div className="mt-0.5 truncate font-body text-[13px] font-extrabold text-ink">{fmtDate(c.last_order_date)}</div>
              </div>
              <div className="min-w-0 rounded-xl border border-border-base/70 px-3 py-2">
                <div className="font-body text-[10px] font-bold uppercase tracking-wide text-muted">মোট খরচ</div>
                <div className="mt-0.5 truncate font-body text-[14px] font-black text-success">৳{(c.total_spent || 0).toLocaleString('en-US')}</div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ═══════════ ডেস্কটপ: টেবিল (≥1024px) ═══════════ */}
      <div className="hidden lg:block">
        <div className="sleek-scrollbar overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-border-base/60 bg-brand-bg/30 font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
                {HEADERS.map((h, i) => (
                  <th key={h} className={`px-3 py-3.5 ${i === 0 ? 'pl-5' : ''} ${i === HEADERS.length - 1 ? 'pr-5 text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
              {customers.map((c, i) => (
                <tr key={(c.phone || c.name) + i} className="transition-colors duration-brand hover:bg-brand-bg/25">
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
                  <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right font-black text-ink">
                    ৳{(c.total_spent || 0).toLocaleString('en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
