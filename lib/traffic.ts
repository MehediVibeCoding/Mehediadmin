import type { Product } from '@/types';

// Supabase `page_views` টেবিলের একটা রো — `visitor_id`/`created_at` সবসময় থাকে,
// `product_id`/`page_url` ঐচ্ছিক (স্কিমা ভিন্ন হতে পারে, তাই auto-detect করা হয়)।
export interface TrafficPageView {
  visitor_id: string | null;
  created_at: string;
  product_id?: string | number | null;
  page_url?: string | null;
}

export type TrackingField = 'product_id' | 'page_url' | null;

// প্রোডাক্ট-ভিউ ট্র্যাকিং কলাম কোনটা আছে সেটা auto-detect করো (legacy loadPageViewsData)
const ID_FIELD_CANDIDATES = ['product_id', 'productId', 'prod_id', 'item_id'];
const URL_FIELD_CANDIDATES = ['page_url', 'pageUrl', 'url', 'path', 'pathname', 'page'];

export function detectTrackingField(rows: TrafficPageView[]): TrackingField {
  if (!rows.length) return null;
  const sampleKeys = Object.keys(rows[0] as unknown as Record<string, unknown>);
  if (ID_FIELD_CANDIDATES.some((k) => sampleKeys.includes(k))) return 'product_id';
  if (URL_FIELD_CANDIDATES.some((k) => sampleKeys.includes(k))) return 'page_url';
  return null;
}

export interface DateRangeInput {
  start: Date;
  end: Date;
}

// রেঞ্জের মধ্যে ফিল্টার করো (legacy renderTrafficPage — endExclusive পরের দিন পর্যন্ত)
export function filterByRange(rows: TrafficPageView[], range: DateRangeInput): TrafficPageView[] {
  const start = new Date(range.start);
  start.setHours(0, 0, 0, 0);
  const endExclusive = new Date(range.end);
  endExclusive.setHours(0, 0, 0, 0);
  endExclusive.setDate(endExclusive.getDate() + 1);
  return rows.filter((r) => {
    if (!r.created_at) return false;
    const d = new Date(r.created_at);
    return d >= start && d < endExclusive;
  });
}

export interface TrafficSummary {
  uniqueVisitors: number;
  totalViews: number;
  avgViews: string; // legacy .toFixed(1)
}

export function computeSummary(filtered: TrafficPageView[]): TrafficSummary {
  const uniqueSet = new Set<string>();
  filtered.forEach((r) => {
    if (r.visitor_id) uniqueSet.add(r.visitor_id);
  });
  return {
    uniqueVisitors: uniqueSet.size,
    totalViews: filtered.length,
    avgViews: uniqueSet.size ? (filtered.length / uniqueSet.size).toFixed(1) : '0',
  };
}

// ২৪ ঘণ্টার ডিস্ট্রিবিউশন (legacy hourCounts)
export function computeHourCounts(filtered: TrafficPageView[]): number[] {
  const hourCounts = new Array(24).fill(0);
  filtered.forEach((r) => {
    const h = new Date(r.created_at).getHours();
    hourCounts[h]++;
  });
  return hourCounts;
}

// সবচেয়ে ব্যস্ত ৩-ঘণ্টার উইন্ডো (legacy renderTrafficPage bestWinStart/bestWinSum)
export function findPeakWindow(hourCounts: number[]): { start: number; sum: number } {
  let bestWinStart = 0;
  let bestWinSum = -1;
  for (let h = 0; h < 24; h++) {
    let sum = 0;
    for (let k = 0; k < 3; k++) sum += hourCounts[(h + k) % 24];
    if (sum > bestWinSum) {
      bestWinSum = sum;
      bestWinStart = h;
    }
  }
  return { start: bestWinStart, sum: bestWinSum };
}

// পূর্ণাঙ্গ বাংলা সময়-লেবেল (legacy bnHourLabel)
export function bnHourLabel(h: number): string {
  let period: string;
  if (h >= 5 && h < 12) period = 'সকাল';
  else if (h >= 12 && h < 16) period = 'দুপুর';
  else if (h >= 16 && h < 18) period = 'বিকাল';
  else if (h >= 18 && h < 21) period = 'সন্ধ্যা';
  else period = 'রাত';
  let hr12 = h % 12;
  if (hr12 === 0) hr12 = 12;
  return `${period} ${hr12}টা`;
}

// কম্প্যাক্ট AM/PM লেবেল (legacy shortHourLabel)
export function shortHourLabel(h: number): string {
  const suffix = h < 12 ? 'AM' : 'PM';
  let hr12 = h % 12;
  if (hr12 === 0) hr12 = 12;
  return `${hr12}${suffix}`;
}

export interface PeakHourLabels {
  short: string;
  full: string;
  note: string;
}

// stat card + peak-hour note টেক্সট (legacy renderTrafficPage peakLabelShort/Full/note)
export function peakHourLabels(peak: { start: number; sum: number }): PeakHourLabels {
  if (peak.sum <= 0) {
    return { short: '—', full: '—', note: 'এই সময়সীমায় পর্যাপ্ত ডাটা পাওয়া যায়নি' };
  }
  const endHour = (peak.start + 2) % 24;
  const short = `${shortHourLabel(peak.start)}-${shortHourLabel(endHour)}`;
  const full = `${bnHourLabel(peak.start)} - ${bnHourLabel(endHour)}`;
  return {
    short,
    full,
    note: `সবচেয়ে বেশি ভিজিটর আসে ${full} — এই সময়ে Facebook/TikTok অ্যাড চালালে সবচেয়ে বেশি রেজাল্ট পাবেন!`,
  };
}

