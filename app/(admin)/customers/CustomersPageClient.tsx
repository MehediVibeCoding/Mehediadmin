'use client';

import { useState } from 'react';
import type { Customer } from '@/types';
import CustomersTable from '@/components/customers/CustomersTable';
import Pagination, { PAGE_SIZE } from '@/components/common/Pagination';

interface Props {
  initialCustomers: Customer[];
}

// legacy #page-customers — শুধু title/sub আর পেজ-ভিত্তিক (১৪টি/পেজ) টেবিল,
// কোনো সার্চ/ফিল্টার টুলবার নেই (admin.html-এও ছিল না)।
export default function CustomersPageClient({ initialCustomers }: Props) {
  const [page, setPage] = useState(1);
  const paginated = initialCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-bold text-xl text-ink">কাস্টমার তালিকা</h1>
        <p className="mt-0.5 text-sm text-muted">নিবন্ধিত গ্রাহকদের তথ্য</p>
      </div>

      <div className="rounded-brand bg-brand-surface shadow-sh1">
        <CustomersTable customers={paginated} />
        <Pagination page={page} total={initialCustomers.length} onPageChange={setPage} />
      </div>
    </div>
  );
}
