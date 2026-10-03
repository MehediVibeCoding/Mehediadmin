'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Coupon, CouponStats } from '@/types';
import CouponStatCards from '@/components/coupons/CouponStatCards';
import CouponsTable from '@/components/coupons/CouponsTable';
import CouponModal from '@/components/coupons/CouponModal';

interface Props {
  initialCoupons: Coupon[];
  initialStats: CouponStats;
}

export default function CouponsPageClient({ initialCoupons, initialStats }: Props) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [stats, setStats] = useState(initialStats);
  const [modal, setModal] = useState<{ coupon?: Coupon } | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCoupons(initialCoupons);
    setStats(initialStats);
  }, [initialCoupons, initialStats]);

  // Realtime — অন্য ডিভাইস বা ট্যাব থেকে কুপন আপডেট/টগল/ডিলিট হলে
  // ডেবাউন্সড রিফ্রেশ দিয়ে লাইভ ডাটা আনা হয় (অপ্রয়োজনীয় ল্যাগ রোধে ৪০০ms debounce)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-coupons-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, () => {
        if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = setTimeout(() => {
          router.refresh();
        }, 400);
      })
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <div>
      {/* ১. স্ট্যাটাস সামারি কার্ডস */}
      <CouponStatCards stats={stats} />

      {/* ২. কুপন টেবিল ও মোবাইল কার্ড তালিকা */}
      <CouponsTable
        coupons={coupons}
        onEdit={(c) => setModal({ coupon: c })}
        onAdd={() => setModal({})}
      />

      {/* ৩. কুপন যোগ/এডিট মডাল */}
      {modal && (
        <CouponModal
          editingCoupon={modal.coupon}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
