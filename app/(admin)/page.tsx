import { getDashboardData } from '@/app/actions/dashboard';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import StatGrid from '@/components/dashboard/StatGrid';
import RecentOrders from '@/components/dashboard/RecentOrders';
import QuickActions from '@/components/dashboard/QuickActions';
import RevenueChart from '@/components/dashboard/RevenueChart';
import LowStockAlert from '@/components/dashboard/LowStockAlert';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    const data = await getDashboardData();
    const today = new Date().toLocaleDateString('bn-BD', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div>
        <div className="mb-5 text-center">
          <h1 className="font-display text-xl text-ink md:text-2xl">Hi Mehedi, Welcome To Vangcur Dashboard</h1>
          <p className="mt-1 text-sm text-muted">{today}</p>
        </div>

        <WeatherWidget />

        <StatGrid stats={data.stats} />

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <RecentOrders orders={data.recentOrders} />
          <QuickActions />
        </div>

        <RevenueChart revenueByDate={data.revenueByDate} />

        <LowStockAlert items={data.lowStock} />
      </div>
    );
  } catch (err) {
    // Supabase/env সমস্যা হলে blank 500 না দেখিয়ে আসল কারণটা দেখাও —
    // এটা শুধু ডায়াগনস্টিকের জন্য, রুট কজ ফিক্স হয়ে গেলে এই catch আর
    // trigger হবে না।
    const message = err instanceof Error ? err.message : String(err);
    return (
      <div className="rounded-brand border border-red-200 bg-red-50 p-6 text-red-700">
        <h1 className="mb-2 font-display text-lg">ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে</h1>
        <p className="text-sm">{message}</p>
        <p className="mt-3 text-xs text-red-500">
          সাধারণত এর কারণ: Vercel-এ SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL ভুল বা
          missing, অথবা Supabase-এ orders / page_views টেবিল এখনো তৈরি হয়নি।
        </p>
      </div>
    );
  }
}
