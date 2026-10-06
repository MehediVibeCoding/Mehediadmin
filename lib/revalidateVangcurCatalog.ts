// ফাইলের পাথ: lib/revalidateVangcurCatalog.ts
// প্রোডাক্ট/ক্যাটাগরি/হিরো কার্ড/অফার সেভ হওয়ার পর এটা কল করলে Vangcur-এর
// /api/revalidate-catalog এন্ডপয়েন্ট হিট হয় — লাইভ সাইটের ক্যাশ করা পেজ সাথে সাথে নতুন হয়।
//
// ডিজাইন নিয়ম (আগের মতোই): এটা কখনো throw করে না এবং অ্যাডমিনের সেভ কখনো আটকায় না।
// ব্যর্থ হলেও লাইভ সাইট নিজে থেকেই ২–৫ মিনিটের মধ্যে নতুন ডেটা নিয়ে নেয়।
//
// 🆕 আগে সব ব্যর্থতা (env নেই, 401, 503, রিডাইরেক্ট, নেটওয়ার্ক) নিঃশব্দে গিলে ফেলা হতো, তাই
// "প্রোডাক্ট সাইটে আসছে না" হলে কারণ জানার উপায় ছিল না। এখন প্রতিবার ফলাফল Vercel
// Function Logs-এ `[revalidate-catalog]` প্রিফিক্সে লেখা হয় (Vercel → Mehediadmin প্রজেক্ট → Logs)।
//
// প্রয়োজনীয় env (Mehediadmin-এ): VANGCUR_SITE_URL (যেমন https://vangcur.com — যে ঠিকানা
// আসলে সাইট সার্ভ করে, রিডাইরেক্ট হয় এমন ঠিকানা নয়) ও GUIDE_REVALIDATE_SECRET_KEY
// (Vangcur-এর একই নামের env-এর সাথে হুবহু এক হতে হবে)।

import { invalidateProductsData } from '@/lib/adminCache';
import { createServiceRoleClient } from '@/lib/supabase/server';

// 🆕 শেষ রিফ্রেশের ফলাফল admin_sync_status টেবিলে (key='catalog') রাখা হয় — অ্যাডমিনের
// CatalogSyncBanner এটা পড়ে ব্যর্থ হলে সতর্কবার্তা দেখায়। এটাও কখনো throw করে না।
export const CATALOG_SYNC_KEY = 'catalog';

export interface CatalogSyncResult {
  ok: boolean;
  message: string;
}

const TIMEOUT_MS = 4000;

async function attempt(url: string, secret: string): Promise<{ ok: boolean; status?: number; note?: string; retry: boolean }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
      body: '{}',
      cache: 'no-store',
      // রিডাইরেক্ট নিজে অনুসরণ করা হয় না — ৩০১/৩০২ হলে POST চুপচাপ GET হয়ে যায় এবং
      // রিভ্যালিডেশন কখনোই চলে না; তাই রিডাইরেক্ট ধরা পড়লে স্পষ্টভাবে লগ করি।
      redirect: 'manual',
      signal: controller.signal,
    });
    if (res.ok) return { ok: true, status: res.status, retry: false };

    if (res.status >= 300 && res.status < 400) {
      return {
        ok: false,
        status: res.status,
        note: `রিডাইরেক্ট হচ্ছে → ${res.headers.get('location') || '?'} — VANGCUR_SITE_URL-এ সরাসরি চূড়ান্ত ঠিকানাটা দিন`,
        retry: false,
      };
    }
    let msg = '';
    try { msg = (await res.text()).slice(0, 120); } catch { /* ignore */ }
    const hint =
      res.status === 401 ? 'সিক্রেট কী দুই প্রজেক্টে মিলছে না' :
      res.status === 503 ? 'Vangcur-এ GUIDE_REVALIDATE_SECRET_KEY সেট করা নেই' :
      res.status === 429 ? 'রেট লিমিট' :
      res.status === 404 ? 'ঠিকানা ভুল, বা Vangcur-এ /api/revalidate-catalog ডিপ্লয় হয়নি' : '';
    // শুধু সার্ভার-সাইড/সাময়িক ত্রুটিতে আবার চেষ্টা; ৪xx-এ আবার চেষ্টা বৃথা
    return { ok: false, status: res.status, note: [hint, msg].filter(Boolean).join(' | '), retry: res.status >= 500 };
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    return { ok: false, note: aborted ? `${TIMEOUT_MS}ms-এ সাড়া নেই` : `নেটওয়ার্ক ত্রুটি: ${e instanceof Error ? e.message : String(e)}`, retry: true };
  } finally {
    clearTimeout(timeout);
  }
}

async function recordStatus(ok: boolean, message: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    await supabase
      .from('admin_sync_status')
      .upsert(
        { key: CATALOG_SYNC_KEY, ok, message: message.slice(0, 300), updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      );
  } catch {
    // স্ট্যাটাস লেখা ব্যর্থ হলেও সেভ বা রিভ্যালিডেশন আটকাবে না
  }
}

export async function revalidateVangcurCatalog(): Promise<CatalogSyncResult> {
  // প্রোডাক্ট/স্টক/প্রফিট সেভের পর অ্যাডমিনের নিজের ক্যাশও (ড্যাশবোর্ডের কম-স্টক, প্রফিট) মুছে ফেলি —
  // এটা প্রতিটা প্রোডাক্ট-রাইটের পরে ডাকা হয়, তাই এক জায়গাতেই সব কভার হয়
  invalidateProductsData();

  const base = process.env.VANGCUR_SITE_URL;
  const secret = process.env.GUIDE_REVALIDATE_SECRET_KEY;

  if (!base || !secret) {
    console.error(
      `[revalidate-catalog] ❌ স্কিপ: ${!base ? 'VANGCUR_SITE_URL' : ''}${!base && !secret ? ' ও ' : ''}${!secret ? 'GUIDE_REVALIDATE_SECRET_KEY' : ''} সেট করা নেই (Mehediadmin-এর Vercel env দেখুন)`,
    );
    const message = `${!base ? 'VANGCUR_SITE_URL' : ''}${!base && !secret ? ' ও ' : ''}${!secret ? 'GUIDE_REVALIDATE_SECRET_KEY' : ''} সেট করা নেই (Mehediadmin-এর Vercel env দেখুন)`;
    await recordStatus(false, message);
    return { ok: false, message };
  }

  const url = `${base.replace(/\/$/, '')}/api/revalidate-catalog`;

  let result = await attempt(url, secret);
  if (!result.ok && result.retry) {
    result = await attempt(url, secret); // একবারই রিট্রাই
  }

  if (result.ok) {
    console.log(`[revalidate-catalog] ✅ লাইভ সাইটের ক্যাশ রিফ্রেশ হয়েছে (${url} → ${result.status})`);
    await recordStatus(true, 'ঠিক আছে');
    return { ok: true, message: 'ঠিক আছে' };
  }

  console.error(
    `[revalidate-catalog] ❌ ব্যর্থ (${url})${result.status ? ` → HTTP ${result.status}` : ''}${result.note ? ` — ${result.note}` : ''}. লাইভ সাইট নিজে থেকে কয়েক মিনিটে আপডেট নেবে।`,
  );
  const message = `${result.status ? `HTTP ${result.status}` : 'সংযোগ ব্যর্থ'}${result.note ? ` — ${result.note}` : ''}`;
  await recordStatus(false, message);
  return { ok: false, message };
}
