// ══════════════════════════════════════════════════════════════
//  SMART PARSER v2 (কোনো external AI/API না — সম্পূর্ণ rule-based)
//  ২০২৬-০৮ পুনর্লিখন — কেন রিরাইট করা হলো (আগের ভার্সনের আসল বাগ):
//  পুরনো ভার্সন প্রতিটা ফিল্ডের জন্য আলাদা আলাদা "কোথায় থামবে"
//  নির্ধারণ করত একটা ছোট stop-keyword লিস্ট দিয়ে। বাস্তব SEO
//  content-এ যেসব শব্দ ওই লিস্টে ছিল না (যেমন "Power Adapter:",
//  "Install করার আগে...", ইত্যাদি), সেগুলোতে না থেমে Technical
//  Specifications ফিল্ড পুরো বাকি ডকুমেন্ট গিলে ফেলত।
//
//  নতুন ডিজাইন: প্রথমে পুরো ডকুমেন্টকে একটা নির্দিষ্ট ক্রমের
//  "canonical section anchor" (heading) দিয়ে ভাগ করা হয়:
//    SEO Product Name → H1 → Meta Title → Meta Description →
//    OG Description → এক নজরে → Hero Introduction/Description →
//    Technical Specifications → Packaging → FAQ
//  প্রতিটা সেকশনের কনটেন্ট = তার নিজের anchor থেকে শুরু করে,
//  ডকুমেন্টে এরপর যে anchor-টা প্রথম পাওয়া যায় তার ঠিক আগে পর্যন্ত —
//  কখনোই কোনো ছোট keyword-লিস্টের ওপর নির্ভর করে না, তাই "রানঅ্যাওয়ে"
//  বাগ কাঠামোগতভাবেই আর সম্ভব না।
//  Features ও Extra-Info-Boxes-এর জন্য আলাদা কোনো heading লাগে না —
//  Description আর Technical Specifications-এর মাঝের "gap" থেকে
//  emoji-শুরু ব্লক আলাদা করে Features বের করা হয়, আর Packaging-এর
//  পরের "───" দিয়ে ভাগ করা ব্লকগুলো থেকে Extra Info Box বের করা হয়।
// ══════════════════════════════════════════════════════════════

export interface ParsedProductData {
  name: string;
  cat: string;
  price: number;
  old: number;
  stock: number;
  rating: number;
  warranty: string;
  badge: string;
  seo_h1: string; // 🆕 H1 — খালি হলে সাইটে product name-ই h1 হিসেবে দেখাবে
  meta_title: string; // 🆕
  meta_description: string; // 🆕
  og_description: string; // 🆕
  quick_specs_text: string; // "এক নজরে" — এখন থেকে ফ্রি-ফ্লো টেক্সট (আগে ছিল ৫টা key:value pair)
  packaging_content: string; // 🆕 আলাদা ডেডিকেটেড ফিল্ড
  desc: string;
  features: string[];
  tech_specs: string;
  faqs: string;
  closing: string;
  power_info: string;
  info_boxes: string; // "### Title\nBody" ফরম্যাট (product-form.ts-এর parseInfoBoxes() এটা পার্স করে)
}

function escRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function bnToEn(s: string): string {
  if (!s) return s;
  return s.replace(/[০-৯]/g, (d) => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
}

function parsePrice(s: string): number {
  if (!s) return 0;
  const cleaned = bnToEn(s);
  const m = cleaned.match(/[\d,]+/);
  return m ? parseInt(m[0].replace(/,/g, '')) : 0;
}

function isBlank(l: string): boolean {
  return !l || !l.trim();
}

function isDividerLine(l: string): boolean {
  const t = l.trim();
  return !!t && /^([─_\-—=]){3,}$/.test(t);
}

function sameLineValueFromColon(line: string): string {
  const idx = line.search(/[:：]/);
  if (idx < 0) return '';
  return line.slice(idx + 1).trim();
}

// ══════════════════════════════════════════════════════════════
//  ধাপ ১ — canonical section anchors (detection regex আলাদা, value
//  extraction কোলনের ওপর ভিত্তি করে আলাদা — এতে জটিল regex ক্যাপচার
//  গ্রুপের backtracking-জনিত ভুল এড়ানো যায়)
// ══════════════════════════════════════════════════════════════

type AnchorId =
  | 'name' | 'h1' | 'metaTitle' | 'metaDesc' | 'ogDesc' | 'quickSpecs'
  | 'desc' | 'techSpecs' | 'packaging' | 'faq';

interface AnchorMatch {
  id: AnchorId;
  lineIdx: number;
  sameLineValue: string;
}

const ANCHOR_TESTS: { id: AnchorId; test: RegExp }[] = [
  { id: 'name', test: /^(?:seo\s*product\s*name|product\s*name|প্রোডাক্টের\s*নাম|পণ্যের\s*নাম)\b/i },
  { id: 'h1', test: /^h1\b/i },
  { id: 'metaTitle', test: /^meta\s*title\b/i },
  { id: 'metaDesc', test: /^meta\s*description\b/i },
  { id: 'ogDesc', test: /^(?:open\s*graph\s*description|og\s*description)\b/i },
  { id: 'quickSpecs', test: /এক\s*নজরে|^quick\s*specs?\b/i },
  { id: 'desc', test: /^(?:hero\s*introduction|product\s*description|বিস্তারিত\s*বিবরণ|বিস্তারিত\s*বর্ণনা|description)\b/i },
  { id: 'techSpecs', test: /technical\s*specifications?|কারিগরি\s*(?:স্পেসিফিকেশন|তথ্য)/i },
  { id: 'packaging', test: /packaging\s*content|in\s*the\s*box|(?:box|বক্স|প্যাকেজ)[^a-zA-Z০-৯\n]{0,4}(?:যা|কী)\s*(?:আছে|পাবেন|থাকবে)/i },
  { id: 'faq', test: /^faq\b|^প্রশ্নোত্তর\b|^কিছু\s*কমন\s*প্রশ্ন\b/i },
];

function matchAnchor(line: string): { id: AnchorId } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  for (const { id, test } of ANCHOR_TESTS) {
    if (test.test(trimmed)) return { id };
  }
  return null;
}

// পুরো ডকুমেন্ট স্ক্যান করে প্রতিটা anchor-এর প্রথম occurrence (document-order)
// রাখা হয় — কোনো anchor দ্বিতীয়বার লক করে না, তাই কোনো FAQ উত্তরে কাকতালীয়ভাবে
// মিলে-যাওয়া শব্দ নতুন করে সেকশন শুরু করতে পারে না।
function findAnchors(lines: string[]): AnchorMatch[] {
  const found: AnchorMatch[] = [];
  const seen = new Set<AnchorId>();
  lines.forEach((line, idx) => {
    const m = matchAnchor(line);
    if (m && !seen.has(m.id)) {
      seen.add(m.id);
      found.push({ id: m.id, lineIdx: idx, sameLineValue: sameLineValueFromColon(line) });
    }
  });
  return found;
}

function sectionBody(lines: string[], anchors: AnchorMatch[], anchor: AnchorMatch): string[] {
  const idx = anchors.findIndex((a) => a === anchor);
  const nextAnchor = anchors[idx + 1];
  const endIdx = nextAnchor ? nextAnchor.lineIdx : lines.length;
  const bodyLines: string[] = [];
  if (anchor.sameLineValue) bodyLines.push(anchor.sameLineValue);
  for (let i = anchor.lineIdx + 1; i < endIdx; i++) bodyLines.push(lines[i]);
  return bodyLines;
}

function firstNonBlank(lines: string[]): string {
  for (const l of lines) if (!isBlank(l)) return l.trim();
  return '';
}

