// [NEW FILE] ফাইলের পাথ: components/orders/RiskBadge.tsx
import type { OrderRisk, OrderRiskLevel } from '@/types';

export const RISK_META: Record<
  OrderRiskLevel,
  { label: string; hint: string; pill: string; dot: string; text: string; bar: string }
> = {
  green: {
    label: 'High',
    hint: 'বিশ্বস্ত — ফোন ছাড়াই সরাসরি কুরিয়ারে দেওয়া যায়',
    pill: 'border-emerald-200/90 bg-emerald-50 text-emerald-700',
    dot: 'bg-success',
    text: 'text-emerald-700',
    bar: 'bg-success',
  },
  yellow: {
    label: 'Medium',
    hint: 'মাঝারি — পাঠানোর আগে একবার ফোনে কথা বলে নেওয়া ভালো',
    pill: 'border-amber-200/90 bg-amber-50 text-amber-700',
    dot: 'bg-warn',
    text: 'text-amber-700',
    bar: 'bg-warn',
  },
  red: {
    label: 'Low',
    hint: 'ঝুঁকিপূর্ণ — ফোনে যাচাই এবং পূর্ণ/বেশি অগ্রিম নেওয়া নিরাপদ',
    pill: 'border-red-200/90 bg-red-50 text-red-700',
    dot: 'bg-danger',
    text: 'text-red-700',
    bar: 'bg-danger',
  },
};

// ট্রাস্ট স্কোর ব্যাজ — অর্ডার তালিকার ছোট ট্যাগ (নম্বরের পাশে)।
// অর্ডারে স্কোর না থাকলে (পুরনো অর্ডার বা এখনো হিসাব হয়নি) কিছুই দেখায় না।
export default function RiskBadge({ risk }: { risk?: OrderRisk | null }) {
  if (!risk) return null;
  const m = RISK_META[risk.level];
  const why = risk.reasons.length > 0 ? `\n• ${risk.reasons.slice(0, 4).join('\n• ')}` : '';
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 font-body text-[10.5px] font-extrabold leading-none ${m.pill}`}
      title={`ট্রাস্ট স্কোর ${risk.score}/100 — ${m.hint}${why}`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 4 6v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6z" />
      </svg>
      {m.label}
      <span className="font-black opacity-80">{risk.score}</span>
    </span>
  );
}
