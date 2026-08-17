'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types';
import type { CategoryOption } from '@/lib/constants/categories';
import ProductsTable from '@/components/products/ProductsTable';
import ProductModal from '@/components/products/ProductModal';
import { emptyFormState, productToFormState } from '@/lib/product-form';

interface Props {
  initialProducts: Product[];
  categories: CategoryOption[];
}

export default function ProductsPageClient({ initialProducts, categories }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [modal, setModal] = useState<{ product?: Product } | null>(null);

  useEffect(() => setProducts(initialProducts), [initialProducts]);

  function refresh() {
    router.refresh();
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl text-ink">প্রোডাক্ট ম্যানেজমেন্ট</h1>
        <p className="mt-0.5 text-sm text-muted">প্রোডাক্ট যোগ, এডিট, মুছুন ও সাজান</p>
      </div>

      <ProductsTable
        products={products}
        categories={categories}
        onEdit={(p) => setModal({ product: p })}
        onAdd={() => setModal({})}
        onChanged={refresh}
      />

      {modal && (
        <ProductModal
          categories={categories}
          editingProduct={modal.product}
          initialState={modal.product ? productToFormState(modal.product) : emptyFormState(categories[0]?.id || 'rgb')}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
