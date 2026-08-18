import type { Order, OrderStatus, Product } from '@/types';

// legacy DEFAULT_UNIT_PROFIT — বেশিরভাগ প্রোডাক্টে ডিফল্ট প্রফিট ৳২০০, specs._profit না থাকলে
export const DEFAULT_UNIT_PROFIT = 200;

// legacy renderProfitPage() — শুধু confirmed/shipped/delivered অর্ডারই "আসল" প্রফিট,
// pending/cancelled বাদ (dashboard.ts-এর CONFIRMED_STATUSES-এর সাথে অভিন্ন)
export const PROFIT_STATUSES: OrderStatus[] = ['confirmed', 'shipped', 'delivered'];

// প্রোডাক্ট নাম দিয়ে match করে প্রতি ইউনিটের প্রফিট বের করো (legacy getUnitProfitByName)
export function getUnitProfitByName(name: string, products: Product[]): number {
  const key = (name || '').toLowerCase().trim();
  if (!key) return DEFAULT_UNIT_PROFIT;
  const p = products.find((x) => (x.name || '').toLowerCase().trim() === key);
  const profit = p?.specs?._profit;
  if (profit != null && !Number.isNaN(Number(profit))) return Number(profit);
  return DEFAULT_UNIT_PROFIT;
}

// একটা অর্ডারের সব আইটেমের মোট নেট প্রফিট (legacy computeOrderProfit)
export function computeOrderProfit(order: Order, products: Product[]): number {
  return (order.items || []).reduce((sum, it) => {
    const unitProfit = getUnitProfitByName(it.name, products);
    const qty = Number(it.qty) || 0;
    return sum + unitProfit * qty;
  }, 0);
}

export interface DateRangeInput {
  start: Date;
  end: Date;
}

// রেঞ্জের মধ্যে confirmed/shipped/delivered অর্ডার (legacy renderProfitPage inRange filter)
export function filterProfitOrders(orders: Order[], range: DateRangeInput): Order[] {
  const start = new Date(range.start);
  start.setHours(0, 0, 0, 0);
  const endExclusive = new Date(range.end);
  endExclusive.setHours(0, 0, 0, 0);
  endExclusive.setDate(endExclusive.getDate() + 1);
  return orders.filter((o) => {
    if (!PROFIT_STATUSES.includes(o.status)) return false;
    const key = (o.created_at || '').slice(0, 10);
    if (!key) return false;
    const d = new Date(key + 'T00:00:00');
    return d >= start && d < endExclusive;
  });
}

interface DayAgg {
  revenue: number;
  profit: number;
  orders: number;
}

// দিন অনুযায়ী গ্রুপ করা রেভিনিউ/প্রফিট/অর্ডার-সংখ্যা (legacy renderProfitPage dayMap)
export function buildProfitDayMap(filtered: Order[], products: Product[]): Map<string, DayAgg> {
  const dayMap = new Map<string, DayAgg>();
  filtered.forEach((o) => {
    const key = (o.created_at || '').slice(0, 10);
    if (!dayMap.has(key)) dayMap.set(key, { revenue: 0, profit: 0, orders: 0 });
    const row = dayMap.get(key)!;
    row.revenue += o.total || 0;
    row.profit += computeOrderProfit(o, products);
    row.orders += 1;
  });
  return dayMap;
}

export interface ProfitSummary {
  totalProfit: number;
  totalRevenue: number;
  totalOrders: number;
  avgProfit: number;
}

// স্ট্যাট কার্ড চারটার জন্য (legacy prfTotal/prfRevenue/prfOrders/prfAvg)
export function computeProfitSummary(filtered: Order[], products: Product[]): ProfitSummary {
  const totalProfit = filtered.reduce((s, o) => s + computeOrderProfit(o, products), 0);
  const totalRevenue = filtered.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = filtered.length;
  const avgProfit = totalOrders ? totalProfit / totalOrders : 0;
  return { totalProfit, totalRevenue, totalOrders, avgProfit };
}

export interface ProfitDayRow {
  key: string; // YYYY-MM-DD
  label: string; // বাংলা ফরম্যাট
  orders: number;
  revenue: number;
  profit: number;
}

// টেবিল: দিন অনুযায়ী সাজানো, সাম্প্রতিক আগে (legacy renderProfitPage tbl.innerHTML অংশ)
export function buildProfitDayTable(dayMap: Map<string, DayAgg>): ProfitDayRow[] {
  const dayKeys = [...dayMap.keys()].sort((a, b) => b.localeCompare(a));
  return dayKeys.map((k) => {
    const d = new Date(k + 'T00:00:00');
    const label = d.toLocaleDateString('bn-BD', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const row = dayMap.get(k)!;
    return { key: k, label, orders: row.orders, revenue: row.revenue, profit: row.profit };
  });
}

export interface ProfitChartSeries {
  labels: string[];
  values: number[]; // প্রতিদিনের নিট প্রফিট
  subtitle: string; // 'dd MMM – dd MMM yyyy' রেঞ্জ লেবেল (legacy prfTrendSub)
}

// চার্টের জন্য start→end প্রতিটা দিনের লেবেল/ভ্যালু (legacy renderProfitChart data-prep,
// ৯০ দিনের বেশি হলে ক্যাপ করা হয় — চার্ট খুব ঘন হয়ে যাওয়া ঠেকাতে)
const CHART_MAX_DAYS = 90;

export function buildProfitChartSeries(dayMap: Map<string, DayAgg>, range: DateRangeInput): ProfitChartSeries {
  const start = new Date(range.start);
  start.setHours(0, 0, 0, 0);
  const end = new Date(range.end);
  end.setHours(0, 0, 0, 0);

  const dayCount = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const capped = Math.min(dayCount, CHART_MAX_DAYS);

  const labels: string[] = [];
  const values: number[] = [];
  for (let i = 0; i < capped; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toLocaleDateString('en-CA');
    labels.push(d.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' }));
    values.push(dayMap.get(key)?.profit || 0);
  }

  const subtitle =
    start.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }) +
    ' – ' +
    end.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });

  return { labels, values, subtitle };
}
