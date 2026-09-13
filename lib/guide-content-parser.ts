// ফাইলের পাথ: lib/guide-content-parser.ts
// [NEW] গাইড পেজের raw SEO content (তোমার 01-06 নম্বর .md ফাইলগুলোর মতো ফরম্যাটে
// লেখা) পেস্ট করলে সরাসরি GuideBlock[]-এ রূপান্তর করে। lib/smart-parser.ts-এর সাথে
// দর্শন এক — কোনো external AI/API না, সম্পূর্ণ rule-based এবং deterministic —
// কিন্তু পদ্ধতি ভিন্ন: প্রোডাক্ট পার্সার নির্দিষ্ট field-anchor (H1/Meta Title/...)
// ধরে ফিল্ড বের করে, এখানে সেটা তো আছেই (SEO META LAYER-এর জন্য), কিন্তু
// PAGE CONTENT-এর ভেতরের প্রতিটা ### সেকশনের জন্য কোনো fixed heading-list রাখা
// হয়নি — তার বদলে সেকশনের ভেতরের raw markdown STRUCTURE (টেবিল, বুলেট লিস্ট,
// নাম্বারড লিস্ট, repeated bold-line+paragraph জোড়া) দেখে কোন ব্লক-টাইপ ফিট করে
// সেটা ঠিক করা হয়। এর ফলে এই একই পার্সার ভবিষ্যতে যেকোনো নতুন টেমপ্লেট টাইপের
// জন্যও কাজ করবে — কোনো per-template config লাগে না।
//
// সততার সাথে একটা সীমাবদ্ধতা: raw content বাংলা-ইংরেজি মিশ্রিত এক-ভাষার টেক্সট
// (আলাদা bn/en জোড়া না), তাই প্রতিটা LocalizedText ফিল্ডে bn আর en দুটোতেই একই
// এক্সট্র্যাক্ট-করা টেক্সট বসে — এটা অনুবাদ না, শুধু একটা শুরুর বিন্দু। en ফিল্ড
// আলাদা করে ইংরেজিতে লেখা/ঠিক করা ম্যানুয়াল ট্যাবের কাজ।

import type {
  GuideBlock,
  LocalizedText,
  CardItem,
  PriceRow,
  ComparisonRow,
  StepItem,
  FaqItem,
  RelatedLinkItem,
} from '@/types/guides';

export interface ParsedGuideMeta {
  h1: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  keywords: string[];
}

export interface ParsedGuideContent {
  meta: ParsedGuideMeta;
  blocks: GuideBlock[];
  /** কতগুলো ### সেকশন পাওয়া গেছে বনাম কতগুলো একটা নির্দিষ্ট (table/list/card) টাইপে
   *  ম্যাপ করা গেছে বনাম শুধু plain RichText fallback-এ পড়েছে — পেস্ট করার পর
   *  ছোট একটা সামারি দেখানোর জন্য (কোন ব্লকগুলো ম্যানুয়ালি upgrade করার সুযোগ আছে) */
  stats: { totalSections: number; structuredSections: number; fallbackSections: number };
}

function loc(text: string): LocalizedText {
  const clean = text.trim();
  return { bn: clean, en: clean };
}

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function isBlank(l: string): boolean {
  return !l || !l.trim();
}

function stripMd(s: string): string {
  return s
    .trim()
    .replace(/^`+|`+$/g, '') // ব্যাকটিক
    .replace(/^\*\*|\*\*$/g, '') // বোল্ড
    .trim();
}

/** blank-line দিয়ে আলাদা প্যারাগ্রাফ-ব্লকে ভাগ করা, প্রতিটার ভেতরের newline স্পেসে বদলানো */
function toParagraphs(lines: string[]): LocalizedText[] {
  const text = lines.join('\n');
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean)
    .map(loc);
}

// ══════════════════════════════════════════════════════════════
//  ধাপ ১ — SEO META LAYER থেকে H1/Meta Title/Meta Description/Slug/Keywords
// ══════════════════════════════════════════════════════════════

function extractField(lines: string[], keyPattern: RegExp): string {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(keyPattern);
    if (!m) continue;
    const sameLine = lines[i].slice(m[0].length).trim();
    if (sameLine) return stripMd(sameLine);
    // পরের প্রথম non-blank লাইন
    for (let j = i + 1; j < lines.length && j < i + 4; j++) {
      if (!isBlank(lines[j])) return stripMd(lines[j]);
      if (j > i + 1) break; // একটার বেশি blank line মানে সেকশন শেষ, ভ্যালু নেই
    }
    return '';
  }
  return '';
}

