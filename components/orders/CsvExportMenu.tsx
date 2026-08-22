'use client';

import { useEffect, useRef, useState } from 'react';
import DateRangePicker, { type DateRange } from '@/components/common/DateRangePicker';

interface Props {
  onExportAll: () => void;
  onExportRange: (range: DateRange) => void;
}

export default function CsvExportMenu({ onExportAll, onExportRange }: Props) {
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
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-[38px] items-center gap-1.5 rounded-[10px] border border-border-base bg-brand-surface px-3 text-xs font-semibold text-ink transition-brand hover:bg-surface-muted"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-brand-accent">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
        <span>CSV</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3 w-3 opacity-60 transition-brand ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[220px] overflow-hidden rounded-xl border border-border-base bg-brand-surface p-1.5 shadow-sh2">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onExportAll();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-ink transition-brand hover:bg-brand-bg hover:text-brand-dark"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-brand-accent">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
              <path d="M14 2v6h6" />
            </svg>
            <span>
              <span className="block">সম্পূর্ণ ডাটা এক্সপোর্ট</span>
              <span className="mt-px block text-[10.5px] font-medium text-muted">সব অর্ডার এক CSV ফাইলে</span>
            </span>
          </button>
          <div className="my-1 h-px bg-border-base" />
          <DateRangePicker
            variant="menu-item"
            active={false}
            range={null}
            minDaysBack={364}
            applyLabel="এই রেঞ্জের CSV ডাউনলোড করুন"
            menuItemLabel="কাস্টম রেঞ্জ এক্সপোর্ট"
            menuItemSubLabel="নির্দিষ্ট দিন বা তারিখ বেছে নিন"
            menuItemIcon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
                <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
                <path d="M3 9.5h18" />
                <path d="M8 2.5v4M16 2.5v4" />
              </svg>
            }
            onApply={(range) => {
              if (range) {
                onExportRange(range);
                setOpen(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
