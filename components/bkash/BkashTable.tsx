'use client';

import type { BkashPayment } from '@/app/actions/bkash';
import { useToast } from '@/components/admin/Toast';

interface Props {
  payments: BkashPayment[];
  openingOrderId: string | null;
  onOpenOrder: (orderId: string) => void;
  onViewSms: (payment: BkashPayment) => void;
}

const TABLE_HEADERS: { label: string; align?: 'right' }[] = [
  { label: 'তারিখ ও সময়' },
  { label: 'প্রেরক নম্বর' },
  { label: 'টাকা' },
  { label: 'TrxID' },
  { label: 'স্ট্যাটাস' },
  { label: 'লিংকড অর্ডার' },
  { label: 'মেসেজ', align: 'right' },
];

const money = (n: number) =>
  '৳' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ১১ ডিজিট হলে 01812-344455 ধরনের সাজানো রূপ
const fmtPhone = (n: string) => (/^\d{11}$/.test(n) ? `${n.slice(0, 5)}-${n.slice(5)}` : n || '—');

// বাংলাদেশ সময়ে (UTC+6) তারিখ ও সময় আলাদাভাবে
export function formatBkashDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '—', time: '' };
  return {
    date: d.toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Dhaka' }),
    time: d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Dhaka' }),
  };
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/70">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function UsedPill({ used }: { used: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-body text-[11px] font-extrabold leading-none ${
        used ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
      }`}
      title={used ? 'এই পেমেন্ট একটি অর্ডারে ব্যবহৃত হয়েছে' : 'এই পেমেন্ট এখনো কোনো অর্ডারে লাগেনি'}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${used ? 'bg-success' : 'bg-warn'}`} />
      {used ? 'ব্যবহৃত' : 'অব্যবহৃত'}
    </span>
  );
}

function OrderLink({
  payment,
  opening,
  onOpen,
}: {
  payment: BkashPayment;
  opening: boolean;
  onOpen: (orderId: string) => void;
}) {
  if (!payment.used_order_id) {
    return <span className="font-body text-[12px] font-semibold text-muted/70">—</span>;
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(payment.used_order_id as string)}
      disabled={opening}
      className="inline-flex items-center rounded-lg border border-brand-light/30 bg-brand-light/10 px-2.5 py-1.5 font-body text-[12.5px] font-black leading-none tracking-tight text-brand-light transition-all duration-brand hover:bg-brand-light hover:text-white active:scale-95 disabled:opacity-60"
      title="অর্ডারের পূর্ণ মেমো দেখুন"
    >
      {opening ? 'লোড হচ্ছে…' : payment.order_num || 'অর্ডার দেখুন'}
    </button>
  );
}

