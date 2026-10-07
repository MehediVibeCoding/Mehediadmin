'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { revalidateVangcurCatalog } from '@/lib/revalidateVangcurCatalog';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sanitizeInput, sanitizeInputArray } from '@/lib/security';
import { validateImageUpload } from '@/lib/uploadValidation';
import { requireAdmin } from '@/lib/auth-guard';
import { adminCached, PRODUCTS_TAG } from '@/lib/adminCache';
import { PAGE_SIZE } from '@/lib/constants/pagination';
import type { Product, ProductFaq, ProductInfoBox, ProductListRow, ProductSpecs } from '@/types';
import { parseInfoBoxes, parseFeatureBlocks } from '@/lib/smart-parser';
import { revalidateGuidePage } from '@/lib/revalidateGuidePage';
import { guidePageUrlPath } from '@/types/guides';

const GUIDE_TABLE = 'guide_pages';
const GUIDE_TEMPLATES_TABLE = 'guide_page_templates';

const TABLE = 'custom_products';
const STORAGE_BUCKET = 'product-images';
// ড্র্যাগ-সর্টে নতুন sort_order মানগুলো এই ব্যবধানে বসে — মাঝে নতুন প্রোডাক্ট
// ঢোকানোর (ভবিষ্যতে দরকার হলে) জায়গা রাখতে। নতুন প্রোডাক্ট তৈরির সময়ও এই
// ব্যবধানেই পরের মান বসে (নিচে createProduct দ্রষ্টব্য)।
const SORT_ORDER_GAP = 1000;

function escapeIlike(raw: string): string {
  // % ও _ ILIKE-এ ওয়াইল্ডকার্ড — প্রোডাক্টের নামে এগুলো থাকলেও যেন ভুল মিল না ধরে
  return raw.replace(/[%_]/g, (m) => '\\' + m);
}

// ══════════════════════════════════════════════════════════════
//  READ — তালিকা (হালকা, পেজ ধরে, সার্চ/ক্যাটাগরি ফিল্টারসহ)
// ══════════════════════════════════════════════════════════════
// 🚀 (প্রোডাক্ট লিস্ট স্কেল ফিক্স, ২০২৬-১০): আগে এখানে পুরো টেবিল select('*') দিয়ে
// একবারে আসত (লম্বা বর্ণনা/স্পেকসহ), তাই ১০০০+ প্রোডাক্টে ধীর আর ব্রাউজারে ভারী হতো।
// এখন ডাটাবেজের admin_products_page() RPC শুধু তালিকায় দেখানো কলামগুলো, সার্চ/ক্যাটাগরি
// ফিল্টার করে, আর পেজ ধরে পাঠায় — যত প্রোডাক্টই থাকুক, প্রতিবার মাত্র কয়েক KB আসে।
// সাজানোর ক্রম এখন custom_products.sort_order কলামে (আগের vc_prod_order JSON
// array-এর বদলে) — ড্র্যাগ করলে শুধু নড়াচড়া করা সারিগুলোই আপডেট হয় (reorderProducts)।

export interface ProductsPageParams {
  search: string;
  cat: string; // 'all' = সব ক্যাটাগরি
  page: number; // 1-based
  pageSize: number;
}

export interface ProductsPageResult {
  rows: ProductListRow[];
  total: number;
}

const MAX_SEARCH_LENGTH = 80;

function mapProductListRow(r: Record<string, unknown>): ProductListRow {
  return {
    id: Number(r.id),
    name: String(r.name ?? ''),
    name_bn: (r.name_bn as string) ?? null,
    cat: String(r.cat ?? ''),
    cats: Array.isArray(r.cats) ? (r.cats as string[]) : [],
    price: Number(r.price) || 0,
    old: Number(r.old) || 0,
    stock: r.stock !== undefined && r.stock !== null ? Number(r.stock) : 0,
    warranty: String(r.warranty ?? ''),
    badge: String(r.badge ?? ''),
    rating: Number(r.rating) || 0,
    color_group_id: (r.color_group_id as string) ?? null,
    color_name: (r.color_name as string) ?? null,
    color_swatch: (r.color_swatch as string) ?? null,
    sort_order: Number(r.sort_order) || 0,
    first_img: (r.first_img as string) ?? null,
  };
}

