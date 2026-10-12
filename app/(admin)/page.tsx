import { getDashboardData } from '@/app/actions/dashboard';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import StatGrid from '@/components/dashboard/StatGrid';
import RecentOrders from '@/components/dashboard/RecentOrders';
import QuickActions from '@/components/dashboard/QuickActions';
import RevenueChart from '@/components/dashboard/RevenueChart';
import InsightCarousel from '@/components/dashboard/InsightCarousel';
import { TrafficProvider } from '@/components/dashboard/TrafficProvider';
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
      <TrafficProvider>
      <div className="pb-4">
        {/* ১. ওয়েলকাম + তারিখ + লাইভ আবহাওয়া — একটাই কার্ডে */}
        <WeatherWidget dateLabel={today} />

        {/* ২. নিট প্রফিট হিরো + ছয় মেট্রিকের একটাই বোর্ড */}
        <StatGrid stats={data.stats} insights={data.insights} />

        {/* ৩. রেভিনিউ ট্রেন্ড চার্ট ও সোয়াইপযোগ্য ইনসাইট কার্ড (প্রথমটা অর্ডার অবস্থা) */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.9fr_1.1fr]">
          <RevenueChart revenueByDate={data.revenueByDate} />
          <InsightCarousel stats={data.stats} insights={data.insights} actions={data.actions} />
        </div>

        {/* ৪. সর্বশেষ অর্ডারসমূহ ও কুইক অ্যাকশন প্যানেল */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.9fr_1.1fr]">
          <RecentOrders orders={data.recentOrders} />
          <QuickActions />
        </div>

        {/* ৫. কম স্টক সতর্কতা লিস্ট */}
        <LowStockAlert items={data.lowStock} />
      </div>
      </TrafficProvider>
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
