'use client';

// ফাইলের পাথ: components/admin/CatalogSyncBanner.tsx
// অ্যাডমিনে সেভ করলে লাইভ সাইট আর সাথে সাথে বদলায় না — "পেন্ডিং পরিবর্তন: N" দেখায় আর
// "এখনই প্রকাশ করুন (ক্যাশ পার্জসহ)" বাটন দেয়। লাইভে পাঠানো ব্যর্থ হলে সতর্কবার্তা দেখায়।
// পেন্ডিং ০ ও সব ঠিক থাকলে কিছুই দেখায় না। কখন স্ট্যাটাস পড়ে: পেজ খুললে, পেজ বদলালে, ট্যাবে ফিরলে,
// এবং সেভের পর notifyCatalogSyncCheck() ডাকলে — কোনো টাইমার/পোলিং নেই।

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getCatalogSyncStatus, publishCatalog, type CatalogSyncStatus } from '@/app/actions/catalogSync';
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
    // সেভের পেন্ডিং গণনা রেসপন্সের পরে (after()) বাড়ে, তাই একটু পরে আবার পড়ি
    const onCheck = () => { check(); setTimeout(check, 1500); };
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    window.addEventListener(CATALOG_SYNC_CHECK_EVENT, onCheck);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener(CATALOG_SYNC_CHECK_EVENT, onCheck);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check]);

  async function handlePublish() {
    setRetrying(true);
    try {
      setStatus(await publishCatalog());
    } catch {
      // ব্যর্থ হলে আগের সতর্কবার্তাই থাকবে
    } finally {
      setRetrying(false);
    }
  }

  if (!status) return null;
  const failed = !status.ok;
  if (!failed && status.pending <= 0) return null;

  return (
    <div
      role={failed ? 'alert' : 'status'}
      className={`mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border px-4 py-3 font-body shadow-sh1 ${
        failed ? 'border-warn/40 bg-warn/10' : 'border-ink/15 bg-white'
      }`}
    >
      <span className="text-[18px] leading-none" aria-hidden="true">{failed ? '⚠️' : '📝'}</span>
      <div className="min-w-0 flex-1">
        {failed ? (
          <>
            <p className="text-[13px] font-extrabold text-ink">লাইভ সাইটে পরিবর্তন এখনো পৌঁছায়নি</p>
            <p className="break-words text-[11.5px] font-medium leading-relaxed text-muted">
              আপনার সেভ ঠিকই হয়েছে। আবার চেষ্টা করতে নিচের বাটন চাপুন।
              {status.message ? ` (কারণ: ${status.message})` : ''}
            </p>
          </>
        ) : (
          <>
            <p className="text-[13px] font-extrabold text-ink">পেন্ডিং পরিবর্তন: {status.pending}</p>
            <p className="text-[11.5px] font-medium leading-relaxed text-muted">
              সেভ হয়েছে, কিন্তু লাইভ সাইটে এখনো দেখা যাবে না। সব বদল শেষ হলে একবার প্রকাশ করুন।
            </p>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={handlePublish}
        disabled={retrying}
        className="shrink-0 rounded-xl bg-ink px-3.5 py-2 text-[12px] font-bold text-white transition-transform active:scale-95 disabled:opacity-60"
      >
        {retrying ? 'প্রকাশ হচ্ছে…' : 'এখনই প্রকাশ করুন (ক্যাশ পার্জসহ)'}
      </button>
    </div>
  );
}
