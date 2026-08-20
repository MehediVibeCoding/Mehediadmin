import type { Order, OrderItem, OrderStatus } from '@/types';

// legacy admin.html-এর ORD_STATUS_META/ORD_STATUS_ORDER থেকে হুবহু —
// dot রং টেবিল, স্ট্যাটাস-ড্রপডাউন ও অর্ডার ডিটেইল মোডালে ব্যবহৃত হয়
// (StatusPill কম্পোনেন্টের bg/text রং থেকে আলাদা, ওটা টেবিলের পিলের জন্য)।
//
// 'rejected' — নতুন যোগ হয়েছে (bKash manual পেমেন্ট verify ফ্লো, admin
// fake/ভুল TxnID পেলে reject করে)। Vangcur-এর storefront (TrackOrderModal,
// WaitingOverlay) আগে থেকেই এই স্ট্যাটাস হ্যান্ডেল করত, কিন্তু admin panel-এ
// এটা সেট করার কোনো উপায় ছিল না — এখন যোগ হলো।
export const ORDER_STATUS_ORDER: OrderStatus[] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'rejected',
];

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; dot: string }> = {
  pending: { label: 'Pending', dot: '#F59E0B' },
  confirmed: { label: 'Confirmed', dot: '#3B82F6' },
  shipped: { label: 'Shipped', dot: '#6366F1' },
  delivered: { label: 'Delivered', dot: '#10B981' },
  cancelled: { label: 'Cancelled', dot: '#EF4444' },
  rejected: { label: 'Rejected', dot: '#B91C1C' },
};

// legacy viewOrder()-এ ফিক্সড অ্যাডভান্স ৳২০০ (সব অর্ডারে একই)
export const ORDER_ADVANCE = 200;

function parseItems(raw: unknown): OrderItem[] {
  if (Array.isArray(raw)) return raw as OrderItem[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Supabase-এর raw orders row → app-এর Order টাইপ। column নাম legacy
// getOrdersAsync()-এর সাথে verify করা (Module ১ Dashboard-এই VERIFIED হয়েছিল)।
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapOrderRow(o: any): Order {
  return {
    id: o.id,
    order_num: o.order_num || '',
    created_at: o.created_at || '',
    status: (o.status || 'pending') as OrderStatus,
    customer_name: o.customer_name || '',
    customer_phone: o.customer_phone || '',
    customer_district: o.customer_district || '',
    customer_address: o.customer_address || '',
    customer_email: o.customer_email || '',
    items: parseItems(o.items),
    shipping: o.shipping || '',
    shipping_cost: o.shipping_cost || 0,
    subtotal: o.subtotal || 0,
    total: o.total || 0,
    payment_txn: o.payment_txn || '',
    payment_last4: o.payment_last4 || '',
    ip: o.ip || '',
  };
}

// legacy renderOrders() সার্চ ম্যাচিং — অর্ডার নং/নাম সরাসরি সাবস্ট্রিং,
// ফোন নম্বর শুধু query-তে অন্তত একটা digit থাকলেই ম্যাচ করা হয়
// (নাহলে খালি স্ট্রিং সবসময় ম্যাচ করে ফেলে ভুল রেজাল্ট দিত)
export function orderMatchesQuery(o: Order, rawQuery: string): boolean {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return true;
  const digitsQ = q.replace(/\D/g, '');
  return (
    o.order_num?.toLowerCase().includes(q) ||
    o.customer_name?.toLowerCase().includes(q) ||
    (digitsQ.length > 0 && (o.customer_phone || '').replace(/\D/g, '').includes(digitsQ))
  );
}
