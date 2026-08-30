'use client';

interface Props {
  code: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmDialog({ code, deleting, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && !deleting && onCancel()}
    >
      <div className="w-full max-w-sm rounded-brand bg-brand-surface p-6 text-center shadow-sh3">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </div>
        <h3 className="mb-1.5 font-bold text-ink">কুপন ডিলিট করবেন?</h3>
        <p className="mb-5 text-sm text-muted">
          <span className="font-semibold text-ink">{code}</span> কুপনটি স্থায়ীভাবে মুছে যাবে — এই কাজ ফিরিয়ে আনা যাবে না।
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="flex-1 rounded-brand border border-border-base py-2.5 text-sm font-medium text-ink transition-brand hover:border-brand-primary disabled:opacity-60"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="flex-1 rounded-brand bg-danger py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90 disabled:opacity-60"
          >
            {deleting ? 'ডিলিট হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
