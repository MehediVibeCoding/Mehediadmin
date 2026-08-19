'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { DEFAULT_CATEGORIES, type CategoryOption } from '@/lib/constants/categories';

const SETTING_KEY = 'vc_categories';

// legacy getCats()-এর সমতুল্য — কোনো আলাদা "categories" টেবিল নেই, বরং
// store_settings key 'vc_categories'-এ owner-এর সেভ করা কাস্টম লিস্ট (JSON
// array) থাকলে সেটাই authority, না থাকলে DEFAULT_CATEGORIES fallback।
export async function getCategories(): Promise<CategoryOption[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('store_settings')
    .select('setting_value')
    .eq('setting_key', SETTING_KEY)
    .maybeSingle();

  if (error || !data?.setting_value) return DEFAULT_CATEGORIES;

  try {
    const raw = data.setting_value;
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map((s: Partial<CategoryOption>) => ({
        id: s.id || '',
        name: s.name || s.id || '',
        icon: s.icon || '📦',
      }));
    }
  } catch {
    // parse ব্যর্থ হলে fallback-এই থাকো
  }
  return DEFAULT_CATEGORIES;
}

// legacy saveCats() — products.ts-এর writeOrder()-এর মতোই upsert, fallback delete+insert
async function persistCategories(cats: CategoryOption[]): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error: upsertError } = await supabase
    .from('store_settings')
    .upsert({ setting_key: SETTING_KEY, setting_value: JSON.stringify(cats) }, { onConflict: 'setting_key' });
  if (upsertError) {
    await supabase.from('store_settings').delete().eq('setting_key', SETTING_KEY);
    await supabase.from('store_settings').insert({ setting_key: SETTING_KEY, setting_value: JSON.stringify(cats) });
  }
  revalidatePath('/design/categories');
  revalidatePath('/products'); // Products-এর ক্যাটাগরি dropdown/ফিল্টার এর উপর নির্ভরশীল
}

export interface CategoryActionResult {
  ok: boolean;
  message?: string;
}

// legacy addNewCategory() + saveCategoryEdit()-এর "নতুন" শাখা
export async function addCategory(input: { id: string; name: string; icon: string }): Promise<CategoryActionResult> {
  const id = input.id.trim().toLowerCase().replace(/\s/g, '');
  const name = input.name.trim();
  const icon = input.icon.trim() || '📦';

  if (!name) return { ok: false, message: 'ক্যাটাগরির নাম দিন' };
  if (!id) return { ok: false, message: 'ক্যাটাগরির ID দিন' };

  const cats = await getCategories();
  if (cats.find((c) => c.id === id)) {
    return { ok: false, message: 'এই ID ইতিমধ্যে আছে!' };
  }

  await persistCategories([...cats, { id, name, icon }]);
  return { ok: true };
}

// legacy saveCategoryEdit()-এর "এডিট" শাখা — id ইচ্ছাকৃতভাবে অপরিবর্তিত থাকে (legacy-ও তাই করত)
export async function updateCategory(
  id: string,
  input: { name: string; icon: string }
): Promise<CategoryActionResult> {
  const name = input.name.trim();
  const icon = input.icon.trim() || '📦';
  if (!name) return { ok: false, message: 'ক্যাটাগরির নাম দিন' };

  const cats = await getCategories();
  const idx = cats.findIndex((c) => c.id === id);
  if (idx === -1) return { ok: false, message: 'ক্যাটাগরি খুঁজে পাওয়া যায়নি' };

  cats[idx] = { ...cats[idx], name, icon };
  await persistCategories(cats);
  return { ok: true };
}

// legacy deleteCategory()
export async function deleteCategory(id: string): Promise<CategoryActionResult> {
  const cats = await getCategories();
  const next = cats.filter((c) => c.id !== id);
  if (next.length === cats.length) return { ok: false, message: 'ক্যাটাগরি খুঁজে পাওয়া যায়নি' };
  await persistCategories(next);
  return { ok: true };
}

// legacy drag/drop-এর পর saveCats(reordered) — এখানে reorder করা পুরো id লিস্ট নেওয়া হয়
export async function reorderCategories(orderedIds: string[]): Promise<CategoryActionResult> {
  const cats = await getCategories();
  const byId = new Map(cats.map((c) => [c.id, c]));
  const reordered = orderedIds.map((id) => byId.get(id)).filter((c): c is CategoryOption => !!c);
  // orderedIds-এ না থাকা কোনো ক্যাটাগরি থেকে গেলে (edge case) শেষে জুড়ে দাও, যাতে হারিয়ে না যায়
  cats.forEach((c) => {
    if (!orderedIds.includes(c.id)) reordered.push(c);
  });
  await persistCategories(reordered);
  return { ok: true };
}
