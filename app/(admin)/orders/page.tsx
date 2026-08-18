import { listOrders } from '@/app/actions/orders';
import OrdersPageClient from './OrdersPageClient';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  try {
    const orders = await listOrders();
    return <OrdersPageClient initialOrders={orders} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <div className="rounded-brand border border-red-200 bg-red-50 p-6 text-red-700">
        <h1 className="mb-2 font-display text-lg">অর্ডার লোড করতে সমস্যা হয়েছে</h1>
        <p className="text-sm">{message}</p>
        <p className="mt-3 text-xs text-red-500">
          সাধারণত এর কারণ: Vercel-এ SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL ভুল বা
          missing, অথবা Supabase-এ orders টেবিল এখনো তৈরি হয়নি।
        </p>
      </div>
    );
  }
}