function parseMeta(lines: string[]): ParsedGuideMeta {
  const h1 = extractField(lines, /^\*\*H1\s*[:：]\*\*/i);
  const metaTitle = extractField(lines, /^\*\*Meta\s*Title\s*[:：]\*\*/i);
  const metaDescription = extractField(lines, /^\*\*Meta\s*Description\s*[:：]\*\*/i);
  const rawSlug = extractField(lines, /^\*\*URL\s*Slug\s*[:：]\*\*/i);
  const rawKeywords = extractField(lines, /^\*\*Target\s*keywords\s*[:：]\*\*/i);

  // Slug-এ পুরো পাথ (/xyz বা /compare/xyz) থাকতে পারে — শুধু শেষ অংশটা
  // রাখা হয়, কারণ prefix এখন টেমপ্লেট থেকে আসে, raw content থেকে না
  const slugParts = rawSlug.split('/').filter(Boolean);
  const slug = slugParts[slugParts.length - 1] ?? '';

  const keywords = rawKeywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  return { h1, metaTitle, metaDescription, slug, keywords };
}

// ══════════════════════════════════════════════════════════════
//  ধাপ ২ — PAGE CONTENT রিজিয়ন বের করে ### দিয়ে সাব-সেকশনে ভাগ করা
// ══════════════════════════════════════════════════════════════

interface Subsection {
  heading: string;
  body: string[];
}

function extractPageContentSubsections(lines: string[]): Subsection[] {
  const startIdx = lines.findIndex((l) => /^#\s*[০-৯0-9]+\.\s*PAGE\s*CONTENT/i.test(l.trim()));
  if (startIdx === -1) return [];

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^#\s*[০-৯0-9]+\./.test(lines[i].trim())) {
      endIdx = i;
      break;
    }
  }

  const region = lines.slice(startIdx + 1, endIdx);
  const subsections: Subsection[] = [];
  let current: Subsection | null = null;

  for (const rawLine of region) {
    // মার্কডাউন horizontal rule (সেকশন সেপারেটর হিসেবে ব্যবহৃত) — কনটেন্ট না, বাদ
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(rawLine)) continue;

    const h = rawLine.match(/^###\s+(.*)$/);
    if (h) {
      if (current) subsections.push(current);
      current = { heading: h[1].trim(), body: [] };
    } else if (current) {
      current.body.push(rawLine);
    }
  }
  if (current) subsections.push(current);

  return subsections;
}

// ══════════════════════════════════════════════════════════════
//  ধাপ ৩ — একটা সাবসেকশনের বডি দেখে কোন স্ট্রাকচার (টেবিল/বুলেট/নাম্বার/কার্ড) ফিট করে
// ══════════════════════════════════════════════════════════════

function isFaqHeading(heading: string): boolean {
  return /সাধারণ প্রশ্ন|প্রশ্নোত্তর|\bfaq\b/i.test(heading);
}

function isRelatedLinksHeading(heading: string): boolean {
  return /আরও পড়ুন|related (guides|links)|see also/i.test(heading);
}

function parseFaqBody(body: string[]): FaqItem[] {
  const items: FaqItem[] = [];
  let question = '';
  let answerLines: string[] = [];

  function flush() {
    if (question) items.push({ question: loc(question), answer: loc(answerLines.join(' ').trim()) });
  }

  for (const raw of body) {
    const line = raw.trim();
    const qMatch = line.match(/^\*\*(.+?)\*\*\s*$/);
    if (qMatch) {
      flush();
      question = qMatch[1].trim();
      answerLines = [];
    } else if (line) {
      answerLines.push(line);
    }
  }
  flush();
  return items;
}

function parseRelatedLinksBody(body: string[]): RelatedLinkItem[] {
  const items: RelatedLinkItem[] = [];
  const text = body.join('\n');
  const matches = text.matchAll(/\[([^\]\n]+)\]/g);
  for (const m of matches) {
    const title = m[1].replace(/→\s*$/, '').trim();
    if (title) items.push({ title: loc(title), href: '' });
  }
  return items;
}

