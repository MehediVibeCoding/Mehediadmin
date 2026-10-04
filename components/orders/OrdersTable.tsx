'use client';

import type { Order } from '@/types';
import StatusPill from '@/components/admin/StatusPill';
import Checkbox from '@/components/common/Checkbox';
import { useToast } from '@/components/admin/Toast';
import { getOrderAdvance, getOrderDueCOD, isAdvanceTier2, needsDiamondAction } from '@/lib/orders';
import { formatDateBn } from '@/lib/dateFormat';

interface Props {
  orders: Order[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onView: (id: string) => void;
}

const TABLE_HEADERS: { label: string; align?: 'right' }[] = [
  { label: 'অর্ডার নং' },
  { label: 'গ্রাহক' },
  { label: 'তারিখ' },
  { label: 'মোট বিল' },
  { label: 'অ্যাডভান্স' },
  { label: 'বাকি (COD)' },
  { label: 'স্ট্যাটাস' },
  { label: 'অ্যাকশন', align: 'right' },
];

const money = (n: number) => '৳' + (n || 0).toLocaleString('en-US');
// তারিখ না থাকলে আজকের তারিখ (আগের আচরণ অপরিবর্তিত)
const fmtDate = (d?: string) => formatDateBn(d || new Date().toISOString());

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-light/15 font-body font-black text-brand-light"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted/70">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function DiamondBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-brand-light/40 bg-brand-light/10 px-2 py-1 font-body text-[10.5px] font-extrabold leading-none text-ink"
      title="ডায়মন্ড মেম্বার: ১ দিনে কুরিয়ারে হ্যান্ডওভার দিন + সারপ্রাইজ গ্যাজেট গিফট ঢোকান"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
        <path d="M6 3h12l4 6-10 12L2 9z" />
        <path d="M2 9h20M12 21 8 9l4-6 4 6z" />
      </svg>
      ডায়মন্ড: আগে পাঠান + গিফট
    </span>
  );
}

