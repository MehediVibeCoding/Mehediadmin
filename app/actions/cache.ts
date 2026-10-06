'use server';

import { requireAdmin } from '@/lib/auth-guard';
import { invalidateOrdersData, invalidateProductsData } from '@/lib/adminCache';

// রিয়েলটাইম ইভেন্ট (নতুন অর্ডার, বিকাশ ওয়েবহুক, অটো-ক্যান্সেল) বা ট্যাব আবার সামনে
// আসার পর ব্রাউজার এটা ডাকে — সার্ভারের ক্যাশ মুছে যায়, তারপর পেজ রিফ্রেশ হয়।
// 'orders' = শুধু অর্ডার-নির্ভর ক্যাশ; 'all' = প্রোডাক্ট-নির্ভরও (ট্যাব ফিরে এলে)।
export async function refreshAdminCaches(scope: 'orders' | 'all' = 'orders'): Promise<void> {
  await requireAdmin();
  invalidateOrdersData();
  if (scope === 'all') invalidateProductsData();
}