function joinNonBlank(lines: string[], sep: string): string {
  return lines.map((l) => l.trim()).filter(Boolean).join(sep);
}

// ══════════════════════════════════════════════════════════════
//  Features — desc-anchor আর techSpecs-anchor-এর মাঝের পুরো
//  অংশটাকে blank-line দিয়ে প্যারাগ্রাফ-ব্লকে ভাগ করা হয়। প্রথম
//  যে ব্লক emoji/pictograph দিয়ে শুরু (আর যথেষ্ট ছোট, দীর্ঘ প্যারা
//  না), সেখান থেকে Features শুরু ধরা হয় — তার আগের সব ব্লক
//  Description (Hero Introduction)। এক্সপ্লিসিট "Product
//  Features:" জাতীয় হেডিং থাকলে সেটাও চেনে (থাকলে ওই লাইনটা বাদ
//  দিয়ে তার পরের ব্লক থেকে Features শুরু হয়)।
// ══════════════════════════════════════════════════════════════

const EMOJI_PREFIX = /^((?:\p{Emoji_Presentation}|\p{Extended_Pictographic})\ufe0f?)\s*(.*)$/u;
const FEATURES_HEADING = /^(?:product\s*features?|প্রধান\s*ফিচারস?|ফিচার(?:সমূহ)?|features?)\s*[:：]?\s*$/i;

function splitDescAndFeatures(regionLines: string[]): { descParas: string[]; featureParas: string[] } {
  const text = regionLines.join('\n');
  const paraBlocks = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  let splitIdx = -1;
  let dropHeadingAt = -1;
  for (let i = 0; i < paraBlocks.length; i++) {
    const pLines = paraBlocks[i].split('\n').map((l) => l.trim()).filter(Boolean);
    const firstLine = pLines[0] || '';
    if (pLines.length === 1 && FEATURES_HEADING.test(firstLine)) {
      dropHeadingAt = i;
      splitIdx = i + 1;
      break;
    }
    const emojiMatch = firstLine.match(EMOJI_PREFIX);
    if (emojiMatch && pLines.length <= 6) {
      splitIdx = i;
      break;
    }
  }
  if (splitIdx === -1) splitIdx = paraBlocks.length; // কোনো ফিচার ব্লক পাওয়া যায়নি — সবটাই বিবরণ

  const descParaBlocks = paraBlocks.slice(0, dropHeadingAt >= 0 ? dropHeadingAt : splitIdx);
  const featureParaBlocks = paraBlocks.slice(splitIdx);
  return { descParas: descParaBlocks, featureParas: featureParaBlocks };
}

export function parseFeatureBlocks(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  const blocks = raw.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const features: string[] = [];
  for (const block of blocks) {
    if (features.length >= 30) break; // malformed paste থেকে বাঁচার জন্য safety cap
    const blockLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!blockLines.length) continue;
    if (blockLines.length === 1) {
      features.push(blockLines[0].replace(/^[-•*✔✓]\s*/, ''));
      continue;
    }
    const titleLine = blockLines[0].replace(/^[-•*✔✓]\s*/, '');
    const description = blockLines.slice(1).join(' ');
    const emojiMatch = titleLine.match(EMOJI_PREFIX);
    if (emojiMatch) {
      features.push(`${emojiMatch[1]}**${emojiMatch[2].trim()}** — ${description}`);
    } else {
      features.push(`**${titleLine}** — ${description}`);
    }
  }
  return features;
}

// ══════════════════════════════════════════════════════════════
//  Technical Specs — একটা region-এর ভেতরে তিন রকম ফরম্যাট বোঝে:
//   ১) "Key: Value" প্রতি লাইনে
//   ২) Markdown pipe table সারি: "| Key | Value |"
//   ৩) দুই-লাইনের জোড়া (blank-line দিয়ে আলাদা): "Key\nValue" —
//      rich text থেকে টেবিল কপি-পেস্ট করলে প্রায়ই এভাবেই আসে
//  "Power Adapter:"/"Connection (flow)?:" লাইন এখানে ধরা হয় না —
//  সেগুলো আলাদাভাবে power_info-তে যায়।
// ══════════════════════════════════════════════════════════════

