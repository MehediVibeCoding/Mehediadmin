'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { listProducts } from '@/app/actions/products';
import { detectTrackingField, type TrackingField, type TrafficPageView } from '@/lib/traffic';
import type { Product } from '@/types';

// legacy loadPageViewsData() — শুধু গত ৯০ দিনের ডাটা টানা হয় (পুরনো ডাটা
// মোছা হচ্ছে না, শুধু performance-এর জন্য এখানে না আনা হচ্ছে)। ক্যালেন্ডারে
// সর্বোচ্চ ৮৯ দিন পেছনের রেঞ্জ সিলেক্ট করা যায় (lib CAL_MIN_DAYS.trf), তাই
// এই ৯০ দিনের window-ই যথেষ্ট — রেঞ্জ বদলালে নতুন করে fetch লাগে না, ঠিক
// legacy-র মতোই ক্লায়েন্টে থাকা ডাটা re-filter হয়।
const PAGE_VIEWS_LOOKBACK_DAYS = 90;

export interface TrafficData {
  pageViews: TrafficPageView[];
  products: Product[];
  trackingField: TrackingField;
}

export async function getTrafficData(): Promise<TrafficData> {
  const supabase = createServiceRoleClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PAGE_VIEWS_LOOKBACK_DAYS);

  const [pageViewsRes, products] = await Promise.all([
    supabase.from('page_views').select('*').gte('created_at', cutoff.toISOString()),
    listProducts(),
  ]);

  if (pageViewsRes.error) {
    throw new Error('ট্রাফিক ডাটা লোড ব্যর্থ: ' + pageViewsRes.error.message);
  }

  const pageViews = (pageViewsRes.data || []) as TrafficPageView[];

  return {
    pageViews,
    products,
    trackingField: detectTrackingField(pageViews),
  };
}
