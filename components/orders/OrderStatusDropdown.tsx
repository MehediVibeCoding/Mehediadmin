'use client';

import { useEffect, useRef, useState } from 'react';
import type { OrderStatus } from '@/types';
import { ORDER_STATUS_META, ORDER_STATUS_ORDER } from '@/lib/orders';

interface Props {
  selectedCount: number;
  filterStatus: 'all' | OrderStatus;
  onSelectFilter: (status: 'all' | OrderStatus) => void;
  onSelectBulk: (status: OrderStatus) => void;
}

export default function OrderStatusDropdown({ selectedCount, filterStatus, onSelectFilter, onSelectBulk }: Props) {
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

  const dot = bulkMode ? '#0058C7' : filterStatus === 'all' ? '#6B7280' : ORDER_STATUS_META[filterStatus].dot;
  const label = bulkMode ? `${selectedCount}টি সিলেক্টেড` : filterStatus === 'all' ? 'সব স্ট্যাটাস' : ORDER_STATUS_META[filterStatus].label;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-[38px] items-center gap-2 rounded-[10px] border-[1.5px] bg-brand-surface px-3 text-xs font-semibold text-ink transition-brand hover:bg-surface-muted ${
          bulkMode ? 'border-brand-accent bg-brand-bg text-brand-dark' : 'border-border-base'
        }`}
      >
        <span className="h-[9px] w-[9px] shrink-0 rounded-full shadow-[0_0_0_3px_rgba(0,0,0,.04)]" style={{ background: dot }} />
        <span>{label}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-[190px] overflow-hidden rounded-xl border border-border-base bg-brand-surface p-1.5 shadow-sh2">
          {!bulkMode && (
            <button
              type="button"
              onClick={() => {
                onSelectFilter('all');
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-brand hover:bg-brand-bg ${
                filterStatus === 'all' ? 'text-brand-dark' : 'text-ink'
              }`}
            >
              <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: '#6B7280' }} />
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
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-brand hover:bg-brand-bg ${
                  active ? 'text-brand-dark' : 'text-ink'
                }`}
              >
                <span className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: m.dot }} />
                {m.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