const HEADER_WORDS = /^(specifications?|details?|বিবরণ|তথ্য|features?|values?)$/i;

function isPowerLine(l: string): boolean {
  const t = l.trim();
  return /^power\s*adapter\s*[:：]/i.test(t) || /^connection(?:\s*flow)?\s*[:：]/i.test(t);
}

function parseTechSpecsRegion(lines: string[]): { techSpecs: string; powerInfo: string } {
  const powerLines: string[] = [];
  const rest: string[] = [];
  for (const l of lines) {
    if (isPowerLine(l)) powerLines.push(l.trim());
    else rest.push(l);
  }

  const blocks: string[][] = [];
  let current: string[] = [];
  for (const raw of rest) {
    if (isBlank(raw)) {
      if (current.length) blocks.push(current);
      current = [];
    } else {
      current.push(raw.trim());
    }
  }
  if (current.length) blocks.push(current);

  const rows: [string, string][] = [];
  for (const block of blocks) {
    if (block.length === 1) {
      const line = block[0];
      if (line.startsWith('|')) {
        const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
        if (cells.length === 2 && !/^-+$/.test(cells[0]) && !HEADER_WORDS.test(cells[0]) && !HEADER_WORDS.test(cells[1])) {
          rows.push([cells[0], cells[1]]);
        }
        continue;
      }
      const idx = line.indexOf(':');
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim();
        if (k && v) rows.push([k, v]);
      }
      continue;
    }
    if (block.length === 2 && !HEADER_WORDS.test(block[0]) && !HEADER_WORDS.test(block[1])) {
      rows.push([block[0], block[1]]);
      continue;
    }
    for (const line of block) {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim();
        if (k && v) rows.push([k, v]);
      }
    }
  }

  return {
    techSpecs: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    powerInfo: powerLines.join('\n'),
  };
}

// ══════════════════════════════════════════════════════════════
//  Packaging — বুলেট লিস্ট। "───" ডিভাইডার পেলে সেখান থেকে আর
//  পরের সব কিছু Extra Info-এর অংশ (packaging-এর অংশ না)।
// ══════════════════════════════════════════════════════════════

function parsePackagingRegion(lines: string[]): { packaging: string[]; extraInfoLines: string[] } {
  const dividerIdx = lines.findIndex((l) => isDividerLine(l));
  const pkgLines = dividerIdx >= 0 ? lines.slice(0, dividerIdx) : lines;
  const extraInfoLines = dividerIdx >= 0 ? lines.slice(dividerIdx) : [];
  const packaging = pkgLines.map((l) => l.trim()).filter(Boolean).map((l) => l.replace(/^[-•*✔✓]\s*/, ''));
  return { packaging, extraInfoLines };
}

// ══════════════════════════════════════════════════════════════
//  Extra Info Boxes — দুইভাবে বক্স আলাদা করা যায়:
//   ১) "### Title\nBody" এক্সপ্লিসিট মার্কার
//   ২) "───" ডিভাইডার দিয়ে আলাদা ব্লক — প্রথম লাইন টাইটেল, বাকিটা বডি
// ══════════════════════════════════════════════════════════════

function extraInfoLinesToRaw(lines: string[]): string {
  const joined = lines.join('\n');
  if (/^###\s*/m.test(joined)) return joined.trim();

  const blocks = joined
    .split(/^\s*[─_\-—=]{3,}\s*$/m)
    .map((b) => b.trim())
    .filter(Boolean);

  const boxes: string[] = [];
  for (const block of blocks) {
    const blockLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!blockLines.length) continue;
    const title = blockLines[0].replace(/[:：]\s*$/, '');
    const body = blockLines.slice(1).join('\n').trim();
    if (title && body) boxes.push(`### ${title}\n${body}`);
  }
  return boxes.join('\n\n');
}

