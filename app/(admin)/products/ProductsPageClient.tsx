'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Product } from '@/types';
import type { CategoryOption } from '@/lib/constants/categories';
import {
  getProductsPage,
  getProductById,
  getCategoryCounts,
  type ProductsPageResult,
  type CategoryCounts,
} from '@/app/actions/products';
import { PAGE_SIZE } from '@/lib/constants/pagination';
import ProductsTable from '@/components/products/ProductsTable';
import ProductModal from '@/components/products/ProductModal';
import { useToast } from '@/components/admin/Toast';
import { emptyFormState, productToFormState } from '@/lib/product-form';

interface Props {
  initialPage: ProductsPageResult;
  initialCounts: CategoryCounts;
  categories: CategoryOption[];
}

type ModalState =
  | { mode: 'add'; initialCat?: string }
  | { mode: 'edit'; id: number; product?: Product };

// 🚀 (প্রোডাক্ট লিস্ট স্কেল ফিক্স, ২০২৬-১০): আগে এখানে সব প্রোডাক্ট একবারে
// ব্রাউজারে থাকত (initialProducts), আর সার্চ/ফিল্টার/পেজিং সব ক্লায়েন্টে হতো।
// এখন customers পেজের মতোই — শুধু বর্তমান পেজ ব্রাউজারে থাকে, সার্চ/ক্যাটাগরি/পেজ
// বদলালে getProductsPage() সার্ভারে কল হয়। ১০ হাজার প্রোডাক্টেও প্রতিবার মাত্র
// কয়েক KB আসে। এডিট-মোডাল খোলার সময়ই শুধু একটা প্রোডাক্টের পুরো ডেটা আসে।
export default function ProductsPageClient({ initialPage, initialCounts, categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const [data, setData] = useState<ProductsPageResult>(initialPage);
  const [counts, setCounts] = useState<CategoryCounts>(initialCounts);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [catFilter, setCatFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [modal, setModal] = useState<ModalState | null>(null);

  const paramsRef = useRef({ page, catFilter, debouncedQuery });
  paramsRef.current = { page, catFilter, debouncedQuery };

  // দেরিতে আসা পুরনো রেসপন্স যেন নতুনটাকে না ঢেকে দেয় (customers পেজের একই প্যাটার্ন)
  const reqIdRef = useRef(0);

  const load = useCallback(async (p: { page: number; catFilter: string; debouncedQuery: string }) => {
    const id = ++reqIdRef.current;
    setLoading(true);
    try {
      const res = await getProductsPage({ search: p.debouncedQuery, cat: p.catFilter, page: p.page, pageSize: PAGE_SIZE });
      if (id !== reqIdRef.current) return;
      setData(res);
      const maxPage = Math.max(1, Math.ceil(res.total / PAGE_SIZE));
      if (p.page > maxPage) setPage(maxPage);
    } catch {
      if (id === reqIdRef.current) showToastRef.current('❌ প্রোডাক্ট লোড ব্যর্থ হয়েছে');
    } finally {
      if (id === reqIdRef.current) setLoading(false);
    }
  }, []);

  const loadCounts = useCallback(async () => {
    try {
      setCounts(await getCategoryCounts());
    } catch {
      // গণনা রিফ্রেশ ব্যর্থ হলেও তালিকা দেখাতে বাধা নেই — চুপচাপ বাদ
    }
  }, []);

  // সার্চ টাইপ করার সময় প্রতি অক্ষরে সার্ভার কল না করে ৩০০ms পরে
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // পেজ/ক্যাটাগরি/সার্চ বদলালে সার্ভার থেকে নতুন পেজ। প্রথম মাউন্টে initialPage থাকায় স্কিপ।
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    load({ page, catFilter, debouncedQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, catFilter, debouncedQuery]);

  // ক্যাটাগরি ম্যানেজমেন্ট পেজের "+ প্রোডাক্ট" বাটন থেকে আসলে (?openAdd=<catId>)
  // সেই ক্যাটাগরি প্রি-সিলেক্ট করে অ্যাড-মোডাল খুলে দাও, তারপর URL পরিষ্কার করো
  useEffect(() => {
    const catId = searchParams.get('openAdd');
    if (catId) {
      setModal({ mode: 'add', initialCat: catId });
      router.replace('/products');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reload() {
    load(paramsRef.current);
  }

  // মডাল আগেই (লোডিং অবস্থায়) খুলে যায়, তারপর প্রোডাক্টের পুরো ডেটা আসে — নিচের
  // setModal কলব্যাকগুলো cur.id === id চেক করে, তাই মাঝে অন্য প্রোডাক্ট এডিটে গেলে
  // দেরিতে আসা পুরনো রেসপন্স ভুল প্রোডাক্টে বসবে না।
  function handleEdit(id: number) {
    setModal({ mode: 'edit', id, product: undefined });
    getProductById(id)
      .then((product) => {
        setModal((cur) => (cur && cur.mode === 'edit' && cur.id === id ? { ...cur, product: product || undefined } : cur));
      })
      .catch(() => {
        showToastRef.current('❌ প্রোডাক্ট লোড ব্যর্থ হয়েছে');
        setModal((cur) => (cur && cur.mode === 'edit' && cur.id === id ? null : cur));
      });
  }

  const editingProduct = modal?.mode === 'edit' ? modal.product : undefined;
  const editingLoading = modal?.mode === 'edit' && !modal.product;

  return (
    <div>
      <ProductsTable
        rows={data.rows}
        total={data.total}
        page={page}
        pageSize={PAGE_SIZE}
        loading={loading}
        query={query}
        catFilter={catFilter}
        counts={counts}
        categories={categories}
        onQueryChange={setQuery}
        onCatChange={(c) => {
          setCatFilter(c);
          setPage(1);
        }}
        onPageChange={setPage}
        onEdit={handleEdit}
        onAdd={() => setModal({ mode: 'add' })}
        onReordered={(rows) => setData((d) => ({ ...d, rows }))}
        onChanged={() => {
          reload();
          loadCounts();
        }}
      />

      {editingLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="flex items-center gap-2.5 rounded-full bg-white px-5 py-3 shadow-sh1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] animate-spin text-brand-light">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v5h-5" />
            </svg>
            <span className="font-body text-[13px] font-extrabold text-ink">লোড হচ্ছে…</span>
          </div>
        </div>
      )}

      {modal && !editingLoading && (
        <ProductModal
          categories={categories}
          editingProduct={editingProduct}
          initialState={
            editingProduct
              ? productToFormState(editingProduct)
              : emptyFormState((modal.mode === 'add' && modal.initialCat) || categories[0]?.id || 'rgb')
          }
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            reload();
            loadCounts();
          }}
        />
      )}
    </div>
  );
}
