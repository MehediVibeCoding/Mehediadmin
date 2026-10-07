import SectionHeading from '@/components/common/SectionHeading';
import type { FunnelStep } from '@/lib/analytics/types';

interface Props {
  steps: FunnelStep[];
}

// প্রোডাক্ট দেখা → কার্ট → চেকআউট → অর্ডার। প্রতিটা ধাপে কত জন এসেছে ও কত জন ঝরে পড়েছে।
// ডাটা আসে মেইন সাইটের GA4 ই-কমার্স ইভেন্ট (view_item, add_to_cart, begin_checkout, purchase) থেকে।
export default function FunnelCard({ steps }: Props) {
  const top = Math.max(steps[0]?.users || 0, 1);
  const hasData = steps.some((s) => s.users > 0);
  return (
    <div className="rounded-[24px] border border-white/90 bg-white p-4 shadow-sh1 sm:p-5">
      <SectionHeading hint="কত জন ভিজিটর কোন ধাপ পর্যন্ত গেছে (GA4 ই-কমার্স ইভেন্ট)">কেনাকাটার ধাপ</SectionHeading>
      {!hasData ? (
        <div className="rounded-2xl border border-brand-light/25 bg-brand-light/10 px-4 py-5 text-center">
          <p className="font-body text-[13px] font-extrabold text-ink">এখনো কোনো ই-কমার্স ইভেন্ট আসেনি</p>
          <p className="mt-1 font-body text-[11.5px] font-medium text-muted">
            মেইন সাইটে ট্র্যাকিং চালু হওয়ার পর প্রথম ভিজিট ও কেনাকাটা থেকে এখানে ডাটা জমতে শুরু করবে (GA4-এ ১–২ ঘণ্টা দেরি হতে পারে)।
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {steps.map((s, i) => {
            const prev = i > 0 ? steps[i - 1].users : 0;
            const keep = i > 0 && prev > 0 ? Math.round((s.users / prev) * 100) : null;
            return (
              <div key={s.key}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-body text-[13px] font-extrabold text-ink">
                    {i + 1}. {s.label}
                  </span>
                  <span className="shrink-0 font-body text-[12.5px] font-black text-ink">
                    {s.users.toLocaleString('en-US')} জন
                    {keep !== null && (
                      <span className="ml-1.5 font-bold text-muted">({keep}% পরের ধাপে)</span>
                    )}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-brand-light/15">
                  <div
                    className={`h-full rounded-full ${i === steps.length - 1 ? 'bg-success' : 'bg-gradient-to-r from-brand-light/70 to-brand-light'}`}
                    style={{ width: `${Math.max(s.users > 0 ? 3 : 0, Math.round((s.users / top) * 100))}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="rounded-2xl border border-border-base/70 bg-surface-muted/60 px-3.5 py-2.5 font-body text-[12px] font-semibold text-muted">
            প্রোডাক্ট দেখা থেকে অর্ডার পর্যন্ত রূপান্তর:{' '}
            <b className="font-black text-ink">
              {steps[0].users > 0 ? ((steps[3].users / steps[0].users) * 100).toFixed(1) : '0'}%
            </b>
          </div>
        </div>
      )}
    </div>
  );
}
