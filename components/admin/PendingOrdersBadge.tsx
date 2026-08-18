'use client';

import { useOrdersRealtime } from '@/components/admin/OrdersRealtimeProvider';

export default function PendingOrdersBadge() {
  const { pendingCount } = useOrdersRealtime();
  if (pendingCount <= 0) return null;
  return (
    <span className="ml-auto rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {pendingCount}
    </span>
  );
}
