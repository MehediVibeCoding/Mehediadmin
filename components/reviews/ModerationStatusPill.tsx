import type { ProductReview, ReviewModerationStatus } from '@/types';

// StatusPill (অর্ডার মডিউল)-এর pending/rejected হেক্স-এর সাথে সামঞ্জস্যপূর্ণ —
// নতুন hex বানানো হয়নি, একই টোন ব্যবহার করা হয়েছে
const META: Record<ReviewModerationStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'অপেক্ষায়', bg: '#FEF3C7', text: '#92400E' },
  approved: { label: 'অনুমোদিত', bg: '#D1FAE5', text: '#065F46' },
  rejected: { label: 'বাতিল', bg: '#FECACA', text: '#7F1D1D' },
};

export function reviewStatus(r: Pick<ProductReview, 'is_approved' | 'is_rejected'>): ReviewModerationStatus {
  if (r.is_rejected) return 'rejected';
  if (r.is_approved) return 'approved';
  return 'pending';
}

export default function ModerationStatusPill({ status }: { status: ReviewModerationStatus }) {
  const m = META[status];
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
      style={{ background: m.bg, color: m.text }}
    >
      {m.label}
    </span>
  );
}
