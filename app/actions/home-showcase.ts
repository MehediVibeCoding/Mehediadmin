'use server';

import { revalidatePath } from 'next/cache';
import { revalidateVangcurCatalog } from '@/lib/revalidateVangcurCatalog';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { ALLOWED_IMAGE_MIME, verifyImageMagicBytes, MAGIC_BYTE_MISMATCH_MESSAGE } from '@/lib/uploadValidation';
import {
  DEFAULT_SHOWCASE, SHOWCASE_SETTING_KEY, normalizeShowcase, type ShowcaseConfig,
} from '@/lib/constants/homeShowcase';

const STORAGE_BUCKET = 'product-images'; // hero-cards/products মডিউলের bucket-ই পুনর্ব্যবহার, নতুন bucket তৈরি হয়নি

export interface HomeShowcaseActionResult {
  ok: boolean;
  message?: string;
}

// মূল সাইটের হোম পেজের শোকেস সেকশন (৪ কার্ড + ২ স্পটলাইট) — কিছু সেভ না থাকলে ডিফল্ট
export async function getHomeShowcase(): Promise<ShowcaseConfig> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('store_settings')
    .select('setting_value')
    .eq('setting_key', SHOWCASE_SETTING_KEY)
    .maybeSingle();

  if (error || !data?.setting_value) return DEFAULT_SHOWCASE;

  try {
    const raw = data.setting_value;
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return normalizeShowcase(parsed);
  } catch {
    return DEFAULT_SHOWCASE;
  }
}

async function persistHomeShowcase(config: ShowcaseConfig): Promise<void> {
  const supabase = createServiceRoleClient();
  const value = JSON.stringify(config);
  const { error: upsertError } = await supabase
    .from('store_settings')
    .upsert({ setting_key: SHOWCASE_SETTING_KEY, setting_value: value }, { onConflict: 'setting_key' });
  if (upsertError) {
    await supabase.from('store_settings').delete().eq('setting_key', SHOWCASE_SETTING_KEY);
    const { error: insertError } = await supabase
      .from('store_settings')
      .insert({ setting_key: SHOWCASE_SETTING_KEY, setting_value: value });
    if (insertError) throw new Error(insertError.message);
  }
  revalidatePath('/design/home-showcase');
  await revalidateVangcurCatalog();
}

// ক্লায়েন্ট থেকে আসা ডেটা বিশ্বাস করা হয় না — normalizeShowcase() সব ফিল্ড যাচাই করে, অক্ষর সীমায় ছাঁটে
// এবং শুধু https ছবির লিংক রাখে। তারপর যা বেরোয় সেটাই সেভ হয়।
export async function saveHomeShowcase(input: unknown): Promise<HomeShowcaseActionResult> {
  await requireAdmin();
  const config = normalizeShowcase(input);

  for (let i = 0; i < config.cards.length; i++) {
    const c = config.cards[i];
    if (!c.title) return { ok: false, message: `⚠️ কার্ড #${i + 1}-এর শিরোনাম দিন` };
    if (!c.btn) return { ok: false, message: `⚠️ কার্ড #${i + 1}-এর বাটন টেক্সট দিন` };
  }
  for (let i = 0; i < config.spotlights.length; i++) {
    const s = config.spotlights[i];
    if (!s.enabled) continue;
    if (!s.title) return { ok: false, message: `⚠️ স্পটলাইট #${i + 1}-এর শিরোনাম দিন` };
    if (!s.btn) return { ok: false, message: `⚠️ স্পটলাইট #${i + 1}-এর বাটন টেক্সট দিন` };
  }

  try {
    await persistHomeShowcase(config);
  } catch (e) {
    return { ok: false, message: `❌ সেভ ব্যর্থ: ${e instanceof Error ? e.message : 'অজানা সমস্যা'}` };
  }
  return { ok: true };
}

export async function resetHomeShowcaseToDefault(): Promise<HomeShowcaseActionResult> {
  await requireAdmin();
  try {
    await persistHomeShowcase(JSON.parse(JSON.stringify(DEFAULT_SHOWCASE)) as ShowcaseConfig);
  } catch (e) {
    return { ok: false, message: `❌ রিসেট ব্যর্থ: ${e instanceof Error ? e.message : 'অজানা সমস্যা'}` };
  }
  return { ok: true };
}

// ছবি আপলোড — হিরো-কার্ডের মতোই: আসল MIME + ম্যাজিক-বাইট যাচাই, Supabase Storage-এ রেখে শুধু URL ফেরত
export async function uploadHomeShowcaseImage(
  formData: FormData
): Promise<{ ok: boolean; url?: string; message?: string }> {
  await requireAdmin();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'কোনো ফাইল পাওয়া যায়নি' };
  }
  if (file.size > 3 * 1024 * 1024) {
    return { ok: false, message: '⚠️ ছবির সাইজ ৩MB এর বেশি — ছোট করে দিন' };
  }
  const ext = ALLOWED_IMAGE_MIME[file.type];
  if (!ext) {
    return { ok: false, message: 'শুধুমাত্র JPG, PNG বা WebP ছবি আপলোড করা যাবে' };
  }
  if (!(await verifyImageMagicBytes(file, file.type))) {
    return { ok: false, message: MAGIC_BYTE_MISMATCH_MESSAGE };
  }
  const supabase = createServiceRoleClient();
  const path = `home-showcase/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) return { ok: false, message: error.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { ok: true, url: publicUrl };
}
