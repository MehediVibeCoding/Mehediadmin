import { listCoupons, getCouponStats } from '@/app/actions/coupons';
import CouponsPageClient from './CouponsPageClient';

export const dynamic = 'force-dynamic';

export default async function CouponsPage() {
  try {
    const coupons = await listCoupons();
    const stats = await getCouponStats(coupons);
    return <CouponsPageClient initialCoupons={coupons} initialStats={stats} />;
  } catch (err) {
    // Supabase/env সমস্যা হলে blank 500 না দেখিয়ে আসল কারণটা দেখাও — products/page.tsx-এর
    // মতোই diagnostic catch, root cause ফিক্স হয়ে গেলে এটা আর trigger হবে না।
    const message = err instanceof Error ? err.message : String(err);
    return (
      <div className="rounded-brand border border-red-200 bg-red-50 p-6 text-red-700">
        <h1 className="mb-2 font-bold text-lg">কুপন লোড করতে সমস্যা হয়েছে</h1>
        <p className="text-sm">{message}</p>
        <p className="mt-3 text-xs text-red-500">
          সাধারণত এর কারণ: Supabase-এ <code>coupons</code> টেবিল এখনো তৈরি হয়নি (supabase/coupons.sql চালান),
          অথবা Vercel-এ SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL ভুল বা missing।
        </p>
      </div>
    );
  }
}
