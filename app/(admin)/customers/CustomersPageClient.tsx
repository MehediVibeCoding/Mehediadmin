'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Customer, Order, OrderStatus } from '@/types';
import { getCustomersPage, type CustomersPageResult } from '@/app/actions/customers';
import { getBkashLinkedOrder } from '@/app/actions/bkash';
import { updateOrderStatus } from '@/app/actions/orders';
import { playChaChing } from '@/lib/sound';
import { useToast } from '@/components/admin/Toast';
import { useOrdersRealtime } from '@/components/admin/OrdersRealtimeProvider';
import CustomersTable, { customerKey } from '@/components/customers/CustomersTable';
import CustomerDetail from '@/components/customers/CustomerDetail';
import OrderDetailModal from '@/components/orders/OrderDetailModal';
import Pagination, { PAGE_SIZE } from '@/components/common/Pagination';

interface Props {
  initialPage: CustomersPageResult;
}

// একটাই কার্ডে তিনটা সংখ্যা — চিকন, যাতে নিচের তালিকার জন্য মোবাইলে বেশি জায়গা থাকে
function SummaryStrip({ customers, orders, spent }: { customers: number; orders: number; spent: number }) {
  const cells = [
    { label: 'কাস্টমার', value: customers.toLocaleString('en-US') },
    { label: 'অর্ডার', value: orders.toLocaleString('en-US') },
    { label: 'মোট বিক্রি', value: '৳' + spent.toLocaleString('en-US') },
  ];
  return (
    <div className="mb-3 grid grid-cols-3 divide-x divide-border-base/60 rounded-[22px] border border-white/90 bg-white py-3 shadow-sh1">
      {cells.map((c) => (
        <div key={c.label} className="min-w-0 px-3 text-center sm:px-5">
          <div className="truncate font-body text-[10.5px] font-extrabold uppercase tracking-wider text-muted">{c.label}</div>
          <div className="mt-0.5 truncate font-body text-[18px] font-black leading-tight tracking-tight text-ink sm:text-[22px]">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

// legacy #page-customers — orders টেবিল থেকে গ্রুপ করা কাস্টমার তালিকা (পেজ-ভিত্তিক, ১৪টি/পেজ)।
// 🚀 এখন সার্চ ও পেজ ভাগ সার্ভারে (ডাটাবেজের ফাংশনে) হয় — ব্রাউজারে সব কাস্টমার আসে না।
export default function CustomersPageClient({ initialPage }: Props) {
  const [data, setData] = useState<CustomersPageResult>(initialPage);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [selected, setSelected] = useState<Customer | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [openingOrderId, setOpeningOrderId] = useState<string | null>(null);
  const [detailRefresh, setDetailRefresh] = useState(0);

  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const { ordersVersion } = useOrdersRealtime();

  const paramsRef = useRef({ page, debouncedQuery });
  paramsRef.current = { page, debouncedQuery };

  // দেরিতে আসা পুরনো রেসপন্স যেন নতুনটাকে না ঢেকে দেয়
  const reqIdRef = useRef(0);

  const load = useCallback(async (p: { page: number; debouncedQuery: string }) => {
    const id = ++reqIdRef.current;
    setLoading(true);
    try {
      const res = await getCustomersPage({ search: p.debouncedQuery, page: p.page, pageSize: PAGE_SIZE });
      if (id !== reqIdRef.current) return;
      setData(res);
      // পেজ শেষ হয়ে গেলে সর্বশেষ বৈধ পেজে নামানো
      const maxPage = Math.max(1, Math.ceil(res.total / PAGE_SIZE));
      if (p.page > maxPage) setPage(maxPage);
    } catch {
      if (id === reqIdRef.current) showToastRef.current('❌ কাস্টমার লোড ব্যর্থ হয়েছে');
    } finally {
      if (id === reqIdRef.current) setLoading(false);
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

  // পেজ/সার্চ বদলালে সার্ভার থেকে নতুন পেজ। প্রথম মাউন্টে initialPage থাকায় স্কিপ।
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    load({ page, debouncedQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedQuery]);

  // নতুন অর্ডার/আপডেটের রিয়েলটাইম ইভেন্ট এলে (সার্ভার-ক্যাশ মোছার পর) বর্তমান পেজ নীরবে নতুন
  useEffect(() => {
    if (ordersVersion === 0) return;
    load(paramsRef.current);
  }, [ordersVersion, load]);

  async function openOrder(id: string) {
    if (openingOrderId) return;
    setOpeningOrderId(id);
    try {
      const o = await getBkashLinkedOrder(id);
      if (o) setViewingOrder(o);
      else showToastRef.current('❌ অর্ডার খুঁজে পাওয়া যায়নি');
    } catch {
      showToastRef.current('❌ অর্ডার লোড ব্যর্থ হয়েছে');
    } finally {
      setOpeningOrderId(null);
    }
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    const res = await updateOrderStatus(id, status);
    if (res.status === 'ok') {
      setViewingOrder((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
      setDetailRefresh((v) => v + 1);
      if (status === 'confirmed') playChaChing();
      showToastRef.current('✅ স্ট্যাটাস আপডেট হয়েছে');
    } else {
      showToastRef.current('❌ ' + (res.message || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে'));
    }
  }

  const paginated = data.rows;
  const totalFiltered = data.total;
  const totals = data.totals;

  return (
    <div>
      <SummaryStrip customers={totals.customers} orders={totals.orders} spent={totals.spent} />

      {/* সার্চ */}
      <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-light"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম, ফোন বা ইমেইল দিয়ে খুঁজুন..."
            className="h-11 w-full rounded-full border border-border-base/80 bg-surface-muted/50 pl-11 pr-10 font-body text-[13px] font-medium text-ink transition-all duration-brand placeholder:text-muted/70 focus:bg-white lg:h-10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="সার্চ মুছুন"
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-border-base/70 text-muted transition-colors hover:bg-brand-light hover:text-white"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* মোবাইলে কার্ড সরাসরি ক্যানভাসে; ডেস্কটপে (≥1024px) একটাই সাদা কার্ডে টেবিল + পেজিনেশন */}
      <div className="lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-white/90 lg:bg-white lg:shadow-sh1">
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <CustomersTable customers={paginated} onSelect={setSelected} selectedKey={selected ? customerKey(selected) : null} />
        </div>
        {totalFiltered > 0 && (
          <div className="mt-3 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1 lg:mt-0 lg:rounded-none lg:border-0 lg:border-t lg:border-border-base/60 lg:px-5 lg:shadow-none">
            <Pagination page={page} total={totalFiltered} onPageChange={setPage} bare />
          </div>
        )}
      </div>

      {selected && (
        <CustomerDetail
          customer={selected}
          onClose={() => setSelected(null)}
          onOpenOrder={openOrder}
          openingOrderId={openingOrderId}
          suspendEsc={!!viewingOrder}
          refreshKey={detailRefresh}
        />
      )}

      {/* কাস্টমার প্যানেলের পরে রেন্ডার — তাই একই z-index-এ উপরে বসে */}
      {viewingOrder && (
        <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrder(null)} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}
