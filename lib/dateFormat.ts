// অডিট §৭.২: তারিখ ফরম্যাটিং এক জায়গায়। আগে OrdersTable, CustomersTable,
// QnAPanel-এ আলাদা আলাদা লোকাল ফাংশন ছিল।

/** বাংলা লোকেলে "৪ অক্টো ২০২৬" ধরনের তারিখ। ফাঁকা/অবৈধ হলে '—' */
export function formatDateBn(d?: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}
