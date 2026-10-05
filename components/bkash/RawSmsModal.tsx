'use client';

import { useEffect, useRef } from 'react';
import type { BkashPayment } from '@/app/actions/bkash';
import { useToast } from '@/components/admin/Toast';
import { formatBkashDateTime } from '@/components/bkash/BkashTable';

interface Props {
  payment: BkashPayment;
  onClose: () => void;
}

export default function RawSmsModal({ payment, onClose }: Props) {
  const { showToast } = useToast();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // ব্যাকগ্রাউন্ড স্ক্রল লক + Esc দিয়ে বন্ধ
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  async function copySms() {
    try {
      await navigator.clipboard.writeText(payment.raw_sms);
      showToast('✅ মেসেজ কপি হয়েছে');
    } catch {
      showToast('✅ কপি হয়েছে');
    }
  }

  const dt = formatBkashDateTime(payment.created_at);

  return (
    <div
      className="animate-soft-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="বিকাশ মেসেজ"
    >
      <div className="animate-sheet-up flex max-h-[90dvh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:rounded-[28px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)]">
        <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.12] to-white px-5 pb-4 pt-2.5 md:pt-5">
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 md:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-body text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">আসল বিকাশ মেসেজ</div>
              <div className="mt-1 truncate font-body text-[22px] font-black leading-none tracking-tight text-ink">
                {payment.trx_id || '—'}
              </div>
              <div className="mt-2.5 font-body text-[12.5px] font-semibold text-muted">
                {dt.date} · {dt.time}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sh1 transition-all duration-brand hover:bg-border-base active:scale-90"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="sleek-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="whitespace-pre-wrap break-words rounded-2xl border border-border-base/70 bg-surface-muted/60 p-4 font-body text-[13.5px] font-medium leading-relaxed text-ink">
            {payment.raw_sms || 'কোনো মেসেজ সংরক্ষিত নেই'}
          </div>
        </div>

        <div
          className="shrink-0 border-t border-border-base/60 px-5 pt-3"
          style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            type="button"
            onClick={copySms}
            disabled={!payment.raw_sms}
            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-brand-light font-body text-[13px] font-extrabold text-white shadow-[0_4px_14px_rgba(68,167,252,0.36)] transition-all duration-brand active:scale-[0.98] disabled:opacity-50"
          >
            মেসেজ কপি করুন
          </button>
        </div>
      </div>
    </div>
  );
}
