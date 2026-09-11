// ফাইলের পাথ: components/guides/GuideFieldPrimitives.tsx
// [NEW] প্রতিটা ব্লক-এডিটরে বারবার লাগে এমন ছোট ছোট ফর্ম-ফিল্ড — বাংলা+ইংরেজি
// ইনপুট জোড়া, আর "repeating list" (কার্ড/ধাপ/প্রশ্নোত্তরের মতো অ্যারে) যোগ/মুছার UI।

'use client';

import type { LocalizedText } from '@/types/guides';

export function LocalizedTextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: LocalizedText;
  onChange: (v: LocalizedText) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-2.5">
      <label className="mb-1 block text-[11px] font-semibold text-ink">{label}</label>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <input
          type="text"
          value={value.bn}
          onChange={(e) => onChange({ ...value, bn: e.target.value })}
          placeholder={placeholder ? `${placeholder} (বাংলা)` : 'বাংলা'}
          className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]"
        />
        <input
          type="text"
          value={value.en}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
          placeholder={placeholder ? `${placeholder} (English)` : 'English'}
          className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]"
        />
      </div>
    </div>
  );
}

export function LocalizedTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: LocalizedText;
  onChange: (v: LocalizedText) => void;
  rows?: number;
}) {
  return (
    <div className="mb-2.5">
      <label className="mb-1 block text-[11px] font-semibold text-ink">{label}</label>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <textarea
          value={value.bn}
          onChange={(e) => onChange({ ...value, bn: e.target.value })}
          placeholder="বাংলা"
          rows={rows}
          className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]"
        />
        <textarea
          value={value.en}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
          placeholder="English"
          rows={rows}
          className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]"
        />
      </div>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-2.5">
      <label className="mb-1 block text-[11px] font-semibold text-ink">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]"
      />
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="mb-2.5">
      <label className="mb-1 block text-[11px] font-semibold text-ink">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** cardGrid/relatedLinks ব্লকে আইকন বেছে নেওয়ার জন্য — Vangcur-এর GuideIcons.tsx-এর সাথে key মিলিয়ে রাখা */
export const GUIDE_ICON_KEYS = [
  '', 'bedroom', 'shop', 'camera', 'wallet', 'strand', 'signboard',
  'glassTube', 'ruler', 'shield', 'wrench', 'smartphone', 'check', 'spark',
];

export function RepeatingSection<T>({
  label,
  items,
  onChange,
  renderItem,
  newItem,
  itemLabel = (i) => `আইটেম ${i + 1}`,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, onUpdate: (next: T) => void) => React.ReactNode;
  newItem: () => T;
  itemLabel?: (index: number) => string;
}) {
  return (
    <div className="mb-3 rounded-lg border border-border-base bg-white p-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-ink">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...items, newItem()])}
          className="rounded-md border border-border-base bg-surface-muted px-2 py-1 text-[11px] font-semibold text-ink hover:border-brand-primary"
        >
          + যোগ করুন
        </button>
      </div>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-border-base bg-surface-muted p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10.5px] font-semibold text-muted">{itemLabel(i)}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => {
                    const next = [...items];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    onChange(next);
                  }}
                  className="rounded border border-border-base bg-white px-1.5 py-0.5 text-[10px] disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={i === items.length - 1}
                  onClick={() => {
                    const next = [...items];
                    [next[i], next[i + 1]] = [next[i + 1], next[i]];
                    onChange(next);
                  }}
                  className="rounded border border-border-base bg-white px-1.5 py-0.5 text-[10px] disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                  className="rounded border border-[#FECACA] bg-[#FEE2E2] px-1.5 py-0.5 text-[10px] text-[#991B1B]"
                >
                  মুছুন
                </button>
              </div>
            </div>
            {renderItem(item, (next) => {
              const copy = [...items];
              copy[i] = next;
              onChange(copy);
            })}
          </div>
        ))}
        {items.length === 0 && <div className="py-2 text-center text-[11px] text-muted">এখনো কিছু যোগ করা হয়নি</div>}
      </div>
    </div>
  );
}