async function fetchProductsPage(search: string, cat: string, limit: number, offset: number): Promise<ProductsPageResult> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc('admin_products_page', {
    p_search: search,
    p_cat: cat,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw new Error('প্রোডাক্ট লোড ব্যর্থ: ' + error.message);
  const d = (data || {}) as { rows?: Record<string, unknown>[]; total?: number };
  return {
    rows: (d.rows || []).map(mapProductListRow),
    total: Number(d.total) || 0,
  };
}

// সার্চ ছাড়া পেজগুলো ক্যাশ হয় (প্রোডাক্ট বদলালে মুছে যায়, সর্বোচ্চ ২ মিনিট) —
// customers.ts-এর fetchCustomersPageCached-এর একই প্যাটার্ন।
const fetchProductsPageCached = adminCached(fetchProductsPage, ['admin-products-page'], [PRODUCTS_TAG]);

export async function getProductsPage(params: ProductsPageParams): Promise<ProductsPageResult> {
  await requireAdmin();
  const pageSize = Math.min(Math.max(1, Math.floor(Number(params.pageSize)) || PAGE_SIZE), 200);
  const page = Math.max(1, Math.floor(Number(params.page)) || 1);
  const search = String(params.search ?? '').slice(0, MAX_SEARCH_LENGTH).trim();
  const cat = String(params.cat ?? 'all').trim() || 'all';
  const offset = (page - 1) * pageSize;
  return search ? fetchProductsPage(search, cat, pageSize, offset) : fetchProductsPageCached('', cat, pageSize, offset);
}

// ক্যাটাগরি চিপের পাশের সংখ্যাগুলো — আগে সব প্রোডাক্ট ব্রাউজারে এনে গোনা হতো,
// এখন ডাটাবেজের admin_category_counts() RPC একবারেই গুনে দেয়।
export interface CategoryCounts {
  all: number;
  byCat: Record<string, number>;
}

async function fetchCategoryCounts(): Promise<CategoryCounts> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc('admin_category_counts');
  if (error) throw new Error('ক্যাটাগরি গণনা ব্যর্থ: ' + error.message);
  const d = (data || {}) as { all?: number; by_cat?: Record<string, number> };
  return { all: Number(d.all) || 0, byCat: d.by_cat || {} };
}

const fetchCategoryCountsCached = adminCached(fetchCategoryCounts, ['admin-category-counts'], [PRODUCTS_TAG]);

export async function getCategoryCounts(): Promise<CategoryCounts> {
  await requireAdmin();
  return fetchCategoryCountsCached();
}

// এডিট-মোডাল খোলার সময় একটা প্রোডাক্টের পুরো ডেটা (specs/desc/features/faqs সহ) —
// তালিকায় আর এটা লাগে না, তাই listProducts()-এর বদলে শুধু এডিট ক্লিক করলেই এটা চলে।
export async function getProductById(id: number): Promise<Product | null> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const [{ data, error }, { data: costRow }] = await Promise.all([
    supabase.from(TABLE).select('*').eq('id', id).maybeSingle(),
    supabase.from('product_costs').select('unit_profit').eq('product_id', id).maybeSingle(),
  ]);
  if (error) throw new Error('প্রোডাক্ট লোড ব্যর্থ: ' + error.message);
  if (!data) return null;
  return {
    ...data,
    unit_profit: costRow?.unit_profit !== undefined && costRow?.unit_profit !== null ? Number(costRow.unit_profit) : undefined,
  } as Product;
}

