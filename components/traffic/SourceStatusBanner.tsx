import type { SourceStatus } from '@/lib/analytics/types';

interface Item {
  name: string;
  status: SourceStatus;
}

// কোনো সোর্স সংযুক্ত না থাকলে বা ডাটা আনতে ব্যর্থ হলে — কী ঠিক করতে হবে সেটা সরাসরি বলে দেয়।
export default function SourceStatusBanner({ items }: { items: Item[] }) {
  const problems = items.filter((i) => !i.status.ok);
  if (problems.length === 0) return null;
  return (
    <div className="mb-4 flex flex-col gap-2.5">
      {problems.map((p) => (
        <div key={p.name} className="rounded-[20px] border border-amber-200/80 bg-amber-50 p-3.5 sm:p-4">
          <div className="font-body text-[13px] font-black text-ink">
            {p.status.configured ? `${p.name} থেকে ডাটা আনা যায়নি` : `${p.name} এখনো সংযুক্ত নয়`}
          </div>
          {p.status.hint && (
            <div className="mt-0.5 font-body text-[12px] font-semibold leading-relaxed text-[#92400E]">{p.status.hint}</div>
          )}
          {p.status.error && (
            <div className="mt-1.5 break-words rounded-xl bg-white/70 px-2.5 py-1.5 font-mono text-[10.5px] text-muted">
              {p.status.error.slice(0, 300)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
