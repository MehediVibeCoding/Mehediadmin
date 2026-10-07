import { getTrafficData } from '@/app/actions/traffic';
import TrafficPageClient from './TrafficPageClient';
import PageErrorBox from '@/components/common/PageErrorBox';

export const dynamic = 'force-dynamic';

export default async function TrafficPage() {
  try {
    const data = await getTrafficData();
    return <TrafficPageClient initialData={data} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <PageErrorBox
        title="ট্রাফিক ডাটা লোড করতে সমস্যা হয়েছে"
        message={message}
        hint="সাধারণত এর কারণ: অ্যাডমিন লগইন সেশন শেষ হয়ে যাওয়া বা Vercel-এ ADMIN_EMAIL / Supabase এনভায়রনমেন্ট ভেরিয়েবল ভুল বা missing।"
      />
    );
  }
}