// ══════════════════════════════════════════════════════════════
//  FAQ — দুই ফরম্যাট সাপোর্ট করে:
//   ১) "Q: ...\nA: ..." / "প্রশ্ন: ...\nউত্তর: ..." এক্সপ্লিসিট প্রিফিক্স
//   ২) blank-line দিয়ে আলাদা ব্লক, প্রথম লাইন প্রশ্ন, বাকিটা উত্তর
//      (আসল SEO content-এ এই ফরম্যাটেই লেখা হয় — আগের ভার্সনে তাই
//      FAQ সবসময় খালি থেকে যেত)
// ══════════════════════════════════════════════════════════════

function parseFaqRegion(lines: string[]): string {
  const text = lines.join('\n');
  const faqBlocks: string[] = [];

  if (/^\s*(?:Q|প্রশ্ন)\s*[:：]/im.test(text)) {
    let q = '';
    let a = '';
    for (const raw of lines) {
      const l = raw.trim();
      if (!l) continue;
      if (/^(?:প্রশ্ন|Q)\s*[:：]/i.test(l)) {
        if (q && a) faqBlocks.push(`Q: ${q}\nA: ${a}`);
        q = l.replace(/^(?:প্রশ্ন|Q)\s*[:：]\s*/i, '').trim();
        a = '';
      } else if (/^(?:উত্তর|A)\s*[:：]/i.test(l)) {
        a = l.replace(/^(?:উত্তর|A)\s*[:：]\s*/i, '').trim();
      } else if (a) {
        a += ' ' + l;
      } else if (q) {
        q += ' ' + l;
      }
    }
    if (q && a) faqBlocks.push(`Q: ${q}\nA: ${a}`);
    return faqBlocks.join('\n\n');
  }

  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  for (const block of blocks) {
    const blockLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (blockLines.length < 2) continue;
    const q = blockLines[0];
    const a = blockLines.slice(1).join(' ');
    if (q && a) faqBlocks.push(`Q: ${q}\nA: ${a}`);
  }
  return faqBlocks.join('\n\n');
}

// ══════════════════════════════════════════════════════════════
//  Price/Old/Rating/Warranty/Badge/Stock — ইচ্ছাকৃতভাবে সহজ
//  keyword-খোঁজা পদ্ধতিতেই রাখা হলো, কারণ এগুলো SEO content-এর অংশ
//  না — সবসময় এডমিনে Basic Info ট্যাবে ম্যানুয়ালি বসানো হয়/এডিট
//  করা যায়। কনটেন্টে কাকতালীয়ভাবে মিলে গেলে শুধু prefill হবে।
// ══════════════════════════════════════════════════════════════

function findVal(lines: string[], keys: string[]): string {
  // পরিমাপক আলাদাকারী চিহ্ন ইচ্ছাকৃতভাবে শুধু ":" / "：" / "=" / "ঃ" —
  // em-dash/hyphen বাদ দেওয়া হয়েছে, কারণ বাংলায় প্রায়ই ইংরেজি শব্দের
  // সাথে সরাসরি হাইফেন দিয়ে বিভক্তি যুক্ত হয় (যেমন FAQ-এর ভেতরের
  // "Warranty-তে কী কভার হয়?") — hyphen অনুমতি দিলে এই ধরনের বাক্যকেও
  // ভুলবশত "Warranty: তে কী কভার হয়?" হিসেবে ধরে ফেলত।
  for (const line of lines) {
    for (const k of keys) {
      const m = line.match(new RegExp('^' + escRe(k) + '\\s*[:：=ঃ]\\s*(.+)', 'i'));
      if (m) return bnToEn(m[1].trim());
    }
  }
  return '';
}

