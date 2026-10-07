import { getCategories } from '@/app/actions/categories';
import { getCategoryCounts } from '@/app/actions/products';
import CategoriesPageClient from '@/components/design/CategoriesPageClient';

export const dynamic = 'force-dynamic';

// legacy getCatProdCount() — 'all' বাদে প্রতিটা ক্যাটাগরিতে কয়টা প্রোডাক্ট আছে (multi-cat p.cats সাপোর্ট সহ)।
// 🚀 আগে এর জন্য সব প্রোডাক্ট ব্রাউজারে এনে গোনা হতো; এখন ডাটাবেজের
// admin_category_counts() RPC একবারেই গুনে ফেরত দেয় (১০ হাজার প্রোডাক্টেও হালকা)।
export default async function CategoriesPage() {
  const [categories, counts] = await Promise.all([getCategories(), getCategoryCounts()]);

  const productCounts: Record<string, number> = {};
  categories.forEach((c) => {
    productCounts[c.id] = c.id === 'all' ? counts.all : counts.byCat[c.id] || 0;
  });

  return (
    <div className="mx-auto max-w-3xl">
      <CategoriesPageClient categories={categories} productCounts={productCounts} />
    </div>
  );
}
