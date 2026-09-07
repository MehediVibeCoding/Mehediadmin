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
    /* ══ খাঁটি সাদা সারফেস ক্যানভাস ও হাই-কনট্রাস্ট বর্ডার (নীল ব্যাকগ্রাউন্ডে টেক্সট মিশে যাওয়ার সমাধান) ══ */
    <div className="overflow-hidden rounded-[24px] border border-border-base/80 bg-white shadow-sh2">
      <div className="sleek-scrollbar overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          {/* হেডার রো */}
          <thead>
            <tr className="border-b border-border-base bg-[#F8FAFC] font-body text-[11px] font-extrabold uppercase tracking-wider text-muted">
              <th className="p-3.5 pl-4">
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
                  className={`p-3.5 ${i === TABLE_HEADERS.length - 1 ? 'pr-4 text-right' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          {/* জেব্রা-স্ট্রাইপ টেবিল বডি (প্রতিটি রো পরিষ্কার আলাদা ও ১০০% পঠনযোগ্য) */}
          <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
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
                    className={`transition-colors duration-brand odd:bg-white even:bg-[#F8FAFC]/85 ${
                      isSelected ? '!bg-brand-light/10' : 'hover:!bg-brand-bg/25'
                    }`}
                  >
                    {/* চেকবক্স */}
                    <td className="p-3 pl-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(o.id)}
                        className="h-4 w-4 rounded border-border-base text-brand-light focus:ring-brand-light cursor-pointer"
                      />
                    </td>

                    {/* অর্ডার নম্বর — প্রিমিয়াম স্কাই-ব্লু হাইলাইট চিপ ব্যাজ */}
                    <td className="whitespace-nowrap p-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onView(o.id)}
                          className="inline-flex items-center rounded-lg border border-brand-light/30 bg-brand-light/10 px-2.5 py-1 font-body text-[12.5px] font-black tracking-tight text-brand-light transition-all hover:bg-brand-light hover:text-white"
                          title="অর্ডার বিস্তারিত দেখুন"
                        >
                          {o.order_num}
                        </button>

                        {hasCoupon && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full border border-orange-200/80 bg-orange-50 px-2 py-0.5 font-body text-[10px] font-extrabold text-orange-700 shadow-xs"
                            title={`কুপন ছাড়: -৳${(o.discount_amount || 0).toLocaleString('en-US')}`}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                            </svg>
                            <span>{o.coupon_code || 'কুপন'} (-৳{(o.discount_amount || 0).toLocaleString('en-US')})</span>
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

                    {/* গ্রাহকের নাম (শার্প ডার্ক টেক্সট) */}
                    <td className="p-3 font-bold text-ink max-w-[170px] truncate">
                      {o.customer_name || '—'}
                    </td>

                    {/* ফোন নম্বর (কপি বাটন সহ) */}
                    <td className="whitespace-nowrap p-3">
                      <button
                        type="button"
                        onClick={() => copyTxt(o.customer_phone || '')}
                        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-semibold text-ink hover:bg-brand-bg/30 hover:text-brand-light"
                        title="কপি করতে ক্লিক করুন"
                      >
                        <span>{o.customer_phone || '—'}</span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted/60">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    </td>

                    {/* মোট বিল */}
                    <td className="whitespace-nowrap p-3 font-black text-ink">
                      ৳{(o.total || 0).toLocaleString('en-US')}
                    </td>

                    {/* পরিশোধিত অ্যাডভান্স ও টায়ার ২ ট্যাগ */}
                    <td className="whitespace-nowrap p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-success">
                          ৳{advancePaid.toLocaleString('en-US')}
                        </span>
                        {tier2 && (
                          <span className="rounded-full border border-purple-200/80 bg-purple-50 px-2 py-0.5 font-body text-[9.5px] font-extrabold text-purple-700 shadow-xs">
                            5%
                          </span>
                        )}
                      </div>
                    </td>

                    {/* বাকি টাকা (ক্যাশ অন ডেলিভারি) */}
                    <td className="whitespace-nowrap p-3 font-black text-danger">
                      ৳{due.toLocaleString('en-US')}
                    </td>

                    {/* স্ট্যাটাস পিল */}
                    <td className="whitespace-nowrap p-3">
                      <StatusPill status={o.status} />
                    </td>

                    {/* রিডিজাইন করা "বিস্তারিত" আইস-স্কাই পিল বাটন */}
                    <td className="whitespace-nowrap p-3 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => onView(o.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-brand-light/35 bg-brand-light/10 px-3.5 py-1.5 font-body text-[11.5px] font-extrabold text-brand-light shadow-xs transition-all duration-brand hover:border-brand-light hover:bg-brand-light hover:text-white active:scale-95"
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
