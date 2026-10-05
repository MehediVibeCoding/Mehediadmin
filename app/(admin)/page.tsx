import { getDashboardData } from '@/app/actions/dashboard';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import StatGrid from '@/components/dashboard/StatGrid';
import RecentOrders from '@/components/dashboard/RecentOrders';
import QuickActions from '@/components/dashboard/QuickActions';
import RevenueChart from '@/components/dashboard/RevenueChart';
import OrderStatusDonut from '@/components/dashboard/OrderStatusDonut';
import LowStockAlert from '@/components/dashboard/LowStockAlert';
import PageErrorBox from '@/components/common/PageErrorBox';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    const data = await getDashboardData();
    const today = new Date().toLocaleDateString('bn-BD', {
      timeZone: 'Asia/Dhaka',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div className="pb-4">
        {/* ১. ওয়েলকাম + তারিখ + লাইভ আবহাওয়া — একটাই কার্ডে */}
        <WeatherWidget dateLabel={today} />

        {/* ২. কালারফুল প্যাস্টেল গ্লাস স্ট্যাটাস গ্রিড — একটা হিরো কার্ড + কমপ্যাক্ট টাইলস */}
        <StatGrid stats={data.stats} />

        {/* ৩. রেভিনিউ ট্রেন্ড চার্ট ও অর্ডার-অবস্থা ডোনাট পাশাপাশি */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.9fr_1.1fr]">
          <RevenueChart revenueByDate={data.revenueByDate} />
          <OrderStatusDonut stats={data.stats} />
        </div>

        {/* ৪. সর্বশেষ অর্ডারসমূহ ও কুইক অ্যাকশন প্যানেল */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.9fr_1.1fr]">
          <RecentOrders orders={data.recentOrders} />
          <QuickActions />
        </div>

        {/* ৫. কম স্টক সতর্কতা লিস্ট */}
        <LowStockAlert items={data.lowStock} />
      </div>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <PageErrorBox
        title="ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে"
        message={message}
        hint="টিপস: Vercel-এ SUPABASE_SERVICE_ROLE_KEY এবং NEXT_PUBLIC_SUPABASE_URL সঠিকভাবে যুক্ত আছে কি না দেখে নিন।"
      />
    );
  }
}
