'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sanitizeInput, sanitizeInputArray } from '@/lib/security';
import { requireAdmin } from '@/lib/auth-guard';
import type { Product, ProductFaq, ProductSpecs } from '@/types';

const TABLE = 'custom_products';
const ORDER_KEY = 'vc_prod_order';
const STORAGE_BUCKET = 'product-images';

// ══════════════════════════════════════════════════════════════
//  ORDER (drag-sort) — legacy vc_prod_order (store_settings) থেকে
// ══════════════════════════════════════════════════════════════

async function readOrder(): Promise<number[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('store_settings')
    .select('setting_value')
    .eq('setting_key', ORDER_KEY)
    .maybeSingle();
  if (!data?.setting_value) return [];
  try {
    const raw = data.setting_value;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeOrder(order: number[]): Promise<void> {
  const supabase = createServiceRoleClient();
  // legacy saveSettingToSupabase()-এর মতোই upsert, fallback delete+insert
  const { error: upsertError } = await supabase
    .from('store_settings')
    .upsert({ setting_key: ORDER_KEY, setting_value: JSON.stringify(order) }, { onConflict: 'setting_key' });
  if (upsertError) {
    await supabase.from('store_settings').delete().eq('setting_key', ORDER_KEY);
    await supabase
      .from('store_settings')
      .insert({ setting_key: ORDER_KEY, setting_value: JSON.stringify(order) });
  }
}

function applyOrder(products: Product[], order: number[]): Product[] {
  if (!order.length) return products;
  const orderMap = new Map<number, number>();
  order.forEach((id, i) => orderMap.set(id, i));
  return [...products].sort((a, b) => {
    const ia = orderMap.has(a.id) ? orderMap.get(a.id)! : 99999;
    const ib = orderMap.has(b.id) ? orderMap.get(b.id)! : 99999;
    return ia - ib;
  });
}

// ══════════════════════════════════════════════════════════════
//  READ
// ══════════════════════════════════════════════════════════════

export async function listProducts(): Promise<Product[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const [{ data, error }, order] = await Promise.all([
    supabase.from(TABLE).select('*'),
    readOrder(),
  ]);
  if (error) throw new Error('প্রোডাক্ট লোড ব্যর্থ: ' + error.message);
  const products = (data || []) as Product[];
  return applyOrder(products, order);
}

// ══════════════════════════════════════════════════════════════
//  CREATE / UPDATE — Basic + Full Layout + Images ট্যাব থেকে raw ফর্ম
//  ডেটা নিয়ে legacy saveProd()-এর মতোই parse করে DB কলামে সাজায়।
// ══════════════════════════════════════════════════════════════

export interface QuickSpecRow {
  key: string;
  value: string;
}

export interface ProductFormInput {
  name: string;
  nameBn: string;
  cats: string[];
  price: number;
  old: number;
  stock: number;
  badge: string;
  discountColor: '' | 'green';
  warranty: string;
  rating: number;
  profit: number;
  desc: string;
  imgs: string[];
  quickSpecs: QuickSpecRow[]; // সর্বোচ্চ ৫টা — "স্পেসিফিকেশন এক নজরে"
  techSpecsRaw: string; // "Key: Value" প্রতি লাইনে
  featuresRaw: string; // প্রতি লাইনে একটা ফিচার
  faqsRaw: string; // "Q: ...\nA: ...\n\nQ: ...\nA: ..." ফরম্যাট
  closing?: string; // শুধু AI Parse ফ্লো থেকে আসে — ম্যানুয়াল ফর্মে কোনো ফিল্ড নেই (legacy-তেও নেই)
}

function parseTechSpecs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim();
        if (k && v) out[k] = v;
      }
    });
  return out;
}

function parseFeatures(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-•*]\s*/, ''));
}

function parseFaqs(raw: string): ProductFaq[] {
  const faqs: ProductFaq[] = [];
  raw
    .split(/\n\n+/)
    .filter((b) => b.trim())
    .forEach((block) => {
      const qm = block.match(/Q:\s*(.+)/i);
      const am = block.match(/A:\s*([\s\S]+)/i);
      if (qm && am) faqs.push({ q: qm[1].trim(), a: am[1].trim() });
    });
  return faqs;
}

