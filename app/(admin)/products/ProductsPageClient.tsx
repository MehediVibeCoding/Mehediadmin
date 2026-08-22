'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const [products, setProducts] = useState(initialProducts);
  const [modal, setModal] = useState<{ product?: Product; initialCat?: string } | null>(null);

  useEffect(() => setProducts(initialProducts), [initialProducts]);

  // ক্যাটাগরি ম্যানেজমেন্ট পেজের "+ প্রোডাক্ট" বাটন থেকে আসলে (?openAdd=<catId>)
  // সেই ক্যাটাগরি প্রি-সিলেক্ট করে অ্যাড-মোডাল খুলে দাও, তারপর URL পরিষ্কার করো
  useEffect(() => {
    const catId = searchParams.get('openAdd');
    if (catId) {
      setModal({ initialCat: catId });
      router.replace('/products');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refresh() {
    router.refresh();
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-bold text-xl text-ink">প্রোডাক্ট ম্যানেজমেন্ট</h1>
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
          initialState={
            modal.product
              ? productToFormState(modal.product)
              : emptyFormState(modal.initialCat || categories[0]?.id || 'rgb')
          }
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
