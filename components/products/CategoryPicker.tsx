'use client';

import { getCleanIcon, type CategoryOption } from '@/lib/constants/categories';
import { SelectBox } from '@/components/common/FormField';

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
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-body text-[12.5px] font-extrabold text-ink">
          ক্যাটাগরি <span className="text-danger">*</span>
        </span>
        <button
          type="button"
          onClick={addRow}
          className="flex h-8 items-center gap-1 rounded-full border border-brand-light/40 bg-brand-light/10 px-3 font-body text-[11.5px] font-extrabold text-ink transition-all duration-brand active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-3 w-3 text-brand-light">
            <path d="M12 5v14M5 12h14" />
          </svg>
          আরেকটি ক্যাটাগরি
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((val, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <SelectBox className="min-w-0 flex-1" value={val} onChange={(v) => updateRow(idx, v)}>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {getCleanIcon(c)} {c.name}
                </option>
              ))}
            </SelectBox>
            {idx > 0 ? (
              <button
                type="button"
                onClick={() => removeRow(idx)}
                aria-label="ক্যাটাগরি সরান"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-200/80 bg-red-50 text-danger transition-all duration-brand active:scale-90"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="h-4 w-4">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
