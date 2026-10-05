import { listOrdersPage } from '@/app/actions/orders';
import OrdersPageClient from './OrdersPageClient';
import { PAGE_SIZE } from '@/lib/constants/pagination';
import PageErrorBox from '@/components/common/PageErrorBox';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  try {
    const initial = await listOrdersPage({
      page: 1,
      pageSize: PAGE_SIZE,
      status: 'all',
      search: '',
    });
    return <OrdersPageClient initialPage={initial} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <PageErrorBox
        title="অর্ডার লোড করতে সমস্যা হয়েছে"
        message={message}
        hint="সাধারণত এর কারণ: Vercel-এ SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL ভুল বা missing, অথবা Supabase-এ orders টেবিল এখনো তৈরি হয়নি।"
      />
    );
  }
}
