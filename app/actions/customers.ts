'use server';

import { listOrders } from './orders';
import { requireAdmin } from '@/lib/auth-guard';
import { aggregateCustomers } from '@/lib/customers';
import type { Customer } from '@/types';

// legacy renderCustomers() ব্রাউজারে ক্যাশ করা অর্ডার লিস্ট (_cachedOrders)
// থেকে client-side aggregate করত — এখানে একই aggregation সার্ভার-সাইডে করা
// হচ্ছে (roadmap-এর "client-side Supabase call না করে Server Action ব্যবহার"
// নীতি অনুযায়ী)। listOrders() ইতিমধ্যে `orders` টেবিল থেকে created_at DESC
// সর্ট করে আনে, ঠিক legacy getOrdersAsync()-এর মতোই — তাই আলাদা কোনো নতুন
// query/টেবিল লাগছে না।
export async function listCustomers(): Promise<Customer[]> {
  await requireAdmin();
  const orders = await listOrders();
  return aggregateCustomers(orders);
}
