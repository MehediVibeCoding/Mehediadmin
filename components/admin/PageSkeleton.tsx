// সব লিস্ট-টাইপ পেজের (অর্ডার/প্রোডাক্ট/কাস্টমার/ট্রাফিক/প্রফিট ইত্যাদি)
// জন্য একটা সাধারণ instant-feedback স্কেলিটন — route-level loading.tsx
// ফাইলগুলো এটা রিইউজ করে, যাতে ক্লিক করার সাথে সাথেই কিছু একটা বদলায়
// (ডেটা রেডি হওয়া পর্যন্ত স্ক্রিন জমে না থেকে)।
function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-brand bg-black/[.06] ${className}`} />;
}

export default function PageSkeleton() {
  return (
    <div>
      <div className="mb-6 flex flex-col items-center gap-2">
        <Bar className="h-6 w-56" />
        <Bar className="h-3.5 w-72" />
      </div>
      <div className="mb-4 flex flex-wrap justify-center gap-2.5">
        <Bar className="h-[38px] w-64" />
        <Bar className="h-[38px] w-32" />
        <Bar className="h-[38px] w-[38px]" />
      </div>
      <div className="glass-card-strong rounded-brand p-5 shadow-glass">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bar key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
