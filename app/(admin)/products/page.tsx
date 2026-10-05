import { listProducts } from '@/app/actions/products';
import { getCategories } from '@/app/actions/categories';
import ProductsPageClient from './ProductsPageClient';
import PageErrorBox from '@/components/common/PageErrorBox';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  try {
    const [products, categories] = await Promise.all([listProducts(), getCategories()]);
    return <ProductsPageClient initialProducts={products} categories={categories} />;
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
