'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getDashboardTraffic, type DashboardTraffic } from '@/app/actions/dashboardTraffic';
import { getLiveVisitors } from '@/app/actions/traffic';

// ভিজিটর ডাটা একবার এনে ড্যাশবোর্ডের সব কার্ডে ভাগ করে দেয় (স্ট্যাট টাইল + ইনসাইট কার্ড)।
// - প্রথম লোড: পেজ খোলার পর ব্যাকগ্রাউন্ডে — ড্যাশবোর্ড তাৎক্ষণিক খোলে, GA4 ধীর হলেও আটকায় না।
// - লাইভ সংখ্যা: GA4 সংযুক্ত থাকলে প্রতি ৬০ সেকেন্ডে, শুধু ট্যাব দৃশ্যমান থাকলে।

export interface LiveCounts {
  ok: boolean;
  last30: number;
  last5: number;
}

interface TrafficState {
  status: 'loading' | 'ready' | 'error';
  data: DashboardTraffic | null;
  live: LiveCounts | null;
}

const TrafficContext = createContext<TrafficState>({ status: 'loading', data: null, live: null });

const LIVE_REFRESH_MS = 60_000;

export function TrafficProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TrafficState>({ status: 'loading', data: null, live: null });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function pullLive() {
      if (document.visibilityState !== 'visible') return;
      try {
        const l = await getLiveVisitors();
        if (cancelled) return;
        setState((s) => ({ ...s, live: { ok: l.ok, last30: l.last30, last5: l.last5 } }));
      } catch {
        // লাইভ সংখ্যা না এলে আগের সংখ্যাই থাকে
      }
    }

    (async () => {
      try {
        const data = await getDashboardTraffic();
        if (cancelled) return;
        setState({ status: 'ready', data, live: null });
        if (data.source === 'ga4') {
          pullLive();
          timer = setInterval(pullLive, LIVE_REFRESH_MS);
        }
      } catch {
        if (!cancelled) setState({ status: 'error', data: null, live: null });
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <TrafficContext.Provider value={value}>{children}</TrafficContext.Provider>;
}

export function useDashboardTraffic(): TrafficState {
  return useContext(TrafficContext);
}