/** markdown pipe table সারি বের করা — `| a | b |` প্যাটার্ন, separator (---) বাদ */
function extractTableRows(body: string[]): string[][] | null {
  const tableLines = body.filter((l) => /^\s*\|.*\|\s*$/.test(l));
  if (tableLines.length < 2) return null;

  const rows = tableLines
    .map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
    .filter((cells) => !cells.every((c) => /^-+$/.test(c))); // separator সারি বাদ

  return rows.length >= 2 ? rows : null;
}

function looksLikePriceRange(s: string): boolean {
  return /৳|tk\.?|taka|[\d,]+\s*[-–—]\s*[\d,]+/i.test(s);
}

const BOLD_LINE = /^\*\*(.+?)\*\*\s*$/;

/** body-তে ≥২টা "bold-only লাইন + তার পরের প্যারাগ্রাফ" জোড়া পাওয়া গেলে card-গুলো বের করা */
function extractCardPairs(body: string[]): CardItem[] | null {
  const blocks = body.join('\n').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const cards: CardItem[] = [];

  for (const block of blocks) {
    const blockLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (blockLines.length < 1) continue;
    const boldMatch = blockLines[0].match(BOLD_LINE);
    if (!boldMatch) return null; // একটাও non-bold-led ব্লক থাকলে এটা card-প্যাটার্ন না
    const title = boldMatch[1].trim();
    const description = blockLines.slice(1).join(' ').trim();
    cards.push({ title: loc(title), description: loc(description || title) });
  }

  return cards.length >= 2 ? cards : null;
}

function extractBulletItems(body: string[]): string[] | null {
  const bulletLines = body.filter((l) => /^\s*[-•]\s+/.test(l));
  if (bulletLines.length < 2) return null;
  // পুরো সেকশন প্রায় পুরোটাই বুলেট হওয়া উচিত (নাহলে এটা আসলে বুলেটসহ একটা paragraph section)
  const nonBlankLines = body.filter((l) => !isBlank(l));
  if (bulletLines.length < nonBlankLines.length * 0.6) return null;
  return bulletLines.map((l) => l.replace(/^\s*[-•]\s+/, '').trim());
}

function extractNumberedSteps(body: string[]): StepItem[] | null {
  const numberedLines = body.filter((l) => /^\s*\d+\.\s+/.test(l));
  if (numberedLines.length < 2) return null;
  const nonBlankLines = body.filter((l) => !isBlank(l));
  if (numberedLines.length < nonBlankLines.length * 0.6) return null;
  return numberedLines.map((l) => ({
    title: loc(l.replace(/^\s*\d+\.\s+/, '').trim()),
    description: loc(''),
  }));
}

// ══════════════════════════════════════════════════════════════
//  ধাপ ৪ — একটা সাবসেকশনকে সবচেয়ে ফিট করা ব্লক-টাইপে রূপান্তর
// ══════════════════════════════════════════════════════════════

function subsectionToBlock(sub: Subsection): { block: GuideBlock; structured: boolean } {
  const heading = loc(sub.heading);

  if (isFaqHeading(sub.heading)) {
    return {
      structured: true,
      block: { id: newId('faq'), type: 'faq', heading, items: parseFaqBody(sub.body) },
    };
  }

  if (isRelatedLinksHeading(sub.heading)) {
    return {
      structured: true,
      block: { id: newId('relatedlinks'), type: 'relatedLinks', heading, items: parseRelatedLinksBody(sub.body) },
    };
  }

  const table = extractTableRows(sub.body);
  if (table) {
    const [header, ...dataRows] = table;
    if (header.length === 3 && dataRows.every((r) => looksLikePriceRange(r[2] ?? ''))) {
      const rows: PriceRow[] = dataRows.map((r) => ({
        label: loc(r[0] ?? ''),
        unit: loc(r[1] ?? ''),
        priceRangeBdt: (r[2] ?? '').trim(),
      }));
      return { structured: true, block: { id: newId('pricetable'), type: 'priceTable', heading, rows } };
    }
    const columnHeaders = header.slice(1).map(loc);
    const rows: ComparisonRow[] = dataRows.map((r) => ({
      label: loc(r[0] ?? ''),
      values: r.slice(1).map(loc),
    }));
    return {
      structured: true,
      block: { id: newId('comparisontable'), type: 'comparisonTable', heading, columnHeaders, rows },
    };
  }

  const cards = extractCardPairs(sub.body);
  if (cards) {
    const columns = cards.length >= 4 ? 4 : cards.length === 3 ? 3 : 2;
    return {
      structured: true,
      block: { id: newId('cardgrid'), type: 'cardGrid', heading, columns, cards },
    };
  }

  const steps = extractNumberedSteps(sub.body);
  if (steps) {
    return { structured: true, block: { id: newId('steps'), type: 'steps', heading, steps } };
  }

  const bullets = extractBulletItems(sub.body);
  if (bullets) {
    return {
      structured: true,
      block: { id: newId('checklist'), type: 'checklist', heading, items: bullets.map(loc) },
    };
  }

  // ফলব্যাক — সাধারণ RichText, তবু heading + সব প্যারাগ্রাফ ঠিকমতো বসানো থাকে
  return {
    structured: false,
    block: { id: newId('richtext'), type: 'richText', heading, paragraphs: toParagraphs(sub.body) },
  };
}

