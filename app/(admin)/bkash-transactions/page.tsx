import { listBkashPage } from '@/app/actions/bkash';
import BkashPageClient from './BkashPageClient';
import { PAGE_SIZE } from '@/lib/constants/pagination';
import PageErrorBox from '@/components/common/PageErrorBox';

export const dynamic = 'force-dynamic';

export default async function BkashTransactionsPage() {
  try {
    const initial = await listBkashPage({
      page: 1,
      pageSize: PAGE_SIZE,
      filter: 'all',
      search: '',
    });
    return <BkashPageClient initialPage={initial} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <PageErrorBox
        title="বিকাশ লেনদেন লোড করতে সমস্যা হয়েছে"
        message={message}
        hint="সাধারণত এর কারণ: Vercel-এ SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL ভুল বা missing, অথবা Supabase-এ bkash_inbox টেবিল এখনো তৈরি হয়নি।"
      />
    );
  }
}
