'use client';

import type { QuickSpecRow } from '@/app/actions/products';

interface Props {
  rows: QuickSpecRow[];
  onChange: (rows: QuickSpecRow[]) => void;
}

const MAX_ROWS = 5;

export default function SpecEditor({ rows, onChange }: Props) {
  function updateRow(idx: number, field: 'key' | 'value', val: string) {
    const next = [...rows];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  }

  function removeRow(idx: number) {
    onChange(rows.filter((_, i) => i !== idx));
  }

  function addRow() {
    if (rows.length >= MAX_ROWS) return;
    onChange([...rows, { key: '', value: '' }]);
  }

  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <input
              className="flex-1 rounded-lg border border-border-base px-3 py-2 text-sm"
              placeholder="Key (দৈর্ঘ্য, কন্ট্রোল...)"
              value={row.key}
              onChange={(e) => updateRow(idx, 'key', e.target.value)}
            />
            <input
              className="flex-1 rounded-lg border border-border-base px-3 py-2 text-sm"
              placeholder="Value (5 Meter, App & Remote...)"
              value={row.value}
              onChange={(e) => updateRow(idx, 'value', e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-sm text-danger"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        disabled={rows.length >= MAX_ROWS}
        className="mt-2 w-full rounded-brand border border-border-base py-2 text-sm font-medium text-ink transition-brand hover:border-brand-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        + নতুন স্পেসিফিকেশন যোগ করুন
      </button>
    </div>
  );
}
