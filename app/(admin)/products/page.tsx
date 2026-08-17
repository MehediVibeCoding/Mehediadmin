import { listProducts } from '@/app/actions/products';
import { getCategories } from '@/app/actions/categories';
import ProductsPageClient from './ProductsPageClient';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([listProducts(), getCategories()]);
  return <ProductsPageClient initialProducts={products} categories={categories} />;
}
