interface Props {
  icon: React.ReactNode; // SVG ভেতরের path/shape (24x24 viewBox)
  title: string;
  subtitle?: string;
}

// অর্ডার ও কাস্টমার পেজের একই রকম, মাঝখানে-সারিবদ্ধ হেডার (ড্যাশবোর্ডের সেন্টার্ড স্টাইলের সাথে মিল)
export default function PageHeader({ icon, title, subtitle }: Props) {
  return (
    <div className="mb-5 mt-1 flex flex-col items-center gap-1.5 text-center md:mb-6">
      <div className="mb-0.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-white shadow-[0_6px_18px_rgba(68,167,252,0.38)]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[22px] w-[22px]"
        >
          {icon}
        </svg>
      </div>
      <h1 className="font-body text-[22px] font-black leading-tight tracking-tight text-ink sm:text-[26px]">{title}</h1>
      {subtitle && (
        <p className="max-w-[300px] font-body text-[12.5px] font-medium leading-snug text-muted sm:max-w-none">
          {subtitle}
        </p>
      )}
    </div>
  );
}
