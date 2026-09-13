// ফাইলের পাথ: app/actions/guideTemplates.ts
// [NEW] guide_page_templates টেবিলের সার্ভার অ্যাকশন — Template Manager UI-এর ব্যাকএন্ড।
// প্যাটার্ন app/actions/guidePages.ts-এর সাথেই মিলিয়ে লেখা।

'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { sanitizeInput } from '@/lib/security';
import { revalidateGuidePage } from '@/lib/revalidateGuidePage';
import { RESERVED_URL_PREFIXES } from '@/types/guides';
import type { GuideBlock, GuidePageTemplate } from '@/types/guides';

const TABLE = 'guide_page_templates';

function normalizeKey(raw: string): string {
  return sanitizeInput(raw)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function normalizePrefix(raw: string): string {
  return sanitizeInput(raw)
    .toLowerCase()
    .replace(/^\/|\/$/g, '')
    .replace(/[^\w\s/-]/g, '')
    .replace(/[\s_]+/g, '-');
}

export interface GuideTemplateActionResult {
  ok: boolean;
  message?: string;
  template?: GuidePageTemplate;
}

export async function listGuideTemplates(): Promise<GuidePageTemplate[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from(TABLE).select('*').order('name_bn', { ascending: true });
  if (error) return [];
  return (data || []) as GuidePageTemplate[];
}

/** url_prefix বাছাই করার সময় validation — Vangcur-এর existing static route বা অন্য কোনো
 *  অ্যাক্টিভ টেমপ্লেটের prefix-এর সাথে সংঘর্ষ ঠেকাতে। excludeId দিলে (এডিট করার সময়)
 *  নিজের রো-কে নিজের সাথে তুলনা করা বাদ যায়। */
async function validatePrefix(
  supabase: ReturnType<typeof createServiceRoleClient>,
  prefix: string,
  excludeId?: string
): Promise<string | null> {
  const first = prefix.split('/')[0];
  if (first && RESERVED_URL_PREFIXES.includes(first)) {
    return `"${first}" Vangcur-এর একটা existing রুট — এটা url prefix হিসেবে ব্যবহার করা যাবে না`;
  }

  let query = supabase.from(TABLE).select('id, key, url_prefix').eq('url_prefix', prefix);
  if (excludeId) query = query.neq('id', excludeId);
  const { data } = await query;
  if (data && data.length > 0) {
    return `এই prefix ইতিমধ্যে "${data[0].key}" টেমপ্লেটে ব্যবহার হচ্ছে`;
  }

  return null;
}

export async function createGuideTemplate(input: {
  key: string;
  name_bn: string;
  name_en: string;
  scope: 'category' | 'product';
  url_prefix: string;
  block_skeleton?: GuideBlock[];
}): Promise<GuideTemplateActionResult> {
  const { email } = await requireAdmin();
  const supabase = createServiceRoleClient();

  const key = normalizeKey(input.key);
  const url_prefix = normalizePrefix(input.url_prefix);

  if (!key) return { ok: false, message: 'একটা key দিতে হবে (ইংরেজি, আন্ডারস্কোর দিয়ে)' };

  const prefixError = await validatePrefix(supabase, url_prefix);
  if (prefixError) return { ok: false, message: prefixError };

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      key,
      name_bn: sanitizeInput(input.name_bn),
      name_en: sanitizeInput(input.name_en),
      scope: input.scope,
      url_prefix,
      block_skeleton: input.block_skeleton ?? [],
      is_active: true,
      updated_by: email,
    })
    .select('*')
    .maybeSingle();

  if (error || !data) {
    const dup = error?.code === '23505';
    return { ok: false, message: dup ? 'এই key আগে থেকেই ব্যবহার হচ্ছে' : 'তৈরি ব্যর্থ: ' + error?.message };
  }

  return { ok: true, template: data as GuidePageTemplate };
}

export async function updateGuideTemplate(input: {
  id: string;
  name_bn: string;
  name_en: string;
  url_prefix: string;
  block_skeleton: GuideBlock[];
  is_active: boolean;
}): Promise<GuideTemplateActionResult> {
  const { email } = await requireAdmin();
  const supabase = createServiceRoleClient();

  const url_prefix = normalizePrefix(input.url_prefix);
  const prefixError = await validatePrefix(supabase, url_prefix, input.id);
  if (prefixError) return { ok: false, message: prefixError };

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      name_bn: sanitizeInput(input.name_bn),
      name_en: sanitizeInput(input.name_en),
      url_prefix,
      block_skeleton: input.block_skeleton,
      is_active: input.is_active,
      updated_by: email,
    })
    .eq('id', input.id)
    .select('*')
    .maybeSingle();

  if (error || !data) return { ok: false, message: 'সেভ ব্যর্থ: ' + error?.message };

  // url_prefix বদলালে এই টেমপ্লেটের সব existing পেজের URL বদলে যায় — কতগুলো পেজ তা
  // আলাদাভাবে বের না করে, নিরাপদে পুরো root-level catch-all route-pattern রিভ্যালিডেট করে দেওয়া হচ্ছে
  await revalidateGuidePage(undefined);
  return { ok: true, template: data as GuidePageTemplate };
}

export async function deleteGuideTemplate(id: string): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  const supabase = createServiceRoleClient();

  const { data: key } = await supabase.from(TABLE).select('key').eq('id', id).maybeSingle();
  if (key) {
    const { count } = await supabase
      .from('guide_pages')
      .select('id', { count: 'exact', head: true })
      .eq('page_type', key.key);
    if (count && count > 0) {
      return { ok: false, message: `এই টেমপ্লেট দিয়ে তৈরি ${count}টা পেজ আছে — আগে সেগুলো মুছুন বা অন্য টেমপ্লেটে সরান` };
    }
  }

  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) return { ok: false, message: 'ডিলিট ব্যর্থ: ' + error.message };
  return { ok: true };
}
