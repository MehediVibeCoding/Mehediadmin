import { listProducts } from '@/app/actions/products';
import { getCategories } from '@/app/actions/categories';
import ProductsPageClient from './ProductsPageClient';

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
      <div className="rounded-brand border border-red-200 bg-red-50 p-6 text-red-700">
        <h1 className="mb-2 font-bold text-lg">প্রোডাক্ট লোড করতে সমস্যা হয়েছে</h1>
        <p className="text-sm">{message}</p>
        <p className="mt-3 text-xs text-red-500">
          সাধারণত এর কারণ: Vercel-এ SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL
          ভুল বা missing, অথবা Supabase-এ custom_products / store_settings টেবিল এখনো তৈরি হয়নি।
        </p>
      </div>
    );
  }
}
