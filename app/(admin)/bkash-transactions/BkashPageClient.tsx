'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Order, OrderStatus } from '@/types';
import {
  listBkashPage,
  getBkashLinkedOrder,
  type BkashFilter,
  type BkashPayment,
  type BkashPageResult,
} from '@/app/actions/bkash';
import { updateOrderStatus } from '@/app/actions/orders';
import { playChaChing } from '@/lib/sound';
import { useToast } from '@/components/admin/Toast';
import PageHeader from '@/components/admin/PageHeader';
import BkashStatCards from '@/components/bkash/BkashStatCards';
import BkashToolbar from '@/components/bkash/BkashToolbar';
import BkashTable from '@/components/bkash/BkashTable';
import RawSmsModal from '@/components/bkash/RawSmsModal';
import OrderDetailModal from '@/components/orders/OrderDetailModal';
import Pagination, { PAGE_SIZE } from '@/components/common/Pagination';

interface Props {
  initialPage: BkashPageResult;
}

// নতুন পেমেন্ট এসএমএস ধরার জন্য ট্যাব খোলা থাকলে এই বিরতিতে নীরবে রিফ্রেশ হয়
const AUTO_REFRESH_MS = 30_000;

export default function BkashPageClient({ initialPage }: Props) {
  const [rows, setRows] = useState<BkashPayment[]>(initialPage.rows);
  const [total, setTotal] = useState(initialPage.total);
  const [counts, setCounts] = useState(initialPage.counts);
  const [today, setToday] = useState(initialPage.today);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<BkashFilter>('all');
  const [page, setPage] = useState(1);

  const [smsPayment, setSmsPayment] = useState<BkashPayment | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [openingOrderId, setOpeningOrderId] = useState<string | null>(null);

  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // বর্তমান ফিল্টার/পেজ — কলব্যাক ও অটো-রিফ্রেশে সবসময় সর্বশেষ মান ব্যবহার করার জন্য
  const paramsRef = useRef({ page, filter, debouncedSearch });
  paramsRef.current = { page, filter, debouncedSearch };

  // দেরিতে আসা পুরনো রেসপন্স যেন নতুনটাকে না ঢেকে দেয়
  const reqIdRef = useRef(0);

  const load = useCallback(
    async (p: { page: number; filter: BkashFilter; debouncedSearch: string }, silent = false) => {
      const id = ++reqIdRef.current;
      if (!silent) setLoading(true);
      try {
        const res = await listBkashPage({
          page: p.page,
          pageSize: PAGE_SIZE,
          filter: p.filter,
          search: p.debouncedSearch,
        });
        if (id !== reqIdRef.current) return;
        setRows(res.rows);
        setTotal(res.total);
        setCounts(res.counts);
        setToday(res.today);
        // পেজ শেষ হয়ে গেলে সর্বশেষ বৈধ পেজে নামানো
        const maxPage = Math.max(1, Math.ceil(res.total / PAGE_SIZE));
        if (p.page > maxPage) setPage(maxPage);
      } catch {
        if (!silent && id === reqIdRef.current) showToastRef.current('❌ বিকাশ লেনদেন লোড ব্যর্থ হয়েছে');
      } finally {
        if (!silent && id === reqIdRef.current) setLoading(false);
      }
    },
    []
  );

  // সার্চ টাইপ করার সময় প্রতি অক্ষরে সার্ভার কল না করে ৩০০ms পরে
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // পেজ/ফিল্টার/সার্চ বদলালে সার্ভার থেকে নতুন পেজ। প্রথম মাউন্টে initialPage থাকায় স্কিপ।
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    load({ page, filter, debouncedSearch });
  }, [page, filter, debouncedSearch, load]);

  // ট্যাব দৃশ্যমান থাকলে নিয়মিত নীরব রিফ্রেশ; ট্যাবে ফিরে এলেও সাথে সাথে
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') load(paramsRef.current, true);
    };
    const timer = setInterval(tick, AUTO_REFRESH_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [load]);

  function selectFilter(f: BkashFilter) {
    setFilter(f);
    setPage(1);
  }

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setFilter('all');
    setPage(1);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await load(paramsRef.current);
    setRefreshing(false);
  }

  async function openOrder(orderId: string) {
    if (openingOrderId) return;
    setOpeningOrderId(orderId);
    try {
      const order = await getBkashLinkedOrder(orderId);
      if (order) setViewingOrder(order);
      else showToast('❌ অর্ডারটি পাওয়া যায়নি');
    } catch {
      showToast('❌ অর্ডার লোড ব্যর্থ হয়েছে');
    } finally {
      setOpeningOrderId(null);
    }
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    const res = await updateOrderStatus(id, status);
    if (res.status === 'ok') {
      setViewingOrder((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
      if (status === 'confirmed') playChaChing();
      showToastRef.current('✅ স্ট্যাটাস আপডেট হয়েছে');
    } else {
      showToastRef.current('❌ ' + (res.message || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে'));
    }
  }

  return (
    <div>
      <PageHeader
        icon={
          <>
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </>
        }
        title="বিকাশ লেনদেন"
        subtitle="ফোনে আসা প্রতিটা বিকাশ পেমেন্ট লাইভ — কোনটা অর্ডারে লেগেছে, কোনটা বেওয়ারিশ"
      />

      <BkashStatCards today={today} unusedCount={counts.unused} activeFilter={filter} onSelectFilter={selectFilter} />

      <BkashToolbar
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onSelectFilter={selectFilter}
        counts={counts}
        onRefresh={handleRefresh}
        refreshing={refreshing || loading}
        onClearFilters={clearFilters}
      />

      {/* মোবাইলে: কার্ডগুলো সরাসরি নীল ক্যানভাসের উপর; ডেস্কটপে (≥1024px): একটাই সাদা কার্ডে টেবিল + পেজিনেশন */}
      <div className="lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-white/90 lg:bg-white lg:shadow-sh1">
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <BkashTable
            payments={rows}
            openingOrderId={openingOrderId}
            onOpenOrder={openOrder}
            onViewSms={setSmsPayment}
          />
        </div>
        {total > 0 && (
          <div className="mt-3 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1 lg:mt-0 lg:rounded-none lg:border-0 lg:border-t lg:border-border-base/60 lg:px-5 lg:shadow-none">
            <Pagination page={page} total={total} onPageChange={setPage} bare />
          </div>
        )}
      </div>

      {smsPayment && <RawSmsModal payment={smsPayment} onClose={() => setSmsPayment(null)} />}

      {viewingOrder && (
        <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrder(null)} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}
