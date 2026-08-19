import type { Order } from '@/types';

// legacy setOrderStatus()-এর addConfirmed payload থেকে হুবহু পোর্ট করা।
// আগে browser → নিজের সাইটের /api/sync-sheet → Google Apps Script — এই
// দুই-ধাপে যেত (কারণ vanilla SPA-তে URL গোপন রাখার আর কোনো উপায় ছিল না)।
// এখানে সরাসরি সার্ভার থেকে (Server Action-এর ভেতরের `after()` কলব্যাক থেকে)
// পাঠানো হচ্ছে — GOOGLE_SHEET_URL কখনো browser-এ যায় না, তাই আলাদা কোনো
// public proxy route লাগছে না।
export async function syncConfirmedOrderToSheet(order: Order): Promise<void> {
  const url = process.env.GOOGLE_SHEET_URL;
  if (!url) {
    console.warn('GOOGLE_SHEET_URL সেট করা নেই — Google Sheet sync স্কিপ করা হলো।');
    return;
  }

  const payload = {
    action: 'addConfirmed',
    orderNum: order.order_num,
    date: order.created_at,
    name: order.customer_name || '',
    phone: order.customer_phone || '',
    dist: order.customer_district || '',
    addr: order.customer_address || '',
    email: order.customer_email || '',
    items: (order.items || []).map((i) => `${i.name} × ${i.qty}`).join('; '),
    itemsRaw: order.items || [],
    shippingCost: order.shipping_cost || 0,
    total: order.total || 0,
    ip: order.ip || '',
  };

  try {
    // legacy proxy Google Apps Script-কে 'text/plain' দিয়ে কল করত (Apps
    // Script-এর CORS preflight এড়াতে) — Script-এর doPost() ঠিক এই
    // content-type-এ raw JSON string আশা করে, তাই এখানেও একই রাখা হলো।
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    // legacy-ও silently fail করত (.catch(()=>{})) — এই sync ব্যর্থ হলে
    // অর্ডারের মূল স্ট্যাটাস-আপডেট আটকাবে না, শুধু সার্ভার লগে নোট থাকবে।
    console.warn('Google Sheet sync ব্যর্থ:', e instanceof Error ? e.message : e);
  }
}
