'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sanitizeInput } from '@/lib/security';
import { requireAdmin } from '@/lib/auth-guard';
import type { OfferConfig, OfferActiveModel } from '@/types';

const SETTING_KEY = 'vc_offer_popup';

const DEFAULT_OFFER_CONFIG: OfferConfig = {
  active_model: 'none',
  model1: { title: '', body: '', btn_text: '', btn_url: '' },
  model2: { img: '', url: '' },
  model3: { product_id: '', badge_text: '' },
};

// legacy loadOfferData() — store_settings.vc_offer_popup পড়ে, না থাকলে ডিফল্ট শেপ
export async function getOfferConfig(): Promise<OfferConfig> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('store_settings')
    .select('setting_value')
    .eq('setting_key', SETTING_KEY)
    .maybeSingle();

  if (error || !data?.setting_value) return DEFAULT_OFFER_CONFIG;

  try {
    const raw = data.setting_value;
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed === 'object') {
      const v = parsed as Partial<OfferConfig>;
      // legacy: Object.assign(defaults, v) — সেভ করা মান defaults-এর উপর merge হয়
      return {
        active_model: v.active_model || 'none',
        model1: { ...DEFAULT_OFFER_CONFIG.model1, ...v.model1 },
        model2: { ...DEFAULT_OFFER_CONFIG.model2, ...v.model2 },
        model3: { ...DEFAULT_OFFER_CONFIG.model3, ...v.model3 },
      };
    }
  } catch {
    // parse ব্যর্থ হলে fallback-এই থাকো
  }
  return DEFAULT_OFFER_CONFIG;
}

async function persistOfferConfig(cfg: OfferConfig): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error: upsertError } = await supabase
    .from('store_settings')
    .upsert({ setting_key: SETTING_KEY, setting_value: JSON.stringify(cfg) }, { onConflict: 'setting_key' });
  if (upsertError) {
    await supabase.from('store_settings').delete().eq('setting_key', SETTING_KEY);
    await supabase.from('store_settings').insert({ setting_key: SETTING_KEY, setting_value: JSON.stringify(cfg) });
  }
  revalidatePath('/offers-mgmt');
}

export interface OfferActionResult {
  ok: boolean;
  message?: string;
}

// legacy handleOfferToggle() — চালু করলে বাকি দুইটা মডেল স্বয়ংক্রিয়ভাবে বন্ধ হয়ে যায় (একবারে একটাই লাইভ)
export async function toggleActiveModel(
  model: Exclude<OfferActiveModel, 'none'>,
  checked: boolean
): Promise<OfferActionResult> {
  await requireAdmin();
  const cfg = await getOfferConfig();
  cfg.active_model = checked ? model : 'none';
  await persistOfferConfig(cfg);
  return { ok: true };
}

// legacy saveOfferModel() — মডেল অনুযায়ী ভিন্ন ফিল্ড সেভ হয়, active_model অপরিবর্তিত থাকে
export async function saveOfferModel1(input: Omit<OfferConfig['model1'], never>): Promise<OfferActionResult> {
  await requireAdmin();
  const cfg = await getOfferConfig();
  cfg.model1 = {
    title: sanitizeInput(input.title),
    body: sanitizeInput(input.body),
    btn_text: sanitizeInput(input.btn_text),
    btn_url: sanitizeInput(input.btn_url),
  };
  await persistOfferConfig(cfg);
  return { ok: true };
}

export async function saveOfferModel2(input: OfferConfig['model2']): Promise<OfferActionResult> {
  await requireAdmin();
  const cfg = await getOfferConfig();
  cfg.model2 = {
    img: sanitizeInput(input.img),
    url: sanitizeInput(input.url),
  };
  await persistOfferConfig(cfg);
  return { ok: true };
}

export async function saveOfferModel3(input: OfferConfig['model3']): Promise<OfferActionResult> {
  await requireAdmin();
  const cfg = await getOfferConfig();
  cfg.model3 = {
    product_id: input.product_id,
    badge_text: sanitizeInput(input.badge_text) || 'HOT DEAL',
  };
  await persistOfferConfig(cfg);
  return { ok: true };
}

// legacy deleteOfferModel() — মডেলের ডেটা খালি করে দেয়, লাইভ থাকলে বন্ধ করে দেয়
export async function deleteOfferModel(model: Exclude<OfferActiveModel, 'none'>): Promise<OfferActionResult> {
  await requireAdmin();
  const cfg = await getOfferConfig();
  if (model === 'model1') cfg.model1 = { title: '', body: '', btn_text: '', btn_url: '' };
  else if (model === 'model2') cfg.model2 = { img: '', url: '' };
  else if (model === 'model3') cfg.model3 = { product_id: '', badge_text: '' };
  if (cfg.active_model === model) cfg.active_model = 'none';
  await persistOfferConfig(cfg);
  return { ok: true };
}
