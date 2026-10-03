'use client';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string; // স্ক্রিন-রিডার/টাইটেল
  className?: string;
}

// globals.css-এ `input { -webkit-appearance: none }` থাকায় নেটিভ চেকবক্স অদৃশ্য হয়ে যেত —
// তাই কাস্টম স্কাই-ব্লু চেকবক্স (৪৪×৪৪ টাচ এরিয়া সহ)।
export default function Checkbox({ checked, onChange, label, className = '' }: Props) {
  return (
    <label
      title={label}
      className={`relative inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      <span className="pointer-events-none flex h-[22px] w-[22px] items-center justify-center rounded-[7px] border-[1.5px] border-border-base bg-white text-transparent transition-all duration-brand peer-checked:border-brand-light peer-checked:bg-brand-light peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-light/50">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    </label>
  );
}