function buildSpecs(input: ProductFormInput): ProductSpecs {
  const specs: ProductSpecs = {};
  const quickKeys: string[] = [];
  input.quickSpecs.slice(0, 5).forEach(({ key, value }) => {
    const k = sanitizeInput(key);
    const v = sanitizeInput(value);
    if (k && v) {
      specs[k] = v;
      quickKeys.push(k);
    }
  });
  if (quickKeys.length) specs._quick_keys = quickKeys;

  const tech = parseTechSpecs(input.techSpecsRaw);
  Object.entries(tech).forEach(([k, v]) => {
    specs[sanitizeInput(k)] = sanitizeInput(v);
  });

  if (input.discountColor) specs._discount_color = input.discountColor;
  specs._profit = Number.isFinite(input.profit) ? input.profit : 200;

  return specs;
}

interface SaveResult {
  status: 'ok' | 'duplicate' | 'error';
  product?: Product;
  message?: string;
}

export async function checkDuplicateName(name: string, excludeId?: number): Promise<boolean> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from(TABLE).select('id, name');
  const nameLower = name.toLowerCase().trim();
  return !!(data || []).find(
    (p: { id: number; name: string }) => p.id !== excludeId && (p.name || '').toLowerCase().trim() === nameLower
  );
}

export async function createProduct(
  input: ProductFormInput,
  opts: { forceDuplicate?: boolean } = {}
): Promise<SaveResult> {
  await requireAdmin();
  if (!input.name.trim() || !input.price) {
    return { status: 'error', message: 'নাম ও মূল্য আবশ্যক' };
  }
  if (!opts.forceDuplicate && (await checkDuplicateName(input.name))) {
    return { status: 'duplicate' };
  }

  const supabase = createServiceRoleClient();
  const imgs = input.imgs.filter(Boolean);
  const desc = sanitizeInput(input.desc);
  const row = {
    name: sanitizeInput(input.name),
    name_bn: sanitizeInput(input.nameBn),
    price: input.price,
    old: input.old || input.price,
    cat: input.cats[0] || 'rgb',
    cats: input.cats,
    stock: Number.isFinite(input.stock) ? input.stock : 0,
    warranty: sanitizeInput(input.warranty) || '১ সপ্তাহ রিপ্লেসমেন্ট ওয়ারেন্টি',
    imgs: imgs.length ? imgs : ['📦'],
    specs: buildSpecs(input),
    desc_text: desc,
    long_desc: desc,
    features: sanitizeInputArray(parseFeatures(input.featuresRaw)),
    badge: (input.badge || '').toUpperCase(),
    rating: input.rating || 4.5,
    faqs: parseFaqs(input.faqsRaw).map((f) => ({ q: sanitizeInput(f.q), a: sanitizeInput(f.a) })),
    closing: input.closing ? sanitizeInput(input.closing) : '',
  };

  const { data, error } = await supabase.from(TABLE).insert([row]).select().single();
  if (error) return { status: 'error', message: error.message };

  // নতুন id-কে order-এর শেষে যোগ করো
  const order = await readOrder();
  if (!order.includes(data.id)) {
    order.push(data.id);
    await writeOrder(order);
  }

  revalidatePath('/products');
  return { status: 'ok', product: data as Product };
}