export interface TrafficDayRow {
  key: string; // YYYY-MM-DD
  label: string; // বাংলা ফরম্যাট
  uniqueVisitors: number;
  totalViews: number;
  avgViews: string;
}

// দিন অনুযায়ী গ্রুপ করা টেবিল, সাম্প্রতিক আগে (legacy renderTrafficDayTable)
export function buildDayTable(filtered: TrafficPageView[]): TrafficDayRow[] {
  const dayMap = new Map<string, { views: number; visitorSet: Set<string> }>();
  filtered.forEach((r) => {
    if (!r.created_at) return;
    const key = new Date(r.created_at).toLocaleDateString('en-CA');
    if (!dayMap.has(key)) dayMap.set(key, { views: 0, visitorSet: new Set() });
    const row = dayMap.get(key)!;
    row.views += 1;
    if (r.visitor_id) row.visitorSet.add(r.visitor_id);
  });

  const dayKeys = [...dayMap.keys()].sort((a, b) => b.localeCompare(a));
  return dayKeys.map((k) => {
    const d = new Date(k + 'T00:00:00');
    const label = d.toLocaleDateString('bn-BD', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const row = dayMap.get(k)!;
    const uniq = row.visitorSet.size;
    return {
      key: k,
      label,
      uniqueVisitors: uniq,
      totalViews: row.views,
      avgViews: uniq ? (row.views / uniq).toFixed(1) : '0',
    };
  });
}

export interface TrendSeries {
  subtitle: string; // 'ঘণ্টাভিত্তিক ইউনিক ভিজিটর' | 'দৈনিক ইউনিক ভিজিটর'
  labels: string[];
  values: number[];
  total: number;
}

// hourly (single day) বা daily (multi-day) ইউনিক ভিজিটর সিরিজ (legacy drawTrafficTrendChart data-prep অংশ)
export function buildTrendSeries(filtered: TrafficPageView[], range: DateRangeInput, singleDay: boolean): TrendSeries {
  const labels: string[] = [];
  const dataMap = new Map<string | number, Set<string>>();

  if (singleDay) {
    for (let h = 0; h < 24; h++) {
      labels.push(h + 'টা');
      dataMap.set(h, new Set());
    }
    filtered.forEach((r) => {
      const h = new Date(r.created_at).getHours();
      if (r.visitor_id) dataMap.get(h)!.add(r.visitor_id);
    });
  } else {
    const cursor = new Date(range.start);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(range.end);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      const key = cursor.toLocaleDateString('en-CA');
      labels.push(cursor.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' }));
      dataMap.set(key, new Set());
      cursor.setDate(cursor.getDate() + 1);
    }
    filtered.forEach((r) => {
      const key = new Date(r.created_at).toLocaleDateString('en-CA');
      if (dataMap.has(key) && r.visitor_id) dataMap.get(key)!.add(r.visitor_id);
    });
  }

  const values = [...dataMap.values()].map((s) => s.size);
  const total = values.reduce((s, v) => s + v, 0);
  return {
    subtitle: singleDay ? 'ঘণ্টাভিত্তিক ইউনিক ভিজিটর' : 'দৈনিক ইউনিক ভিজিটর',
    labels,
    values,
    total,
  };
}

export interface TopViewedEntry {
  key: string;
  name: string;
  thumb: string | null; // image URL, null হলে fallback আইকন দেখাতে হবে
  count: number;
  pct: number;
}

// সর্বাধিক দেখা প্রোডাক্ট — trackingField না থাকলে null (legacy "সেটআপ নেই" fallback দেখাতে)
export function buildTopViewed(
  filtered: TrafficPageView[],
  products: Product[],
  trackingField: TrackingField
): TopViewedEntry[] | null {
  if (!trackingField) return null;

  const counts = new Map<string, number>();
  filtered.forEach((r) => {
    let key: string | null = null;
    if (trackingField === 'product_id' && r.product_id != null) key = String(r.product_id);
    else if (trackingField === 'page_url' && r.page_url) key = String(r.page_url);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  function resolve(key: string): { name: string; thumb: string | null } {
    if (trackingField === 'product_id') {
      const p = products.find((p) => String(p.id) === key);
      if (p) return { name: p.name, thumb: p.imgs?.[0]?.startsWith('http') ? p.imgs[0] : null };
    } else {
      const lowerKey = key.toLowerCase();
      const found = products.find(
        (p) => lowerKey.includes(String(p.id)) || lowerKey.includes((p.name || '').toLowerCase().slice(0, 8))
      );
      if (found) return { name: found.name, thumb: found.imgs?.[0]?.startsWith('http') ? found.imgs[0] : null };
    }
    return { name: key, thumb: null };
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCount = sorted[0]?.[1] || 1;

  return sorted.map(([key, count]) => {
    const { name, thumb } = resolve(key);
    return { key, name, thumb, count, pct: Math.round((count / maxCount) * 100) };
  });
}