export interface ProductPickerRow {
  id: number;
  name: string;
  price: number;
  imgs: string[];
}

// অফার-পিকারের মতো ড্রপডাউনে "সব প্রোডাক্ট" দরকার হয় (শুধু id/name/price/ছবি) —
// পেজিনেশন ছাড়া, কিন্তু আগের মতো পুরো বর্ণনা/স্পেক/ফিচার/FAQ টেনে আনে না।
export async function listProductsForPicker(): Promise<ProductPickerRow[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, price, imgs')
    .order('sort_order', { ascending: true });
  if (error) throw new Error('প্রোডাক্ট লোড ব্যর্থ: ' + error.message);
  return (data || []).map((p) => ({
    id: Number(p.id),
    name: String(p.name ?? ''),
    price: Number(p.price) || 0,
    imgs: Array.isArray(p.imgs) ? (p.imgs as string[]) : [],
  }));
}

// কালার-ভ্যারিয়েন্ট লিংক-পিকারে একটা বিদ্যমান গ্রুপের বাকি সদস্যরা (ProductModal) —
// আগে পুরো প্রোডাক্ট তালিকা ব্রাউজারে থেকে ফিল্টার হতো, এখন সরাসরি group id দিয়ে কুয়েরি।
export async function getColorGroupMembers(
  groupId: string,
  excludeId: number
): Promise<{ id: number; name: string; color_name: string | null; color_swatch: string | null }[]> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, color_name, color_swatch')
    .eq('color_group_id', groupId)
    .neq('id', excludeId)
    .limit(50);
  if (error) throw new Error('কালার গ্রুপ লোড ব্যর্থ: ' + error.message);
  return (data || []) as { id: number; name: string; color_name: string | null; color_swatch: string | null }[];
}


// 🔒 প্রফিট-লিক ফিক্স (P0-01): `product_costs`-এই এখন একমাত্র সোর্স-অফ-ট্রুথ —
// আগে buildSpecs() এটা specs._profit হিসেবে custom_products-এ লিখত, যেটা
// RLS দিয়ে anon key-তেও পাবলিকলি readable ছিল। এখন createProduct/updateProduct
// সেভের পর এই ফাংশন দিয়ে আলাদা admin-only টেবিলে upsert করে।
async function upsertProductCost(productId: number, unitProfit: number): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('product_costs')
    .upsert({ product_id: productId, unit_profit: unitProfit }, { onConflict: 'product_id' });
  if (error) {
    // best-effort: প্রোডাক্ট সেভ আটকাবে না, কিন্তু লগে থাকুক যাতে ধরা পড়ে
    console.error('[products] product_costs upsert ব্যর্থ:', error.message);
  }
}

// ══════════════════════════════════════════════════════════════
//  CREATE / UPDATE — Basic + Full Layout + Images ট্যাব থেকে raw ফর্ম
//  ডেটা নিয়ে legacy saveProd()-এর মতোই parse করে DB কলামে সাজায়।
// ══════════════════════════════════════════════════════════════

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
  // 🆕 SEO ফিল্ডস — সবগুলো ঐচ্ছিক, খালি রাখলে সাইট auto-generated fallback ব্যবহার করে
  h1: string;
  metaTitle: string;
  metaDescription: string;
  ogDescription: string;
  quickSpecsText: string; // 🆕 "স্পেসিফিকেশন এক নজরে" — ফ্রি-ফ্লো টেক্সট (আগে ছিল ৫টা key:value pair — SpecEditor বাদ)
  desc: string;
  imgs: string[];
  featuresRaw: string; // blank-line দিয়ে আলাদা ব্লক — একলাইন হলে bullet, দুই+ লাইন হলে প্রথমটা title (bold) বাকিটা description
  techSpecsRaw: string; // "Key: Value" প্রতি লাইনে
  powerInfo: string; // ঐচ্ছিক — খালি রাখলে প্রোডাক্ট পেজে সেকশনটাই দেখাবে না
  packagingContent: string; // 🆕 ঐচ্ছিক — খালি রাখলে প্রোডাক্ট পেজে সেকশনটাই দেখাবে না
  infoBoxesRaw: string; // "### Title\nBody" ফরম্যাট, একাধিক ব্লক blank line দিয়ে আলাদা
  faqsRaw: string; // "Q: ...\nA: ...\n\nQ: ...\nA: ..." ফরম্যাট
  closing?: string; // শুধু AI Parse ফ্লো থেকে আসে — ম্যানুয়াল ফর্মে কোনো ফিল্ড নেই (legacy-তেও নেই)
  colorName: string; // 🆕 কালার ভ্যারিয়েন্ট — এই প্রোডাক্টটার কালারের নাম (যেমন "Baby Pink")
  colorSwatch: string; // 🆕 কালার ভ্যারিয়েন্ট — সোয়াচ ডটের হেক্স কোড (যেমন "#F9C5D1")
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

