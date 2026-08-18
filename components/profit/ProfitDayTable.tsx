import type { ProfitDayRow } from '@/lib/profit';

interface Props {
  rows: ProfitDayRow[];
}

const HEADERS = ['তারিখ', 'অর্ডার সংখ্যা', 'রেভিনিউ', 'নিট প্রফিট'];

// legacy renderProfitPage() prfTbl — TrafficDayTable.tsx-এর টেবিল প্যাটার্ন
// অনুসরণ করে বসানো। "নিট প্রফিট" কলাম legacy-তে #059669 (green) — এই অ্যাপে
// এই একই concept-এর জন্য Dashboard-এর StatGrid.tsx আগেই success token
// ব্যবহার করেছে, তাই এখানেও success (হার্ডকোড হেক্স না)।
export default function ProfitDayTable({ rows }: Props) {
  return (
    <div className="mt-4 rounded-brand bg-brand-surface p-5 shadow-sh1">
      <div className="mb-3 text-sm font-bold text-ink">📅 দিন অনুযায়ী প্রফিট</div>
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
                  এই সময়ে কোনো নিশ্চিত অর্ডার নেই
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.key} className={i % 2 === 1 ? 'bg-surface-muted/40' : ''}>
                  <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] font-bold text-ink">
                    {r.label}
                  </td>
                  <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] text-ink">
                    {r.orders}
                  </td>
                  <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] text-ink">
                    ৳{Math.round(r.revenue).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] font-bold text-success">
                    ৳{Math.round(r.profit).toLocaleString()}
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
