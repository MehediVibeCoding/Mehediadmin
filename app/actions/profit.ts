'use server';

import { listOrders } from '@/app/actions/orders';
import { listProducts } from '@/app/actions/products';
import type { Order, Product } from '@/types';

// legacy initProfitPage() — loadAndRenderOrders() দিয়ে সব অর্ডার আনত (কোনো
// lookback limit ছাড়া, page_views-এর মতো ৯০ দিনের window না — অর্ডার ডাটা
// রেঞ্জ ৩৬৪ দিন পর্যন্ত পিছনে যেতে পারে, তাই পুরো লিস্টই দরকার)। প্রোডাক্ট
// লাগে specs._profit (per-unit profit) পড়ার জন্য — getAllProds() এর সমতুল্য।
export interface ProfitData {
  orders: Order[];
  products: Product[];
}

export async function getProfitData(): Promise<ProfitData> {
  const [orders, products] = await Promise.all([listOrders(), listProducts()]);
  return { orders, products };
}