// 🆕 আগে এখানে শুধু "প্রতি লাইনে একটা ফিচার" ধরা হতো — এখন AI Planner-এর
// মতোই blank-line-separated ব্লক সাপোর্ট করে (icon+title লাইন, তারপর
// description লাইন), তাই ম্যানুয়ালি টাইপ করা আর AI Parse করা — দুই পথেই
// একই ফরম্যাটে ফিচার সেভ হয়। parseFeatureBlocks() smart-parser.ts থেকে
// shared (single source of truth)।
function parseFeatures(raw: string): string[] {
  return parseFeatureBlocks(raw);
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
  // 🆕 "স্পেসিফিকেশন এক নজরে" এখন থেকে specs._quick_keys-এর বদলে top-level
  // quick_specs_text কলামে সরাসরি সেভ হয় (নিচে createProduct/updateProduct
  // দ্রষ্টব্য) — এই ফাংশনে আর quick-spec হ্যান্ডলিং নেই। পুরনো প্রোডাক্টের
  // specs._quick_keys ডেটা অক্ষত থাকে, শুধু নতুন সেভে আর তৈরি হয় না।
  const tech = parseTechSpecs(input.techSpecsRaw);
  Object.entries(tech).forEach(([k, v]) => {
    specs[sanitizeInput(k)] = sanitizeInput(v);
  });

  if (input.discountColor) specs._discount_color = input.discountColor;
  // 🔒 প্রফিট আর এখানে (specs) লেখা হয় না — product_costs টেবিলে যায়
  // (দ্রষ্টব্য: upsertProductCost, createProduct/updateProduct-এর নিচে)

  return specs;
}

interface SaveResult {
  status: 'ok' | 'duplicate' | 'error';
  product?: Product;
  message?: string;
}

