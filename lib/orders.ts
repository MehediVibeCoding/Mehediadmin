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

// একটাই সোর্স অফ ট্রুথ: dot (স্ট্যাটাস ডট/ফিল্টার), bg+text (পিল ও সিলেক্টেড বাটন)।
// ব্র্যান্ড নিয়ম: গাঢ় নীল/ইন্ডিগো নেই — Confirmed = সিগনেচার স্কাই-ব্লু (#44A7FC),
// Shipped = ভায়োলেট (যাতে স্কাই-ব্লু থেকে আলাদা বোঝা যায়)। text রংগুলো ছোট লেখার জন্য ≥4.5:1 কনট্রাস্ট।
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  pending: { label: 'Pending', dot: '#F59E0B', bg: '#FEF3C7', text: '#92400E' },
  confirmed: { label: 'Confirmed', dot: '#44A7FC', bg: '#E3F2FF', text: '#0F6FC6' },
  shipped: { label: 'Shipped', dot: '#8B5CF6', bg: '#EDE9FE', text: '#6D28D9' },
  delivered: { label: 'Delivered', dot: '#10B981', bg: '#D1FAE5', text: '#065F46' },
  cancelled: { label: 'Cancelled', dot: '#EF4444', bg: '#FEE2E2', text: '#B91C1C' },
  rejected: { label: 'Rejected', dot: '#B91C1C', bg: '#FECACA', text: '#7F1D1D' },
};

// ⚠️ আপডেট: storefront-এ এখন ডায়নামিক অ্যাডভান্স (৳৮,০০০-এর নিচে ৳২০০ ফিক্সড,
// ৳৮,০০০–২০,০০০ রেঞ্জে 5% + তার উপর 1.5% bKash ট্রানজেকশন ফি)। তাই এই ধ্রুবক
// আর সরাসরি ব্যবহার করা হয় না — শুধু legacy/পুরনো অর্ডারের জন্য ফলব্যাক ডিফল্ট
// হিসেবে রাখা হয়েছে, যেখানে DB-তে advance_paid null/undefined। আসল মান সবসময়
// order.advance_paid থেকে পড়তে হবে: `order.advance_paid ?? ORDER_ADVANCE_FALLBACK`
export const ORDER_ADVANCE_FALLBACK = 200;
/** @deprecated ব্যাকওয়ার্ড কম্প্যাটিবিলিটির জন্য রাখা — নতুন কোডে ORDER_ADVANCE_FALLBACK বা getOrderAdvance() ব্যবহার করো */
export const ORDER_ADVANCE = ORDER_ADVANCE_FALLBACK;

/** legacy অর্ডারে advance_paid না থাকলে নিরাপদ ফলব্যাক (৳২০০) — কখনো `total - 200` হার্ডকোড করা যাবে না */
export function getOrderAdvance(order: Pick<Order, 'advance_paid'>): number {
  return normalizeAdvance(order.advance_paid);
}

/**
 * advance_paid নর্মালাইজ: null/undefined/খালি/অসংখ্যা/ঋণাত্মক হলে legacy fallback (২০০);
 * ০ সহ যেকোনো অঋণাত্মক সংখ্যা যেমন আছে তেমনই থাকে (Legendary Zero-Advance অর্ডারে ০ সঠিক মান)।
 */
function normalizeAdvance(raw: unknown): number {
  if (raw === null || raw === undefined || raw === '') return ORDER_ADVANCE_FALLBACK;
  const v = Number(raw);
  return Number.isFinite(v) && v >= 0 ? v : ORDER_ADVANCE_FALLBACK;
}

/** ডেলিভারিতে বাকি (COD) — total - advance_paid, কখনো ঋণাত্মক না */
export function getOrderDueCOD(order: Pick<Order, 'total' | 'advance_paid'>): number {
  const total = Number(order.total) || 0;
  return Math.max(0, total - getOrderAdvance(order));
}

/** ৳২০০-এর বেশি অ্যাডভান্স মানেই ডায়নামিক ৫% + bKash ফি টিয়ার প্রযোজ্য হয়েছে */
export function isAdvanceTier2(order: Pick<Order, 'advance_paid'>): boolean {
  return getOrderAdvance(order) > ORDER_ADVANCE_FALLBACK;
}

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
    discount_amount: Number(o.discount_amount) || 0,
    coupon_code: o.coupon_code || null,
    total: o.total || 0,
    // legacy অর্ডারে column null/undefined থাকলে ফলব্যাক ৳২০০ — কখনো hardcode `200` লেখা যাবে না,
    // এই একটামাত্র জায়গাতেই ফলব্যাকটা বসে, বাকি সব জায়গায় order.advance_paid সরাসরি পড়া হয়
    // 0 একটি বৈধ মান (Legendary "Zero Advance" ভাউচারের অর্ডার) — শুধু null/undefined/খালি/অবৈধ
    // হলেই legacy fallback (২০০)। আগে `> 0` চেক ০-কেও ২০০ বানিয়ে ফেলত।
    advance_paid: normalizeAdvance(o.advance_paid),
    payment_txn: o.payment_txn || '',
    payment_last4: o.payment_last4 || '',
    fingerprint_id: o.fingerprint_id || null,
    ip: o.ip || '',
    user_id: o.user_id || null,
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

// কাস্টমার সাইটের মেম্বারশিপের ডায়মন্ড লেভেল = ৫–৯টি ডেলিভার্ড অর্ডার
// (সিলভার ১–২, গোল্ড ৩–৪, লিজেন্ডারি ১০+ — lib/membershipData.ts-এর সাথে মিল রেখে)।
export const DIAMOND_MIN_DELIVERED = 5;
export const DIAMOND_MAX_DELIVERED = 9;

export function isDiamondByDeliveredCount(deliveredCount: number): boolean {
  return deliveredCount >= DIAMOND_MIN_DELIVERED && deliveredCount <= DIAMOND_MAX_DELIVERED;
}

/** ডায়মন্ড সুবিধা (আগে পাঠানো + সারপ্রাইজ গিফট) এখনো দেওয়ার বাকি — শিপ হয়ে গেলে আর অ্যাকশন লাগে না */
export function needsDiamondAction(order: Pick<Order, 'member_tier' | 'status'>): boolean {
  return order.member_tier === 'diamond' && (order.status === 'pending' || order.status === 'confirmed');
}
