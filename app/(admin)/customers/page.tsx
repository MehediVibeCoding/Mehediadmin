import { getCustomersPage } from '@/app/actions/customers';
import { PAGE_SIZE } from '@/lib/constants/pagination';
import CustomersPageClient from './CustomersPageClient';
import PageErrorBox from '@/components/common/PageErrorBox';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  try {
    const initial = await getCustomersPage({ search: '', page: 1, pageSize: PAGE_SIZE });
    return <CustomersPageClient initialPage={initial} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <PageErrorBox
        title="কাস্টমার লোড করতে সমস্যা হয়েছে"
        message={message}
        hint="সাধারণত এর কারণ: Vercel-এ SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL ভুল বা missing, অথবা Supabase-এ orders টেবিল এখনো তৈরি হয়নি।"
      />
    );
  }
}
