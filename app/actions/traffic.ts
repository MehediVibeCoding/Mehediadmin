'use server';

import { requireAdmin } from '@/lib/auth-guard';
import { loadLiveData, loadTrafficData } from '@/lib/analytics/report';
import type { LiveData, TrafficData, TrafficRange } from '@/lib/analytics/types';

// 📊 ট্রাফিক ডাটার সোর্স এখন GA4 Data API + Cloudflare GraphQL API।
// - মেইন সাইট (Vangcur) ও তার Supabase ডাটাবেজে কোনো বাড়তি লোড পড়ে না — ডাটা আসে সরাসরি Google/Cloudflare থেকে।
// - রেজাল্ট ৫ মিনিট সার্ভারে ক্যাশ থাকে (lib/analytics/report.ts); "রিফ্রেশ" বাটনে fresh=true দিলে ক্যাশ এড়িয়ে নতুন ডাটা আনে।
// - প্রতিটা অ্যাকশন নিজে requireAdmin() ডাকে (middleware-এর ওপর একা ভরসা নয়)।

const MAX_DAYS = 90;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// বাংলাদেশ সময় অনুযায়ী আজকের তারিখ (সার্ভার UTC-তে চললেও দিন ঠিক থাকে)
function todayInDhaka(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
}

function shiftDays(ymd: string, delta: number): string {
  const d = new Date(ymd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function sanitizeRange(input?: TrafficRange): TrafficRange {
  const today = todayInDhaka();
  const fallback: TrafficRange = { start: shiftDays(today, -6), end: today }; // ডিফল্ট: গত ৭ দিন
  if (!input || !DATE_RE.test(input.start) || !DATE_RE.test(input.end)) return fallback;
  let { start, end } = input;
  if (end > today) end = today;
  if (start > end) start = end;
  const min = shiftDays(end, -(MAX_DAYS - 1));
  if (start < min) start = min;
  return { start, end };
}

export async function getTrafficData(range?: TrafficRange, opts?: { fresh?: boolean }): Promise<TrafficData> {
  await requireAdmin();
  return loadTrafficData(sanitizeRange(range), !!opts?.fresh);
}

export async function getLiveVisitors(): Promise<LiveData> {
  await requireAdmin();
  return loadLiveData();
}
