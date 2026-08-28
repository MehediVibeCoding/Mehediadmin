'use client';

import { useState } from 'react';
import type { ProductQuestionWithAnswers } from '@/types';

interface Props {
  question: ProductQuestionWithAnswers;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (answer: string) => void;
}

export default function AnswerQuestionModal({ question, busy, onCancel, onConfirm }: Props) {
  const [answer, setAnswer] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-md rounded-brand bg-brand-surface p-5 shadow-sh3">
        <h3 className="mb-1 text-sm font-bold text-ink">✍️ প্রশ্নের উত্তর দিন</h3>
        <div className="mb-3.5 rounded-lg border border-border-base bg-surface-muted p-3 text-xs text-ink">
          <div className="mb-0.5 font-bold text-brand-dark">{question.product_name}</div>
          <div className="text-muted">
            <b className="text-ink">{question.user_name || 'গ্রাহক'}</b> জিজ্ঞাসা করেছেন:
          </div>
          <div className="mt-1">{question.question}</div>
        </div>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          placeholder="Vangcur টিমের পক্ষ থেকে উত্তর লিখুন..."
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
            disabled={busy || !answer.trim()}
            onClick={() => onConfirm(answer)}
            className="rounded-brand bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'সাবমিট হচ্ছে...' : '💾 উত্তর সাবমিট করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
