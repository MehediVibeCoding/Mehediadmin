import type { Product } from '@/types';
import type { ProductFormInput, QuickSpecRow } from '@/app/actions/products';
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
    desc: '',
    imgs: [],
    quickSpecs: [],
    techSpecsRaw: '',
    featuresRaw: '',
    faqsRaw: '',
    powerInfo: '',
    infoBoxesRaw: '',
  };
}

export function productToFormState(p: Product): ProductFormInput {
  const specs = p.specs || {};
  const quickKeys = specs._quick_keys || [];
  const quickSpecs: QuickSpecRow[] = quickKeys
    .filter((k) => typeof specs[k] === 'string')
    .map((k) => ({ key: k, value: specs[k] as string }));

  const techSpecsRaw = Object.entries(specs)
    .filter(([k, v]) => !k.startsWith('_') && !quickKeys.includes(k) && typeof v === 'string')
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
    desc: p.desc_text || p.long_desc || '',
    imgs: p.imgs || [],
    quickSpecs,
    techSpecsRaw,
    featuresRaw: (p.features || []).join('\n'),
    faqsRaw: (p.faqs || []).map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n'),
    powerInfo: p.power_info || '',
    infoBoxesRaw: stringifyInfoBoxes(p.info_boxes || []),
  };
}

// legacy runAIParser()-এর quick_specs parsing-এর হুবহু পোর্ট — প্রতিটা
// কমা-সেপারেটেড অংশ "Key: Value" অথবা "Key Value" (প্রথম space দিয়ে split)
// ফরম্যাটে হতে পারে, সর্বোচ্চ ৫টা।
function parseQuickSpecsString(raw: string): QuickSpecRow[] {
  if (!raw || !raw.trim()) return [];
  const rows: QuickSpecRow[] = [];
  for (const part of raw.split(',')) {
    if (rows.length >= 5) break;
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      const k = trimmed.slice(0, colonIdx).trim();
      const v = trimmed.slice(colonIdx + 1).trim();
      if (k) rows.push({ key: k, value: v });
      continue;
    }
    const spaceIdx = trimmed.search(/\s/);
    if (spaceIdx > 0) {
      const k = trimmed.slice(0, spaceIdx).trim();
      const v = trimmed.slice(spaceIdx + 1).trim();
      if (k) rows.push({ key: k, value: v });
    } else if (trimmed) {
      rows.push({ key: trimmed, value: '' });
    }
  }
  return rows;
}

// Smart Parser ("AI Parser") থেকে পাওয়া ডেটা → নতুন প্রোডাক্ট ফর্মে prefill।
// legacy runAIParser()-এর মতোই: ক্যাটাগরি auto-select করা হয় না (ব্যবহারকারী
// নিজে বেছে নেবেন), packaging_content আলাদা desc-এ না গিয়ে Technical
// Specs-এর শেষে "Packaging Content: ..." লাইন হিসেবে যোগ হয়। ছবি এই
// ফাংশনের বাইরে থেকে (AI Parser পেজের নিজস্ব image manager থেকে) আসে।
export function parsedToFormState(parsed: ParsedProductData, imgs: string[] = []): ProductFormInput {
  let techSpecsRaw = parsed.tech_specs || '';
  if (parsed.packaging_content && parsed.packaging_content.trim()) {
    if (techSpecsRaw) techSpecsRaw += '\n';
    techSpecsRaw += 'Packaging Content: ' + parsed.packaging_content.trim();
  }

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
    desc: parsed.desc,
    imgs,
    quickSpecs: parseQuickSpecsString(parsed.quick_specs),
    techSpecsRaw,
    featuresRaw: parsed.features.join('\n'),
    faqsRaw: parsed.faqs,
    closing: parsed.closing,
    powerInfo: parsed.power_info,
    infoBoxesRaw: parsed.info_boxes,
  };
}