export default function BkashTable({ payments, openingOrderId, onOpenOrder, onViewSms }: Props) {
  const { showToast } = useToast();

  async function copyTxt(t: string) {
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      showToast(`কপি করা হয়েছে: ${t}`);
    } catch {
      showToast('ক্লিপবোর্ডে কপি হয়েছে');
    }
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 shadow-sh1">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/[0.12] text-brand-light">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </svg>
        </span>
        <span className="font-body text-[14px] font-extrabold text-ink">কোনো বিকাশ পেমেন্ট পাওয়া যায়নি</span>
        <span className="font-body text-[12px] font-medium text-muted">ফিল্টার বদলে বা রিসেট করে আবার দেখুন</span>
      </div>
    );
  }

  return (
    <>
      {/* ═══════════ মোবাইল + ট্যাবলেট: পেমেন্ট কার্ড (<1024px) ═══════════ */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
        {payments.map((p) => {
          const dt = formatBkashDateTime(p.created_at);
          return (
            <article
              key={p.id}
              className={`flex flex-col rounded-[22px] border bg-white p-3.5 shadow-sh1 ${
                p.is_used ? 'border-white/90' : 'border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-body text-[22px] font-black leading-none tracking-tight text-success">{money(p.amount)}</div>
                  <div className="mt-1.5 font-body text-[11.5px] font-semibold text-muted">
                    {dt.date} · {dt.time}
                  </div>
                </div>
                <UsedPill used={p.is_used} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => copyTxt(p.sender_number)}
                  className="min-w-0 rounded-xl border border-border-base/70 px-2.5 py-2 text-left transition-colors active:bg-brand-light/10"
                  title="কপি করতে ট্যাপ করুন"
                >
                  <div className="font-body text-[10px] font-bold uppercase tracking-wide text-muted">প্রেরক নম্বর</div>
                  <div className="mt-0.5 flex items-center gap-1.5 truncate font-body text-[13px] font-extrabold text-ink">
                    {fmtPhone(p.sender_number)}
                    <CopyIcon />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => copyTxt(p.trx_id)}
                  className="min-w-0 rounded-xl border border-border-base/70 px-2.5 py-2 text-left transition-colors active:bg-brand-light/10"
                  title="কপি করতে ট্যাপ করুন"
                >
                  <div className="font-body text-[10px] font-bold uppercase tracking-wide text-muted">TrxID</div>
                  <div className="mt-0.5 flex items-center gap-1.5 truncate font-body text-[13px] font-extrabold text-ink">
                    {p.trx_id || '—'}
                    <CopyIcon />
                  </div>
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <OrderLink payment={p} opening={openingOrderId === p.used_order_id} onOpen={onOpenOrder} />
                <button
                  type="button"
                  onClick={() => onViewSms(p)}
                  className="flex h-10 items-center gap-1.5 rounded-full border border-brand-light/35 bg-brand-light/10 px-3.5 font-body text-[12px] font-extrabold text-brand-light transition-all duration-brand active:scale-95"
                >
                  <EyeIcon />
                  আসল মেসেজ
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* ═══════════ ডেস্কটপ: সাজানো টেবিল (≥1024px) ═══════════ */}
      <div className="hidden lg:block">
        <div className="sleek-scrollbar overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-border-base/60 bg-brand-bg/30 font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
                {TABLE_HEADERS.map((h) => (
                  <th key={h.label} className={`px-3 py-3.5 first:pl-5 ${h.align === 'right' ? 'pr-5 text-right' : ''}`}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
              {payments.map((p) => {
                const dt = formatBkashDateTime(p.created_at);
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors duration-brand ${p.is_used ? 'hover:bg-brand-bg/25' : 'bg-amber-50/40 hover:bg-amber-50/70'}`}
                  >
                    <td className="whitespace-nowrap py-3 pl-5 pr-3">
                      <div className="font-extrabold text-ink">{dt.date}</div>
                      <div className="mt-0.5 text-[12px] font-semibold text-muted">{dt.time}</div>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3">
                      <button
                        type="button"
                        onClick={() => copyTxt(p.sender_number)}
                        className="inline-flex items-center gap-1.5 font-extrabold text-ink transition-colors hover:text-brand-light"
                        title="কপি করতে ক্লিক করুন"
                      >
                        {fmtPhone(p.sender_number)}
                        <CopyIcon />
                      </button>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 font-black text-success">{money(p.amount)}</td>

                    <td className="whitespace-nowrap px-3 py-3">
                      <button
                        type="button"
                        onClick={() => copyTxt(p.trx_id)}
                        className="inline-flex items-center gap-1.5 font-extrabold tracking-wide text-ink transition-colors hover:text-brand-light"
                        title="কপি করতে ক্লিক করুন"
                      >
                        {p.trx_id || '—'}
                        <CopyIcon />
                      </button>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3">
                      <UsedPill used={p.is_used} />
                    </td>

                    <td className="whitespace-nowrap px-3 py-3">
                      <OrderLink payment={p} opening={openingOrderId === p.used_order_id} onOpen={onOpenOrder} />
                    </td>

                    <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
                      <button
                        type="button"
                        onClick={() => onViewSms(p)}
                        aria-label="আসল মেসেজ দেখুন"
                        title="আসল মেসেজ দেখুন"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-light/35 bg-brand-light/10 text-brand-light transition-all duration-brand hover:border-brand-light hover:bg-brand-light hover:text-white active:scale-90"
                      >
                        <EyeIcon />
                      </button>
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
