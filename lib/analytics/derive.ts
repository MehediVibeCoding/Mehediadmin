import type { DailyPoint, Ga4Report, ProductViewRow } from './types';
import type { TopViewedEntry, TrafficDayRow, TrafficSummary, TrendSeries } from '@/lib/traffic';

// GA4 রিপোর্ট → বিদ্যমান ট্রাফিক UI কম্পোনেন্টের প্রপ (কোনো সার্ভার-ইমপোর্ট নেই, ক্লায়েন্টে চলে)।

export function emptyHourCounts(): number[] {
  return new Array(24).fill(0);
}

export function toSummary(ga: Ga4Report | null): TrafficSummary {
  if (!ga) return { uniqueVisitors: 0, totalViews: 0, avgViews: '0' };
  const { users, views } = ga.totals;
  return { uniqueVisitors: users, totalViews: views, avgViews: users ? (views / users).toFixed(1) : '0' };
}

export function toDayRows(daily: DailyPoint[]): TrafficDayRow[] {
  return [...daily]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((d) => {
      const label = new Date(d.date + 'T00:00:00').toLocaleDateString('bn-BD', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return {
        key: d.date,
        label,
        uniqueVisitors: d.users,
        totalViews: d.views,
        avgViews: d.users ? (d.views / d.users).toFixed(1) : '0',
      };
    });
}

export function toTrendSeries(ga: Ga4Report | null, singleDay: boolean): TrendSeries {
  if (!ga) return { subtitle: 'দৈনিক ইউনিক ভিজিটর', labels: [], values: [], total: 0 };
  if (singleDay) {
    const values = ga.hourly.users;
    return {
      subtitle: 'ঘণ্টাভিত্তিক ইউনিক ভিজিটর',
      labels: values.map((_, h) => h + 'টা'),
      values,
      total: ga.totals.users,
    };
  }
  const labels = ga.daily.map((d) =>
    new Date(d.date + 'T00:00:00').toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' }),
  );
  const values = ga.daily.map((d) => d.users);
  return { subtitle: 'দৈনিক ইউনিক ভিজিটর', labels, values, total: ga.totals.users };
}

export function toTopViewed(products: ProductViewRow[]): TopViewedEntry[] {
  const max = products[0]?.views || 1;
  return products.map((p) => ({
    key: p.id,
    name: p.name,
    thumb: p.thumb,
    count: p.views,
    pct: Math.round((p.views / max) * 100),
  }));
}

// দেশের ISO কোড → ফ্ল্যাগ ইমোজি (ডাটা হিসেবে; হেডিংয়ে নয়)
export function flagEmoji(code?: string): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0)));
}

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}

export function formatDuration(sec: number): string {
  const s = Math.round(sec);
  if (s < 60) return `${s} সেকেন্ড`;
  return `${Math.floor(s / 60)} মি ${s % 60} সে`;
}
