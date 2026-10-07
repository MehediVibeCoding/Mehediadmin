import 'server-only';
import { createSign } from 'node:crypto';

// 🔐 GA4 Data API (REST) — কোনো অতিরিক্ত npm প্যাকেজ ছাড়াই।
// সার্ভিস অ্যাকাউন্টের JWT তৈরি করে access token নেয়, তারপর analyticsdata.googleapis.com কল করে।
// এনভায়রনমেন্ট ভেরিয়েবল (দুটো উপায়ের যেকোনো একটা):
//   (ক) GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY   ← সহজ, আলাদা আলাদা কপি-পেস্ট
//   (খ) GOOGLE_SERVICE_ACCOUNT_KEY = পুরো JSON (এক লাইনে)
//   এবং GA_PROPERTY_ID

export class Ga4Error extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'Ga4Error';
    this.status = status;
  }
}

interface Credentials {
  email: string;
  privateKey: string;
}

function loadCredentials(): Credentials | null {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  if (rawJson) {
    try {
      const j = JSON.parse(rawJson) as { client_email?: string; private_key?: string };
      if (j.client_email && j.private_key) {
        return { email: j.client_email, privateKey: normalizeKey(j.private_key) };
      }
    } catch {
      /* JSON ভুল হলে নিচের আলাদা ভেরিয়েবলে যাবে */
    }
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (email && key) return { email, privateKey: normalizeKey(key) };
  return null;
}

// Vercel-এ কী প্রায়ই "\n" লিটারেল সহ বা কোটেশনসহ বসে — দুটোই ঠিক করে নেওয়া হয়
function normalizeKey(k: string): string {
  let s = k.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1);
  return s.replace(/\\n/g, '\n');
}

export function ga4Configured(): boolean {
  return !!process.env.GA_PROPERTY_ID && !!loadCredentials();
}

const b64url = (b: Buffer | string): string =>
  Buffer.from(b).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

  const cred = loadCredentials();
  if (!cred) throw new Ga4Error('Google সার্ভিস অ্যাকাউন্ট এনভায়রনমেন্ট ভেরিয়েবল সেট করা নেই', 500);

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(
    JSON.stringify({
      iss: cred.email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  let signature: string;
  try {
    signature = b64url(createSign('RSA-SHA256').update(`${header}.${claim}`).sign(cred.privateKey));
  } catch {
    throw new Ga4Error('GOOGLE_PRIVATE_KEY পড়া যাচ্ছে না — কী-টা সম্পূর্ণ ও সঠিকভাবে বসান', 500);
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claim}.${signature}`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !json.access_token) {
    throw new Ga4Error(`Google লগইন ব্যর্থ: ${json.error_description || res.status}`, res.status === 400 ? 401 : res.status);
  }
  cachedToken = { token: json.access_token, exp: now + (json.expires_in || 3600) };
  return json.access_token;
}

async function ga4Post<T>(path: string, body: unknown): Promise<T> {
  const property = process.env.GA_PROPERTY_ID?.trim();
  if (!property) throw new Ga4Error('GA_PROPERTY_ID সেট করা নেই', 500);
  const token = await getAccessToken();
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${property}:${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; status?: string } };
  if (!res.ok) {
    throw new Ga4Error(json.error?.message || `GA4 API ত্রুটি (${res.status})`, res.status);
  }
  return json;
}

// ── রিপোর্ট টাইপ (শুধু যা লাগে) ──
export interface Ga4ReportRequest {
  dateRanges?: { startDate: string; endDate: string; name?: string }[];
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  orderBys?: unknown[];
  limit?: number;
  dimensionFilter?: unknown;
  keepEmptyRows?: boolean;
}
export interface Ga4ReportResponse {
  rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[];
}

/** একসাথে সর্বোচ্চ ৫টা রিপোর্ট */
export async function ga4BatchReports(requests: Ga4ReportRequest[]): Promise<Ga4ReportResponse[]> {
  const out = await ga4Post<{ reports?: Ga4ReportResponse[] }>('batchRunReports', { requests });
  return out.reports || [];
}

export async function ga4Realtime(body: {
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  minuteRanges?: { name?: string; startMinutesAgo: number; endMinutesAgo: number }[];
  limit?: number;
  orderBys?: unknown[];
}): Promise<Ga4ReportResponse> {
  return ga4Post<Ga4ReportResponse>('runRealtimeReport', body);
}

/** সারিগুলোকে সহজ আকৃতিতে আনে */
export function readRows(r: Ga4ReportResponse | undefined): { dims: string[]; mets: number[] }[] {
  return (r?.rows || []).map((row) => ({
    dims: (row.dimensionValues || []).map((d) => d.value),
    mets: (row.metricValues || []).map((m) => Number(m.value) || 0),
  }));
}
