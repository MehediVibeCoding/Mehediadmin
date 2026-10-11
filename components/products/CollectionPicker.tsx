'use client';

import { SelectBox } from '@/components/common/FormField';

// প্রোডাক্ট ফর্মে "কালেকশন" বাছাই — ক্যাটাগরি বাছার ঠিক নিচে। হোম পেজের ৪টা কালেকশন কার্ডের
// (গিফট আইডিয়া / প্রিমিয়াম / ইউনিক / কিউট) যেকোনো এক বা একাধিকে প্রোডাক্টটা রাখা যায়।
// এটা ক্যাটাগরি থেকে সম্পূর্ণ আলাদা: প্রোডাক্ট ক্যাটাগরিতেও থাকবে, আবার এখানে বাছা কালেকশনেও।

interface CollectionOption {
  id: string;
  name: string;
}

interface Props {
  options: CollectionOption[];
  value: string[];
  onChange: (collections: string[]) => void;
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-3 w-3 text-brand-light">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function CollectionPicker({ options, value, onChange }: Props) {
  // কিছু বাছা না থাকলে একটা ফাঁকা সারি দেখায় ("কোনো কালেকশনে নয়")
  const rows = value.length ? value : [''];
  const canAdd = value.length > 0 && value.length < options.length;

  function updateRow(idx: number, val: string) {
    const next = [...rows];
    next[idx] = val;
    onChange(next.filter(Boolean));
  }

  function removeRow(idx: number) {
    onChange(rows.filter((_, i) => i !== idx).filter(Boolean));
  }

  function addRow() {
    const unused = options.find((o) => !value.includes(o.id));
    if (unused) onChange([...value, unused.id]);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-body text-[12.5px] font-extrabold text-ink">
          কালেকশন <span className="text-[11px] font-medium text-muted">(ঐচ্ছিক — হোম পেজের কালেকশন কার্ডে দেখাবে)</span>
        </span>
        {canAdd && (
          <button
            type="button"
            onClick={addRow}
            className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-brand-light/40 bg-brand-light/10 px-3 font-body text-[11.5px] font-extrabold text-ink transition-all duration-brand active:scale-95"
          >
            <PlusIcon />
            আরেকটি কালেকশন
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((val, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <SelectBox className="min-w-0 flex-1" value={val} onChange={(v) => updateRow(idx, v)}>
              {idx === 0 && <option value="">কোনো কালেকশনে নয়</option>}
              {options
                .filter((o) => o.id === val || !rows.includes(o.id))
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
            </SelectBox>
            {idx > 0 || val ? (
              <button
                type="button"
                onClick={() => removeRow(idx)}
                aria-label="কালেকশন সরান"
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
