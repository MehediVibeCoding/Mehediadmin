// 📊 ট্রাফিক অ্যানালিটিক্সের শেয়ার্ড টাইপ — সার্ভার ও ক্লায়েন্ট দুই দিকেই নিরাপদ (কোনো সার্ভার-ইমপোর্ট নেই)।

export interface TrafficRange {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  users: number;
  views: number;
  sessions: number;
  newUsers: number;
}

export interface GeoRow {
  key: string;
  name: string;
  code?: string; // দেশের ISO কোড (ফ্ল্যাগের জন্য)
  sub?: string; // শহরের ক্ষেত্রে দেশের নাম
  users: number;
  sessions: number;
}

export interface NameCount {
  key: string;
  name: string;
  users: number;
  sessions: number;
}

export interface PageRow {
  path: string;
  views: number;
  users: number;
}

export interface ProductViewRow {
  id: string;
  name: string;
  thumb: string | null;
  views: number;
}

export interface FunnelStep {
  key: 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase';
  label: string;
  users: number;
  events: number;
}

export interface Ga4Report {
  totals: {
    users: number;
    newUsers: number;
    sessions: number;
    views: number;
    avgSessionSec: number;
    engagementRate: number; // 0..1
  };
  daily: DailyPoint[];
  hourly: { views: number[]; users: number[] }; // ২৪টা করে
  countries: GeoRow[];
  cities: GeoRow[];
  channels: NameCount[];
  sources: NameCount[];
  devices: NameCount[];
  topPages: PageRow[];
  products: ProductViewRow[];
  funnel: FunnelStep[];
}

export interface CloudflareReport {
  totals: {
    requests: number;
    pageViews: number;
    bandwidthBytes: number;
    uniques: number; // দৈনিক ইউনিকের যোগফল
    cachedRequests: number;
    threats: number;
  };
  daily: { date: string; requests: number; uniques: number; bytes: number }[];
  countries: { code: string; requests: number }[];
}

export interface SourceStatus {
  configured: boolean;
  ok: boolean;
  error?: string;
  hint?: string;
}

export interface TrafficData {
  range: TrafficRange;
  ga4: Ga4Report | null;
  ga4Status: SourceStatus;
  cloudflare: CloudflareReport | null;
  cloudflareStatus: SourceStatus;
  fetchedAt: string; // ISO
}

export interface LiveData {
  ok: boolean;
  error?: string;
  last30: number;
  last5: number;
  countries: { name: string; code?: string; users: number }[];
  pages: { path: string; users: number }[];
}
