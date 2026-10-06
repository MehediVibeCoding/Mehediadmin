'use server';

import { requireAdmin } from '@/lib/auth-guard';
import type { TrackingField, TrafficPageView } from '@/lib/traffic';
import type { Product } from '@/types';

// 📌 ট্রাফিক ডাটার সোর্স এখন সংযুক্ত নয়।
// আগে Supabase `page_views` টেবিল থেকে পড়া হতো — সেই সিস্টেম সরিয়ে ফেলা হয়েছে
// (Vangcur আর পেজ ভিউ লেখে না, টেবিলও নেই)। ভবিষ্যতে Cloudflare Web Analytics API
// থেকে ডাটা আনা হবে; তখন শুধু এই ফাইলের getTrafficData() বদলালেই হবে —
// পেজ/চার্ট/টেবিলের UI আর lib/traffic.ts-এর হেল্পার অপরিবর্তিত থাকবে।
// getTrafficData()-কে `connected: true` + `pageViews` (TrafficPageView[]) ফেরত দিলেই
// সব UI আগের মতো ডাটা দেখাবে।
export interface TrafficData {
  pageViews: TrafficPageView[];
  products: Product[];
  trackingField: TrackingField;
  // false হলে ট্রাফিক পেজে "সোর্স সংযুক্ত নয়" নোটিস দেখায়
  connected: boolean;
}

export async function getTrafficData(): Promise<TrafficData> {
  await requireAdmin();
  return { pageViews: [], products: [], trackingField: null, connected: false };
}
