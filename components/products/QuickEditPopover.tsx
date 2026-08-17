'use client';

import { useState } from 'react';

interface Props {
  productName: string;
  kind: 'stock' | 'badge';
  initialValue: string | number;
  onSave: (value: string | number) => Promise<void>;
  onClose: () => void;
}

export default function QuickEditPopover({ productName, kind, initialValue, onSave, onClose }: Props) {
  const [value, setValue] = useState(String(initialValue));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (kind === 'stock') {
      const n = parseInt(value);
      if (isNaN(n) || n < 0) {
        alert('❌ সঠিক স্টক সংখ্যা দিন');
        return;
      }
      setSaving(true);
      await onSave(n);
    } else {
      setSaving(true);
      await onSave(value.trim().toUpperCase());
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="min-w-[260px] rounded-brand border border-border-base bg-white p-5 shadow-sh3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-[15px] font-bold text-ink">
          {kind === 'stock' ? 'স্টক আপডেট' : 'ব্যাজ সম্পাদনা'}
        </div>
        <div className="mb-3 text-xs text-muted">{productName}</div>
        <input
          autoFocus
          type={kind === 'stock' ? 'number' : 'text'}
          min={kind === 'stock' ? 0 : undefined}
          maxLength={kind === 'badge' ? 14 : undefined}
          placeholder={kind === 'badge' ? 'যেমন: HOT, NEW (খালি রাখলে ব্যাজ থাকবে না)' : undefined}
          className={`mb-3 w-full rounded-lg border border-border-base px-2.5 py-2.5 text-center text-base font-bold ${
            kind === 'badge' ? 'uppercase' : ''
          }`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex-1 rounded-lg bg-ink py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? '...' : '✅ সেভ করুন'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-surface-muted py-2.5 text-sm font-bold text-ink"
          >
            বাতিল
          </button>
        </div>
      </div>
    </div>
  );
}
