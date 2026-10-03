import type { OrderStatus } from '@/types';
import { ORDER_STATUS_META } from '@/lib/orders';

// রং আসে lib/orders.ts-এর ORDER_STATUS_META থেকে (পিল, ড্রপডাউন, মোডাল — সব জায়গায় একই)।
// ব্র্যান্ড নিয়ম অনুযায়ী Confirmed এখন সিগনেচার স্কাই-ব্লু; গাঢ় নীল আর নেই।
export default function StatusPill({ status }: { status: OrderStatus }) {
  const m = ORDER_STATUS_META[status] || ORDER_STATUS_META.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-body text-[11px] font-extrabold leading-none"
      style={{ background: m.bg, color: m.text }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}
