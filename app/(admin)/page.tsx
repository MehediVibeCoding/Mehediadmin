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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div className="pb-4">
        {/* সেন্টার্ড ওয়েলকাম হেডার + নিচে অ্যাকসেন্ট-কালার ডেট পিল */}
        <div className="mb-6 flex flex-col items-center gap-2.5 text-center">
          <h1 className="font-body text-[21px] font-black tracking-tight text-ink sm:text-[26px]">
            Hi Mehedi, Welcome to Vangcur Dashboard
          </h1>

          <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-brand-light to-brand-primary px-4 py-1.5 shadow-sh2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="font-body text-[12px] font-bold text-white">
              {today}
            </span>
          </div>
        </div>

        {/* ১. লাইভ আবহাওয়া উইজেট (ব্র্যান্ড স্কাই-ব্লু গ্লাস) */}
        <WeatherWidget />

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
      <div className="card-hover-glow mx-auto max-w-xl rounded-[24px] border border-red-200/80 bg-white/85 p-6 shadow-sh1 backdrop-blur-xl">
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