export function smartParse(raw: string): ParsedProductData {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const anchors = findAnchors(lines);
  const byId = new Map<AnchorId, AnchorMatch>();
  anchors.forEach((a) => byId.set(a.id, a));

  function bodyOf(id: AnchorId): string[] {
    const a = byId.get(id);
    return a ? sectionBody(lines, anchors, a) : [];
  }

  // ── Product Name ──
  let name = firstNonBlank(bodyOf('name'));
  if (!name) {
    for (const l of lines) {
      if (l.trim() && !l.includes(':') && l.trim().length > 8) {
        name = l.trim();
        break;
      }
    }
  }
  if (name) {
    name = name
      .replace(/\s*(?:price|মূল্য|দাম|Price)\s*[:=]?\s*[\d,০-৯]+\s*(?:tk|taka|টাকা|BDT)?/gi, '')
      .trim();
    name = name.replace(/\s*[\d,০-৯]+\s*(?:tk|taka|টাকা|BDT)\s*$/gi, '').trim();
  }

  // ── SEO মেটা ফিল্ডস ──
  const seo_h1 = firstNonBlank(bodyOf('h1'));
  const meta_title = firstNonBlank(bodyOf('metaTitle'));
  const meta_description = joinNonBlank(bodyOf('metaDesc'), ' ');
  const og_description = joinNonBlank(bodyOf('ogDesc'), ' ');

  // ── এক নজরে (ফ্রি-ফ্লো টেক্সট) ──
  const quick_specs_text = joinNonBlank(bodyOf('quickSpecs'), ' ');

  // ── Description + Features — একই region থেকে ভাগ হয় ──
  const descRegion = bodyOf('desc');
  const { descParas, featureParas } = splitDescAndFeatures(descRegion);
  const desc = descParas.map((p) => p.replace(/\n/g, ' ').trim()).join('\n\n');
  const features = parseFeatureBlocks(featureParas.join('\n\n'));

  // ── Technical Specs + Power Info ──
  let tech_specs = '';
  let power_info = '';
  if (byId.has('techSpecs')) {
    const parsed = parseTechSpecsRegion(bodyOf('techSpecs'));
    tech_specs = parsed.techSpecs;
    power_info = parsed.powerInfo;
  }

  // ── Packaging Content + Extra Info gap ──
  let packaging_content = '';
  let infoBoxesRaw = '';
  if (byId.has('packaging')) {
    const { packaging, extraInfoLines } = parsePackagingRegion(bodyOf('packaging'));
    packaging_content = packaging.join('\n');
    infoBoxesRaw = extraInfoLinesToRaw(extraInfoLines);
  }

  // ── FAQ ──
  const faqs = byId.has('faq') ? parseFaqRegion(bodyOf('faq')) : '';

  // ── Price/Old/Rating/Warranty/Badge/Stock (ঐচ্ছিক prefill) ──
  const priceRaw = findVal(lines, ['বর্তমান মূল্য', 'Price', 'মূল্য', 'দাম', 'Current Price', 'বর্তমান দাম']);
  const price = parsePrice(priceRaw);
  const oldRaw = findVal(lines, ['পুরনো মূল্য', 'Old Price', 'আগের মূল্য', 'পুরানো মূল্য', 'পুরনো দাম', 'Original Price']);
  const old = parsePrice(oldRaw) || Math.round(price * 1.3);

  const ratingRaw = findVal(lines, ['রেটিং', 'Rating', 'রেটিং (1-5)', 'Rate']);
  let rating = parseFloat(bnToEn(ratingRaw)) || 4.5;
  if (rating > 5) rating = 5;
  if (rating < 1) rating = 4.5;

  const warranty = findVal(lines, ['ওয়ারেন্টি', 'Warranty', 'গ্যারান্টি', 'Guarantee']);

  const badgeRaw = findVal(lines, ['Badge', 'ব্যাজ', 'Tag']);
  let badge = '';
  if (/hot/i.test(badgeRaw)) badge = 'HOT';
  else if (/new/i.test(badgeRaw)) badge = 'NEW';
  else if (/sale/i.test(badgeRaw)) badge = 'SALE';

  const stockRaw = bnToEn(findVal(lines, ['Stock', 'স্টক', 'Quantity', 'স্টক পরিমাণ']));
  const stock = parseInt(stockRaw) || 0;

  let cat = 'rgb';
  if (/smartwatch|ঘড়ি|watch/i.test(raw)) cat = 'smartwatch';
  else if (/power.?bank|পাওয়ার ব্যাংক/i.test(raw)) cat = 'powerbank';
  else if (/tws|earbuds|earphone|ইয়ারবাড/i.test(raw)) cat = 'tws';
  else if (/headphone|headset|হেডফোন/i.test(raw)) cat = 'headphone';
  else if (/lamp|লাইট.*acrylic|acrylic/i.test(raw)) cat = 'lamp';
  else if (/fan|ফ্যান/i.test(raw)) cat = 'fan';
  else if (/rgb|neon|light|লাইট/i.test(raw)) cat = 'rgb';

  let closing = '';
  const closingPatterns =
    /(?:অর্ডার করুন|পেতে|যোগাযোগ|থেকে সেরা|থেকে পাবেন|বিশ্বাস|পরিবার|নিশ্চিত|গ্যারান্টি|সাশ্রয়|সেরা দাম|এখনই|আজই|কিনুন)/i;
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
    const l = lines[i].trim();
    if (l && !l.includes(':') && l.length > 15 && !/^(Q:|A:|FAQ|-|•|\*)/i.test(l)) {
      if (closingPatterns.test(l)) {
        closing = l;
        break;
      }
    }
  }

  return {
    name,
    cat,
    price,
    old,
    stock,
    rating,
    warranty,
    badge,
    seo_h1,
    meta_title,
    meta_description,
    og_description,
    quick_specs_text,
    packaging_content,
    desc,
    features,
    tech_specs,
    faqs,
    closing,
    power_info,
    info_boxes: infoBoxesRaw,
  };
}

