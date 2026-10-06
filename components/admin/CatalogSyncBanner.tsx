'use client';

// ফাইলের পাথ: components/admin/CatalogSyncBanner.tsx
// অ্যাডমিন থেকে সেভ করার পর লাইভ সাইটের ক্যাশ রিফ্রেশ ব্যর্থ হলে ছোট সতর্কবার্তা দেখায়।
// সফল হলে কিছুই দেখায় না। কখন স্ট্যাটাস পড়ে: পেজ খুললে, পেজ বদলালে, ট্যাবে ফিরলে,
// এবং সেভের পর notifyCatalogSyncCheck() ডাকলে — কোনো টাইমার/পোলিং নেই।

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getCatalogSyncStatus, retryCatalogSync, type CatalogSyncStatus } from '@/app/actions/catalogSync';
import { CATALOG_SYNC_CHECK_EVENT } from '@/lib/catalogSyncEvent';

export default function CatalogSyncBanner() {
  const pathname = usePathname();
  const [status, setStatus] = useState<CatalogSyncStatus | null>(null);
  const [retrying, setRetrying] = useState(false);
  const busyRef = useRef(false);

  const check = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      setStatus(await getCatalogSyncStatus());
    } catch {
      // নীরবে উপেক্ষা — ব্যানার শুধু একটা সহায়ক সংকেত
    } finally {
      busyRef.current = false;
    }
  }, []);

  useEffect(() => {
    check();
  }, [check, pathname]);

  useEffect(() => {
    // সেভ শেষ হওয়ার সাথে সাথে রেজাল্ট DB-তে লেখা হয়ে যায় (action-এর ভেতরেই await করা), তাই সরাসরি পড়া যায়
    const onCheck = () => { check(); };
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    window.addEventListener(CATALOG_SYNC_CHECK_EVENT, onCheck);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(CATALOG_SYNC_CHECK_EVENT, onCheck);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check]);

  async function handleRetry() {
    setRetrying(true);
    try {
      setStatus(await retryCatalogSync());
    } catch {
      // ব্যর্থ হলে আগের সতর্কবার্তাই থাকবে
    } finally {
      setRetrying(false);
    }
  }

  if (!status || status.ok) return null;

  return (
    <div
      role="alert"
      className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-warn/40 bg-warn/10 px-4 py-3 font-body shadow-sh1"
    >
      <span className="text-[18px] leading-none" aria-hidden="true">⚠️</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold text-ink">লাইভ সাইটে পরিবর্তন এখনো পৌঁছায়নি</p>
        <p className="break-words text-[11.5px] font-medium leading-relaxed text-muted">
          আপনার সেভ ঠিকই হয়েছে। লাইভ সাইট নিজে থেকে কয়েক মিনিটের মধ্যে নতুন ডেটা নেবে — তাড়াতাড়ি চাইলে আবার চেষ্টা করুন।
          {status.message ? ` (কারণ: ${status.message})` : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="shrink-0 rounded-xl bg-ink px-3.5 py-2 text-[12px] font-bold text-white transition-transform active:scale-95 disabled:opacity-60"
      >
        {retrying ? 'চেষ্টা চলছে…' : 'আবার চেষ্টা করুন'}
      </button>
    </div>
  );
}
