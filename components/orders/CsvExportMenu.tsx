'use client';

import { useEffect, useRef, useState } from 'react';
import DateRangePicker, { type DateRange } from '@/components/common/DateRangePicker';

interface Props {
  onExportAll: () => void;
  onExportRange: (range: DateRange) => void;
  className?: string;
}

// মোবাইলে (<md) নিচ থেকে ওঠা শিট, ডেস্কটপে (≥md) ডানদিক-অ্যালাইনড পপওভার।
export default function CsvExportMenu({ onExportAll, onExportRange, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border-base/80 bg-white px-4 font-body text-[12.5px] font-bold text-ink transition-all duration-brand hover:border-brand-light hover:text-brand-light active:scale-95 md:h-10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-brand-light">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
        <span>CSV</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3 w-3 opacity-60 transition-transform duration-brand ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[70] bg-ink/30 backdrop-blur-[2px] md:hidden" onClick={() => setOpen(false)} />
          <div className="animate-sheet-up fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom,0px))] z-[71] max-h-[80dvh] overflow-y-auto rounded-[26px] border border-white/90 bg-white p-2.5 shadow-[0_-8px_40px_rgba(26,26,26,0.18)] md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-[calc(100%+8px)] md:z-40 md:w-[250px] md:animate-none md:rounded-2xl md:p-1.5 md:shadow-sh2">
            <div className="mx-auto mb-2 mt-1 h-1 w-10 rounded-full bg-border-base md:hidden" />
            <div className="px-3 pb-1.5 font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted md:hidden">
              CSV এক্সপোর্ট
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onExportAll();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-body text-[12.5px] font-bold text-ink transition-brand hover:bg-brand-bg/40 hover:text-brand-light"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light/[0.12] text-brand-light">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 2v6h6" />
                </svg>
              </span>
              <span>
                <span className="block">সম্পূর্ণ ডাটা এক্সপোর্ট</span>
                <span className="mt-0.5 block text-[10.5px] font-medium text-muted">সব অর্ডার এক CSV ফাইলে</span>
              </span>
            </button>
            <div className="mx-2 my-1 h-px bg-border-base/70" />
            <DateRangePicker
              variant="menu-item"
              active={false}
              range={null}
              minDaysBack={364}
              applyLabel="এই রেঞ্জের CSV ডাউনলোড করুন"
              menuItemLabel="কাস্টম রেঞ্জ এক্সপোর্ট"
              menuItemSubLabel="নির্দিষ্ট দিন বা তারিখ বেছে নিন"
              menuItemIcon={
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light/[0.12] text-brand-light">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                    <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
                    <path d="M3 9.5h18" />
                    <path d="M8 2.5v4M16 2.5v4" />
                  </svg>
                </span>
              }
              onApply={(range) => {
                if (range) {
                  onExportRange(range);
                  setOpen(false);
                }
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
