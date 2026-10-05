import { listCoupons, getCouponStats } from '@/app/actions/coupons';
import CouponsPageClient from './CouponsPageClient';
import PageErrorBox from '@/components/common/PageErrorBox';

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
      <PageErrorBox
        title="কুপন লোড করতে সমস্যা হয়েছে"
        message={message}
        hint={
          <>
            সাধারণত এর কারণ: Supabase-এ <code>coupons</code> টেবিল এখনো তৈরি হয়নি (supabase/coupons.sql চালান),
            অথবা Vercel-এ SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL ভুল বা missing।
          </>
        }
      />
    );
  }
}
