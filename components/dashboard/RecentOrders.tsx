import Link from 'next/link';
import type { Order } from '@/types';
import StatusPill from '@/components/admin/StatusPill';

export default function RecentOrders({ orders }: { orders: Order[] }) {
  return (
    <div className="glass-card-strong rounded-brand p-4 shadow-glass md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-ink">সর্বশেষ ৫টি অর্ডার</span>
        <Link href="/orders" className="text-xs font-semibold text-brand-primary hover:underline">
          সব দেখুন →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-base text-xs uppercase text-muted">
              <th className="pb-2 pr-3 font-semibold">অর্ডার</th>
              <th className="pb-2 pr-3 font-semibold">গ্রাহক</th>
              <th className="pb-2 pr-3 font-semibold">মোট</th>
              <th className="pb-2 pr-3 font-semibold">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-5 text-center text-muted">
                  কোনো অর্ডার নেই
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-border-base last:border-0">
                  <td className="py-2.5 pr-3 font-semibold text-ink">{o.order_num}</td>
                  <td className="py-2.5 pr-3 text-ink">{o.customer_name || '-'}</td>
                  <td className="py-2.5 pr-3 text-ink">৳{(o.total || 0).toLocaleString()}</td>
                  <td className="py-2.5 pr-3">
                    <StatusPill status={o.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
