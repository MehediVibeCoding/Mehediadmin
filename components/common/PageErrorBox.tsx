interface Props {
  /** যেমন: "অর্ডার লোড করতে সমস্যা হয়েছে" */
  title: string;
  /** catch-এ ধরা আসল এরর মেসেজ */
  message: string;
  /** সম্ভাব্য কারণের ব্যাখ্যা (ঐচ্ছিক) */
  hint?: React.ReactNode;
}

// সব পেজের সার্ভার-সাইড ডাটা-লোড এরর বক্স — ড্যাশবোর্ডের এরর কার্ডের মতো একই স্টাইল।
// সার্ভার কম্পোনেন্ট থেকেও ব্যবহারযোগ্য (কোনো হুক/ক্লায়েন্ট কোড নেই)।
export default function PageErrorBox({ title, message, hint }: Props) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-xl rounded-[24px] border border-red-200/80 bg-white p-5 shadow-sh1 sm:p-6"
    >
      <div className="flex items-center gap-3 border-b border-red-100 pb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-danger">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 className="font-body text-[16px] font-black text-danger">{title}</h2>
          <p className="font-body text-[12px] font-medium text-muted">ডাটাবেজ বা নেটওয়ার্ক সংযোগ যাচাই করুন</p>
        </div>
      </div>
      <p className="mt-3 break-words font-body text-[13px] text-ink/80">{message}</p>
      {hint && <p className="mt-3 rounded-xl bg-surface-muted p-3 font-body text-[11.5px] leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}
