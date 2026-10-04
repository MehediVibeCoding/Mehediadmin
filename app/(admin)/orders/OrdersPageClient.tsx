'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Order, OrderStatus } from '@/types';
import {
  listOrders,
  listOrdersPage,
  updateOrderStatus,
  bulkUpdateOrderStatus,
  type OrdersPageResult,
} from '@/app/actions/orders';
import { downloadCsvRows, ordersToCsvRows } from '@/lib/csv';
import { playChaChing } from '@/lib/sound';
import { useToast } from '@/components/admin/Toast';
import { useOrdersRealtime } from '@/components/admin/OrdersRealtimeProvider';
import OrdersToolbar from '@/components/orders/OrdersToolbar';
import OrdersTable from '@/components/orders/OrdersTable';
import OrderDetailModal from '@/components/orders/OrderDetailModal';
import Pagination, { PAGE_SIZE } from '@/components/common/Pagination';
import type { DateRange } from '@/components/common/DateRangePicker';

interface Props {
  initialPage: OrdersPageResult;
}

type StatusFilter = 'all' | OrderStatus;

// শুধু এক্সপোর্টের জন্য পুরো তালিকা দরকার — বাকি সময় সার্ভার থেকে শুধু পেজ আসে
function inRange(dateStr: string, range: DateRange): boolean {
  const d = new Date(dateStr);
  const start = new Date(range.start);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setHours(23, 59, 59, 999);
  return d >= start && d <= end;
}

