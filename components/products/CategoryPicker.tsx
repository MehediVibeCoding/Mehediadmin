'use client';

import { getCleanIcon, type CategoryOption } from '@/lib/constants/categories';

interface Props {
  categories: CategoryOption[];
  value: string[];
  onChange: (cats: string[]) => void;
}

export default function CategoryPicker({ categories, value, onChange }: Props) {
  const options = categories.filter((c) => c.id !== 'all');
  const rows = value.length ? value : [options[0]?.id || 'rgb'];

  function updateRow(idx: number, val: string) {
    const next = [...rows];
    next[idx] = val;
    onChange(next);
  }

  function removeRow(idx: number) {
    onChange(rows.filter((_, i) => i !== idx));
  }

  function addRow() {
    const unused = options.find((c) => !rows.includes(c.id));
    onChange([...rows, unused?.id || options[0]?.id || 'rgb']);
  }

  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-ink">
        ক্যাটাগরি *
        <button
          type="button"
          onClick={addRow}
          className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700"
        >
          + আরেকটি ক্যাটাগরি
        </button>
      </label>
      <div className="flex flex-col gap-1.5">
        {rows.map((val, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <select
              className="flex-1 rounded-lg border border-border-base px-3 py-2 text-sm"
              value={val}
              onChange={(e) => updateRow(idx, e.target.value)}
            >
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {getCleanIcon(c)} {c.name}
                </option>
              ))}
            </select>
            {idx > 0 ? (
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-sm text-danger"
              >
                ✕
              </button>
            ) : (
              <div className="w-9 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
