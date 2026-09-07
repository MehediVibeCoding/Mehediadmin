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

const TABLE_HEADERS = [
  'অর্ডার নং',
  'তারিখ',
  'গ্রাহক',
  'ফোন নম্বর',
  'মোট বিল',
  'অ্যাডভান্স',
  'বাকি (COD)',
  'স্ট্যাটাস',
  'অ্যাকশন',
];

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
    <div className="sleek-scrollbar overflow-x-auto">
      {/* আসল প্রমিত কমপ্যাক্ট ডাটা টেবিল (বক্স বাদ দিয়ে দ্রুত স্ক্যানিংয়ের শতভাগ কার্যকর রূপ) */}
      <table className="w-full min-w-[760px] text-left">
        <thead>
          <tr className="border-b border-border-base/70 bg-brand-bg/30 font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">
            <th className="rounded-l-xl p-3">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-border-base text-brand-light focus:ring-brand-light cursor-pointer"
                title="সবগুলো সিলেক্ট করুন"
              />
            </th>
            {TABLE_HEADERS.map((h, i) => (
              <th
                key={h}
                className={`p-3 ${i === TABLE_HEADERS.length - 1 ? 'rounded-r-xl text-right' : ''}`}
              >
                {h}
              </th>
            ))}
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
                  {/* চেকবক্স */}
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(o.id)}
                      className="h-4 w-4 rounded border-border-base text-brand-light focus:ring-brand-light cursor-pointer"
                    />
                  </td>

                  {/* অর্ডার নং — গাঢ় নীল সম্পূর্ণ বর্জন, ১০০% সিগনেচার স্কাই-ব্লু (#44A7FC) */}
                  <td className="whitespace-nowrap p-3 font-black text-brand-light">
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
                          className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[9.5px] font-extrabold text-orange-700 shadow-xs"
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

                  {/* তারিখ */}
                  <td className="whitespace-nowrap p-3 font-medium text-muted">
                    {new Date(o.created_at || Date.now()).toLocaleDateString('bn-BD', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>

                  {/* গ্রাহক */}
                  <td className="p-3 font-bold text-ink max-w-[170px] truncate">
                    {o.customer_name || '—'}
                  </td>

                  {/* ফোন নম্বর (কপি টু ক্লিপবোর্ড) */}
                  <td className="whitespace-nowrap p-3">
                    <button
                      type="button"
                      onClick={() => copyTxt(o.customer_phone || '')}
                      className="font-semibold text-ink/80 hover:text-brand-light hover:underline"
                      title="কপি করতে ক্লিক করুন"
                    >
                      {o.customer_phone || '—'}
                    </button>
                  </td>

                  {/* মোট মূল্য */}
                  <td className="whitespace-nowrap p-3 font-black text-ink">
                    ৳{(o.total || 0).toLocaleString('en-US')}
                  </td>

                  {/* পরিশোধিত অ্যাডভান্স */}
                  <td className="whitespace-nowrap p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-success">
                        ৳{advancePaid.toLocaleString('en-US')}
                      </span>
                      {tier2 && (
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-extrabold text-purple-700">
                          5%
                        </span>
                      )}
                    </div>
                  </td>

                  {/* বাকি COD */}
                  <td className="whitespace-nowrap p-3 font-black text-danger">
                    ৳{due.toLocaleString('en-US')}
                  </td>

                  {/* স্ট্যাটাস পিল */}
                  <td className="whitespace-nowrap p-3">
                    <StatusPill status={o.status} />
                  </td>

                  {/* অ্যাকশন বাটন */}
                  <td className="whitespace-nowrap p-3 text-right">
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
  );
}