// স্থানীয় সময়ের দিনের শুরু/শেষ → ISO (ডাটাবেজে created_at তুলনার জন্য)
function rangeToIso(range: DateRange): { from: string; to: string } {
  const start = new Date(range.start);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

export default function OrdersPageClient({ initialPage }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<Order[]>(initialPage.rows);
  const [total, setTotal] = useState(initialPage.total);
  const [grandTotal, setGrandTotal] = useState(initialPage.grandTotal);
  const [statusCounts, setStatusCounts] = useState(initialPage.statusCounts);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPendingStatus, setBulkPendingStatus] = useState<OrderStatus | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const { ordersVersion } = useOrdersRealtime();

  // বর্তমান ফিল্টার/পেজ — কলব্যাক ও রিয়েলটাইমে সবসময় সর্বশেষ মান ব্যবহার করার জন্য
  const paramsRef = useRef({ page, filterStatus, debouncedSearch, dateRange });
  paramsRef.current = { page, filterStatus, debouncedSearch, dateRange };

  // দেরিতে আসা পুরনো রেসপন্স যেন নতুনটাকে না ঢেকে দেয়
  const reqIdRef = useRef(0);

  const load = useCallback(
    async (p: { page: number; filterStatus: StatusFilter; debouncedSearch: string; dateRange: DateRange | null }) => {
      const id = ++reqIdRef.current;
      setLoading(true);
      try {
        const iso = p.dateRange ? rangeToIso(p.dateRange) : null;
        const res = await listOrdersPage({
          page: p.page,
          pageSize: PAGE_SIZE,
          status: p.filterStatus,
          search: p.debouncedSearch,
          fromIso: iso?.from ?? null,
          toIso: iso?.to ?? null,
        });
        if (id !== reqIdRef.current) return;
        setRows(res.rows);
        setTotal(res.total);
        setGrandTotal(res.grandTotal);
        setStatusCounts(res.statusCounts);
        // পেজ শেষ হয়ে গেলে (যেমন অর্ডার মুছে/বদলে) সর্বশেষ বৈধ পেজে নামানো
        const maxPage = Math.max(1, Math.ceil(res.total / PAGE_SIZE));
        if (p.page > maxPage) setPage(maxPage);
      } catch {
        if (id === reqIdRef.current) showToastRef.current('❌ অর্ডার লোড ব্যর্থ হয়েছে');
      } finally {
        if (id === reqIdRef.current) setLoading(false);
      }
    },
    []
  );

  // Dashboard-এর "পেন্ডিং অর্ডার" quick-action শর্টকাট থেকে আসলে (?status=pending)
  // সেই স্ট্যাটাস ফিল্টার প্রি-সিলেক্ট করে দাও, তারপর URL পরিষ্কার করো
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setFilterStatus(status as OrderStatus);
      router.replace('/orders');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // সার্চ টাইপ করার সময় প্রতি অক্ষরে সার্ভার কল না করে ৩০০ms পরে
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // পেজ/ফিল্টার বদলালে সার্ভার থেকে নতুন পেজ। প্রথম মাউন্টে initialPage থাকায় স্কিপ।
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    load({ page, filterStatus, debouncedSearch, dateRange });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus, debouncedSearch, dateRange]);

  // realtime ইভেন্ট (OrdersRealtimeProvider) এলে বর্তমান ফিল্টারে নীরবে রিফ্রেশ
  useEffect(() => {
    if (ordersVersion === 0) return;
    load(paramsRef.current);
  }, [ordersVersion, load]);

  const viewingOrder = viewingId ? rows.find((o) => o.id === viewingId) || null : null;

  // ফিল্টার বদলালে সবসময় ১ পেজে
  const selectFilter = useCallback((s: StatusFilter) => {
    setFilterStatus(s);
    setPage(1);
  }, []);

  const applyDate = useCallback((r: DateRange | null) => {
    setDateRange(r);
    setPage(1);
  }, []);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) setBulkPendingStatus(null);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      rows.forEach((o) => (checked ? next.add(o.id) : next.delete(o.id)));
      if (next.size === 0) setBulkPendingStatus(null);
      return next;
    });
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    const res = await updateOrderStatus(id, status);
    if (res.status === 'ok') {
      setRows((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      if (status === 'confirmed') playChaChing();
      showToastRef.current('✅ স্ট্যাটাস আপডেট হয়েছে');
      // কাউন্ট ও ফিল্টারের সাথে মিল রাখতে বর্তমান পেজ আবার আনি
      load(paramsRef.current);
    } else {
      showToastRef.current('❌ ' + (res.message || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে'));
    }
  }

  async function confirmBulk() {
    if (!bulkPendingStatus) return;
    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    const res = await bulkUpdateOrderStatus(ids, bulkPendingStatus);
    setBulkBusy(false);
    if (res.status === 'ok') {
      showToastRef.current(`✅ ${res.changed}টি অর্ডার আপডেট হয়েছে`);
      setSelectedIds(new Set());
      setBulkPendingStatus(null);
      load(paramsRef.current);
    } else {
      showToastRef.current('❌ ' + (res.message || 'বাল্ক আপডেট ব্যর্থ হয়েছে'));
    }
  }

  function cancelBulk() {
    setBulkPendingStatus(null);
    setSelectedIds(new Set());
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await load(paramsRef.current);
      showToastRef.current('🔄 রিফ্রেশ হয়েছে');
    } finally {
      setRefreshing(false);
    }
  }

  async function exportAll() {
    try {
      const all = await listOrders();
      downloadCsvRows(ordersToCsvRows(all), 'orders_all');
      showToastRef.current('⬇️ CSV ডাউনলোড শুরু হয়েছে');
    } catch {
      showToastRef.current('❌ এক্সপোর্ট ব্যর্থ হয়েছে');
    }
  }

  async function exportRange(range: DateRange) {
    try {
      const all = await listOrders();
      const list = all.filter((o) => inRange(o.created_at, range));
      downloadCsvRows(ordersToCsvRows(list), 'orders_range');
      showToastRef.current(`⬇️ ${list.length}টি অর্ডারের CSV ডাউনলোড শুরু হয়েছে`);
    } catch {
      showToastRef.current('❌ এক্সপোর্ট ব্যর্থ হয়েছে');
    }
  }

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setFilterStatus('all');
    setDateRange(null);
    setPage(1);
  }

  return (
    <div>
      <OrdersToolbar
        search={search}
        onSearchChange={setSearch}
        filterStatus={filterStatus}
        onSelectFilter={selectFilter}
        statusCounts={statusCounts}
        totalCount={grandTotal}
        selectedCount={selectedIds.size}
        bulkPendingStatus={bulkPendingStatus}
        onSelectBulk={setBulkPendingStatus}
        onConfirmBulk={confirmBulk}
        onCancelBulk={cancelBulk}
        bulkBusy={bulkBusy}
        dateActive={!!dateRange}
        dateRange={dateRange}
        onDateApply={applyDate}
        onExportAll={exportAll}
        onExportRange={exportRange}
        onRefresh={handleRefresh}
        refreshing={refreshing || loading}
        onClearFilters={clearFilters}
      />

      {/* মোবাইলে: কার্ডগুলো সরাসরি নীল ক্যানভাসের উপর (কার্ডের ভেতরে কার্ড নেই);
          ডেস্কটপে (≥1024px): একটাই সাদা কার্ডে টেবিল + পেজিনেশন */}
      <div className="lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-white/90 lg:bg-white lg:shadow-sh1">
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <OrdersTable
            orders={rows}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onView={setViewingId}
          />
        </div>
        {total > 0 && (
          <div className="mt-3 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1 lg:mt-0 lg:rounded-none lg:border-0 lg:border-t lg:border-border-base/60 lg:px-5 lg:shadow-none">
            <Pagination page={page} total={total} onPageChange={setPage} bare />
          </div>
        )}
      </div>

      {/* সিলেকশন বার ভাসমান থাকলে শেষ কার্ড যেন ঢাকা না পড়ে */}
      {selectedIds.size > 0 && <div className="h-28 lg:hidden" />}

      {viewingOrder && (
        <OrderDetailModal order={viewingOrder} onClose={() => setViewingId(null)} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}
