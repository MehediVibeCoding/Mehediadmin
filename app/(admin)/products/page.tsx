import { getProductsPage, getCategoryCounts } from '@/app/actions/products';
import { getCategories } from '@/app/actions/categories';
import { PAGE_SIZE } from '@/lib/constants/pagination';
import ProductsPageClient from './ProductsPageClient';
import PageErrorBox from '@/components/common/PageErrorBox';

export const dynamic = 'force-dynamic';

// 🚀 (প্রোডাক্ট লিস্ট স্কেল ফিক্স): আগে এখানে listProducts() দিয়ে পুরো টেবিল
// একবারে আসত। এখন শুধু প্রথম পেজ (হালকা কলাম) + ক্যাটাগরি-গণনা সার্ভার থেকে আসে;
// বাকি পেজ/সার্চ ক্লায়েন্ট থেকে getProductsPage() কল করে আনবে (ProductsPageClient দ্রষ্টব্য)।
export default async function ProductsPage() {
  try {
    const [initialPage, counts, categories] = await Promise.all([
      getProductsPage({ search: '', cat: 'all', page: 1, pageSize: PAGE_SIZE }),
      getCategoryCounts(),
      getCategories(),
    ]);
    return <ProductsPageClient initialPage={initialPage} initialCounts={counts} categories={categories} />;
  } catch (err) {
    // Supabase/env সমস্যা হলে blank 500 না দেখিয়ে আসল কারণটা দেখাও —
    // এটা শুধু ডায়াগনস্টিকের জন্য, রুট কজ ফিক্স হয়ে গেলে এই catch আর
    // trigger হবে না।
    const message = err instanceof Error ? err.message : String(err);
    return (
      <PageErrorBox
        title="প্রোডাক্ট লোড করতে সমস্যা হয়েছে"
        message={message}
        hint="সাধারণত এর কারণ: Vercel-এ SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL ভুল বা missing, অথবা Supabase-এ custom_products / store_settings টেবিল এখনো তৈরি হয়নি।"
      />
    );
  }
}
