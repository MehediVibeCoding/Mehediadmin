// সব লিস্ট-টাইপ পেজের route-level loading.tsx এটা রিইউজ করে — ক্লিক করার সাথে সাথেই কিছু একটা
// বদলায়। কাঠামো আসল পেজের মতো (টুলবার কার্ড → চিপ সারি → কার্ড তালিকা); পেজ-টাইটেল আঁকা হয় না,
// কারণ আসল পেজে টাইটেল নেই (লেআউট শিফট এড়াতে)।
function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-brand bg-black/[.06] ${className}`} />;
}

export default function PageSkeleton() {
  return (
    <div>
      <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <Bar className="h-11 w-full flex-1 !rounded-full lg:h-10" />
          <Bar className="h-12 w-full !rounded-full lg:h-10 lg:w-44" />
        </div>
        <div className="mt-3 flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bar key={i} className="h-9 w-24 shrink-0 !rounded-full" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-[20px] border border-white/90 bg-white p-3 shadow-sh1">
            <div className="flex items-start gap-2.5">
              <Bar className="h-[52px] w-[52px] shrink-0 !rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2 pt-1">
                <Bar className="h-3.5 w-3/4" />
                <Bar className="h-3 w-1/2" />
              </div>
            </div>
            <Bar className="mt-3 h-9 w-full !rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
