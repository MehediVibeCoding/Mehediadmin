'use client';

import { useEffect, useRef, useState } from 'react';
import type { OrderStatus } from '@/types';
import { ORDER_STATUS_META, ORDER_STATUS_ORDER } from '@/lib/orders';

interface Props {
  selectedCount: number;
  filterStatus: 'all' | OrderStatus;
  onSelectFilter: (status: 'all' | OrderStatus) => void;
  onSelectBulk: (status: OrderStatus) => void;
  /** বাল্ক মোডে বাটনের লেখা (ডিফল্ট: "স্ট্যাটাস বদলান") */
  bulkLabel?: string;
  className?: string;
}

// মোবাইলে (<md) মেনুটা স্ক্রিনের নিচ থেকে ওঠা শিট — কখনো কেটে যায় না, ট্যাব বারের উপরে (z-71) থাকে।
// ডেস্কটপে (≥md) বাটনের নিচে ভাসমান পপওভার।
export default function OrderStatusDropdown({
  selectedCount,
  filterStatus,
  onSelectFilter,
  onSelectBulk,
  bulkLabel = 'স্ট্যাটাস বদলান',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bulkMode = selectedCount > 0;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const dot = bulkMode ? '#44A7FC' : filterStatus === 'all' ? '#6B7280' : ORDER_STATUS_META[filterStatus].dot;
  const label = bulkMode ? bulkLabel : filterStatus === 'all' ? 'সব স্ট্যাটাস' : ORDER_STATUS_META[filterStatus].label;

  const itemCls = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-body text-[13px] font-bold transition-brand hover:bg-brand-bg/40 lg:py-2.5 ${
      active ? 'bg-brand-light/10 text-ink' : 'text-ink'
    }`;

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-11 w-full items-center justify-center gap-2 rounded-full border px-4 font-body text-[12.5px] font-bold text-ink transition-all duration-brand active:scale-95 md:h-10 ${
          bulkMode
            ? 'border-brand-light bg-brand-light/10'
            : 'border-border-base/80 bg-white hover:border-brand-light hover:text-brand-light'
        }`}
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dot }} />
        <span className="whitespace-nowrap">{label}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3 w-3 transition-transform duration-brand ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[70] bg-ink/30 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)} />
          <div className="animate-sheet-up fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom,0px))] z-[71] max-h-[80dvh] overflow-y-auto rounded-[26px] border border-white/90 bg-white p-2.5 shadow-[0_-8px_40px_rgba(26,26,26,0.18)] lg:absolute lg:inset-x-auto lg:bottom-auto lg:left-0 lg:top-[calc(100%+8px)] lg:z-40 lg:min-w-[210px] lg:animate-none lg:rounded-2xl lg:p-1.5 lg:shadow-sh2">
            <div className="mx-auto mb-2 mt-1 h-1 w-10 rounded-full bg-border-base lg:hidden" />
            <div className="px-3 pb-1.5 font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted lg:hidden">
              {bulkMode ? 'নতুন স্ট্যাটাস বেছে নিন' : 'স্ট্যাটাস ফিল্টার'}
            </div>
            {!bulkMode && (
              <button
                type="button"
                onClick={() => {
                  onSelectFilter('all');
                  setOpen(false);
                }}
                className={itemCls(filterStatus === 'all')}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: '#6B7280' }} />
                সব স্ট্যাটাস
              </button>
            )}
            {ORDER_STATUS_ORDER.map((s) => {
              const m = ORDER_STATUS_META[s];
              const active = !bulkMode && filterStatus === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    if (bulkMode) onSelectBulk(s);
                    else onSelectFilter(s);
                    setOpen(false);
                  }}
                  className={itemCls(active)}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.dot }} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
