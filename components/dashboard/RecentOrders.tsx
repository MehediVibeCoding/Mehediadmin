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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-light/15 text-brand-light">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <h2 className="font-body text-[15px] font-black tracking-tight text-ink">সর্বশেষ অর্ডারসমূহ</h2>
            <p className="font-body text-[11px] font-medium text-muted">ওয়েবসাইটের সর্বশেষ ৫টি লাইভ অর্ডার</p>
          </div>
        </div>

        <Link
          href="/orders"
          className="group inline-flex items-center gap-1.5 rounded-full border border-border-base/80 bg-white px-3.5 py-1.5 font-body text-[11.5px] font-bold text-ink shadow-xs transition-all duration-brand hover:border-brand-light hover:bg-brand-bg/30 hover:text-brand-light active:scale-95"
        >
          <span>সব দেখুন</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-brand group-hover:translate-x-0.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {/* মোবাইল-ফার্স্ট ট্যাকটাইল অর্ডার কার্ডস (ঘিঞ্জি টেবিল সম্পূর্ণ অপসারিত) */}
      <div className="space-y-2.5">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span className="font-body text-[12.5px] font-semibold text-muted">বর্তমানে কোনো অর্ডার নেই</span>
          </div>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="group flex flex-col gap-2 rounded-[18px] border border-border-base/50 bg-white/75 p-3.5 shadow-xs backdrop-blur-md transition-all duration-brand hover:-translate-y-0.5 hover:border-brand-light/50 hover:bg-white hover:shadow-sh1 sm:flex-row sm:items-center sm:justify-between sm:p-4"
            >
              {/* বাম পাশ: আইকন + স্কাই-ব্লু অর্ডার নং + কাস্টমার নেম */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-light/10 text-brand-light shadow-xs transition-transform duration-brand group-hover:scale-105">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href="/orders"
                      className="font-body text-[13.5px] font-black tracking-tight text-brand-light hover:underline"
                    >
                      {o.order_num}
                    </Link>
                    <span className="font-body text-[11px] font-medium text-muted/80">
                      {new Date(o.created_at || Date.now()).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="truncate font-body text-[13px] font-bold text-ink">
                    {o.customer_name || 'গ্রাহকের নাম নেই'}
                  </div>
                </div>
              </div>

              {/* ডান পাশ: মোট টাকা + স্ট্যাটাস পিল */}
              <div className="flex items-center justify-between border-t border-border-base/30 pt-2 sm:border-0 sm:pt-0 sm:justify-end sm:gap-4">
                <span className="font-body text-[15px] font-black text-ink">
                  ৳{(o.total || 0).toLocaleString('en-US')}
                </span>
                <StatusPill status={o.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