export function parseInfoBoxes(raw: string): { title: string; body: string }[] {
  if (!raw || !raw.trim()) return [];
  const boxes: { title: string; body: string }[] = [];
  const blocks = raw.split(/\n(?=###\s*)/).map((b) => b.trim()).filter(Boolean);
  for (const block of blocks) {
    const m = block.match(/^###\s*(.+?)\n([\s\S]*)$/);
    if (m) {
      const title = m[1].trim();
      const body = m[2].trim();
      if (title && body) boxes.push({ title, body });
    }
  }
  return boxes;
}

export function stringifyInfoBoxes(boxes: { title: string; body: string }[]): string {
  return boxes.map((b) => `### ${b.title}\n${b.body}`).join('\n\n');
}

// ── উদাহরণ টেক্সট — এখন থেকে এটাই "ইউনিভার্সাল টেমপ্লেট", প্রতিটা ভবিষ্যৎ
// প্রোডাক্টের SEO কনটেন্ট এই একই heading-ক্রম মেনে লেখা উচিত। GearUP NRGB50
// রেফারেন্স কেসের সাথে মিলিয়ে বানানো (২০২৬-০৮)। ──
export const SMART_PARSER_EXAMPLE = `SEO Product Name:
GearUP NRGB50 5 Meter RGB Neon Light with App & Remote Control

H1:
GearUP NRGB50 5 Meter RGB Neon Light with App & Remote Control

Meta Title:
GearUP NRGB50 5 Meter RGB Neon Light with App & Remote Control | Vangcur

Meta Description:
GearUP NRGB50 — 5 Meter RGB Neon Light যা App ও Remote দুইভাবেই control করা যায়। Single color বা 16M+ RGB shade, 53 effects, 6 Months Replacement Warranty। এখনই দেখুন।

Open Graph Description:
5 Meter RGB Neon Light — App ও Remote-এ control, single বা multi-colour, 6 মাস ওয়ারেন্টি।

এক নজরে GearUP NRGB50:
5 Meter (16.4 Feet) • App + Remote Control • 16M+ Colour Options • 53 Lighting Effects • 20 Colour Zones • Bluetooth • Waterproof • 6 Months Replacement Warranty

Hero Introduction:
ঘরে ঢুকেই যদি মনে হয় সবকিছু কেমন যেন একঘেয়ে, চেনা, বছরের পর বছর একই রকম — তাহলে বদলটা শুরু করার জন্য নতুন করে দেয়াল রং করা বা আসবাবপত্র পাল্টানোর দরকার নেই। মাঝেমধ্যে একটা আলোই যথেষ্ট।

GearUP NRGB50 হলো 5 Meter দৈর্ঘ্যের একটি RGB Neon Light, যা App এবং Remote Control — দুইভাবেই নিয়ন্ত্রণ করা যায়। Bedroom, gaming setup বা study corner — যেখানেই লাগান, ঘরের পুরো মুড বদলে দিতে পারে এই একটা লাইট।

চাইলে পুরো 5 Meter একটাই নির্দিষ্ট রঙে রাখতে পারবেন, আবার চাইলে বিভিন্ন অংশে বিভিন্ন রং দিয়ে নিজের মতো একটা ইউনিক ডিজাইনও তৈরি করতে পারবেন। কন্ট্রোলটা সম্পূর্ণ আপনার হাতে।

🌈 16 Million+ Colour Options
আপনার পছন্দের রং বেছে নিন, অথবা নিজের custom shade তৈরি করুন। একটাই লাইট, কিন্তু রঙের কোনো সীমা নেই।

📱 App + Remote, দুটোই একসাথে
ফোন হাতের কাছে না থাকলে Remote দিয়ে কাজ চালান, বিস্তারিত কাস্টমাইজেশনের জন্য App ব্যবহার করুন।

✨ 53টি Lighting Effect
স্থির এক রং থেকে শুরু করে dynamic changing effect — মুড আর occasion অনুযায়ী বেছে নিন।

🔵 Bluetooth Connectivity
App কানেক্ট করতে WiFi বা internet লাগে না, শুধু ফোনের Bluetooth অন থাকলেই হবে।

⚙️ Technical Specifications

Brand
GearUP

Model
NRGB50

Length
5 Meter

Power
24W

Connectivity
Bluetooth

Colour Options
16 Million+

Power Adapter: Input AC 100–240V, 50/60Hz → Output DC 24V, 1A → 2-pin plug
Connection flow: Wall Socket → Adapter → Inline Switch → Neon Light

📦 Box-এ যা পাবেন

• 1 × GearUP NRGB50 5 Meter RGB Neon Light
• 1 × 24V 1A DC Power Adapter
• 1 × Inline Cord Switch
• 1 × Remote Control
• 8 × Plastic Mounting Clips + Screws

───
🏠 কোথায় ব্যবহার করবেন

Bedroom-এর bed-back wall, gaming setup-এর monitor wall, কিংবা study table-এর পাশের ছোট্ট corner — যেখানেই লাগান, ভালো মানাবে।

───
📏 5 Meter আসলে কতটা?

প্রায় 16.4 Feet — কেনার আগে যে জায়গায় লাগাবেন সেটা একবার মেপে নেওয়াই সবচেয়ে নিরাপদ।

FAQ:
GearUP NRGB50 কি শুধু multicolor light, নাকি single colour-এও রাখা যায়?
দুটোই সম্ভব। RGB lighting-এর পাশাপাশি পুরো 5 Meter একটা নির্দিষ্ট রঙেও রাখতে পারবেন।

App ছাড়া শুধু Remote দিয়ে চালানো যাবে?
হ্যাঁ। Remote দিয়ে basic control সম্পূর্ণভাবে সম্ভব, App বাধ্যতামূলক না।`;
