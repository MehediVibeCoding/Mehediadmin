import type { Product } from '@/types';
import type { ProductFormInput } from '@/app/actions/products';
import type { ParsedProductData } from '@/lib/smart-parser';
import { stringifyInfoBoxes } from '@/lib/smart-parser';

export function emptyFormState(defaultCat: string): ProductFormInput {
  return {
    name: '',
    nameBn: '',
    cats: [defaultCat],
    price: 0,
    old: 0,
    stock: 0,
    badge: '',
    discountColor: '',
    warranty: '',
    rating: 4.5,
    profit: 200,
    h1: '',
    metaTitle: '',
    metaDescription: '',
    ogDescription: '',
    quickSpecsText: '',
    desc: '',
    imgs: [],
    featuresRaw: '',
    techSpecsRaw: '',
    powerInfo: '',
    packagingContent: '',
    infoBoxesRaw: '',
    faqsRaw: '',
  };
}

// পুরনো প্রোডাক্ট, যেগুলোতে এখনো "specs._quick_keys" স্টাইলের key:value
// quick-spec ছিল (নতুন quick_specs_text কলাম আসার আগে সেভ করা) — এডিট
// খুললে সেই key:value pair-গুলোকে "Key: Value • Key: Value" স্টাইলে
// জোড়া দিয়ে নতুন ফ্রি-টেক্সট বক্সে দেখানো হয়, যাতে ডেটা হারিয়ে না যায়।
// পরের বার সেভ করলেই এটা naturally নতুন quick_specs_text কলামে মাইগ্রেট
// হয়ে যাবে।
function legacyQuickSpecsAsText(specs: Product['specs']): string {
  const quickKeys = specs._quick_keys;
  if (!Array.isArray(quickKeys) || !quickKeys.length) return '';
  return quickKeys
    .filter((k) => typeof specs[k] === 'string')
    .map((k) => `${k}: ${specs[k]}`)
    .join(' • ');
}

// পুরনো প্রোডাক্ট, যেগুলোতে Packaging Content এখনো Technical Specs-এর
// ভেতরে "Packaging Content: ..." লাইন হিসেবে গুঁজে রাখা ছিল (নতুন
// packaging_content কলাম আসার আগে) — এডিট খুললে সেটা বের করে নতুন
// ডেডিকেটেড ফিল্ডে বসানো হয়, আর Technical Specs টেক্সট থেকে বাদ দেওয়া
// হয় যাতে দুই জায়গায় ডুপ্লিকেট না দেখায়।
const LEGACY_PACKAGING_KEYS = ['Packaging Content', 'packaging_content'];

export function productToFormState(p: Product): ProductFormInput {
  const specs = p.specs || {};
  const quickKeys = specs._quick_keys || [];

  let legacyPackaging = '';
  const techSpecsRaw = Object.entries(specs)
    .filter(([k, v]) => {
      if (k.startsWith('_') || quickKeys.includes(k) || typeof v !== 'string') return false;
      if (LEGACY_PACKAGING_KEYS.includes(k)) {
        legacyPackaging = v;
        return false;
      }
      return true;
    })
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  return {
    name: p.name || '',
    nameBn: p.name_bn || '',
    cats: p.cats && p.cats.length ? p.cats : [p.cat || 'rgb'],
    price: p.price || 0,
    old: p.old || 0,
    stock: p.stock ?? 0,
    badge: p.badge || '',
    discountColor: (specs._discount_color as '' | 'green') || '',
    warranty: p.warranty || '',
    rating: p.rating || 4.5,
    profit: (specs._profit as number) ?? 200,
    h1: p.seo_h1 || '',
    metaTitle: p.meta_title || '',
    metaDescription: p.meta_description || '',
    ogDescription: p.og_description || '',
    quickSpecsText: p.quick_specs_text || legacyQuickSpecsAsText(specs),
    desc: p.desc_text || p.long_desc || '',
    imgs: p.imgs || [],
    featuresRaw: (p.features || []).join('\n\n'),
    techSpecsRaw,
    powerInfo: p.power_info || '',
    packagingContent: p.packaging_content || legacyPackaging,
    infoBoxesRaw: stringifyInfoBoxes(p.info_boxes || []),
    faqsRaw: (p.faqs || []).map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n'),
  };
}

// Smart Parser ("AI Parser") থেকে পাওয়া ডেটা → নতুন প্রোডাক্ট ফর্মে prefill।
// ২০২৬-০৮ পুনর্লিখনের পর থেকে প্রতিটা ফিল্ড parser-এর নিজস্ব anchor থেকে
// সরাসরি আসে (SEO Product Name, H1, Meta Title, Meta Description, OG
// Description, এক নজরে, Packaging Content — সবগুলোরই এখন নিজস্ব ডেডিকেটেড
// ফর্ম ফিল্ড আছে, তাই আর techSpecsRaw-এর ভেতরে গুঁজে দিতে হয় না)। ছবি এই
// ফাংশনের বাইরে থেকে (AI Parser পেজের নিজস্ব image manager থেকে) আসে।
export function parsedToFormState(parsed: ParsedProductData, imgs: string[] = []): ProductFormInput {
  return {
    name: parsed.name,
    nameBn: '',
    cats: [],
    price: parsed.price,
    old: parsed.old,
    stock: parsed.stock,
    badge: parsed.badge,
    discountColor: '',
    warranty: parsed.warranty,
    rating: parsed.rating,
    profit: 200,
    h1: parsed.seo_h1,
    metaTitle: parsed.meta_title,
    metaDescription: parsed.meta_description,
    ogDescription: parsed.og_description,
    quickSpecsText: parsed.quick_specs_text,
    desc: parsed.desc,
    imgs,
    featuresRaw: parsed.features.join('\n\n'),
    techSpecsRaw: parsed.tech_specs,
    powerInfo: parsed.power_info,
    packagingContent: parsed.packaging_content,
    infoBoxesRaw: parsed.info_boxes,
    faqsRaw: parsed.faqs,
    closing: parsed.closing,
  };
}