export async function updateProduct(id: number, input: ProductFormInput): Promise<SaveResult> {
  await requireAdmin();
  if (!input.name.trim() || !input.price) {
    return { status: 'error', message: 'নাম ও মূল্য আবশ্যক' };
  }
  if (await checkDuplicateName(input.name, id)) {
    return { status: 'duplicate' };
  }

  const supabase = createServiceRoleClient();
  const imgs = input.imgs.filter(Boolean);
  const desc = sanitizeInput(input.desc);
  // ✅ 'closing' column ইচ্ছাকৃতভাবে এখানে টাচ করা হচ্ছে না — legacy ফর্মে
  // এটার কোনো ম্যানুয়াল এডিট ফিল্ড নেই (শুধু AI Parse করলে সেট হয়), আর
  // legacy-তে edit করার সময় hidden field থেকে খালি ভ্যালু গিয়ে বিদ্যমান
  // closing মুছে যেত (এক ধরনের ডেটা-লস বাগ) — এটা replicate না করে
  // existing মান অক্ষত রাখা হচ্ছে।
  const row = {
    name: sanitizeInput(input.name),
    name_bn: sanitizeInput(input.nameBn),
    price: input.price,
    old: input.old || input.price,
    cat: input.cats[0] || 'rgb',
    cats: input.cats,
    stock: Number.isFinite(input.stock) ? input.stock : 0,
    warranty: sanitizeInput(input.warranty),
    imgs: imgs.length ? imgs : ['📦'],
    specs: buildSpecs(input),
    desc_text: desc,
    long_desc: desc,
    features: sanitizeInputArray(parseFeatures(input.featuresRaw)),
    badge: (input.badge || '').toUpperCase(),
    rating: input.rating || 4.5,
    faqs: parseFaqs(input.faqsRaw).map((f) => ({ q: sanitizeInput(f.q), a: sanitizeInput(f.a) })),
  };

  const { data, error } = await supabase.from(TABLE).update(row).eq('id', id).select().single();
  if (error) return { status: 'error', message: error.message };

  revalidatePath('/products');
  return { status: 'ok', product: data as Product };
}

export async function deleteProduct(id: number): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/products');
  return { ok: true };
}

// ══════════════════════════════════════════════════════════════
//  QUICK EDIT — স্টক ও ব্যাজ (টেবিলে ইনলাইন পপওভার থেকে)
// ══════════════════════════════════════════════════════════════

export async function updateStock(id: number, stock: number): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  if (!Number.isFinite(stock) || stock < 0) return { ok: false, message: 'সঠিক স্টক সংখ্যা দিন' };
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TABLE).update({ stock }).eq('id', id);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/products');
  return { ok: true };
}

export async function updateBadge(id: number, badge: string): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from(TABLE)
    .update({ badge: sanitizeInput(badge).toUpperCase() })
    .eq('id', id);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/products');
  return { ok: true };
}

// ══════════════════════════════════════════════════════════════
//  DRAG-SORT ORDER
// ══════════════════════════════════════════════════════════════

export async function updateProductOrder(visibleOrderedIds: number[]): Promise<{ ok: boolean }> {
  await requireAdmin();
  // legacy saveCurrentOrder()-এর মতোই: ফিল্টার/পেজিনেশনের কারণে সবসময় সব
  // প্রোডাক্ট টেবিলে দৃশ্যমান থাকে না, তাই পুরনো সম্পূর্ণ অর্ডার রেখে শুধু
  // দৃশ্যমান আইটেমগুলোর পজিশনে নতুন সিরিয়াল বসানো হয়, বাকিগুলো অপরিবর্তিত।
  const products = await listProducts();
  const fullOld = products.map((p) => p.id);
  const visibleSet = new Set(visibleOrderedIds);
  let vi = 0;
  const merged = fullOld.map((id) => (visibleSet.has(id) ? visibleOrderedIds[vi++] : id));
  await writeOrder(merged);
  revalidatePath('/products');
  return { ok: true };
}

// ══════════════════════════════════════════════════════════════
//  IMAGE UPLOAD — Supabase Storage bucket 'product-images'
//  (legacy client-side upload থেকে server action-এ সরানো হয়েছে,
//   roadmap-এর "প্রতিটা module Server Action ব্যবহার করবে" নীতি অনুযায়ী)
// ══════════════════════════════════════════════════════════════

export async function uploadProductImage(
  formData: FormData
): Promise<{ ok: boolean; url?: string; message?: string }> {
  await requireAdmin();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'কোনো ফাইল পাওয়া যায়নি' };
  }
  const supabase = createServiceRoleClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

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
