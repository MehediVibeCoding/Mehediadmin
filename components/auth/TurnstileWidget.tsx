'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { loadTurnstileScript } from '@/lib/turnstile';

// Vangcur (মূল সাইট)-এর app/components/auth/TurnstileWidget.tsx থেকে কপি করা,
// হুবহু একই আচরণ। NEXT_PUBLIC_TURNSTILE_SITE_KEY সেট করা না থাকলে কিছুই
// render/লোড করে না (graceful degrade) — তখন server-এও verify স্কিপ হয়
// (lib/turnstileServer.ts), তাই keys বসানোর আগে লগইন স্বাভাবিকভাবে কাজ করবে।

export interface TurnstileHandle {
  getToken: () => string;
  waitForToken: (timeoutMs?: number) => Promise<string>;
  reset: () => void;
}

interface TurnstileWidgetProps {
  active: boolean;
}

const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(function TurnstileWidget(
  { active },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string>('');
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useImperativeHandle(ref, () => ({
    getToken: () => tokenRef.current,
    waitForToken: (timeoutMs = 10000) =>
      new Promise<string>((resolve) => {
        if (tokenRef.current) { resolve(tokenRef.current); return; }
        const startedAt = Date.now();
        const timer = setInterval(() => {
          if (tokenRef.current) {
            clearInterval(timer);
            resolve(tokenRef.current);
          } else if (Date.now() - startedAt >= timeoutMs) {
            clearInterval(timer);
            resolve('');
          }
        }, 100);
      }),
    reset: () => {
      tokenRef.current = '';
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // widget আগেই সরানো হয়ে থাকতে পারে — নিরাপদে ignore
        }
      }
    },
  }));

  useEffect(() => {
    if (!active || !siteKey || !containerRef.current || widgetIdRef.current) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current || widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          size: 'flexible',
          appearance: 'interaction-only',
          retry: 'auto',
          'retry-interval': 3000,
          'refresh-expired': 'auto',
          'refresh-timeout': 'auto',
          callback: (token: string) => {
            tokenRef.current = token;
          },
          'error-callback': () => {
            tokenRef.current = '';
          },
          'expired-callback': () => {
            tokenRef.current = '';
          },
          'timeout-callback': () => {
            tokenRef.current = '';
          },
        });
      })
      .catch(() => {
        // script লোড ব্যর্থ হলে token খালিই থাকবে — কল করা কোড স্পষ্ট বার্তা দেখাবে
      });

    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
      tokenRef.current = '';
    };
  }, [active, siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} className="flex w-full justify-center" />;
});

export default TurnstileWidget;
