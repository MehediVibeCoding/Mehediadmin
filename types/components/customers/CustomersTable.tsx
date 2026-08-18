import type { Customer } from '@/types';

interface Props {
  customers: Customer[];
}

const HEADERS = ['নাম', 'ফোন', 'ইমেইল', 'শেষ অর্ডার', 'মোট অর্ডার', 'মোট খরচ'];

// legacy #page-customers টেবিল (custTbl) থেকে হুবহু — কলাম, খালি-স্টেট টেক্সট
// ("কোনো কাস্টমার নেই — অর্ডার আসলে এখানে দেখাবে", legacy renderCustomers()-এর
// রানটাইম empty state, static HTML placeholder না), অর্ডার-সংখ্যা পিল রং
// (.p-confirmed: bg #DBEAFE / text #1E40AF), এবং তারিখ ফরম্যাট নোট:
// legacy এখানে 'en-GB' locale ব্যবহার করেছে (অর্ডার টেবিলের 'bn-BD' থেকে আলাদা)।
export default function CustomersTable({ customers }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
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
          {customers.length === 0 ? (
            <tr>
              <td colSpan={HEADERS.length} className="p-6 text-center text-muted">
                কোনো কাস্টমার নেই — অর্ডার আসলে এখানে দেখাবে
              </td>
            </tr>
          ) : (
            customers.map((c, i) => (
              <tr key={(c.phone || c.name) + i} className={i % 2 === 1 ? 'bg-surface-muted/40' : ''}>
                <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] text-ink">
                  {c.name || '-'}
                </td>
                <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] text-ink">
                  {c.phone || '-'}
                </td>
                <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] text-ink">
                  {c.email || '-'}
                </td>
                <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[11px] text-muted">
                  {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('en-GB') : '-'}
                </td>
                <td className="whitespace-nowrap border-b border-border-base p-2.5">
                  <span
                    className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] font-bold"
                    style={{ background: '#DBEAFE', color: '#1E40AF' }}
                  >
                    {c.order_count}টি
                  </span>
                </td>
                <td className="whitespace-nowrap border-b border-border-base p-2.5 text-[12.5px] font-bold text-ink">
                  ৳{(c.total_spent || 0).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
