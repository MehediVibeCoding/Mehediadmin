import { getCategories } from '@/app/actions/categories';
import { listProducts } from '@/app/actions/products';
import CategoriesPageClient from '@/components/design/CategoriesPageClient';

export const dynamic = 'force-dynamic';

// legacy getCatProdCount() — 'all' বাদে প্রতিটা ক্যাটাগরিতে কয়টা প্রোডাক্ট আছে (multi-cat p.cats সাপোর্ট সহ)
export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([getCategories(), listProducts()]);

  const productCounts: Record<string, number> = {};
  categories.forEach((c) => {
    if (c.id === 'all') {
      productCounts[c.id] = products.length;
      return;
    }
    productCounts[c.id] = products.filter((p) =>
      Array.isArray(p.cats) && p.cats.length ? p.cats.includes(c.id) : p.cat === c.id
    ).length;
  });

  return (
    <div className="mx-auto max-w-3xl">
      <CategoriesPageClient categories={categories} productCounts={productCounts} />
    </div>
  );
}
