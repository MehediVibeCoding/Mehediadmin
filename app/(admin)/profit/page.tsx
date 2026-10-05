import { getProfitData } from '@/app/actions/profit';
import ProfitPageClient from './ProfitPageClient';
import PageErrorBox from '@/components/common/PageErrorBox';

export const dynamic = 'force-dynamic';

export default async function ProfitPage() {
  try {
    const data = await getProfitData();
    return <ProfitPageClient initialData={data} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <PageErrorBox
        title="প্রফিট ডাটা লোড করতে সমস্যা হয়েছে"
        message={message}
        hint="সাধারণত এর কারণ: Vercel-এ SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL ভুল বা missing, অথবা Supabase-এ orders টেবিল এখনো তৈরি হয়নি।"
      />
    );
  }
}