export async function checkDuplicateName(name: string, excludeId?: number): Promise<boolean> {
  await requireAdmin();
  const nameLower = name.toLowerCase().trim();
  if (!nameLower) return false;
  const supabase = createServiceRoleClient();
  // 🚀 আগে পুরো টেবিলের id+name ব্রাউজারে এনে মেলানো হতো (১০ হাজার প্রোডাক্টে প্রতিটা
  // সেভে পুরো টেবিল স্ক্যান)। এখন ডাটাবেজই নাম মেলায় (ইনডেক্সড lower(name) কলাম ব্যবহার করে)।
  const { data, error } = await supabase
    .from(TABLE)
    .select('id')
    .ilike('name', escapeIlike(nameLower))
    .limit(5);
  if (error) return false;
  return !!(data || []).find((p: { id: number }) => p.id !== excludeId);
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

  // নতুন প্রোডাক্ট সবসময় তালিকার শেষে বসে (sort_order = বর্তমান সর্বোচ্চ + গ্যাপ)।
  // 🚀 আগে পুরো order array ডাটাবেজ থেকে এনে push করে আবার পুরোটা লিখতে হতো;
  // এখন শুধু সর্বোচ্চ sort_order-টা (একটা সারি) এনে +১০০০ করলেই হয়।
  const { data: maxRow } = await supabase
    .from(TABLE)
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = (Number(maxRow?.sort_order) || 0) + SORT_ORDER_GAP;

  const row = {
    name: sanitizeInput(input.name),
    name_bn: sanitizeInput(input.nameBn),
    price: input.price,
    old: input.old || input.price,
    cat: input.cats[0] || 'rgb',
    cats: input.cats,
    stock: Number.isFinite(input.stock) ? input.stock : 0,
    warranty: sanitizeInput(input.warranty), // খালি থাকলে খালিই সেভ হয় — মেইন সাইটে ওয়ারেন্টি অংশ দেখাবে না
    imgs: imgs.length ? imgs : ['📦'],
    specs: buildSpecs(input),
    desc_text: desc,
    long_desc: desc,
    features: sanitizeInputArray(parseFeatures(input.featuresRaw)),
    badge: (input.badge || '').toUpperCase(),
    rating: input.rating || 4.5,
    faqs: parseFaqs(input.faqsRaw).map((f) => ({ q: sanitizeInput(f.q), a: sanitizeInput(f.a) })),
    closing: input.closing ? sanitizeInput(input.closing) : '',
    power_info: input.powerInfo ? sanitizeInput(input.powerInfo) : null,
    info_boxes: parseInfoBoxes(input.infoBoxesRaw).map((b) => ({ title: sanitizeInput(b.title), body: sanitizeInput(b.body) })) as ProductInfoBox[],
    seo_h1: input.h1 ? sanitizeInput(input.h1) : null,
    meta_title: input.metaTitle ? sanitizeInput(input.metaTitle) : null,
    meta_description: input.metaDescription ? sanitizeInput(input.metaDescription) : null,
    og_description: input.ogDescription ? sanitizeInput(input.ogDescription) : null,
    quick_specs_text: input.quickSpecsText ? sanitizeInput(input.quickSpecsText) : null,
    packaging_content: input.packagingContent ? sanitizeInput(input.packagingContent) : null,
    color_name: input.colorName ? sanitizeInput(input.colorName) : null,
    color_swatch: input.colorSwatch ? sanitizeInput(input.colorSwatch) : null,
    sort_order: nextSortOrder,
  };

  const { data, error } = await supabase.from(TABLE).insert([row]).select().single();
  if (error) return { status: 'error', message: error.message };

  const unitProfit = Number.isFinite(input.profit) ? input.profit : 200;
  await upsertProductCost(data.id, unitProfit);

  revalidatePath('/products');
  await revalidateVangcurCatalog();
  return { status: 'ok', product: { ...data, unit_profit: unitProfit } as Product };
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
    power_info: input.powerInfo ? sanitizeInput(input.powerInfo) : null,
    info_boxes: parseInfoBoxes(input.infoBoxesRaw).map((b) => ({ title: sanitizeInput(b.title), body: sanitizeInput(b.body) })) as ProductInfoBox[],
    seo_h1: input.h1 ? sanitizeInput(input.h1) : null,
    meta_title: input.metaTitle ? sanitizeInput(input.metaTitle) : null,
    meta_description: input.metaDescription ? sanitizeInput(input.metaDescription) : null,
    og_description: input.ogDescription ? sanitizeInput(input.ogDescription) : null,
    quick_specs_text: input.quickSpecsText ? sanitizeInput(input.quickSpecsText) : null,
    packaging_content: input.packagingContent ? sanitizeInput(input.packagingContent) : null,
    color_name: input.colorName ? sanitizeInput(input.colorName) : null,
    color_swatch: input.colorSwatch ? sanitizeInput(input.colorSwatch) : null,
  };

  const { data, error } = await supabase.from(TABLE).update(row).eq('id', id).select().single();
  if (error) return { status: 'error', message: error.message };

  const unitProfit = Number.isFinite(input.profit) ? input.profit : 200;
  await upsertProductCost(id, unitProfit);

  revalidatePath('/products');
  await revalidateVangcurCatalog();
  return { status: 'ok', product: { ...data, unit_profit: unitProfit } as Product };
}

