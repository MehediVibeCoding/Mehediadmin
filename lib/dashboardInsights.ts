// ড্যাশবোর্ডের ইনসাইট কার্ডের হিসাব — শুধু অর্ডারের সারি থেকে বের করা, কোনো নতুন টেবিল/কলাম লাগে না।
// ফাংশনগুলো খাঁটি (pure): ইনপুট সারি → আউটপুট সংখ্যা। সার্ভার/ক্লায়েন্ট দুই দিকেই নিরাপদ।

export interface InsightOrderRow {
  created_at: string | null;
  status: string | null;
  total: number | string | null;
  customer_phone: string | null;
  customer_district: string | null;
  items: unknown;
  coupon_code: string | null;
  discount_amount: number | string | null;
  payment_verified: boolean | null;
}

export interface DailyOrdersPoint {
  date: string; // YYYY-MM-DD (ঢাকার সময়)
  orders: number;
  revenue: number;
}

export interface TopProductRow {
  name: string;
  qty: number;
  revenue: number;
}

export interface DistrictRow {
  name: string;
  orders: number;
}

export interface DashboardInsights {
  windowDays: number;
  today: { orders: number; revenue: number; yesterdayOrders: number; yesterdayRevenue: number };
  daily14: DailyOrdersPoint[];
  week: { revenue: number; prevRevenue: number; orders: number; prevOrders: number };
  aov: number;
  cancelRate: number; // ০–১০০
  cancelledCount: number;
  totalCount30: number;
  coupon: { orders: number; discount: number };
  weekday: number[]; // রবি(0) … শনি(6)
  hours: number[]; // ২৪টা
  peak: { start: number; sum: number } | null;
  topProducts: TopProductRow[];
  districts: DistrictRow[];
  customers: { total: number; returning: number; fresh: number; repeatRate: number };
  unverifiedAdvance: number;
}

export const EMPTY_INSIGHTS: DashboardInsights = {
  windowDays: 30,
  today: { orders: 0, revenue: 0, yesterdayOrders: 0, yesterdayRevenue: 0 },
  daily14: [],
  week: { revenue: 0, prevRevenue: 0, orders: 0, prevOrders: 0 },
  aov: 0,
  cancelRate: 0,
  cancelledCount: 0,
  totalCount30: 0,
  coupon: { orders: 0, discount: 0 },
  weekday: [0, 0, 0, 0, 0, 0, 0],
  hours: new Array(24).fill(0),
  peak: null,
  topProducts: [],
  districts: [],
  customers: { total: 0, returning: 0, fresh: 0, repeatRate: 0 },
  unverifiedAdvance: 0,
};

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000; // বাংলাদেশে ডে-লাইট সেভিং নেই, সবসময় UTC+6
const DAY_MS = 24 * 60 * 60 * 1000;
const INVALID = new Set(['cancelled', 'rejected']);

// ঢাকার সময়ে "ঘড়ির মান" পড়ার জন্য UTC-getter ব্যবহারযোগ্য একটা Date
function dhaka(ts: number): Date {
  return new Date(ts + DHAKA_OFFSET_MS);
}

