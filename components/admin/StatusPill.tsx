import type { Order, OrderStatus } from '@/types';
import { ORDER_STATUS_META } from '@/lib/orders';

// রং আসে lib/orders.ts-এর ORDER_STATUS_META থেকে (পিল, ড্রপডাউন, মোডাল — সব জায়গায় একই)।
// ব্র্যান্ড নিয়ম অনুযায়ী Confirmed এখন সিগনেচার স্কাই-ব্লু; গাঢ় নীল আর নেই।
//
// 🤖 অটো-কনফার্ম ট্যাগ: স্ট্যাটাস 'confirmed' থাকা অবস্থায় বিকাশ সিস্টেম নিজে কনফার্ম করে থাকলে
// "Confirmed"-এর জায়গায় ছোট ট্যাগ — TrxID দিয়ে মিললে "Tnx Confirm", শেষ ৪ ডিজিটে মিললে
// "LD Confirm"। ম্যানুয়াল কনফার্মে আগের মতোই "Confirmed"। শিপড/ডেলিভার্ড হলে স্বাভাবিক লেবেল।
function autoLabel(status: OrderStatus, verification?: Order['verification_method']): string | null {
  if (status !== 'confirmed') return null;
  if (verification === 'auto_trxid') return 'Tnx Confirm';
  if (verification === 'auto_last4') return 'LD Confirm';
  return null;
}

export default function StatusPill({
  status,
  verification,
}: {
  status: OrderStatus;
  verification?: Order['verification_method'];
}) {
  const m = ORDER_STATUS_META[status] || ORDER_STATUS_META.pending;
  const label = autoLabel(status, verification) ?? m.label;
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-body text-[11px] font-extrabold leading-none"
      style={{ background: m.bg, color: m.text }}
      title={label !== m.label ? 'বিকাশ সিস্টেম অটো-কনফার্ম করেছে' : undefined}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: m.dot }} />
      {label}
    </span>
  );
}
