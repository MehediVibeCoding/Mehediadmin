'use client';

// ফর্মের শেয়ার্ড স্টাইল — প্রোডাক্ট মোডাল, ক্যাটাগরি পিকার, গাইড এডিটর সহ সব জায়গায় একই ফিল্ড লুক।
// globals.css-এ select-এর -webkit-appearance: none থাকায় নেটিভ তীরচিহ্ন অদৃশ্য — তাই SelectBox নিজের চেভ্রন আঁকে।

const NO_SPIN =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

// number-স্পিনার লুকানোর [appearance:textfield] শুধু ইনপুটে — <select>-এ দিলে নেটিভ তীর ফিরে আসে (দ্বিতীয় তীর)
const FIELD_BASE =
  'h-12 w-full rounded-2xl border border-border-base/90 bg-white px-4 font-body text-[14px] font-semibold text-ink transition-all duration-brand placeholder:font-medium placeholder:text-muted/60 disabled:opacity-60';

export const FIELD_CLS = FIELD_BASE + ' ' + NO_SPIN;

export const TEXTAREA_CLS =
  'w-full rounded-2xl border border-border-base/90 bg-white px-4 py-3 font-body text-[13.5px] font-medium leading-relaxed text-ink transition-all duration-brand placeholder:text-muted/60 disabled:opacity-60';

interface FieldProps {
  label: React.ReactNode;
  /** লেবেলের পাশে ছোট ধূসর নোট */
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  /** ইনপুটের নিচে ছোট ব্যাখ্যা */
  help?: React.ReactNode;
}

export function Field({ label, hint, required, children, className = '', help }: FieldProps) {
  return (
    <div className={className}>
      <label className="mb-1.5 flex flex-wrap items-baseline gap-x-1.5 font-body text-[12.5px] font-extrabold text-ink">
        <span>
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </span>
        {hint && <span className="text-[11px] font-medium text-muted">{hint}</span>}
      </label>
      {children}
      {help && <div className="mt-1.5 font-body text-[11px] font-medium leading-snug text-muted">{help}</div>}
    </div>
  );
}

export function SelectBox({
  value,
  onChange,
  children,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${FIELD_BASE} appearance-none pr-10`}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-light"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
