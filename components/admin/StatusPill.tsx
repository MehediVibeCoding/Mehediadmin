import type { OrderStatus } from '@/types';

// legacy admin.html-এর .p-pending/.p-confirmed/... CSS ক্লাস থেকে হুবহু hex —
// DESIGN_SYSTEM.md অনুযায়ী status pill-এর জন্য exact legacy hex রাখার
// সিদ্ধান্তই নেওয়া হয়েছে, brand token দিয়ে replace করা হয়নি।
const STATUS_META: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#92400E' },
  confirmed: { label: 'Confirmed', bg: '#DBEAFE', text: '#1E40AF' },
  shipped: { label: 'Shipped', bg: '#E0E7FF', text: '#3730A3' },
  delivered: { label: 'Delivered', bg: '#D1FAE5', text: '#065F46' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#991B1B' },
};

export default function StatusPill({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
      style={{ background: m.bg, color: m.text }}
    >
      {m.label}
    </span>
  );
}
