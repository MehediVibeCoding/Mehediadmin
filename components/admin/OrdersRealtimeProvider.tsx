'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getPendingOrdersCount } from '@/app/actions/orders';
import { playChaChing } from '@/lib/sound';
import { sendBrowserNotification, requestNotifPermission } from '@/lib/browserNotification';
import { useToast } from '@/components/admin/Toast';

interface OrdersRealtimeContextValue {
  pendingCount: number;
  /** কম্পোনেন্ট mount থাকা অবস্থায় নতুন/আপডেট হওয়া অর্ডার ইভেন্টে +1 করে বদলায় — Orders পেজ চাইলে এটার উপর নির্ভর করে নিজের লিস্ট রিফ্রেশ করতে পারে */
  ordersVersion: number;
}

const OrdersRealtimeContext = createContext<OrdersRealtimeContextValue>({
  pendingCount: 0,
  ordersVersion: 0,
});

// legacy alertNewOrder() + admin-orders-watch realtime channel + pendBadge —
// সব পেজেই সক্রিয় থাকা দরকার (শুধু Orders পেজ খোলা থাকলে না), তাই এখানে
// (admin) layout-এ একবারই mount হয়।
export function OrdersRealtimeProvider({ children }: { children: React.ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [ordersVersion, setOrdersVersion] = useState(0);
  const router = useRouter();
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  useEffect(() => {
    requestNotifPermission();
    getPendingOrdersCount().then(setPendingCount).catch(() => {});

    const supabase = createClient();
    const channel = supabase
      .channel('admin-orders-watch')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          setOrdersVersion((v) => v + 1);
          getPendingOrdersCount().then(setPendingCount).catch(() => {});
          router.refresh();
          const orderNum = (payload.new as { order_num?: string } | null)?.order_num || 'নতুন';
          playChaChing();
          sendBrowserNotification('🛒 নতুন অর্ডার!', `অর্ডার নং: ${orderNum} — এখনই দেখুন`, () =>
            router.push('/orders')
          );
          showToastRef.current(`🔔 নতুন অর্ডার এসেছে! ${orderNum}`);
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        setOrdersVersion((v) => v + 1);
        getPendingOrdersCount().then(setPendingCount).catch(() => {});
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OrdersRealtimeContext.Provider value={{ pendingCount, ordersVersion }}>
      {children}
    </OrdersRealtimeContext.Provider>
  );
}

export function useOrdersRealtime(): OrdersRealtimeContextValue {
  return useContext(OrdersRealtimeContext);
}
