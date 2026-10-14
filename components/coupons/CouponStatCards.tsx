import type { CouponStats } from '@/types';

// শুধু একটাই বড় বাক্স: মোট ছাড় (আনুমানিক)।
// মোট/সক্রিয়/ব্যবহার সংখ্যা নিচের কুপন তালিকাতেই প্রতিটা কুপনের সাথে আছে, তাই এখানে আলাদা বাক্স নেই।
// সলিড স্কাই-ব্লু গ্রেডিয়েন্ট (রঙিন গ্লো/শ্যাডো নেই) — ড্যাশবোর্ডের নিট প্রফিট কার্ডের মতো একই ভাষা।
export default function CouponStatCards({ stats }: { stats: CouponStats }) {
  const totalDiscount = Math.round(stats.totalDiscountGiven || 0);

  return (
    <div className="relative mb-4 overflow-hidden rounded-[24px] bg-gradient-to-br from-brand-light to-brand-light-hover p-5 sm:p-6">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(255,255,255,0.32),transparent_55%)]"
      />
      {/* ডেকোরেটিভ কুপন-টিকেট ওয়াটারমার্ক — স্থির */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        className="pointer-events-none absolute -bottom-8 -right-4 h-[150px] w-[150px] text-white opacity-[0.16] sm:h-[190px] sm:w-[190px]"
      >
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <path d="M14 6v12" strokeDasharray="2 2" />
        <circle cx="8" cy="12" r="2" />
      </svg>

      <div className="relative z-10 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]" aria-hidden="true">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </span>
        <span className="font-body text-[12px] font-extrabold uppercase tracking-wider text-white/90">মোট ছাড় (আনুমানিক)</span>
      </div>

      <div className="relative z-10 mt-4">
        <div className="font-body text-[40px] font-black leading-none tracking-tight text-white sm:text-[48px]">
          {'৳' + totalDiscount.toLocaleString('en-US')}
        </div>
        <div className="mt-2 font-body text-[12px] font-semibold text-white/85">অর্ডার-লিংকড হিসেব</div>
      </div>
    </div>
  );
}