// ══════════════════════════════════════════════════════════════
//  মেইন এক্সপোর্ট
// ══════════════════════════════════════════════════════════════

const HERO_HEADING = /^(hero introduction|introduction|ভূমিকা|ইন্ট্রোডাকশন)\s*$/i;

export function parseGuideContent(raw: string): ParsedGuideContent {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const meta = parseMeta(lines);
  const subsections = extractPageContentSubsections(lines);

  const blocks: GuideBlock[] = [];
  let structuredCount = 0;

  subsections.forEach((sub, i) => {
    // প্রথম সাবসেকশন Hero/Introduction-জাতীয় হলে — একটা HeroBlock synth করা, বাকি
    // প্যারাগ্রাফ (যদি ১টার বেশি থাকে) আলাদা RichText হিসেবে থেকে যায়
    if (i === 0 && HERO_HEADING.test(sub.heading)) {
      const paragraphs = toParagraphs(sub.body);
      blocks.push({
        id: newId('hero'),
        type: 'hero',
        title: loc(meta.h1 || sub.heading),
        subtitle: paragraphs[0] ?? loc(''),
      });
      if (paragraphs.length > 1) {
        blocks.push({
          id: newId('richtext'),
          type: 'richText',
          heading: loc(sub.heading),
          paragraphs: paragraphs.slice(1),
        });
      }
      structuredCount++; // hero সবসময় নির্দিষ্টভাবে চেনা যায়, তাই "structured" ধরা হলো
      return;
    }

    const { block, structured } = subsectionToBlock(sub);
    if (structured) structuredCount++;
    blocks.push(block);
  });

  return {
    meta,
    blocks,
    stats: {
      totalSections: subsections.length,
      structuredSections: structuredCount,
      fallbackSections: subsections.length - structuredCount,
    },
  };
}

// ── উদাহরণ — Mehediadmin-এর Guide Content Paste ট্যাবে "উদাহরণ দেখুন" বাটনে বসবে,
// ঠিক smart-parser.ts-এর SMART_PARSER_EXAMPLE-এর মতোই। ছোট করে রাখা হয়েছে যাতে
// পুরো কাঠামোটা এক নজরে বোঝা যায় — আসল কনটেন্ট আরও বড় হবে। ──
export const GUIDE_PARSER_EXAMPLE = `# PAGE X — EXAMPLE
## Example Guide Page

---

# ১. SEO META LAYER

**H1:** Example Guide Page Title

**Meta Title:**
\`Example Guide Page Title | Vangcur\`

**Meta Description:**
\`এক লাইনে এই পেজের মেটা বিবরণ।\`

**URL Slug:** \`/example-guide-page\`

**Target keywords:** example keyword, আরেকটা কিওয়ার্ড

---

# ২. PAGE CONTENT (যা লাইভ পেজে বসবে)

### Introduction

এই সেকশনের প্রথম প্যারাগ্রাফ Hero-এর subtitle হিসেবে বসবে।

দ্বিতীয় প্যারাগ্রাফ থাকলে সেটা আলাদা RichText ব্লক হিসেবে বসবে।

### দামের রেঞ্জ

| ধরন | সাইজ | দাম (BDT) |
|---|---|---|
| Basic | 5 Meter | ৳৫০০ – ৳১,৩৫০ |

### কেনার আগে চেকলিস্ট

- প্রথম পয়েন্ট
- দ্বিতীয় পয়েন্ট

### সাধারণ প্রশ্ন

**প্রথম প্রশ্ন?**
এর উত্তর এখানে লেখা থাকবে।

**দ্বিতীয় প্রশ্ন?**
এর উত্তরও এভাবেই।`;
