'use server';

import { requireAdmin } from '@/lib/auth-guard';
import { loadTrafficData } from '@/lib/analytics/report';
import type { FunnelStep } from '@/lib/analytics/types';

// ড্যাশবোর্ডের ভিজিটর ট্র্যাকিং কার্ডগুলোর জন্য হালকা সারাংশ। ডাটা আসে ট্রাফিক পেজের মতোই
// GA4 / Cloudflare থেকে (৫ মিনিট সার্ভারে ক্যাশ) — অর্ডারের ডাটাবেজে বাড়তি চাপ পড়ে না।
// ড্যাশবোর্ড পেজ রেন্ডারে এটা ধরা হয় না: ক্লায়েন্ট কার্ড মাউন্ট হওয়ার পর আলাদাভাবে ডাকে,
// তাই GA4 ধীর বা বন্ধ থাকলেও ড্যাশবোর্ড তাৎক্ষণিক খোলে।

export interface DashboardTrafficPoint {
  date: string; // YYYY-MM-DD
  users: number;
  views: number;
}

export interface DashboardTrafficNamed {
  name: string;
  users: number;
}

export interface DashboardTraffic {
  /** কোন সোর্স থেকে সংখ্যা এসেছে; কোনোটাই সংযুক্ত না হলে null */
  source: 'ga4' | 'cloudflare' | null;
  ga4Ok: boolean;
  cloudflareOk: boolean;
  /** সংযোগ না থাকলে/ব্যর্থ হলে বাংলা ইঙ্গিত */
  hint: string | null;
  todayUsers: number | null;
  todayViews: number | null;
  yesterdayUsers: number | null;
  weekUsers: number;
  weekViews: number;
  weekSessions: number;
  weekNewUsers: number;
  avgSessionSec: number;
  engagementRate: number; // ০–১
  daily: DashboardTrafficPoint[]; // গত ৭ দিন, পুরনো → নতুন
  devices: DashboardTrafficNamed[];
  channels: DashboardTrafficNamed[];
  countries: (DashboardTrafficNamed & { code?: string })[];
  funnel: FunnelStep[];
  fetchedAt: string;
}

function todayInDhaka(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
}

function shiftDays(ymd: string, delta: number): string {
  const d = new Date(ymd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export async function getDashboardTraffic(): Promise<DashboardTraffic> {
  await requireAdmin();

  const end = todayInDhaka();
  const start = shiftDays(end, -6);
  const yesterday = shiftDays(end, -1);
  const data = await loadTrafficData({ start, end });

  const ga4 = data.ga4;
  const cf = data.cloudflare;

  const base: DashboardTraffic = {
    source: null,
    ga4Ok: data.ga4Status.ok,
    cloudflareOk: data.cloudflareStatus.ok,
    hint: null,
    todayUsers: null,
    todayViews: null,
    yesterdayUsers: null,
    weekUsers: 0,
    weekViews: 0,
    weekSessions: 0,
    weekNewUsers: 0,
    avgSessionSec: 0,
    engagementRate: 0,
    daily: [],
    devices: [],
    channels: [],
    countries: [],
    funnel: [],
    fetchedAt: data.fetchedAt,
  };

  if (ga4) {
    const byDate = new Map(ga4.daily.map((d) => [d.date, d]));
    const daily: DashboardTrafficPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const key = shiftDays(end, -i);
      const p = byDate.get(key);
      daily.push({ date: key, users: p?.users || 0, views: p?.views || 0 });
    }
    const t = byDate.get(end);
    const y = byDate.get(yesterday);
    return {
      ...base,
      source: 'ga4',
      todayUsers: t?.users ?? 0,
      todayViews: t?.views ?? 0,
      yesterdayUsers: y?.users ?? 0,
      weekUsers: ga4.totals.users,
      weekViews: ga4.totals.views,
      weekSessions: ga4.totals.sessions,
      weekNewUsers: ga4.totals.newUsers,
      avgSessionSec: ga4.totals.avgSessionSec,
      engagementRate: ga4.totals.engagementRate,
      daily,
      devices: ga4.devices.slice(0, 4).map((d) => ({ name: d.name, users: d.users })),
      channels: ga4.channels.slice(0, 5).map((c) => ({ name: c.name, users: c.users })),
      countries: ga4.countries.slice(0, 4).map((c) => ({ name: c.name, users: c.users, code: c.code })),
      funnel: ga4.funnel,
    };
  }

  if (cf) {
    const byDate = new Map(cf.daily.map((d) => [d.date, d]));
    const daily: DashboardTrafficPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const key = shiftDays(end, -i);
      const p = byDate.get(key);
      daily.push({ date: key, users: p?.uniques || 0, views: p?.requests || 0 });
    }
    return {
      ...base,
      source: 'cloudflare',
      todayUsers: byDate.get(end)?.uniques ?? 0,
      todayViews: byDate.get(end)?.requests ?? 0,
      yesterdayUsers: byDate.get(yesterday)?.uniques ?? 0,
      weekUsers: cf.totals.uniques,
      weekViews: cf.totals.pageViews,
      daily,
    };
  }

  // কোনো সোর্সই কাজ করছে না — ইঙ্গিতসহ ফেরত (UI \"ট্র্যাকিং সংযুক্ত করুন\" দেখাবে)
  return {
    ...base,
    hint: data.ga4Status.hint || data.cloudflareStatus.hint || 'অ্যানালিটিক্স সংযুক্ত নয়',
  };
}