function CouponBadge({ code, amount }: { code: string | null; amount: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-orange-200/80 bg-orange-50 px-2 py-1 font-body text-[10.5px] font-extrabold leading-none text-orange-700"
      title={`কুপন ছাড়: -${money(amount)}`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      </svg>
      {code || 'কুপন'} (-{money(amount)})
    </span>
  );
}

export default function OrdersTable({ orders, selectedIds, onToggleSelect, onToggleSelectAll, onView }: Props) {
  const { showToast } = useToast();
  const allChecked = orders.length > 0 && orders.every((o) => selectedIds.has(o.id));

  async function copyTxt(t: string) {
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      showToast(`কপি করা হয়েছে: ${t}`);
    } catch {
      showToast('ক্লিপবোর্ডে কপি হয়েছে');
    }
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 shadow-sh1">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/[0.12] text-brand-light">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          </svg>
        </span>
        <span className="font-body text-[14px] font-extrabold text-ink">কোনো অর্ডার পাওয়া যায়নি</span>
        <span className="font-body text-[12px] font-medium text-muted">ফিল্টার বদলে বা রিসেট করে আবার দেখুন</span>
      </div>
    );
  }

  return (
    <>
      {/* ═══════════ মোবাইল + ট্যাবলেট: অর্ডার কার্ড (<1024px) ═══════════ */}
      <div className="lg:hidden">
        {/* এই পেজের সব সিলেক্ট */}
        <div className="mb-2.5 flex items-center justify-between rounded-2xl border border-white/90 bg-white px-2 py-0.5 shadow-sh1">
          <label className="flex cursor-pointer items-center gap-1 font-body text-[12.5px] font-extrabold text-ink">
            <Checkbox checked={allChecked} onChange={onToggleSelectAll} label="এই পেজের সবগুলো সিলেক্ট করুন" />
            সব সিলেক্ট করুন
          </label>
          <span className="pr-2 font-body text-[11.5px] font-semibold text-muted">এই পেজে {orders.length}টি</span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {orders.map((o) => {
            const advancePaid = getOrderAdvance(o);
            const due = getOrderDueCOD(o);
            const tier2 = isAdvanceTier2(o);
            const hasCoupon = !!o.coupon_code || (o.discount_amount || 0) > 0;
            const diamondAction = needsDiamondAction(o);
            const isSelected = selectedIds.has(o.id);

            return (
              <article
                key={o.id}
                className={`flex flex-col rounded-[22px] border bg-white p-3.5 shadow-sh1 transition-all duration-brand ${
                  isSelected ? 'border-brand-light ring-2 ring-brand-light/25' : 'border-white/90'
                }`}
              >
                {/* হেডার: চেকবক্স · অর্ডার নং · স্ট্যাটাস */}
                <div className="flex items-center gap-1.5">
                  <Checkbox checked={isSelected} onChange={() => onToggleSelect(o.id)} label={`${o.order_num} সিলেক্ট করুন`} />
                  <button
                    type="button"
                    onClick={() => onView(o.id)}
                    className="inline-flex items-center rounded-lg border border-brand-light/30 bg-brand-light/10 px-2.5 py-1.5 font-body text-[13px] font-black leading-none tracking-tight text-brand-light transition-all duration-brand active:scale-95"
                    title="অর্ডার বিস্তারিত দেখুন"
                  >
                    {o.order_num}
                  </button>
                  <div className="ml-auto">
                    <StatusPill status={o.status} />
                  </div>
                </div>

                {/* তারিখ + ব্যাজ */}
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 pl-0.5">
                  <span className="inline-flex items-center gap-1.5 font-body text-[11.5px] font-semibold text-muted">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
                      <path d="M3 9.5h18" />
                      <path d="M8 2.5v4M16 2.5v4" />
                    </svg>
                    {fmtDate(o.created_at)}
                  </span>
                  {diamondAction && <DiamondBadge />}
                  {hasCoupon && <CouponBadge code={o.coupon_code} amount={o.discount_amount || 0} />}
                </div>

                {/* গ্রাহক */}
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-surface-muted/70 p-2.5">
                  <Avatar name={o.customer_name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-body text-[14px] font-extrabold leading-tight text-ink">{o.customer_name || '—'}</div>
                    <button
                      type="button"
                      onClick={() => copyTxt(o.customer_phone || '')}
                      className="mt-1 inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-muted transition-colors active:text-brand-light"
                      title="কপি করতে ট্যাপ করুন"
                    >
                      {o.customer_phone || '—'}
                      <CopyIcon />
                    </button>
                  </div>
                </div>

                {/* টাকার হিসাব — তিনটা সমান টাইল */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="min-w-0 rounded-xl border border-border-base/70 px-2.5 py-2">
                    <div className="font-body text-[10px] font-bold uppercase tracking-wide text-muted">মোট বিল</div>
                    <div className="mt-0.5 truncate font-body text-[14px] font-black text-ink">{money(o.total)}</div>
                  </div>
                  <div className="min-w-0 rounded-xl border border-border-base/70 px-2.5 py-2">
                    <div className="flex items-center gap-1 font-body text-[10px] font-bold uppercase tracking-wide text-muted">
                      অ্যাডভান্স
                      {tier2 && (
                        <span className="rounded-full bg-purple-50 px-1.5 text-[9px] font-black leading-[14px] text-purple-700">5%</span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate font-body text-[14px] font-black text-success">{money(advancePaid)}</div>
                  </div>
                  <div className="min-w-0 rounded-xl border border-border-base/70 px-2.5 py-2">
                    <div className="font-body text-[10px] font-bold uppercase tracking-wide text-muted">বাকি (COD)</div>
                    <div className="mt-0.5 truncate font-body text-[14px] font-black text-danger">{money(due)}</div>
                  </div>
                </div>

                {/* বিস্তারিত বাটন */}
                <button
                  type="button"
                  onClick={() => onView(o.id)}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-brand-light font-body text-[13px] font-extrabold text-white shadow-[0_4px_14px_rgba(68,167,252,0.36)] transition-all duration-brand active:scale-[0.98]"
                >
                  বিস্তারিত দেখুন
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* ═══════════ ডেস্কটপ: সাজানো টেবিল (≥1024px) ═══════════ */}
      <div className="hidden lg:block">
        <div className="sleek-scrollbar overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-border-base/60 bg-brand-bg/30 font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
                <th className="w-[52px] py-2.5 pl-3">
                  <Checkbox checked={allChecked} onChange={onToggleSelectAll} label="সবগুলো সিলেক্ট করুন" />
                </th>
                {TABLE_HEADERS.map((h) => (
                  <th key={h.label} className={`px-3 py-3.5 ${h.align === 'right' ? 'pr-5 text-right' : ''}`}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
              {orders.map((o) => {
                const advancePaid = getOrderAdvance(o);
                const due = getOrderDueCOD(o);
                const tier2 = isAdvanceTier2(o);
                const hasCoupon = !!o.coupon_code || (o.discount_amount || 0) > 0;
                const diamondAction = needsDiamondAction(o);
                const isSelected = selectedIds.has(o.id);

                return (
                  <tr
                    key={o.id}
                    className={`transition-colors duration-brand ${isSelected ? 'bg-brand-light/10' : 'hover:bg-brand-bg/25'}`}
                  >
                    <td className="py-2.5 pl-3">
                      <Checkbox checked={isSelected} onChange={() => onToggleSelect(o.id)} label={`${o.order_num} সিলেক্ট করুন`} />
                    </td>

                    {/* অর্ডার নং + ব্যাজ */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <button
                          type="button"
                          onClick={() => onView(o.id)}
                          className="inline-flex items-center rounded-lg border border-brand-light/30 bg-brand-light/10 px-2.5 py-1.5 text-[12.5px] font-black leading-none tracking-tight text-brand-light transition-all duration-brand hover:bg-brand-light hover:text-white"
                          title="অর্ডার বিস্তারিত দেখুন"
                        >
                          {o.order_num}
                        </button>
                        {diamondAction && <DiamondBadge />}
                        {hasCoupon && <CouponBadge code={o.coupon_code} amount={o.discount_amount || 0} />}
                      </div>
                    </td>

                    {/* গ্রাহক: অ্যাভাটার + নাম + ফোন (কপি) */}
                    <td className="px-3 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar name={o.customer_name} size={36} />
                        <div className="min-w-0">
                          <div className="max-w-[170px] truncate font-extrabold text-ink">{o.customer_name || '—'}</div>
                          <button
                            type="button"
                            onClick={() => copyTxt(o.customer_phone || '')}
                            className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted transition-colors hover:text-brand-light"
                            title="কপি করতে ক্লিক করুন"
                          >
                            {o.customer_phone || '—'}
                            <CopyIcon />
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-muted">{fmtDate(o.created_at)}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-black text-ink">{money(o.total)}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-success">{money(advancePaid)}</span>
                        {tier2 && (
                          <span className="rounded-full border border-purple-200/80 bg-purple-50 px-2 py-0.5 text-[9.5px] font-extrabold text-purple-700">
                            5%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-black text-danger">{money(due)}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right">
                      <button
                        type="button"
                        onClick={() => onView(o.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-brand-light/35 bg-brand-light/10 px-3.5 py-1.5 text-[11.5px] font-extrabold text-brand-light transition-all duration-brand hover:border-brand-light hover:bg-brand-light hover:text-white active:scale-95"
                      >
                        বিস্তারিত
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
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
