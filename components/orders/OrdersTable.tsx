'use client';

import type { Order } from '@/types';
import StatusPill from '@/components/admin/StatusPill';
import { useToast } from '@/components/admin/Toast';
import { getOrderAdvance, getOrderDueCOD, isAdvanceTier2 } from '@/lib/orders';

interface Props {
  orders: Order[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onView: (id: string) => void;
}

export default function OrdersTable({
  orders,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onView,
}: Props) {
  const { showToast } = useToast();
  const allChecked = orders.length > 0 && orders.every((o) => selectedIds.has(o.id));

  async function copyTxt(t: string) {
    try {
      await navigator.clipboard.writeText(t);
      showToast(`কপি করা হয়েছে: ${t}`);
    } catch {
      showToast('ক্লিপবোর্ডে কপি হয়েছে');
    }
  }

  return (
    <div>
      {/* ══ ১. মোবাইল ট্যাকটাইল কার্ড ভিউ (<৭৬৮px) — ডানে-বামে টানাটানি সম্পূর্ণ বন্ধ ══ */}
      <div className="block md:hidden">
        {orders.length > 0 && (
          <div className="mb-3 flex items-center justify-between rounded-[16px] border border-white/90 bg-white/75 p-3 shadow-xs backdrop-blur-md">
            <label className="flex items-center gap-2.5 font-body text-[12.5px] font-bold text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-border-base text-brand-light focus:ring-brand-light cursor-pointer"
              />
              <span>সবগুলো সিলেক্ট করুন ({orders.length}টি)</span>
            </label>
            {selectedIds.size > 0 && (
              <span className="rounded-full bg-brand-light/15 px-2.5 py-0.5 font-body text-[11px] font-extrabold text-brand-light">
                {selectedIds.size}টি সিলেক্টেড
              </span>
            )}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-white/90 bg-white/80 py-12 text-center shadow-xs">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span className="font-body text-[13px] font-semibold text-muted">কোনো অর্ডার পাওয়া যায়নি</span>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const advancePaid = getOrderAdvance(o);
              const due = getOrderDueCOD(o);
              const tier2 = isAdvanceTier2(o);
              const hasCoupon = !!o.coupon_code || (o.discount_amount || 0) > 0;
              const isSelected = selectedIds.has(o.id);

              return (
                <div
                  key={o.id}
                  className={`group relative rounded-[20px] border p-4 shadow-xs backdrop-blur-md transition-all duration-brand ${
                    isSelected
                      ? 'border-brand-light bg-brand-light/[0.04] shadow-sh1'
                      : 'border-white/90 bg-white/85 hover:border-brand-light/40 hover:bg-white'
                  }`}
                >
                  {/* কার্ড টপ রো: চেকবক্স, অর্ডার নং, ডেট ও স্ট্যাটাস পিল */}
                  <div className="flex items-center justify-between gap-2 border-b border-border-base/50 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(o.id)}
                        className="h-4 w-4 rounded border-border-base text-brand-light focus:ring-brand-light cursor-pointer"
                      />
                      <div>
                        {/* গাঢ় নীল চিরতরে বর্জন — ১০০% খাঁটি সিগনেচার স্কাই-ব্লু (#44A7FC) */}
                        <button
                          type="button"
                          onClick={() => onView(o.id)}
                          className="font-body text-[14px] font-black tracking-tight text-brand-light hover:underline"
                        >
                          {o.order_num}
                        </button>
                        <span className="ml-2 font-body text-[10.5px] font-medium text-muted">
                          {new Date(o.created_at || Date.now()).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <StatusPill status={o.status} />
                  </div>

                  {/* কার্ড মিডল রো: গ্রাহকের নাম ও ফোন নম্বর */}
                  <div className="py-2.5">
                    <div className="font-body text-[13.5px] font-bold text-ink">
                      {o.customer_name || '—'}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyTxt(o.customer_phone || '')}
                        className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 font-body text-[11.5px] font-semibold text-ink/85 hover:bg-border-base"
                        title="ফোন নম্বর কপি করুন"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
                        </svg>
                        <span>{o.customer_phone || '—'}</span>
                      </button>

                      {hasCoupon && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 font-body text-[10px] font-extrabold text-orange-700">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                          </svg>
                          <span>-৳{(o.discount_amount || 0).toLocaleString('en-US')}</span>
                        </span>
                      )}

                      {tier2 && (
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 font-body text-[10px] font-extrabold text-purple-700">
                          Tier 2 (5%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* কার্ড বটম রো: টাকা, অ্যাডভান্স, ডিউ ও বিস্তারিত বাটন */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-base/50 pt-2.5">
                    <div className="flex items-baseline gap-2.5">
                      <div>
                        <span className="block font-body text-[9px] font-extrabold uppercase tracking-wider text-muted">মোট</span>
                        <span className="font-body text-[14px] font-black text-ink">
                          ৳{(o.total || 0).toLocaleString('en-US')}
                        </span>
                      </div>
                      <div className="h-4 w-px bg-border-base/70" />
                      <div>
                        <span className="block font-body text-[9px] font-extrabold uppercase tracking-wider text-muted">অ্যাডভান্স</span>
                        <span className="font-body text-[13px] font-black text-success">
                          ৳{advancePaid.toLocaleString('en-US')}
                        </span>
                      </div>
                      <div className="h-4 w-px bg-border-base/70" />
                      <div>
                        <span className="block font-body text-[9px] font-extrabold uppercase tracking-wider text-muted">বাকি COD</span>
                        <span className="font-body text-[13px] font-black text-danger">
                          ৳{due.toLocaleString('en-US')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onView(o.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-border-base/80 bg-white px-3.5 py-1.5 font-body text-[11.5px] font-bold text-ink shadow-xs transition-all duration-brand hover:border-brand-light hover:bg-brand-light hover:text-white active:scale-95"
                    >
                      <span>বিস্তারিত</span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ ২. ডেস্কটপ মার্জিত ফ্রস্টেড গ্লাস ডাটা টেবিল (≥৭৬৮px) ══ */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-base/70 bg-brand-bg/25 font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">
              <th className="rounded-l-[14px] p-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-border-base text-brand-light focus:ring-brand-light cursor-pointer"
                />
              </th>
              <th className="p-3">অর্ডার নং</th>
              <th className="p-3">তারিখ</th>
              <th className="p-3">গ্রাহকের নাম</th>
              <th className="p-3">ফোন নম্বর</th>
              <th className="p-3">মোট বিল</th>
              <th className="p-3">অ্যাডভান্স</th>
              <th className="p-3">বাকি (COD)</th>
              <th className="p-3">স্ট্যাটাস</th>
              <th className="rounded-r-[14px] p-3 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <span className="font-semibold text-muted">কোনো অর্ডার পাওয়া যায়নি</span>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((o) => {
                const advancePaid = getOrderAdvance(o);
                const due = getOrderDueCOD(o);
                const tier2 = isAdvanceTier2(o);
                const hasCoupon = !!o.coupon_code || (o.discount_amount || 0) > 0;
                const isSelected = selectedIds.has(o.id);

                return (
                  <tr
                    key={o.id}
                    className={`transition-colors duration-brand ${
                      isSelected ? 'bg-brand-light/[0.06]' : 'hover:bg-brand-bg/30'
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(o.id)}
                        className="h-4 w-4 rounded border-border-base text-brand-light focus:ring-brand-light cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-black text-brand-light">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onView(o.id)}
                          className="hover:underline"
                        >
                          {o.order_num}
                        </button>
                        {hasCoupon && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold text-orange-700 shadow-xs"
                            title={`কুপন ছাড়: -৳${(o.discount_amount || 0).toLocaleString('en-US')}`}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                            </svg>
                            <span>-৳{(o.discount_amount || 0).toLocaleString('en-US')}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-3 text-muted font-medium">
                      {new Date(o.created_at || Date.now()).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-3 font-bold text-ink">
                      {o.customer_name || '—'}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => copyTxt(o.customer_phone || '')}
                        className="font-medium text-ink/80 hover:text-brand-light hover:underline"
                        title="কপি করতে ক্লিক করুন"
                      >
                        {o.customer_phone || '—'}
                      </button>
                    </td>
                    <td className="whitespace-nowrap p-3 font-black text-ink">
                      ৳{(o.total || 0).toLocaleString('en-US')}
                    </td>
                    <td className="whitespace-nowrap p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-success">৳{advancePaid.toLocaleString('en-US')}</span>
                        {tier2 && (
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[9.5px] font-extrabold text-purple-700">
                            5%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-3 font-black text-danger">
                      ৳{due.toLocaleString('en-US')}
                    </td>
                    <td className="p-3">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => onView(o.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-border-base/80 bg-white px-3 py-1 font-body text-[11.5px] font-bold text-ink shadow-xs transition-all duration-brand hover:border-brand-light hover:bg-brand-light hover:text-white active:scale-95"
                      >
                        <span>বিস্তারিত</span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
