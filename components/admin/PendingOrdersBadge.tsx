'use client';

import { useOrdersRealtime } from '@/components/admin/OrdersRealtimeProvider';

export default function PendingOrdersBadge({ active }: { active?: boolean }) {
  const { pendingCount } = useOrdersRealtime();
  if (pendingCount <= 0) return null;
  return (
    <span
      className={`ml-auto rounded-lg px-1.5 py-0.5 text-[10px] font-bold leading-none text-white ${
        active ? 'bg-white/25' : 'bg-danger'
      }`}
    >
      {pendingCount}
    </span>
  );
}
