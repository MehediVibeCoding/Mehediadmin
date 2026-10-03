'use client';

import { useState } from 'react';

interface Props {
  productName: string;
  kind: 'stock' | 'badge';
  initialValue: string | number;
  onSave: (value: string | number) => Promise<void>;
  onClose: () => void;
}

const BADGE_SUGGESTIONS = ['HOT', 'NEW', 'SALE'];

// মোবাইলে নিচ থেকে ওঠা শিট, ডেস্কটপে মাঝখানের কার্ড। z-[70] — ট্যাব বারের (z-40) অনেক উপরে।
export default function QuickEditPopover({ productName, kind, initialValue, onSave, onClose }: Props) {
  const [value, setValue] = useState(String(initialValue));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isStock = kind === 'stock';

  function bump(delta: number) {
    const n = parseInt(value);
    const base = isNaN(n) ? 0 : n;
    setValue(String(Math.max(0, base + delta)));
    setError('');
  }

  async function handleSave() {
    if (isStock) {
      const n = parseInt(value);
      if (isNaN(n) || n < 0) {
        setError('সঠিক স্টক সংখ্যা দিন');
        return;
      }
      setSaving(true);
      try {
        await onSave(n);
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(true);
      try {
        await onSave(value.trim().toUpperCase());
      } finally {
        setSaving(false);
      }
    }
  }

  const stepBtn =
    'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-light/40 bg-brand-light/10 text-brand-light transition-all duration-brand active:scale-90 active:bg-brand-light active:text-white';

  return (
    <div
      className="animate-soft-fade-in fixed inset-0 z-[70] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="animate-sheet-up w-full max-w-[400px] rounded-t-[30px] bg-white px-5 pt-2.5 shadow-[0_-12px_50px_rgba(26,26,26,0.22)] sm:rounded-[28px] sm:pt-6 sm:shadow-[0_24px_70px_rgba(26,26,26,0.28)]"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-brand-light/30 sm:hidden" />

        <div className="font-body text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">
          {isStock ? 'স্টক আপডেট' : 'ব্যাজ সম্পাদনা'}
        </div>
        <div className="mt-1 line-clamp-2 font-body text-[15px] font-extrabold leading-snug text-ink">{productName}</div>

        <div className="mt-5">
          {isStock ? (
            <div className="flex items-center gap-2.5">
              <button type="button" onClick={() => bump(-1)} aria-label="১ কমান" className={stepBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-5 w-5">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <input
                autoFocus
                type="number"
                inputMode="numeric"
                min={0}
                className="h-14 min-w-0 flex-1 rounded-2xl border border-border-base/90 bg-white text-center font-body text-[22px] font-black text-ink [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError('');
                }}
                onFocus={(e) => e.target.select()}
              />
              <button type="button" onClick={() => bump(1)} aria-label="১ বাড়ান" className={stepBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-5 w-5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <input
                autoFocus
                type="text"
                maxLength={14}
                placeholder="যেমন: HOT, NEW"
                className="h-14 w-full rounded-2xl border border-border-base/90 bg-white px-4 text-center font-body text-[20px] font-black uppercase text-ink placeholder:text-[13px] placeholder:font-medium placeholder:normal-case placeholder:text-muted/60"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {BADGE_SUGGESTIONS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setValue(b)}
                    className={`h-9 rounded-full border px-4 font-body text-[12px] font-black transition-all duration-brand active:scale-95 ${
                      value.trim().toUpperCase() === b
                        ? 'border-brand-light bg-brand-light text-white'
                        : 'border-border-base/80 bg-white text-ink hover:border-brand-light'
                    }`}
                  >
                    {b}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setValue('')}
                  className="h-9 rounded-full border border-red-200/80 bg-red-50 px-4 font-body text-[12px] font-extrabold text-danger transition-all duration-brand active:scale-95"
                >
                  ব্যাজ মুছুন
                </button>
              </div>
              <p className="mt-2.5 text-center font-body text-[11px] font-medium text-muted">খালি রাখলে ব্যাজ থাকবে না</p>
            </>
          )}
          {error && <p className="mt-2.5 text-center font-body text-[12.5px] font-bold text-danger">{error}</p>}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98]"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="h-12 rounded-full bg-brand-light font-body text-[13.5px] font-black text-white shadow-[0_4px_14px_rgba(68,167,252,0.4)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
