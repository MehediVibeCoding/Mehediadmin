'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Order, OrderStatus } from '@/types';
import { listOrders, updateOrderStatus, bulkUpdateOrderStatus } from '@/app/actions/orders';
import { orderMatchesQuery } from '@/lib/orders';
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
  initialOrders: Order[];
}

function inRange(dateStr: string, range: DateRange): boolean {
  const d = new Date(dateStr);
  const start = new Date(range.start);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setHours(23, 59, 59, 999);
  return d >= start && d <= end;
}

export default function OrdersPageClient({ initialOrders }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPendingStatus, setBulkPendingStatus] = useState<OrderStatus | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { showToast } = useToast();
  const { ordersVersion } = useOrdersRealtime();

  // Dashboard-এর "পেন্ডিং অর্ডার" quick-action শর্টকাট থেকে আসলে (?status=pending)
  // সেই স্ট্যাটাস ফিল্টার প্রি-সিলেক্ট করে দাও, তারপর URL পরিষ্কার করো
  // (Categories → Products-এর ?openAdd প্যাটার্নের মতোই)
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setFilterStatus(status as OrderStatus);
      router.replace('/orders');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // realtime নতুন/আপডেট ইভেন্ট এলে (OrdersRealtimeProvider থেকে) নীরবে লিস্ট রিফ্রেশ —
  // প্রথম মাউন্টে স্কিপ করা হচ্ছে কারণ initialOrders আগে থেকেই সার্ভার থেকে আনা
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    listOrders().then(setOrders).catch(() => {});
  }, [ordersVersion]);

  // ফিল্টার বদলালে ১ পেজে ফিরে যাওয়া (legacy pgSyncFilterSig)
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, dateRange]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (!orderMatchesQuery(o, search)) return false;
      if (filterStatus !== 'all' && o.status !== filterStatus) return false;
      if (dateRange && !inRange(o.created_at, dateRange)) return false;
      return true;
    });
  }, [orders, search, filterStatus, dateRange]);

  const paginated = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return filtered.slice(from, from + PAGE_SIZE);
  }, [filtered, page]);

  const viewingOrder = viewingId ? orders.find((o) => o.id === viewingId) || null : null;

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
      paginated.forEach((o) => (checked ? next.add(o.id) : next.delete(o.id)));
      if (next.size === 0) setBulkPendingStatus(null);
      return next;
    });
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    const res = await updateOrderStatus(id, status);
    if (res.status === 'ok') {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      if (status === 'confirmed') playChaChing();
      showToast('✅ স্ট্যাটাস আপডেট হয়েছে');
    } else {
      showToast('❌ ' + (res.message || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে'));
    }
  }

  async function confirmBulk() {
    if (!bulkPendingStatus) return;
    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    const res = await bulkUpdateOrderStatus(ids, bulkPendingStatus);
    setBulkBusy(false);
    if (res.status === 'ok') {
      const status = bulkPendingStatus;
      setOrders((prev) => prev.map((o) => (ids.includes(o.id) ? { ...o, status } : o)));
      showToast(`✅ ${res.changed}টি অর্ডার আপডেট হয়েছে`);
      setSelectedIds(new Set());
      setBulkPendingStatus(null);
    } else {
      showToast('❌ ' + (res.message || 'বাল্ক আপডেট ব্যর্থ হয়েছে'));
    }
  }

  function cancelBulk() {
    setBulkPendingStatus(null);
    setSelectedIds(new Set());
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      setOrders(await listOrders());
      showToast('🔄 রিফ্রেশ হয়েছে');
    } catch {
      showToast('❌ রিফ্রেশ ব্যর্থ হয়েছে');
    } finally {
      setRefreshing(false);
    }
  }

  function exportAll() {
    downloadCsvRows(ordersToCsvRows(orders), 'orders_all');
    showToast('⬇️ CSV ডাউনলোড শুরু হয়েছে');
  }

  function exportRange(range: DateRange) {
    const rows = orders.filter((o) => inRange(o.created_at, range));
    downloadCsvRows(ordersToCsvRows(rows), 'orders_range');
    showToast(`⬇️ ${rows.length}টি অর্ডারের CSV ডাউনলোড শুরু হয়েছে`);
  }

  function clearFilters() {
    setSearch('');
    setFilterStatus('all');
    setDateRange(null);
  }

  return (
    <div>
      <div className="mx-auto mb-3.5 mt-2.5 max-w-full text-center">
        <h1 className="font-bold text-xl text-ink">অর্ডার ম্যানেজমেন্ট</h1>
        <p className="mt-0.5 text-[12.5px] text-muted">সকল গ্রাহকের অর্ডার — Confirm করুন বা Cancel করুন</p>
      </div>

      <OrdersToolbar
        search={search}
        onSearchChange={setSearch}
        filterStatus={filterStatus}
        onSelectFilter={setFilterStatus}
        selectedCount={selectedIds.size}
        bulkPendingStatus={bulkPendingStatus}
        onSelectBulk={setBulkPendingStatus}
        onConfirmBulk={confirmBulk}
        onCancelBulk={cancelBulk}
        bulkBusy={bulkBusy}
        dateActive={!!dateRange}
        dateRange={dateRange}
        onDateApply={setDateRange}
        onExportAll={exportAll}
        onExportRange={exportRange}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onClearFilters={clearFilters}
      />

      <div className="glass-card-strong rounded-brand p-4 shadow-glass md:p-5">
        <OrdersTable
          orders={paginated}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onView={setViewingId}
        />
        <Pagination page={page} total={filtered.length} onPageChange={setPage} />
      </div>

      {viewingOrder && (
        <OrderDetailModal order={viewingOrder} onClose={() => setViewingId(null)} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}
