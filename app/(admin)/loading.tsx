// Next.js App Router-এ route-level loading.tsx না থাকলে ক্লিকের পর পুরো data-fetch শেষ না হওয়া পর্যন্ত
// স্ক্রিন "জমে" থাকে। এই স্কেলিটন ড্যাশবোর্ডের নতুন কাঠামো নকল করে:
// ওয়েলকাম + তারিখ + আবহাওয়া হিরো কার্ড → স্ট্যাট গ্রিড → চার্ট → সর্বশেষ অর্ডার → কম স্টক।
// পেজের উপরে আলাদা টাইটেল নেই (শুভেচ্ছা লেখা এখন ওয়েদার কার্ডের ভেতরে), তাই টাইটেল আঁকা হয় না।
function Skeleton({ className }: { className: string }) {
  return <div className={`sk rounded-brand ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div>
      {/* ১. ওয়েদার কার্ড — উপরে লাগানো, উপরের কোণ সোজা */}
      <div className="-mt-3 rounded-b-[24px] border border-t-0 border-white/90 bg-white p-4 shadow-sh1 sm:p-5 md:-mt-6">
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <Skeleton className="h-14 w-14 shrink-0 !rounded-[18px]" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:flex">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[58px] w-full !rounded-2xl lg:w-28" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 pb-4 lg:grid-cols-[1.45fr_1fr]">
        {/* করণীয় (মোবাইলে সবার আগে) */}
        <Skeleton className="order-1 h-[330px] w-full !rounded-[24px] lg:order-none lg:col-start-2 lg:row-start-1 lg:h-full" />
        {/* প্রফিট + ছয় মেট্রিক */}
        <div className="order-2 space-y-3 lg:order-none lg:col-start-1 lg:row-start-1">
          <Skeleton className="h-[148px] w-full !rounded-[24px]" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[112px] w-full !rounded-[20px]" />
            ))}
          </div>
        </div>
        <Skeleton className="order-3 h-[280px] w-full !rounded-[24px] lg:order-none" />
        <Skeleton className="order-4 h-[348px] w-full !rounded-[24px] lg:order-none lg:col-span-2" />
        <Skeleton className="order-5 h-[260px] w-full !rounded-[24px] lg:order-none lg:col-span-2" />
      </div>
    </div>
  );
}
