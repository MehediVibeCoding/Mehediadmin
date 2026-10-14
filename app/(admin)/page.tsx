import { getDashboardData } from '@/app/actions/dashboard';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import StatGrid from '@/components/dashboard/StatGrid';
import RecentOrders from '@/components/dashboard/RecentOrders';
import TodoCard from '@/components/dashboard/TodoCard';
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
    return (
      <TrafficProvider>
        {/* ওয়েদার কার্ড পেজের একদম মাথায় — প্যানেলের উপরের প্যাডিং (pt-3 / md:pt-6) -mt দিয়ে মুছে লাগানো, উপরের কোণ সোজা */}
        <div className="-mt-3 md:-mt-6">
          <WeatherWidget />
        </div>

        {/*
          মোবাইল ক্রম: আজ কী করতে হবে → প্রফিট+মেট্রিক → রেভিনিউ চার্ট → ইনসাইট (সোয়াইপ, বিকাশ প্রথম) → সর্বশেষ অর্ডার → দ্রুত কাজ → কম স্টক
          ডেস্কটপ (≥১০২৪px): বাম কলাম প্রফিট/চার্ট, ডান কলামে করণীয়/দ্রুত কাজ; তারপর ইনসাইট দুই কলামে; সবশেষে অর্ডার ও কম স্টক।
          DOM ক্রম = ডেস্কটপের পড়ার ক্রম; মোবাইলে order-* দিয়ে সাজানো।
        */}
        <div className="mt-4 grid grid-cols-1 gap-5 pb-4 lg:grid-cols-[1.45fr_1fr]">
          <div className="order-2 min-w-0 lg:order-none">
            <StatGrid stats={data.stats} insights={data.insights} />
          </div>
          <div className="order-1 min-w-0 lg:order-none">
            <TodoCard actions={data.actions} />
          </div>

          <div className="order-3 min-w-0 lg:order-none [&>*]:h-full">
            <RevenueChart revenueByDate={data.revenueByDate} />
          </div>
          <div className="order-6 min-w-0 lg:order-none [&>*]:h-full">
            <QuickActions />
          </div>

          <div className="order-4 min-w-0 lg:order-none lg:col-span-2">
            <InsightCarousel stats={data.stats} insights={data.insights} />
          </div>

          <div className={`order-5 min-w-0 lg:order-none [&>*]:h-full ${data.lowStock.length > 0 ? '' : 'lg:col-span-2'}`}>
            <RecentOrders orders={data.recentOrders} />
          </div>
          {data.lowStock.length > 0 && (
            <div className="order-7 min-w-0 lg:order-none [&>*]:h-full">
              <LowStockAlert items={data.lowStock} />
            </div>
          )}
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
