// ফাইলের পাথ: app/actions/guidePages.ts
// [NEW] guide_pages টেবিলের সব সার্ভার অ্যাকশন — list/create/update/delete/publish।
// প্যাটার্ন app/actions/products.ts আর app/actions/categories.ts-এর সাথে হুবহু মিলিয়ে লেখা:
// প্রতিটা অ্যাকশন নিজে requireAdmin() কল করে, service-role client দিয়ে DB টাচ করে, revalidatePath করে।

'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { sanitizeInput } from '@/lib/security';
import type { GuideBlock, GuidePage, GuidePageType } from '@/types/guides';

const TABLE = 'guide_pages';

/** blocks[]-এর ভেতরের সব string leaf value থেকে script/HTML ট্যাগ সরানো — গভীর পর্যন্ত recursive */
function deepSanitize<T>(value: T): T {
  if (typeof value === 'string') return sanitizeInput(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => deepSanitize(v)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = deepSanitize(v);
    return out as T;
  }
  return value;
}

export interface GuidePageActionResult {
  ok: boolean;
  message?: string;
  page?: GuidePage;
}

// ══════════════════════════════════════════════════════════════
//  READ
// ══════════════════════════════════════════════════════════════

export async function listGuidePagesByProduct(productId: number): Promise<GuidePage[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });
  if (error) throw new Error('গাইড পেজ লোড ব্যর্থ: ' + error.message);
  return (data || []) as GuidePage[];
}

export async function listGuidePagesByCategory(categoryId: string): Promise<GuidePage[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: true });
  if (error) throw new Error('গাইড পেজ লোড ব্যর্থ: ' + error.message);
  return (data || []) as GuidePage[];
}

export async function getGuidePage(id: string): Promise<GuidePage | null> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return data as GuidePage;
}

// ══════════════════════════════════════════════════════════════
//  CREATE
// ══════════════════════════════════════════════════════════════

export interface CreateGuidePageInput {
  page_type: GuidePageType;
  slug: string;
  category_id?: string | null;
  product_id?: number | null;
  h1_bn: string;
  h1_en: string;
}

/** "+" বাটনে ক্লিক করে টাইপ বেছে নেওয়ার সাথে সাথেই একটা খালি ড্রাফট পেজ তৈরি হয়, এডিটর সরাসরি সেটা খুলে দেয় */
export async function createGuidePage(input: CreateGuidePageInput): Promise<GuidePageActionResult> {
  const { email } = await requireAdmin();
  const supabase = createServiceRoleClient();

  const slug = sanitizeInput(input.slug)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!slug) return { ok: false, message: 'স্লাগ খালি রাখা যাবে না' };

  const h1_bn = sanitizeInput(input.h1_bn) || 'শিরোনাম দিন';
  const h1_en = sanitizeInput(input.h1_en) || h1_bn;

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      page_type: input.page_type,
      slug,
      category_id: input.category_id ?? null,
      product_id: input.product_id ?? null,
      meta_title_bn: h1_bn,
      meta_title_en: h1_en,
      meta_description_bn: '',
      meta_description_en: '',
      h1_bn,
      h1_en,
      target_keywords: [],
      blocks: [] as GuideBlock[],
      is_published: false,
      updated_by: email,
    })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    const dup = error?.code === '23505';
    return { ok: false, message: dup ? 'এই স্লাগ আগে থেকেই ব্যবহার হচ্ছে' : 'তৈরি ব্যর্থ: ' + error?.message };
  }

  revalidatePath('/guides');
  return { ok: true, page: data as GuidePage };
}

// ══════════════════════════════════════════════════════════════
//  UPDATE
// ══════════════════════════════════════════════════════════════

export interface UpdateGuidePageInput {
  id: string;
  slug: string;
  meta_title_bn: string;
  meta_title_en: string;
  meta_description_bn: string;
  meta_description_en: string;
  h1_bn: string;
  h1_en: string;
  target_keywords: string[];
  blocks: GuideBlock[];
}

export async function updateGuidePage(input: UpdateGuidePageInput): Promise<GuidePageActionResult> {
  const { email } = await requireAdmin();
  const supabase = createServiceRoleClient();

  const slug = sanitizeInput(input.slug)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      slug,
      meta_title_bn: sanitizeInput(input.meta_title_bn),
      meta_title_en: sanitizeInput(input.meta_title_en),
      meta_description_bn: sanitizeInput(input.meta_description_bn),
      meta_description_en: sanitizeInput(input.meta_description_en),
      h1_bn: sanitizeInput(input.h1_bn),
      h1_en: sanitizeInput(input.h1_en),
      target_keywords: input.target_keywords.map(sanitizeInput).filter(Boolean),
      blocks: deepSanitize(input.blocks),
      updated_by: email,
    })
    .eq('id', input.id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    const dup = error?.code === '23505';
    return { ok: false, message: dup ? 'এই স্লাগ আগে থেকেই ব্যবহার হচ্ছে' : 'সেভ ব্যর্থ: ' + error?.message };
  }

  revalidatePath('/guides');
  return { ok: true, page: data as GuidePage };
}

// ══════════════════════════════════════════════════════════════
//  PUBLISH TOGGLE
// ══════════════════════════════════════════════════════════════

export async function setGuidePagePublished(id: string, published: boolean): Promise<GuidePageActionResult> {
  await requireAdmin();
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      is_published: published,
      published_at: published ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error || !data) return { ok: false, message: 'স্ট্যাটাস বদলানো ব্যর্থ: ' + error?.message };

  revalidatePath('/guides');
  return { ok: true, page: data as GuidePage };
}

// ══════════════════════════════════════════════════════════════
//  DELETE
// ══════════════════════════════════════════════════════════════

export async function deleteGuidePage(id: string): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) return { ok: false, message: 'ডিলিট ব্যর্থ: ' + error.message };
  revalidatePath('/guides');
  return { ok: true };
}

// ══════════════════════════════════════════════════════════════
//  DUPLICATE — একই টাইপের আরেকটা প্রোডাক্টের জন্য টেমপ্লেট হিসেবে কপি করতে (Phase-3 আইডিয়া, এখনই কাজে লাগে)
// ══════════════════════════════════════════════════════════════

export async function duplicateGuidePage(
  id: string,
  overrides: { slug: string; product_id?: number | null; category_id?: string | null }
): Promise<GuidePageActionResult> {
  const source = await getGuidePage(id);
  if (!source) return { ok: false, message: 'সোর্স পেজ পাওয়া যায়নি' };

  return createGuidePage({
    page_type: source.page_type,
    slug: overrides.slug,
    category_id: overrides.category_id ?? source.category_id,
    product_id: overrides.product_id ?? source.product_id,
    h1_bn: source.h1_bn,
    h1_en: source.h1_en,
  }).then(async (res) => {
    if (!res.ok || !res.page) return res;
    // মেটা + ব্লক পুরোটা কপি করা (createGuidePage শুধু খালি ড্রাফট বানায়, তাই দ্বিতীয় ধাপে আপডেট)
    return updateGuidePage({
      id: res.page.id,
      slug: res.page.slug,
      meta_title_bn: source.meta_title_bn,
      meta_title_en: source.meta_title_en,
      meta_description_bn: source.meta_description_bn,
      meta_description_en: source.meta_description_en,
      h1_bn: source.h1_bn,
      h1_en: source.h1_en,
      target_keywords: source.target_keywords,
      blocks: source.blocks,
    });
  });
}
