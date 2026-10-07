import 'server-only';
import type { CloudflareReport } from './types';

// ☁️ Cloudflare GraphQL Analytics API — জোনের দৈনিক HTTP রিকোয়েস্ট, ব্যান্ডউইথ, ইউনিক ভিজিটর।
// এনভায়রনমেন্ট ভেরিয়েবল: CLOUDFLARE_ZONE_ID, CLOUDFLARE_ANALYTICS_API_TOKEN
// (টোকেনে "Zone → Analytics → Read" পারমিশন থাকতে হবে)

export class CloudflareError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'CloudflareError';
    this.status = status;
  }
}

export function cloudflareConfigured(): boolean {
  return !!process.env.CLOUDFLARE_ZONE_ID && !!process.env.CLOUDFLARE_ANALYTICS_API_TOKEN;
}

const QUERY = `
query ($zone: String!, $from: Date!, $to: Date!) {
  viewer {
    zones(filter: { zoneTag: $zone }) {
      httpRequests1dGroups(limit: 200, orderBy: [date_ASC], filter: { date_geq: $from, date_leq: $to }) {
        dimensions { date }
        sum {
          requests
          pageViews
          bytes
          cachedRequests
          threats
          countryMap { clientCountryName requests }
        }
        uniq { uniques }
      }
    }
  }
}`;

interface Group {
  dimensions: { date: string };
  sum: {
    requests: number;
    pageViews: number;
    bytes: number;
    cachedRequests: number;
    threats: number;
    countryMap: { clientCountryName: string; requests: number }[];
  };
  uniq: { uniques: number };
}

export async function fetchCloudflareReport(start: string, end: string): Promise<CloudflareReport> {
  const zone = process.env.CLOUDFLARE_ZONE_ID?.trim();
  const token = process.env.CLOUDFLARE_ANALYTICS_API_TOKEN?.trim();
  if (!zone || !token) throw new CloudflareError('Cloudflare এনভায়রনমেন্ট ভেরিয়েবল সেট করা নেই', 500);

  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { zone, from: start, to: end } }),
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as {
    data?: { viewer?: { zones?: { httpRequests1dGroups?: Group[] }[] } };
    errors?: { message?: string }[];
  };
  if (!res.ok) throw new CloudflareError(`Cloudflare API ত্রুটি (${res.status})`, res.status);
  if (json.errors?.length) throw new CloudflareError(json.errors[0]?.message || 'Cloudflare GraphQL ত্রুটি', 400);

  const groups = json.data?.viewer?.zones?.[0]?.httpRequests1dGroups;
  if (!groups) throw new CloudflareError('জোন পাওয়া যায়নি — CLOUDFLARE_ZONE_ID ঠিক আছে কিনা দেখুন', 404);

  const totals = { requests: 0, pageViews: 0, bandwidthBytes: 0, uniques: 0, cachedRequests: 0, threats: 0 };
  const countryMap = new Map<string, number>();
  const daily = groups.map((g) => {
    totals.requests += g.sum.requests;
    totals.pageViews += g.sum.pageViews;
    totals.bandwidthBytes += g.sum.bytes;
    totals.uniques += g.uniq.uniques;
    totals.cachedRequests += g.sum.cachedRequests;
    totals.threats += g.sum.threats;
    for (const c of g.sum.countryMap || []) {
      countryMap.set(c.clientCountryName, (countryMap.get(c.clientCountryName) || 0) + c.requests);
    }
    return { date: g.dimensions.date, requests: g.sum.requests, uniques: g.uniq.uniques, bytes: g.sum.bytes };
  });

  const countries = [...countryMap.entries()]
    .map(([code, requests]) => ({ code, requests }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);

  return { totals, daily, countries };
}
