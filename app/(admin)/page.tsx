import { getDashboardData } from '@/app/actions/dashboard';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import StatGrid from '@/components/dashboard/StatGrid';
import RecentOrders from '@/components/dashboard/RecentOrders';
import QuickActions from '@/components/dashboard/QuickActions';
import RevenueChart from '@/components/dashboard/RevenueChart';
import OrderStatusDonut from '@/components/dashboard/OrderStatusDonut';
import LowStockAlert from '@/components/dashboard/LowStockAlert';

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
      <div className="card-hover-glow mx-auto max-w-xl rounded-[24px] border border-red-200/80 bg-white p-6 shadow-sh1">
        <div className="flex items-center gap-3 border-b border-red-100 pb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-danger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 className="font-body text-[16px] font-black text-danger">ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে</h2>
            <p className="font-body text-[12px] font-medium text-muted">ডাটাবেজ বা নেটওয়ার্ক সংযোগ যাচাই করুন</p>
          </div>
        </div>
        <p className="mt-3 font-body text-[13px] text-ink/80">{message}</p>
        <p className="mt-3 rounded-lg bg-surface-muted p-2.5 font-body text-[11px] text-muted">
          টিপস: Vercel-এ SUPABASE_SERVICE_ROLE_KEY এবং NEXT_PUBLIC_SUPABASE_URL সঠিকভাবে যুক্ত আছে কি না দেখে নিন।
        </p>
      </div>
    );
  }
}
