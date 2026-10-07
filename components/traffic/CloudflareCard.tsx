import SectionHeading from '@/components/common/SectionHeading';
import BarListCard from './BarListCard';
import type { CloudflareReport } from '@/lib/analytics/types';
import { countryName, flagEmoji, formatBytes } from '@/lib/analytics/derive';

interface Props {
  data: CloudflareReport;
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1">
      <div className="font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1.5 truncate font-body text-[21px] font-black tracking-tight text-ink">{value}</div>
      {sub && <div className="mt-0.5 font-body text-[11px] font-semibold text-muted">{sub}</div>}
    </div>
  );
}

// Cloudflare সব HTTP রিকোয়েস্ট (বট, ক্রলার সহ) গোনে — তাই সংখ্যা GA4-এর চেয়ে বেশি দেখানো স্বাভাবিক।
export default function CloudflareCard({ data }: Props) {
  const t = data.totals;
  const cacheHit = t.requests > 0 ? Math.round((t.cachedRequests / t.requests) * 100) : 0;
  return (
    <div className="mt-4">
      <SectionHeading hint="সাইটে আসা সব রিকোয়েস্ট (বট ও ক্রলার সহ) — Cloudflare-এর হিসাব">নেটওয়ার্ক ট্রাফিক (Cloudflare)</SectionHeading>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Tile label="মোট রিকোয়েস্ট" value={t.requests.toLocaleString('en-US')} sub={`${t.pageViews.toLocaleString('en-US')} পেজ লোড`} />
        <Tile label="ব্যান্ডউইথ" value={formatBytes(t.bandwidthBytes)} sub="ডাটা ট্রান্সফার" />
        <Tile label="ইউনিক ভিজিটর" value={t.uniques.toLocaleString('en-US')} sub="দৈনিক ইউনিকের যোগফল" />
        <Tile label="ক্যাশ হিট" value={`${cacheHit}%`} sub={t.threats > 0 ? `${t.threats.toLocaleString('en-US')} হুমকি আটকানো` : 'কোনো হুমকি নেই'} />
      </div>
      <div className="mt-4">
        <BarListCard
          title="কোন দেশ থেকে রিকোয়েস্ট"
          hint="Cloudflare-এর হিসাব অনুযায়ী (বট সহ)"
          unit="রিকোয়েস্ট"
          rows={data.countries.map((c) => ({
            key: c.code,
            label: countryName(c.code),
            lead: flagEmoji(c.code),
            value: c.requests,
          }))}
        />
      </div>
    </div>
  );
}