export function dhakaDateKey(ts: number): string {
  return dhaka(ts).toISOString().slice(0, 10);
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// ফোন নম্বরের শেষ ১০ ডিজিট — +880/0 প্রিফিক্সের পার্থক্য উপেক্ষা করে একই কাস্টমার চেনা
function phoneKey(raw: string | null): string {
  const d = (raw || '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : d;
}

function parseItems(raw: unknown): { name: string; qty: number; price: number }[] {
  let arr: unknown = raw;
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((i) => {
      const it = i as { name?: unknown; qty?: unknown; price?: unknown };
      return { name: String(it?.name || '').trim(), qty: Math.max(1, num(it?.qty) || 1), price: num(it?.price) };
    })
    .filter((i) => i.name);
}

export function computeInsights(rows: InsightOrderRow[], nowMs: number = Date.now()): DashboardInsights {
  const todayKey = dhakaDateKey(nowMs);
  const yesterdayKey = dhakaDateKey(nowMs - DAY_MS);

  // গত ১৪ দিনের ফাঁকা কাঠামো (পুরনো → নতুন)
  const daily14: DailyOrdersPoint[] = [];
  const dayIndex = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const key = dhakaDateKey(nowMs - i * DAY_MS);
    dayIndex.set(key, daily14.length);
    daily14.push({ date: key, orders: 0, revenue: 0 });
  }

  const cutoff30 = nowMs - 30 * DAY_MS;
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  const hours = new Array(24).fill(0) as number[];
  const productMap = new Map<string, TopProductRow>();
  const districtMap = new Map<string, number>();
  const phoneOrders90 = new Map<string, number>();
  const phones30 = new Set<string>();

  let todayOrders = 0;
  let todayRevenue = 0;
  let yOrders = 0;
  let yRevenue = 0;
  let validRevenue30 = 0;
  let validCount30 = 0;
  let total30 = 0;
  let cancelled30 = 0;
  let couponOrders = 0;
  let couponDiscount = 0;
  let unverifiedAdvance = 0;
  let wRev = 0;
  let wOrders = 0;
  let pwRev = 0;
  let pwOrders = 0;

  for (const r of rows) {
    if (!r.created_at) continue;
    const ts = new Date(r.created_at).getTime();
    if (!Number.isFinite(ts)) continue;
    const status = r.status || 'pending';
    const valid = !INVALID.has(status);
    const total = num(r.total);
    const key = dhakaDateKey(ts);

    if (valid) {
      const pk = phoneKey(r.customer_phone);
      if (pk) phoneOrders90.set(pk, (phoneOrders90.get(pk) || 0) + 1);
    }
    if (status === 'pending' && !r.payment_verified) unverifiedAdvance++;

    // দৈনিক ১৪ দিনের ট্রেন্ড + আজ/গতকাল + ৭ দিন বনাম আগের ৭ দিন
    const di = dayIndex.get(key);
    if (di !== undefined && valid) {
      daily14[di].orders++;
      daily14[di].revenue += total;
      if (di >= 7) {
        wOrders++;
        wRev += total;
      } else {
        pwOrders++;
        pwRev += total;
      }
    }
    if (valid && key === todayKey) {
      todayOrders++;
      todayRevenue += total;
    } else if (valid && key === yesterdayKey) {
      yOrders++;
      yRevenue += total;
    }

    if (ts < cutoff30) continue;

    // ── শেষ ৩০ দিন ──
    total30++;
    if (!valid) {
      cancelled30++;
      continue;
    }
    validCount30++;
    validRevenue30 += total;

    const d = dhaka(ts);
    weekdayCounts[d.getUTCDay()]++;
    hours[d.getUTCHours()]++;

    const disc = num(r.discount_amount);
    if (r.coupon_code) {
      couponOrders++;
      couponDiscount += disc;
    }

    const district = (r.customer_district || '').trim();
    if (district) districtMap.set(district, (districtMap.get(district) || 0) + 1);

    const pk = phoneKey(r.customer_phone);
    if (pk) phones30.add(pk);

    for (const it of parseItems(r.items)) {
      const k = it.name.toLowerCase();
      const cur = productMap.get(k) || { name: it.name, qty: 0, revenue: 0 };
      cur.qty += it.qty;
      cur.revenue += it.qty * it.price;
      productMap.set(k, cur);
    }
  }

  // সবচেয়ে ব্যস্ত ৩-ঘণ্টার উইন্ডো
  let peak: { start: number; sum: number } | null = null;
  for (let h = 0; h < 24; h++) {
    const sum = hours[h] + hours[(h + 1) % 24] + hours[(h + 2) % 24];
    if (!peak || sum > peak.sum) peak = { start: h, sum };
  }
  if (peak && peak.sum <= 0) peak = null;

  let returning = 0;
  phones30.forEach((p) => {
    if ((phoneOrders90.get(p) || 0) >= 2) returning++;
  });
  const custTotal = phones30.size;

  return {
    windowDays: 30,
    today: { orders: todayOrders, revenue: todayRevenue, yesterdayOrders: yOrders, yesterdayRevenue: yRevenue },
    daily14,
    week: { revenue: wRev, prevRevenue: pwRev, orders: wOrders, prevOrders: pwOrders },
    aov: validCount30 > 0 ? Math.round(validRevenue30 / validCount30) : 0,
    cancelRate: total30 > 0 ? Math.round((cancelled30 / total30) * 100) : 0,
    cancelledCount: cancelled30,
    totalCount30: total30,
    coupon: { orders: couponOrders, discount: Math.round(couponDiscount) },
    weekday: weekdayCounts,
    hours,
    peak,
    topProducts: [...productMap.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, 5),
    districts: [...districtMap.entries()]
      .map(([name, orders]) => ({ name, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5),
    customers: {
      total: custTotal,
      returning,
      fresh: Math.max(custTotal - returning, 0),
      repeatRate: custTotal > 0 ? Math.round((returning / custTotal) * 100) : 0,
    },
    unverifiedAdvance,
  };
}
