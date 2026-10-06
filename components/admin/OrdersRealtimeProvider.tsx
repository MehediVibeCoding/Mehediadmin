'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getPendingOrdersCount } from '@/app/actions/orders';
import { refreshAdminCaches } from '@/app/actions/cache';
import { clearOrdersCache } from '@/lib/clientOrdersCache';
import { playChaChing } from '@/lib/sound';
import { sendBrowserNotification, requestNotifPermission } from '@/lib/browserNotification';
import { useToast } from '@/components/admin/Toast';

interface OrdersRealtimeContextValue {
  pendingCount: number;
  /** সার্ভার-ক্যাশ মোছার পর নতুন/আপডেট হওয়া অর্ডার ইভেন্টে +1 করে বদলায় — Orders/Customers পেজ এটার উপর নির্ভর করে নিজের লিস্ট রিফ্রেশ করে */
  ordersVersion: number;
}

const OrdersRealtimeContext = createContext<OrdersRealtimeContextValue>({
  pendingCount: 0,
  ordersVersion: 0,
});

// ট্যাব ১ মিনিটের বেশি পিছনে (ব্যাকগ্রাউন্ডে) থাকলে ফোনের ব্রাউজার ওয়েবসকেট বন্ধ করে দেয় এবং ইভেন্ট মিস হয়।
// তাই ফিরে এলে ক্যাশ মুছে নতুন ডাটা আনা হয়।
const HIDDEN_RESET_MS = 60_000;

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

    // অডিট §১.৩: বাল্ক আপডেটে (যেমন ২০টি অর্ডার একসাথে) প্রতিটা ইভেন্টে
    // router.refresh() ও count fetch চালালে সার্ভার ২০ বার RSC রি-ফেচ করে।
    // সব ইভেন্ট একটি ডিবাউন্সড কলে জমা হয় — শেষ ইভেন্টের ৮০০ms পরে একবার।
    //
    // ক্রম গুরুত্বপূর্ণ: (১) ব্রাউজারের মনে-রাখা ক্যাশ সাথে সাথে মোছা, (২) সার্ভারের ট্যাগ-ক্যাশ মোছা,
    // (৩) তারপর পেজগুলোকে রিফ্রেশ করতে বলা — নইলে রিফ্রেশ আবার পুরনো ক্যাশই ফেরত পেত।
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingScope: 'orders' | 'all' = 'orders';
    const scheduleRefresh = (scope: 'orders' | 'all' = 'orders') => {
      clearOrdersCache();
      if (scope === 'all') pendingScope = 'all';
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(async () => {
        refreshTimer = null;
        const s = pendingScope;
        pendingScope = 'orders';
        try {
          await refreshAdminCaches(s);
        } catch {
          // ব্যর্থ হলেও ২ মিনিট পরে ক্যাশ নিজে নতুন হবে
        }
        clearOrdersCache();
        setOrdersVersion((v) => v + 1);
        getPendingOrdersCount().then(setPendingCount).catch(() => {});
        router.refresh();
      }, 800);
    };

    const supabase = createClient();
    const channel = supabase
      .channel('admin-orders-watch')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          scheduleRefresh();
          const orderNum = (payload.new as { order_num?: string } | null)?.order_num || 'নতুন';
          playChaChing();
          sendBrowserNotification('🛒 নতুন অর্ডার!', `অর্ডার নং: ${orderNum} — এখনই দেখুন`, () =>
            router.push('/orders')
          );
          showToastRef.current(`🔔 নতুন অর্ডার এসেছে! ${orderNum}`);
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        scheduleRefresh();
      })
      .subscribe();

    // ট্যাব ব্যাকগ্রাউন্ডে ১ মিনিটের বেশি থাকার পর সামনে এলে: ক্যাশ মুছে নতুন ডাটা (প্রোডাক্টসহ)
    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      const was = hiddenAt;
      hiddenAt = null;
      if (was !== null && Date.now() - was > HIDDEN_RESET_MS) scheduleRefresh('all');
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      document.removeEventListener('visibilitychange', onVisibility);
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
