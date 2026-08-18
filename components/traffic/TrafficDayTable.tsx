import type { TrafficDayRow } from '@/lib/traffic';

interface Props {
  rows: TrafficDayRow[];
}

const HEADERS = ['তারিখ', 'ইউনিক ভিজিটর', 'মোট পেজভিউ', 'গড় ভিউ/ভিজিটর'];

// buildDayTable() থেকে আসা রো গুলো CustomersTable/OrdersTable-এর টেবিল
// প্যাটার্ন অনুসরণ করে বসানো (header bg-brand-bg/40 + text-brand-primary
// uppercase, row border-base, জোড়-index রো bg-surface-muted/40)। গড়
// ভিউ/ভিজিটর কলাম violet — TrafficStatCards.tsx-এর ভিজিটর কার্ডে নেওয়া
// একই decision অনুযায়ী (legacy hex #7C3AED, Tailwind built-in violet-600
// exact মিল, নতুন hardcoded hex লাগেনি)।
export default function TrafficDayTable({ rows }: Props) {
  return (
    <div className="mt-4 rounded-brand bg-brand-surface p-5 shadow-sh1">
      <div className="mb-3 text-sm font-bold text-ink">📅 দৈনিক পরিসংখ্যান</div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr>
              {HEADERS.map((h, i) => (
                <th
                  key={h}
                  className={`bg-brand-bg/40 p-2.5 text-[10px] font-bold uppercase tracking-wide text-brand-primary ${
                    i === 0 ? 'rounded-tl-brand' : ''
                  } ${i === HEADERS.length - 1 ? 'rounded-tr-brand' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="p-6 text-center text-muted">
                  এই সময়ে কোনো ভিজিটর ডাটা নেই
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.key} className={i % 2 === 1 ? 'bg-surface-muted/40' : ''}>
                  <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] text-ink">
                    {r.label}
                  </td>
                  <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] font-bold text-ink">
                    {r.uniqueVisitors}
                  </td>
                  <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] text-ink">
                    {r.totalViews}
                  </td>
                  <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] font-bold text-violet-600">
                    {r.avgViews}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
