// Next.js App Router-এ route-level loading.tsx না থাকলে ক্লিক করার পর
// পুরো data-fetch শেষ না হওয়া পর্যন্ত স্ক্রিন "জমে" থাকে (কোনো ফিডব্যাক
// ছাড়াই) — এটাই "ক্লিক করলে দেরিতে ওপেন হয়" সমস্যার প্রধান কারণ। এই
// ফাইলটা /（ড্যাশবোর্ড）রুটে ইনস্ট্যান্ট স্কেলিটন দেখায় যতক্ষণ না আসল
// ডেটা (getDashboardData → Supabase) রেডি হয়, ফলে ক্লিক করার সাথে সাথেই
// পেজ বদলানোর অনুভূতি আসে।
function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-brand bg-black/[.06] ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-5 flex flex-col items-center gap-2">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-3.5 w-40" />
      </div>

      <Skeleton className="mb-4 h-[104px] w-full md:h-[92px]" />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-6 md:gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="min-h-[126px] w-full md:min-h-[148px]" />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
        <Skeleton className="h-[260px] w-full" />
        <Skeleton className="h-[180px] w-full" />
      </div>

      <Skeleton className="mt-4 h-[220px] w-full" />
    </div>
  );
}
