// ফাইলের পাথ: components/guides/GuideFieldPrimitives.tsx
// [NEW] প্রতিটা ব্লক-এডিটরে বারবার লাগে এমন ছোট ছোট ফর্ম-ফিল্ড — বাংলা+ইংরেজি
// ইনপুট জোড়া, আর "repeating list" (কার্ড/ধাপ/প্রশ্নোত্তরের মতো অ্যারে) যোগ/মুছার UI।

'use client';

import { createContext, useContext } from 'react';
import type { LocalizedText } from '@/types/guides';
import type { LinkableGuidePage } from '@/app/actions/guidePages';

/** RelatedLinks/CTA এডিটরে "অন্য একটা গাইড পেজ বেছে নিন" ড্রপডাউন বসাতে — GuideEditorModal
 *  একবার listAllGuidePagesForLinking() কল করে পুরো ব্লক-লিস্টের চারপাশে এই Provider বসায়,
 *  তাই প্রতিটা এডিটর কম্পোনেন্টে আলাদা করে prop-drill করতে হয় না */
const LinkablePagesContext = createContext<LinkableGuidePage[]>([]);
export const LinkablePagesProvider = LinkablePagesContext.Provider;
export function useLinkablePages(): LinkableGuidePage[] {
  return useContext(LinkablePagesContext);
}

/** targetPageId (অন্য গাইড পেজ) অথবা raw href — দুটোর একটা বেছে নেওয়ার কম্বো ফিল্ড।
 *  targetPageId সেট থাকলে সেটাই প্রেফার্ড; ড্রপডাউনে "— নিজে URL লিখুন —" বেছে নিলে
 *  নিচের raw URL ইনপুট দেখায়। */
export function GuideLinkTargetField({
  label,
  targetPageId,
  href,
  onChange,
  placeholder,
}: {
  label: string;
  targetPageId?: string;
  href?: string;
  onChange: (next: { targetPageId?: string; href?: string }) => void;
  placeholder?: string;
}) {
  const pages = useLinkablePages();
  const useCustomUrl = !targetPageId;

  return (
    <div className="mb-2.5">
      <label className="mb-1.5 block text-[12px] font-extrabold text-ink">{label}</label>
      <select
        value={targetPageId ?? '__custom__'}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '__custom__') onChange({ targetPageId: undefined, href: href ?? '' });
          else onChange({ targetPageId: v, href: undefined });
        }}
        className="select-chevron appearance-none mb-1.5 w-full rounded-xl border border-border-base/90 bg-white px-3 py-2.5 text-[13px] font-medium"
      >
        <option value="__custom__">— নিজে URL লিখুন —</option>
        {pages.map((p) => (
          <option key={p.id} value={p.id}>
            {p.h1_bn || p.slug} {!p.is_published ? '(draft)' : ''}
          </option>
        ))}
      </select>
      {useCustomUrl && (
        <input
          type="text"
          value={href ?? ''}
          onChange={(e) => onChange({ targetPageId: undefined, href: e.target.value })}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border-base/90 bg-white px-3 py-2.5 text-[13px] font-medium"
        />
      )}
    </div>
  );
}

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
      <label className="mb-1.5 block text-[12px] font-extrabold text-ink">{label}</label>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <input
          type="text"
          value={value.bn}
          onChange={(e) => onChange({ ...value, bn: e.target.value })}
          placeholder={placeholder ? `${placeholder} (বাংলা)` : 'বাংলা'}
          className="w-full rounded-xl border border-border-base/90 bg-white px-3 py-2.5 text-[13px] font-medium"
        />
        <input
          type="text"
          value={value.en}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
          placeholder={placeholder ? `${placeholder} (English)` : 'English'}
          className="w-full rounded-xl border border-border-base/90 bg-white px-3 py-2.5 text-[13px] font-medium"
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
      <label className="mb-1.5 block text-[12px] font-extrabold text-ink">{label}</label>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <textarea
          value={value.bn}
          onChange={(e) => onChange({ ...value, bn: e.target.value })}
          placeholder="বাংলা"
          rows={rows}
          className="w-full rounded-xl border border-border-base/90 bg-white px-3 py-2.5 text-[13px] font-medium"
        />
        <textarea
          value={value.en}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
          placeholder="English"
          rows={rows}
          className="w-full rounded-xl border border-border-base/90 bg-white px-3 py-2.5 text-[13px] font-medium"
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
      <label className="mb-1.5 block text-[12px] font-extrabold text-ink">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border-base/90 bg-white px-3 py-2.5 text-[13px] font-medium"
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
      <label className="mb-1.5 block text-[12px] font-extrabold text-ink">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="select-chevron appearance-none w-full rounded-xl border border-border-base/90 bg-white px-3 py-2.5 text-[13px] font-medium"
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
    <div className="mb-3.5 rounded-2xl border border-border-base/80 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-body text-[12.5px] font-black text-ink">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...items, newItem()])}
          className="rounded-full border border-brand-light/40 bg-brand-light/10 px-3 py-1.5 text-[11.5px] font-extrabold text-ink transition-all duration-brand active:scale-95"
        >
          + যোগ করুন
        </button>
      </div>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-border-base/70 bg-surface-muted/70 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-body text-[11px] font-extrabold text-brand-light">{itemLabel(i)}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => {
                    const next = [...items];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    onChange(next);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border-base/80 bg-white text-[11px] font-bold disabled:opacity-30"
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
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border-base/80 bg-white text-[11px] font-bold disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                  className="rounded-full border border-red-200/80 bg-red-50 px-2.5 py-1 text-[10.5px] font-extrabold text-danger"
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
