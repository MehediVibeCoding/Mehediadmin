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

export default function OrdersTable({ orders, selectedIds, onToggleSelect, onToggleSelectAll, onView }: Props) {
  const { showToast } = useToast();
  const allChecked = orders.length > 0 && orders.every((o) => selectedIds.has(o.id));

  async function copyTxt(t: string) {
    try {
      await navigator.clipboard.writeText(t);
      showToast('✅ কপি: ' + t);
    } catch {
      showToast('✅ কপি হয়েছে');
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr>
            <th className="rounded-tl-[10px] border-b border-[rgba(0,88,199,.14)] bg-brand-bg p-2.5 text-[10px] font-bold uppercase tracking-[.6px] text-brand-dark">
              <input type="checkbox" checked={allChecked} onChange={(e) => onToggleSelectAll(e.target.checked)} className="cursor-pointer" />
            </th>
            {['অর্ডার নং', 'তারিখ', 'গ্রাহক', 'ফোন', 'মোট', 'অ্যাডভান্স', 'বাকি (COD)', 'স্ট্যাটাস', 'অ্যাকশন'].map((h, i) => (
              <th
                key={h}
                className={`border-b border-[rgba(0,88,199,.14)] bg-brand-bg p-2.5 text-[10px] font-bold uppercase tracking-[.6px] text-brand-dark ${
                  i === 8 ? 'rounded-tr-[10px]' : ''
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={10} className="p-6 text-center text-muted">
                কোনো অর্ডার নেই
              </td>
            </tr>
          ) : (
            orders.map((o, i) => {
              const advancePaid = getOrderAdvance(o);
              const due = getOrderDueCOD(o);
              const tier2 = isAdvanceTier2(o);
              const hasCoupon = !!o.coupon_code || (o.discount_amount || 0) > 0;
              return (
                <tr key={o.id} className={`transition-brand hover:bg-brand-bg ${i % 2 === 1 ? 'bg-brand-bg/[.18]' : ''}`}>
                  <td className="border-b border-border-base p-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(o.id)}
                      onChange={() => onToggleSelect(o.id)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="border-b border-border-base p-2.5 text-[12.5px] font-bold text-brand-dark">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{o.order_num}</span>
                      {hasCoupon && (
                        <span
                          className="whitespace-nowrap rounded-full px-1.5 py-[1px] text-[9.5px] font-bold"
                          style={{ background: '#FFF7ED', color: '#C2410C' }}
                          title={`কুপন ছাড়: -৳${(o.discount_amount || 0).toLocaleString()}`}
                        >
                          🏷️ {o.coupon_code || 'COUPON'} (-৳{(o.discount_amount || 0).toLocaleString()})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] text-ink">
                    {new Date(o.created_at || Date.now()).toLocaleDateString('bn-BD')}
                  </td>
                  <td className="border-b border-border-base p-2.5 text-[12.5px] text-ink">{o.customer_name || '-'}</td>
                  <td className="border-b border-border-base p-2.5 text-[12.5px]">
                    <button
                      type="button"
                      onClick={() => copyTxt(o.customer_phone || '')}
                      className="cursor-pointer text-ink underline decoration-dotted underline-offset-2"
                    >
                      {o.customer_phone || '-'}
                    </button>
                  </td>
                  <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] font-bold text-ink">
                    ৳{(o.total || 0).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-success">৳{advancePaid.toLocaleString()}</span>
                      {tier2 && (
                        <span
                          className="whitespace-nowrap rounded-full px-1.5 py-[1px] text-[9.5px] font-bold"
                          style={{ background: '#EDE9FE', color: '#5B21B6' }}
                          title="ডায়নামিক 5% অ্যাডভান্স + 1.5% bKash ফি"
                        >
                          Tier 2 (5%)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] font-bold text-danger">
                    ৳{due.toLocaleString()}
                  </td>
                  <td className="border-b border-border-base p-2.5">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="border-b border-border-base p-2.5">
                    <button
                      type="button"
                      onClick={() => onView(o.id)}
                      className="rounded-[8px] border border-border-base px-2.5 py-1 text-xs font-semibold text-ink transition-brand hover:bg-surface-muted"
                    >
                      বিস্তারিত
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
