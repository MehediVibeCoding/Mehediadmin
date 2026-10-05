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
        hint="সাধারণত এর কারণ: Vercel-এ SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL ভুল বা missing, অথবা Supabase-এ page_views টেবিল এখনো তৈরি হয়নি।"
      />
    );
  }
}
