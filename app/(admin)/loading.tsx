// Next.js App Router-এ route-level loading.tsx না থাকলে ক্লিকের পর পুরো data-fetch শেষ না হওয়া পর্যন্ত
// স্ক্রিন "জমে" থাকে। এই স্কেলিটন ড্যাশবোর্ডের নতুন কাঠামো নকল করে:
// ওয়েলকাম + তারিখ + আবহাওয়া হিরো কার্ড → স্ট্যাট গ্রিড → চার্ট → সর্বশেষ অর্ডার → কম স্টক।
// পেজের উপরে আলাদা টাইটেল নেই (শুভেচ্ছা লেখা এখন ওয়েদার কার্ডের ভেতরে), তাই টাইটেল আঁকা হয় না।
function Skeleton({ className }: { className: string }) {
  return <div className={`sk rounded-brand ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="pb-4">
      {/* ১. ওয়েদার হিরো কার্ড: শুভেচ্ছা + তারিখ চিপ, নিচে আবহাওয়া ও তিনটা স্ট্যাট চিপ */}
      <div className="mb-5 rounded-[24px] border border-white/90 bg-white p-4 shadow-sh1 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-64 max-w-full sm:h-8 sm:w-80" />
          </div>
          <Skeleton className="h-9 w-44 !rounded-full" />
        </div>
        <div className="mt-4 flex flex-col gap-3.5 border-t border-border-base/60 pt-4 lg:flex-row lg:items-center lg:justify-between">
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

      {/* ২. স্ট্যাট গ্রিড: একটা হিরো কার্ড + ছয়টা টাইল */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_1.9fr]">
        <Skeleton className="h-[150px] w-full !rounded-[24px] lg:h-full lg:min-h-[200px]" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] w-full !rounded-[20px]" />
          ))}
        </div>
      </div>

      {/* ৩. রেভিনিউ চার্ট + অর্ডার-অবস্থা ডোনাট */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.9fr_1.1fr]">
        <Skeleton className="h-[280px] w-full !rounded-[24px]" />
        <Skeleton className="h-[280px] w-full !rounded-[24px]" />
      </div>

      {/* ৪. সর্বশেষ অর্ডার + কুইক অ্যাকশন */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.9fr_1.1fr]">
        <Skeleton className="h-[260px] w-full !rounded-[24px]" />
        <Skeleton className="h-[260px] w-full !rounded-[24px]" />
      </div>

      {/* ৫. কম স্টক সতর্কতা */}
      <Skeleton className="mt-5 h-[160px] w-full !rounded-[24px]" />
    </div>
  );
}
