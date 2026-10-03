'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Customer } from '@/types';
import CustomersTable from '@/components/customers/CustomersTable';
import Pagination, { PAGE_SIZE } from '@/components/common/Pagination';
import PageHeader from '@/components/admin/PageHeader';

interface Props {
  initialCustomers: Customer[];
}

function matches(c: Customer, rawQuery: string): boolean {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return true;
  const digitsQ = q.replace(/\D/g, '');
  return (
    (c.name || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q) ||
    (digitsQ.length > 0 && (c.phone || '').replace(/\D/g, '').includes(digitsQ))
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-[20px] border border-white/90 bg-white p-3 shadow-sh1 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light/15 text-brand-light sm:h-10 sm:w-10">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
          {icon}
        </svg>
      </span>
      <div className="min-w-0">
        <div className="truncate font-body text-[10px] font-extrabold uppercase tracking-wider text-muted sm:text-[10.5px]">{label}</div>
        <div className="truncate font-body text-[17px] font-black leading-tight tracking-tight text-ink sm:text-[20px]">{value}</div>
      </div>
    </div>
  );
}

// legacy #page-customers — orders টেবিল থেকে গ্রুপ করা কাস্টমার তালিকা (পেজ-ভিত্তিক, ১৪টি/পেজ)।
// রিডিজাইনে যোগ: সামারি টাইল + হালকা সার্চ (শুধু ক্লায়েন্ট-সাইড ফিল্টার, ডাটা লজিক অপরিবর্তিত)।
export default function CustomersPageClient({ initialCustomers }: Props) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => initialCustomers.filter((c) => matches(c, query)), [initialCustomers, query]);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totals = useMemo(
    () => ({
      customers: initialCustomers.length,
      orders: initialCustomers.reduce((sum, c) => sum + (c.order_count || 0), 0),
      spent: initialCustomers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
    }),
    [initialCustomers]
  );

  return (
    <div>
      <PageHeader
        icon={
          <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        }
        title="কাস্টমার তালিকা"
        subtitle="নিবন্ধিত গ্রাহকদের তথ্য"
      />

      {/* সামারি টাইল */}
      <div className="mb-4 grid grid-cols-3 gap-2.5 sm:gap-3">
        <StatTile
          label="মোট কাস্টমার"
          value={totals.customers.toLocaleString('en-US')}
          icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /></>}
        />
        <StatTile
          label="মোট অর্ডার"
          value={totals.orders.toLocaleString('en-US')}
          icon={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /></>}
        />
        <StatTile
          label="মোট বিক্রি"
          value={'৳' + totals.spent.toLocaleString('en-US')}
          icon={<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>}
        />
      </div>

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
        <CustomersTable customers={paginated} />
        {filtered.length > 0 && (
          <div className="mt-3 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1 lg:mt-0 lg:rounded-none lg:border-0 lg:border-t lg:border-border-base/60 lg:px-5 lg:shadow-none">
            <Pagination page={page} total={filtered.length} onPageChange={setPage} bare />
          </div>
        )}
      </div>
    </div>
  );
}
