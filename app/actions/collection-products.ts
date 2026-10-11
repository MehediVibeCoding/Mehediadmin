'use server';

// ফাইলের পাথ: app/actions/collection-products.ts
// ─────────────────────────────────────────────────────────────────────────────
// "হোম শোকেস" পেজ থেকে কালেকশনের প্রোডাক্ট যোগ/বাদ দেওয়ার অ্যাকশন।
// প্রোডাক্ট এডিট ফর্মের "কালেকশন" ড্রপডাউনের সাথে একই ডেটায় কাজ করে:
//   custom_products.collections (text[]) — 'gift' / 'premium' / 'unique' / 'cute'
// এখানকার পরিবর্তন সাথে সাথে সেভ হয় (আলাদা সেভ বাটন লাগে না) এবং লাইভ সাইটের ক্যাশ নতুন হয়।
// ─────────────────────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache';
import { revalidateVangcurCatalog } from '@/lib/revalidateVangcurCatalog';
import { invalidateProductsData } from '@/lib/adminCache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-guard';
import { COLLECTION_IDS, type CollectionId } from '@/lib/constants/homeShowcase';

export interface CollectionProductItem {
  id: number;
  name: string;
  img: string;
  price: number;
}

export interface CollectionProductsResult {
  ok: boolean;
  products: CollectionProductItem[];
  message?: string;
}

export interface CollectionMutationResult {
  ok: boolean;
  message?: string;
}

const MAX_LIST = 200;
const SEARCH_LIMIT = 12;

const COLUMN_MISSING_MESSAGE =
  'ডাটাবেজে কালেকশন কলাম এখনো তৈরি হয়নি — আগে _migration_reference/002_product_collections.sql চালান';

function isCollectionId(v: unknown): v is CollectionId {
  return typeof v === 'string' && (COLLECTION_IDS as readonly string[]).includes(v);
}

function isMissingCollectionsColumn(message: string): boolean {
  return /collections/i.test(message) && /(column|schema cache)/i.test(message);
}

// imgs: jsonb অ্যারে — প্রতিটা এন্ট্রি হয় ছবির URL, নয়তো emoji ফলব্যাক
function firstImage(imgs: unknown): string {
  if (!Array.isArray(imgs)) return '';
  const hit = imgs.find((x): x is string => typeof x === 'string' && (x.startsWith('http') || x.startsWith('/')));
  return hit || '';
}

function toItem(row: Record<string, unknown>): CollectionProductItem {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    img: firstImage(row.imgs),
    price: Number(row.price) || 0,
  };
}

// ওই কালেকশনে এখন যেসব প্রোডাক্ট আছে
export async function getCollectionProducts(collectionId: string): Promise<CollectionProductsResult> {
  await requireAdmin();
  if (!isCollectionId(collectionId)) return { ok: false, products: [], message: 'অজানা কালেকশন' };

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('custom_products')
    .select('id, name, imgs, price')
    .contains('collections', [collectionId])
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })
    .limit(MAX_LIST);

  if (error) {
    return {
      ok: false,
      products: [],
      message: isMissingCollectionsColumn(error.message) ? COLUMN_MISSING_MESSAGE : 'তালিকা আনতে সমস্যা হয়েছে',
    };
  }
  return { ok: true, products: (data ?? []).map((r) => toItem(r as Record<string, unknown>)) };
}

// যোগ করার জন্য খোঁজা — নাম (আংশিক মিললেও চলবে) অথবা আইডি নম্বর; যেগুলো আগে থেকেই আছে সেগুলো বাদ
export async function searchProductsForCollection(query: string, collectionId: string): Promise<CollectionProductsResult> {
  await requireAdmin();
  if (!isCollectionId(collectionId)) return { ok: false, products: [], message: 'অজানা কালেকশন' };

  const q = String(query ?? '').trim().slice(0, 80);
  if (!q) return { ok: true, products: [] };

  const supabase = createServiceRoleClient();
  const isNumeric = /^\d{1,12}$/.test(q);
  // % ও , ও ( ) PostgREST ফিল্টারের বিশেষ চিহ্ন — সার্চ টেক্সট থেকে সরিয়ে নিই
  const safe = q.replace(/[%,()*\\]/g, ' ').trim();

  let req = supabase.from('custom_products').select('id, name, imgs, price, collections').limit(SEARCH_LIMIT * 2);
  if (isNumeric) {
    req = req.or(`id.eq.${Number(q)},name.ilike.%${safe}%`);
  } else if (safe) {
    req = req.ilike('name', `%${safe}%`);
  } else {
    return { ok: true, products: [] };
  }

  const { data, error } = await req;
  if (error) {
    return {
      ok: false,
      products: [],
      message: isMissingCollectionsColumn(error.message) ? COLUMN_MISSING_MESSAGE : 'খুঁজতে সমস্যা হয়েছে',
    };
  }

  const items = (data ?? [])
    .filter((r) => {
      const cols = (r as Record<string, unknown>).collections;
      return !(Array.isArray(cols) && cols.includes(collectionId));
    })
    .slice(0, SEARCH_LIMIT)
    .map((r) => toItem(r as Record<string, unknown>));
  return { ok: true, products: items };
}

// একটা প্রোডাক্টকে কালেকশনে যোগ বা বাদ — প্রোডাক্টের অন্য কালেকশন ও ক্যাটাগরি অক্ষত থাকে
export async function setProductInCollection(
  productId: number,
  collectionId: string,
  add: boolean,
): Promise<CollectionMutationResult> {
  await requireAdmin();
  if (!isCollectionId(collectionId)) return { ok: false, message: 'অজানা কালেকশন' };
  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: 'প্রোডাক্ট আইডি ঠিক নেই' };

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from('custom_products').select('id, collections').eq('id', id).maybeSingle();
  if (error) {
    return { ok: false, message: isMissingCollectionsColumn(error.message) ? COLUMN_MISSING_MESSAGE : 'প্রোডাক্ট খুঁজতে সমস্যা হয়েছে' };
  }
  if (!data) return { ok: false, message: `#${id} আইডির প্রোডাক্ট পাওয়া যায়নি` };

  const current = new Set(
    Array.isArray((data as Record<string, unknown>).collections)
      ? ((data as Record<string, unknown>).collections as unknown[]).filter((x): x is string => typeof x === 'string')
      : [],
  );
  if (add) current.add(collectionId);
  else current.delete(collectionId);

  // স্থায়ী ক্রমে, শুধু পরিচিত id রেখে সেভ
  const next = COLLECTION_IDS.filter((c) => current.has(c));

  const { error: updateError } = await supabase.from('custom_products').update({ collections: next }).eq('id', id);
  if (updateError) {
    return { ok: false, message: isMissingCollectionsColumn(updateError.message) ? COLUMN_MISSING_MESSAGE : `সেভ ব্যর্থ: ${updateError.message}` };
  }

  revalidatePath('/products');
  revalidatePath('/design/home-showcase');
  invalidateProductsData();
  await revalidateVangcurCatalog();
  return { ok: true };
}
