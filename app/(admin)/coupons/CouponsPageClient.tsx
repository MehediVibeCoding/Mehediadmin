'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    setCoupons(initialCoupons);
    setStats(initialStats);
  }, [initialCoupons, initialStats]);

  // realtime — অন্য অ্যাডমিন ট্যাব/ডিভাইস থেকে is_active টগল, নতুন কুপন
  // তৈরি, বা ডিলিট হলে এই পেজও সাথে সাথে server থেকে ফ্রেশ ডেটা টেনে আনে।
  // NOTE: এটা anon-key ব্রাউজার ক্লায়েন্ট ব্যবহার করে, তাই Supabase-এ
  // `coupons` টেবিলে RLS SELECT পলিসি (authenticated role-এর জন্য) আর
  // Realtime enable করা থাকতে হবে — supabase/coupons.sql দ্রষ্টব্য।
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-coupons-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-bold text-xl text-ink">কুপন ম্যানেজমেন্ট</h1>
        <p className="mt-0.5 text-sm text-muted">ডিসকাউন্ট কুপন তৈরি, এডিট, ও ট্র্যাক করুন</p>
      </div>

      <CouponStatCards stats={stats} />

      <CouponsTable coupons={coupons} onEdit={(c) => setModal({ coupon: c })} onAdd={() => setModal({})} />

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
