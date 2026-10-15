import 'server-only';
import { createHmac, randomBytes } from 'crypto';

// ══════════════════════════════════════════════════════════════
//  Recovery Hub-এর সাথে সংযোগ (অ্যাডমিন প্যানেল ↔ হাব)
//   ১. এক-ক্লিক প্রবেশ (SSO): লগইন-করা অ্যাডমিনের জন্য ৬০ সেকেন্ডের সই করা টোকেন
//   ২. স্টক-রিস্টক সিগন্যাল: স্টক ০ → বেশি হলে হাবকে জানানো (হাবের /stock পেজে "জানাতে হবে")
// env (Vercel → Mehediadmin প্রজেক্ট):
//   RECOVERY_HUB_BASE_URL   — হাবের URL (https://...workers.dev, শেষে / ছাড়া)
//   HUB_SSO_SECRET          — হাবের সাথে হুবহু একই (≥৩২ অক্ষর, এক-ক্লিক প্রবেশের সই-চাবি)
//   RECOVERY_HUB_INGEST_KEY / RECOVERY_HUB_HMAC_SECRET — মূল সাইটে যেটা বসানো, হুবহু সেটাই
// ══════════════════════════════════════════════════════════════

function b64url(buf: Buffer): string {
  return buf.toString('base64url');
}

function hubBase(): string | null {
  const u = (process.env.RECOVERY_HUB_BASE_URL || '').trim().replace(/\/+$/, '');
  return /^https:\/\//.test(u) ? u : null;
}

/** হাবে ঢোকার এক-বার-ব্যবহারযোগ্য URL; env না থাকলে null */
export function buildHubEntryUrl(): string | null {
  const base = hubBase();
  const secret = (process.env.HUB_SSO_SECRET || '').trim();
  if (!base || secret.length < 32) return null;

  const iat = Math.floor(Date.now() / 1000);
  const payload = { v: 1, iss: 'mehediadmin', iat, exp: iat + 60, nonce: b64url(randomBytes(18)) };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(createHmac('sha256', secret).update(body).digest());
  return `${base}/api/sso?t=${body}.${sig}`;
}

/**
 * স্টক ০ → বেশি হলে হাবকে জানায়। সম্পূর্ণ best-effort: env না থাকলে বা হাব বন্ধ থাকলে
 * অ্যাডমিনের স্টক-সেভ কখনো আটকায় না (after() থেকে ডাকা হয়)।
 */
export async function sendRestockSignal(productId: number | string, stock: number): Promise<void> {
  const base = hubBase();
  const apiKey = (process.env.RECOVERY_HUB_INGEST_KEY || '').trim();
  const secret = (process.env.RECOVERY_HUB_HMAC_SECRET || '').trim();
  if (!base || !apiKey || !secret) return;
  if (!Number.isFinite(stock) || stock < 1) return;

  const body = JSON.stringify({ product_id: String(productId), stock: Math.floor(stock) });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');

  try {
    const res = await fetch(`${base}/api/ingest/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'x-timestamp': timestamp, 'x-signature': signature },
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.warn(`[RecoveryHub] restock signal প্রত্যাখ্যাত: HTTP ${res.status}`);
  } catch (e) {
    console.warn('[RecoveryHub] restock signal পাঠানো যায়নি:', e);
  }
}
