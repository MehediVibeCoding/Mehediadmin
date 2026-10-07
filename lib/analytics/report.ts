import 'server-only';
import { unstable_cache } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { ga4BatchReports, ga4Configured, ga4Realtime, readRows, Ga4Error, type Ga4ReportResponse } from './google';
import { cloudflareConfigured, fetchCloudflareReport, CloudflareError } from './cloudflare';
import type {
  CloudflareReport,
  DailyPoint,
  FunnelStep,
  GeoRow,
  Ga4Report,
  LiveData,
  NameCount,
  PageRow,
  ProductViewRow,
  SourceStatus,
  TrafficData,
  TrafficRange,
} from './types';

const CACHE_SECONDS = 300; // ৫ মিনিট — GA4/Cloudflare API স্প্যাম ঠেকাতে
const CACHE_VERSION = 'v1';

const FUNNEL: { key: FunnelStep['key']; label: string }[] = [
  { key: 'view_item', label: 'প্রোডাক্ট দেখেছে' },
  { key: 'add_to_cart', label: 'কার্টে যোগ করেছে' },
  { key: 'begin_checkout', label: 'চেকআউট শুরু করেছে' },
  { key: 'purchase', label: 'অর্ডার করেছে' },
];

const gaDate = (d: string): string => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
const orUnknown = (v: string): string => (!v || v === '(not set)' || v === '(other)' ? 'অজানা' : v);