// ══════════════════════════════════════════════════════════════
//  কালার ভ্যারিয়েন্ট লিংক/আনলিংক — সেভ ফর্মের অংশ না, ProductModal-এর
//  "কালার ভ্যারিয়েন্ট" বক্স থেকে ক্লিক করা মাত্রই আলাদাভাবে চলে (updateStock/
//  updateBadge-এর প্যাটার্নের মতোই)। লিংক করলে দুইটা প্রোডাক্টের কেউ যদি
//  আগে থেকেই অন্য কোনো গ্রুপে থাকে, সেই পুরনো গ্রুপের বাকি সদস্যরাও নতুন
//  একই group_id-তে মার্জ হয়ে যায়, যাতে কখনো দুইটা আলাদা গ্রুপ একসাথে জোড়া
//  লাগানো হলে কেউ বাদ পড়ে না যায়।
// ══════════════════════════════════════════════════════════════

export async function linkColorVariant(
  productId: number,
  otherProductId: number
): Promise<{ ok: boolean; message?: string; groupId?: string }> {
  await requireAdmin();
  if (productId === otherProductId) {
    return { ok: false, message: 'একই প্রোডাক্ট নিজের সাথে লিংক করা যাবে না' };
  }
  const supabase = createServiceRoleClient();
  const { data: rows, error } = await supabase
    .from(TABLE)
    .select('id, color_group_id')
    .in('id', [productId, otherProductId]);
  if (error || !rows || rows.length !== 2) {
    return { ok: false, message: 'প্রোডাক্ট দুটো খুঁজে পাওয়া যায়নি' };
  }
  const a = rows.find((r) => r.id === productId);
  const b = rows.find((r) => r.id === otherProductId);
  const oldGroupIds = [a?.color_group_id, b?.color_group_id].filter(Boolean) as string[];
  const groupId = oldGroupIds[0] || randomUUID();

  const { error: updateErr } = await supabase
    .from(TABLE)
    .update({ color_group_id: groupId })
    .in('id', [productId, otherProductId]);
  if (updateErr) return { ok: false, message: updateErr.message };

  if (oldGroupIds.length) {
    const { error: mergeErr } = await supabase
      .from(TABLE)
      .update({ color_group_id: groupId })
      .in('color_group_id', oldGroupIds);
    if (mergeErr) return { ok: false, message: mergeErr.message };
  }

  revalidatePath('/products');
  await revalidateVangcurCatalog();
  return { ok: true, groupId };
}

