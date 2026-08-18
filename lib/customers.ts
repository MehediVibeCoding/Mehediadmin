import type { Order, Customer } from '@/types';

// legacy renderCustomers()-এর reduce লজিক থেকে হুবহু পোর্ট করা — আলাদা কোনো
// `customers` টেবিল নেই, `orders` রো-গুলো থেকেই গ্রুপ করে কাস্টমার লিস্ট
// বানানো হয়। dedupe key = ফোন (না থাকলে নাম)। নাম/ফোন/ইমেইল প্রথমবার যে
// অর্ডারে এই কাস্টমার পাওয়া যায় সেটা থেকে বসে; order_count/total_spent
// যোগ হতে থাকে এবং last_order_date সবসময় সর্বোচ্চ created_at রাখে —
// legacy-র `if(o.date > acc[k].lastDate) acc[k].lastDate = o.date` এর
// মতোই ইনপুট অর্ডারের ক্রম নির্বিশেষে সঠিক ফলাফল দেয়।
export function aggregateCustomers(orders: Order[]): Customer[] {
  const map = new Map<string, Customer>();

  for (const o of orders) {
    const name = o.customer_name || '';
    const phone = o.customer_phone || '';
    const email = o.customer_email || '';
    if (!phone && !name) continue;

    const key = phone || name;
    let c = map.get(key);
    if (!c) {
      c = { name, phone, email, order_count: 0, total_spent: 0, last_order_date: o.created_at || '' };
      map.set(key, c);
    }
    c.order_count += 1;
    c.total_spent += o.total || 0;
    if (o.created_at && o.created_at > c.last_order_date) c.last_order_date = o.created_at;
  }

  return Array.from(map.values());
}
