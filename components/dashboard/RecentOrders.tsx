import Link from 'next/link';
import type { Order } from '@/types';
import StatusPill from '@/components/admin/StatusPill';

interface Props {
  orders: Order[];
}

export default function RecentOrders({ orders }: Props) {
  return (
    <div className="card-hover-glow overflow-hidden rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-sh1 backdrop-blur-xl sm:p-6">
      {/* হেডার ও অ্যাকশন ক্যাপসুল */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border-base/50 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-bg/50 text-brand-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <h2 className="font-body text-[15px] font-black tracking-tight text-ink">সর্বশেষ অর্ডারসমূহ</h2>
            <p className="font-body text-[11px] font-medium text-muted">ওয়েবসাইটের সর্বশেষ ৫টি গ্রাহক অর্ডার</p>
          </div>
        </div>

        <Link
          href="/orders"
          className="group inline-flex items-center gap-1.5 rounded-full border border-border-base/80 bg-white px-3.5 py-1.5 font-body text-[11.5px] font-bold text-ink shadow-xs transition-all duration-brand hover:border-brand-light hover:bg-brand-bg/30 hover:text-brand-primary active:scale-95"
        >
          <span>সব দেখুন</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-brand group-hover:translate-x-0.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {/* অর্ডার টেবিল */}
      <div className="sleek-scrollbar overflow-x-auto">
        <table className="w-full min-w-[480px] text-left">
          <thead>
            <tr className="border-b border-border-base/60 font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">
              <th className="pb-2.5 pr-4">অর্ডার নং</th>
              <th className="pb-2.5 pr-4">গ্রাহকের নাম</th>
              <th className="pb-2.5 pr-4">মোট মূল্য</th>
              <th className="pb-2.5 text-right sm:text-left">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-base/40 font-body text-[13px]">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <span className="font-body text-[12.5px] font-semibold text-muted">বর্তমানে কোনো অর্ডার নেই</span>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr
                  key={o.id}
                  className="transition-colors duration-brand hover:bg-brand-bg/25"
                >
                  <td className="py-3 pr-4 font-bold text-brand-primary">
                    <Link href="/orders" className="hover:underline">
                      {o.order_num}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 font-semibold text-ink">
                    {o.customer_name || '—'}
                  </td>
                  <td className="py-3 pr-4 font-black text-ink">
                    ৳{(o.total || 0).toLocaleString('en-US')}
                  </td>
                  <td className="py-3 text-right sm:text-left">
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
