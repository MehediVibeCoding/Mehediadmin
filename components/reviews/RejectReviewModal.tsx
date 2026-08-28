'use client';

import { useState } from 'react';

interface Props {
  reviewerName: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

const QUICK_REASONS = [
  'স্প্যাম / প্রাসঙ্গিক নয়',
  'অশালীন ভাষা ব্যবহার হয়েছে',
  'ভুয়া / যাচাই করা যায়নি',
  'অন্য প্রোডাক্টের রিভিউ',
];

export default function RejectReviewModal({ reviewerName, busy, onCancel, onConfirm }: Props) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-sm rounded-brand bg-brand-surface p-5 shadow-sh3">
        <h3 className="mb-1 text-sm font-bold text-ink">✕ রিভিউ বাতিল করুন</h3>
        <p className="mb-3.5 text-xs text-muted">
          <b className="text-ink">{reviewerName}</b>-এর রিভিউ বাতিলের কারণ লিখুন — গ্রাহক ওয়েবসাইটে এই নোটিশ দেখতে পাবেন।
        </p>

        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {QUICK_REASONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setReason(q)}
              className="rounded-full border border-border-base bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-muted transition-brand hover:border-brand-accent hover:text-brand-dark"
            >
              {q}
            </button>
          ))}
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="রিজেকশনের কারণ লিখুন..."
          autoFocus
          className="w-full resize-none rounded-lg border border-border-base px-3 py-2 text-sm outline-none transition-brand focus:border-brand-accent"
        />

        <div className="mt-3.5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-brand border border-border-base px-4 py-2.5 text-sm font-medium text-ink transition-brand hover:border-brand-accent disabled:opacity-50"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={busy || !reason.trim()}
            onClick={() => onConfirm(reason)}
            className="rounded-brand bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'সাবমিট হচ্ছে...' : 'রিজেক্ট করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
