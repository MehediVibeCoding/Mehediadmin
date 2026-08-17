'use server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { DEFAULT_CATEGORIES, type CategoryOption } from '@/lib/constants/categories';

// legacy getCats()-এর সমতুল্য — কোনো আলাদা "categories" টেবিল নেই, বরং
// store_settings key 'vc_categories'-এ owner-এর সেভ করা কাস্টম লিস্ট (JSON
// array) থাকলে সেটাই authority, না থাকলে DEFAULT_CATEGORIES fallback।
// (ক্যাটাগরি CRUD/reorder নিজেই Module ৭-এ আসবে — এখানে শুধু Products-এর
// dropdown-এর জন্য read করা হচ্ছে।)
export async function getCategories(): Promise<CategoryOption[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('store_settings')
    .select('setting_value')
    .eq('setting_key', 'vc_categories')
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