export async function unlinkColorVariant(productId: number): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from(TABLE).update({ color_group_id: null }).eq('id', productId);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/products');
  await revalidateVangcurCatalog();
  return { ok: true };
}
export async function deleteProduct(id: number): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  const supabase = createServiceRoleClient();
  // ডিলিটের পর আর এগুলো জানার উপায় থাকবে না, অথচ নিচে রিভ্যালিডেশনের জন্য দরকার
  const { data: linkedPages } = await supabase
    .from(GUIDE_TABLE)
    .select('slug, page_type')
    .eq('product_id', id);

  // [বাগফিক্স] আগে প্রোডাক্ট ডিলিট করলে শুধু custom_products থেকে রো-টা সরে যেত, কিন্তু
  // এর সাথে লিংকড guide_pages রো-গুলো (slug-সহ) ডাটাবেজে "এতিম" (orphaned) হয়ে থেকে যেত।
  // ফলে পরে একই প্রোডাক্ট/সাব পেজ আবার একই slug দিয়ে বানাতে গেলে createGuidePage()-এর
  // uniqueness constraint "এই স্লাগ আগে থেকেই ব্যবহার হচ্ছে" বলে আটকে দিত — যদিও visible
  // product list-এ সেই প্রোডাক্টটা অনেক আগেই "ডিলিট" হয়ে গেছে। প্রোডাক্ট ডিলিটের সাথে সাথে
  // তার সব সাব পেজ url slug-সহ ডাটাবেজ থেকে পুরোপুরি মুছে ফেলাই এখন থেকে আসল আচরণ।
  if (linkedPages && linkedPages.length > 0) {
    const { error: guideDeleteError } = await supabase.from(GUIDE_TABLE).delete().eq('product_id', id);
    if (guideDeleteError) {
      return { ok: false, message: 'সাব পেজ ডিলিট ব্যর্থ: ' + guideDeleteError.message };
    }
  }

  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) return { ok: false, message: error.message };

  revalidatePath('/products');
  await revalidateVangcurCatalog();

  // ডিলিট হওয়া সাব পেজগুলোর লাইভ URL রিভ্যালিডেট করা — best-effort, ব্যর্থ হলেও প্রোডাক্ট
  // ডিলিট আটকাবে না (revalidateGuidePage নিজেই ৫ সেকেন্ড টাইমআউট + সাইলেন্ট ফেইল হ্যান্ডল করে)
  if (linkedPages && linkedPages.length > 0) {
    const templateKeys = Array.from(new Set(linkedPages.map((p) => p.page_type as string)));
    const { data: templates } = await supabase
      .from(GUIDE_TEMPLATES_TABLE)
      .select('key, url_prefix')
      .in('key', templateKeys);
    const prefixByKey = new Map((templates || []).map((t) => [t.key as string, (t.url_prefix as string) ?? '']));
    await Promise.all(
      linkedPages.map((p) =>
        revalidateGuidePage(guidePageUrlPath(p.slug as string, prefixByKey.get(p.page_type as string) ?? ''))
      )
    );
  }

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
  await revalidateVangcurCatalog();
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
  await revalidateVangcurCatalog();
  return { ok: true };
}

// ══════════════════════════════════════════════════════════════
//  DRAG-SORT ORDER
// ══════════════════════════════════════════════════════════════

export interface ReorderUpdate {
  id: number;
  sort_order: number;
}

// 🚀 (প্রোডাক্ট লিস্ট স্কেল ফিক্স): আগে পুরো প্রোডাক্ট তালিকা এনে, দৃশ্যমান
// অংশে নতুন পজিশন বসিয়ে, পুরো vc_prod_order array আবার লিখতে হতো — ১০ হাজার
// প্রোডাক্টে প্রতি ড্র্যাগে এটা বড় একটা JSON লেখা। এখন ক্লায়েন্ট (ProductsTable)
// বর্তমান পেজের sort_order মানগুলোই নতুন ক্রমে পুনর্বিন্যাস করে পাঠায় — ডাটাবেজ
// শুধু ওই কয়েকটা (সর্বোচ্চ এক পেজ) সারির sort_order আপডেট করে, বাকি টেবিল অক্ষত।
export async function reorderProducts(updates: ReorderUpdate[]): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  if (!updates.length) return { ok: true };
  const supabase = createServiceRoleClient();
  const { error } = await supabase.rpc('admin_reorder_products', { p_updates: updates });
  if (error) return { ok: false, message: error.message };
  revalidatePath('/products');
  await revalidateVangcurCatalog();
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
  if (!(file instanceof File)) {
    return { ok: false, message: 'কোনো ফাইল পাওয়া যায়নি' };
  }
  // 🛡️ অডিট ফিক্স: ফাইলের নাম না, আসল MIME টাইপ চেক করে ext বসানো হচ্ছে
  const validated = validateImageUpload(file);
  if (!validated.ok) return { ok: false, message: validated.message };
  const supabase = createServiceRoleClient();
  const ext = validated.ext;
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
