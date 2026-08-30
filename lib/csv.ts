import type { Order } from '@/types';
import { getOrderAdvance, getOrderDueCOD } from '@/lib/orders';

// legacy csvRowsFromOrders() — headers + rows হুবহু একই কলাম ক্রম, পরে
// ডায়নামিক অ্যাডভান্স/কুপন কলাম যোগ করা হয়েছে (Subtotal, Coupon,
// Discount, Advance Paid, COD Due) — অ্যাকাউন্টিং এক্সপোর্টে হিসাব মেলাতে দরকার
export function ordersToCsvRows(orders: Order[]): string[][] {
  return [
    [
      'Order#',
      'Date',
      'Name',
      'Phone',
      'District',
      'Address',
      'Items',
      'Subtotal',
      'Coupon',
      'Discount',
      'Shipping',
      'Total',
      'Advance Paid',
      'COD Due',
      'Status',
      'TXN',
      'IP',
    ],
    ...orders.map((o) => [
      o.order_num,
      new Date(o.created_at).toLocaleDateString(),
      o.customer_name,
      o.customer_phone,
      o.customer_district,
      o.customer_address,
      (o.items || []).map((i) => `${i.name}×${i.qty}`).join('; '),
      String(o.subtotal ?? ''),
      o.coupon_code || '',
      String(o.discount_amount ?? 0),
      o.shipping,
      String(o.total ?? ''),
      String(getOrderAdvance(o)),
      String(getOrderDueCOD(o)),
      o.status,
      o.payment_txn || o.payment_last4 || '',
      o.ip || '',
    ]),
  ];
}

// legacy downloadCsvRows() — BOM সহ CSV, ব্রাউজারে সরাসরি ডাউনলোড ট্রিগার করে
export function downloadCsvRows(rows: string[][], filenamePrefix: string): void {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}
