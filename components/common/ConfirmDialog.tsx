'use client';

interface Props {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  busy?: boolean;
  /** 'danger' (লাল — ডিলিট) বা 'brand' (স্কাই-ব্লু — সাধারণ নিশ্চিতকরণ) */
  tone?: 'danger' | 'brand';
  onConfirm: () => void;
  onCancel: () => void;
}

// ব্রাউজারের কুৎসিত confirm()/alert()-এর বদলে অ্যাপের নিজস্ব নিশ্চিতকরণ ডায়ালগ।
// z-[120] — সব মোডালের (৬০–১১০) এবং ট্যাব বারের (z-40) উপরে।
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busyLabel = 'অপেক্ষা করুন...',
  busy = false,
  tone = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  const danger = tone === 'danger';
  return (
    <div
      className="animate-soft-fade-in fixed inset-0 z-[120] flex items-end justify-center bg-ink/50 p-3 backdrop-blur-[3px] sm:items-center sm:p-5"
      onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="animate-sheet-up w-full max-w-[380px] rounded-[28px] bg-white p-6 text-center shadow-[0_24px_70px_rgba(26,26,26,0.3)]"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            danger ? 'bg-red-50 text-danger' : 'bg-brand-light/15 text-brand-light'
          }`}
        >
          {danger ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          )}
        </div>
        <h3 className="mb-1.5 font-body text-[17px] font-black text-ink">{title}</h3>
        <p className="mb-6 font-body text-[13px] font-medium leading-relaxed text-muted">{message}</p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-12 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98] disabled:opacity-60"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`h-12 rounded-full font-body text-[13.5px] font-extrabold text-white transition-all duration-brand active:scale-[0.98] disabled:opacity-60 ${
              danger
                ? 'bg-danger shadow-[0_4px_14px_rgba(239,68,68,0.35)] hover:opacity-90'
                : 'bg-brand-light shadow-[0_4px_14px_rgba(68,167,252,0.38)] hover:bg-brand-light-hover'
            }`}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