function eachDay(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(start + 'T00:00:00Z');
  const last = new Date(end + 'T00:00:00Z');
  while (cur <= last && out.length < 400) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

// /product/<slug>-<id> → id
function productIdFromPath(path: string): string | null {
  const m = path.match(/^\/product\/(?:.*-)?(\d+)\/?$/);
  return m ? m[1] : null;
}

async function resolveProducts(views: Map<string, number>): Promise<ProductViewRow[]> {
  const top = [...views.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (top.length === 0) return [];
  const ids = top.map(([id]) => Number(id)).filter((n) => Number.isFinite(n));
  const meta = new Map<string, { name: string; thumb: string | null }>();
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase.from('custom_products').select('id, name, imgs').in('id', ids);
    for (const p of (data || []) as { id: number; name: string; imgs: unknown }[]) {
      const first = Array.isArray(p.imgs) ? (p.imgs[0] as string | undefined) : undefined;
      meta.set(String(p.id), { name: p.name, thumb: first && first.startsWith('http') ? first : null });
    }
  } catch {
    /* নাম না পেলে নিচে পাথ দেখানো হবে */
  }
  return top.map(([id, count]) => ({
    id,
    name: meta.get(id)?.name || `প্রোডাক্ট #${id}`,
    thumb: meta.get(id)?.thumb || null,
    views: count,
  }));
}

async function buildGa4Report(start: string, end: string): Promise<Ga4Report> {
  const dateRanges = [{ startDate: start, endDate: end }];
  const byUsers = [{ metric: { metricName: 'activeUsers' }, desc: true }];

  const [batchA, batchB] = await Promise.all([
    ga4BatchReports([
      {
        dateRanges,
        metrics: [
          { name: 'activeUsers' },
          { name: 'newUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'engagementRate' },
        ],
      },
      {
        dateRanges,
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }, { name: 'newUsers' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
        limit: 400,
      },
      {
        dateRanges,
        dimensions: [{ name: 'hour' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        limit: 24,
      },
      {
        dateRanges,
        dimensions: [{ name: 'country' }, { name: 'countryId' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: byUsers,
        limit: 12,
      },
      {
        dateRanges,
        dimensions: [{ name: 'city' }, { name: 'country' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: byUsers,
        limit: 12,
      },
    ]),
    ga4BatchReports([
      {
        dateRanges,
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: byUsers,
        limit: 10,
      },
      {
        dateRanges,
        dimensions: [{ name: 'sessionSourceMedium' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: byUsers,
        limit: 12,
      },
      {
        dateRanges,
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: byUsers,
        limit: 6,
      },
      {
        dateRanges,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 120,
      },
      {
        dateRanges,
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'activeUsers' }, { name: 'eventCount' }],
        dimensionFilter: {
          filter: { fieldName: 'eventName', inListFilter: { values: FUNNEL.map((f) => f.key) } },
        },
        limit: 10,
      },
    ]),
  ]);

  // ── মোট ──
  const t = readRows(batchA[0])[0]?.mets || [];
  const totals = {
    users: t[0] || 0,
    newUsers: t[1] || 0,
    sessions: t[2] || 0,
    views: t[3] || 0,
    avgSessionSec: t[4] || 0,
    engagementRate: t[5] || 0,
  };

  // ── দৈনিক (ফাঁকা দিনে শূন্য বসিয়ে) ──
  const dayMap = new Map<string, DailyPoint>();
  for (const r of readRows(batchA[1])) {
    const date = gaDate(r.dims[0] || '');
    dayMap.set(date, { date, users: r.mets[0] || 0, views: r.mets[1] || 0, sessions: r.mets[2] || 0, newUsers: r.mets[3] || 0 });
  }
  const daily = eachDay(start, end).map((date) => dayMap.get(date) || { date, users: 0, views: 0, sessions: 0, newUsers: 0 });

  // ── ঘণ্টা ──
  const hourly = { views: new Array<number>(24).fill(0), users: new Array<number>(24).fill(0) };
  for (const r of readRows(batchA[2])) {
    const h = Number(r.dims[0]);
    if (h >= 0 && h < 24) {
      hourly.views[h] = r.mets[0] || 0;
      hourly.users[h] = r.mets[1] || 0;
    }
  }

  // ── দেশ ও শহর ──
  const countries: GeoRow[] = readRows(batchA[3]).map((r) => ({
    key: r.dims[1] || r.dims[0],
    name: orUnknown(r.dims[0]),
    code: r.dims[1] && r.dims[1] !== '(not set)' ? r.dims[1] : undefined,
    users: r.mets[0] || 0,
    sessions: r.mets[1] || 0,
  }));
  const cities: GeoRow[] = readRows(batchA[4]).map((r) => ({
    key: `${r.dims[0]}|${r.dims[1]}`,
    name: orUnknown(r.dims[0]),
    sub: orUnknown(r.dims[1]),
    users: r.mets[0] || 0,
    sessions: r.mets[1] || 0,
  }));

  // ── সোর্স ও ডিভাইস ──
  const toNameCount = (rows: { dims: string[]; mets: number[] }[]): NameCount[] =>
    rows.map((r) => ({ key: r.dims[0], name: orUnknown(r.dims[0]), users: r.mets[0] || 0, sessions: r.mets[1] || 0 }));
  const channels = toNameCount(readRows(batchB[0]));
  const sources = toNameCount(readRows(batchB[1]));
  const devices = toNameCount(readRows(batchB[2]));

  // ── টপ পেজ ও প্রোডাক্ট ভিউ ──
  const pageRows = readRows(batchB[3]);
  const topPages: PageRow[] = pageRows.slice(0, 10).map((r) => ({ path: r.dims[0] || '/', views: r.mets[0] || 0, users: r.mets[1] || 0 }));
  const productViews = new Map<string, number>();
  for (const r of pageRows) {
    const id = productIdFromPath(r.dims[0] || '');
    if (id) productViews.set(id, (productViews.get(id) || 0) + (r.mets[0] || 0));
  }
  const products = await resolveProducts(productViews);

  // ── ফানেল ──
  const evMap = new Map(readRows(batchB[4]).map((r) => [r.dims[0], r.mets]));
  const funnel: FunnelStep[] = FUNNEL.map((f) => ({
    key: f.key,
    label: f.label,
    users: evMap.get(f.key)?.[0] || 0,
    events: evMap.get(f.key)?.[1] || 0,
  }));

  return { totals, daily, hourly, countries, cities, channels, sources, devices, topPages, products, funnel };
}

// ── ক্যাশড সংস্করণ (ব্যর্থ হলে throw করে → ব্যর্থতা ক্যাশ হয় না) ──
const cachedGa4 = unstable_cache(buildGa4Report, [CACHE_VERSION, 'ga4-report'], { revalidate: CACHE_SECONDS });
const cachedCloudflare = unstable_cache(fetchCloudflareReport, [CACHE_VERSION, 'cf-report'], { revalidate: CACHE_SECONDS });

function ga4Hint(e: unknown): SourceStatus {
  const message = e instanceof Error ? e.message : String(e);
  const status = e instanceof Ga4Error ? e.status : 0;
  let hint = 'GA4 ডাটা আনা যায়নি। Vercel-এ GA_PROPERTY_ID ও সার্ভিস অ্যাকাউন্টের ভেরিয়েবলগুলো আবার দেখুন।';
  if (status === 403 || /permission|PERMISSION_DENIED/i.test(message)) {
    hint = 'GA4 → Admin → Property access management-এ সার্ভিস অ্যাকাউন্টের ইমেইলকে "Viewer" দিন। এছাড়া Google Cloud-এ "Google Analytics Data API" চালু আছে কিনা দেখুন।';
  } else if (/private_key|GOOGLE_PRIVATE_KEY|পড়া যাচ্ছে না/i.test(message)) {
    hint = 'GOOGLE_PRIVATE_KEY সম্পূর্ণ (-----BEGIN থেকে END পর্যন্ত) ও সঠিকভাবে বসানো আছে কিনা দেখুন।';
  } else if (status === 401 || /invalid_grant|লগইন ব্যর্থ/i.test(message)) {
    hint = 'সার্ভিস অ্যাকাউন্টের ইমেইল ও প্রাইভেট কী একই সার্ভিস অ্যাকাউন্টের কিনা মিলিয়ে দেখুন; কী বাতিল হয়ে থাকলে নতুন কী বানান।';
  } else if (status === 400 || status === 404) {
    hint = 'GA_PROPERTY_ID শুধু সংখ্যা হতে হবে (Property ID, "G-" দিয়ে শুরু হওয়া Measurement ID নয়)।';
  }
  return { configured: true, ok: false, error: message, hint };
}

function cfHint(e: unknown): SourceStatus {
  const message = e instanceof Error ? e.message : String(e);
  const status = e instanceof CloudflareError ? e.status : 0;
  let hint = 'Cloudflare ডাটা আনা যায়নি। CLOUDFLARE_ZONE_ID ও টোকেন আবার দেখুন।';
  if (status === 401 || status === 403 || /authoriz|permission|not allowed/i.test(message)) {
    hint = 'Cloudflare টোকেনে "Zone → Analytics → Read" পারমিশন আছে এবং এই ডোমেইনের জোন সিলেক্ট করা আছে কিনা দেখুন।';
  } else if (status === 404) {
    hint = 'CLOUDFLARE_ZONE_ID ভুল — Cloudflare → ডোমেইনের Overview পেজের ডান পাশে Zone ID আছে।';
  }
  return { configured: true, ok: false, error: message, hint };
}

const notConfigured = (hint: string): SourceStatus => ({ configured: false, ok: false, hint });

export async function loadTrafficData(range: TrafficRange, fresh = false): Promise<TrafficData> {
  const { start, end } = range;

  const ga4Promise: Promise<{ data: Ga4Report | null; status: SourceStatus }> = ga4Configured()
    ? (fresh ? buildGa4Report(start, end) : cachedGa4(start, end))
        .then((data) => ({ data, status: { configured: true, ok: true } as SourceStatus }))
        .catch((e) => ({ data: null, status: ga4Hint(e) }))
    : Promise.resolve({
        data: null,
        status: notConfigured('Vercel-এ GA_PROPERTY_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL ও GOOGLE_PRIVATE_KEY বসান।'),
      });

  const cfPromise: Promise<{ data: CloudflareReport | null; status: SourceStatus }> = cloudflareConfigured()
    ? (fresh ? fetchCloudflareReport(start, end) : cachedCloudflare(start, end))
        .then((data) => ({ data, status: { configured: true, ok: true } as SourceStatus }))
        .catch((e) => ({ data: null, status: cfHint(e) }))
    : Promise.resolve({
        data: null,
        status: notConfigured('Vercel-এ CLOUDFLARE_ZONE_ID ও CLOUDFLARE_ANALYTICS_API_TOKEN বসান।'),
      });

  const [ga4, cf] = await Promise.all([ga4Promise, cfPromise]);
  return {
    range,
    ga4: ga4.data,
    ga4Status: ga4.status,
    cloudflare: cf.data,
    cloudflareStatus: cf.status,
    fetchedAt: new Date().toISOString(),
  };
}

// ── রিয়েলটাইম (ক্যাশ ছাড়া — অ্যাকশন থেকে প্রতি ~৪৫ সেকেন্ডে ডাকা হয়) ──
export async function loadLiveData(): Promise<LiveData> {
  const empty: LiveData = { ok: false, last30: 0, last5: 0, countries: [], pages: [] };
  if (!ga4Configured()) return { ...empty, error: 'GA4 সংযুক্ত নয়' };
  try {
    const [totals, countries, pages] = await Promise.all([
      ga4Realtime({
        metrics: [{ name: 'activeUsers' }],
        minuteRanges: [
          { name: 'm30', startMinutesAgo: 29, endMinutesAgo: 0 },
          { name: 'm5', startMinutesAgo: 4, endMinutesAgo: 0 },
        ],
      }),
      ga4Realtime({
        dimensions: [{ name: 'country' }, { name: 'countryId' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 5,
      }),
      // পেজ-ভিত্তিক ভাগ ঐচ্ছিক — এটা ব্যর্থ হলেও বাকিটা চলবে
      ga4Realtime({
        dimensions: [{ name: 'unifiedScreenName' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 5,
      }).catch((): Ga4ReportResponse => ({ rows: [] })),
    ]);

    let last30 = 0;
    let last5 = 0;
    for (const r of readRows(totals)) {
      if (r.dims[0] === 'm30') last30 = r.mets[0] || 0;
      if (r.dims[0] === 'm5') last5 = r.mets[0] || 0;
    }
    return {
      ok: true,
      last30,
      last5,
      countries: readRows(countries).map((r) => ({
        name: orUnknown(r.dims[0]),
        code: r.dims[1] && r.dims[1] !== '(not set)' ? r.dims[1] : undefined,
        users: r.mets[0] || 0,
      })),
      pages: readRows(pages).map((r) => ({ path: orUnknown(r.dims[0]), users: r.mets[0] || 0 })),
    };
  } catch (e) {
    return { ...empty, error: e instanceof Error ? e.message : String(e) };
  }
}
