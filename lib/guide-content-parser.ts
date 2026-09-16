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

// ══════════════════════════════════════════════════════════════
//  [NEW] হেডিং-আইকন সিস্টেম — AGENTS.md-এর নো-ইমোজি পলিসি মেনে, raw কনটেন্টে
//  ### হেডিং বা কার্ড-টাইটেলে emoji প্রিফিক্স (🌈💰🎯 ইত্যাদি) থাকলেও লাইভ
//  পেজে সেটা না দেখিয়ে, তার বদলে টেক্সটের অর্থ বুঝে
//  app/components/guides/GuideIcons.tsx-এর GUIDE_ICON_REGISTRY থেকে একটা
//  উপযুক্ত SVG আইকন-key বসানো হয়। এটা সম্পূর্ণ keyword-ভিত্তিক (কোনো AI/API
//  না) — তাই ভবিষ্যতে অন্য বিষয়ের কনটেন্টেও (এমনকি emoji ছাড়া লেখা হলেও)
//  কাজ করবে, একটাও ম্যাচ না পেলে নিরাপদ ডিফল্ট 'spark' বসে।
// ══════════════════════════════════════════════════════════════

const HEADING_EMOJI_PATTERN = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;

function cleanHeadingText(h: string): string {
  return h.replace(HEADING_EMOJI_PATTERN, '').replace(/\s{2,}/g, ' ').trim();
}

// ক্রম গুরুত্বপূর্ণ — বেশি নির্দিষ্ট/যৌগিক প্যাটার্ন আগে, সাধারণ single-keyword
// প্যাটার্ন পরে, যাতে "App নাকি Remote" জাতীয় হেডিং ভুলবশত শুধু "App" রুলে
// (smartphone) না গিয়ে সঠিক "scale" (তুলনা) আইকনে যায়।
const ICON_RULES: [RegExp, string][] = [
  [/^(ধাপ|step)\s*[০-৯0-9]/i, 'wrench'], // "ধাপ ১ — ...", "Step 2 — ..." হেডিং
  [/app\s*(নাকি|vs\.?|or)\s*remote|remote\s*(নাকি|vs\.?|or)\s*app/i, 'scale'],
  [/পার্থক্য|difference|তুলনা|\bcompare\b|\bvs\b/i, 'scale'],
  [/connect\s*করবেন|সংযোগ\s*করবেন|কানেক্ট\s*করবেন|pairing|pair\s*করবেন/i, 'linkChain'],
  [/remote\s*control|রিমোট\s*কন্ট্রোল/i, 'remote'],
  [/zone|control\s*panel|\bslider\b|\bdimmer\b/i, 'sliders'],
  [/\bapp\b|অ্যাপ/i, 'smartphone'],
  [/সংশ্লিষ্ট|আরও\s*পড়ুন|related\s*(guides|links)|see\s*also/i, 'book'],
  [/সাধারণ\s*প্রশ্ন|প্রশ্নোত্তর|\bfaq\b/i, 'question'],
  [/outdoor|বৃষ্টি|\brain\b|আবহাওয়া|\bweather\b/i, 'cloud'],
  [/\bcut(ting)?\b|কাটতে|কাট\s*করা/i, 'scissors'],
  [/খুলে\s*ফেলতে|খুলবেন|\bremove\b|uninstall|unmount/i, 'unlock'],
  [/সমস্যা.{0,10}সমাধান|troubleshoot/i, 'wrench'],
  [/checklist|চেকলিস্ট|যা\s*মনে\s*রাখবেন|ঠিক\s*হয়ে\s*গেলে/i, 'check'],
  [/কখনো\s*করা\s*উচিত\s*না|করবেন\s*না|\bভুল\b|mistake|\bavoid\b|সতর্ক/i, 'warning'],
  [/design\s*করার\s*আগে|planning|মাথায়\s*রাখবেন/i, 'compass'],
  [/ছবি|photo|camera|কেমন\s*দেখাবে/i, 'camera'],
  [/\broom\b|ঘর|বেডরুম|bedroom|gaming/i, 'bedroom'],
  [/colour|color|\bরং\b|palette|shade|design\s*idea|ডিজাইন\s*আইডিয়া/i, 'palette'],
  [/দাম|price|মূল্য|বাজেট|budget|\bcost\b|product\s*page|প্রোডাক্ট\s*পেজ/i, 'wallet'],
  [/আসল\s*কথা|মানেই\s*কি|আসলে\s*কী|\bmyth\b/i, 'bulb'],
  [/কোথায়\s*পড়ে|কোথায়\s*ফিট|অবস্থান/i, 'pin'],
  [/প্রস্তুত\s*রাখ|প্রস্তুতি/i, 'clipboard'],
  [/যা\s*যা\s*লাগবে|যা\s*লাগবে|\bneed\b|বক্সে\s*কী|what.?s\s*in\s*the\s*box/i, 'box'],
  [/installation|ইনস্টলেশন|ইনস্টল|power\s*connection|\bwall\b/i, 'wrench'],
  [/recommendation|সুপারিশ|রিকমেন্ড/i, 'spark'],
  [/প্রকারভেদ|\bধরন\b|category|\btypes?\b/i, 'layers'],
  [/কোন\s*কাজে\s*কোনটা|কখন\s*কোনটা|best\s*for|use\s*case/i, 'target'],
  [/warranty|ওয়ারেন্টি|safety|নিরাপত্তা/i, 'shield'],
  [/measurement|দৈর্ঘ্য|\blength\b|সাইজ|\bsize\b|dimension/i, 'ruler'],
  [/glass|কাচ|traditional\s*neon/i, 'glassTube'],
  [/shop|দোকান|branding|ব্র্যান্ডিং|sign(board)?/i, 'signboard'],
];

function inferIconKey(text: string): string {
  for (const [re, icon] of ICON_RULES) {
    if (re.test(text)) return icon;
  }
  return 'spark';
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

    // [হার্ডেনিং] আগে শুধু ### (৩-হ্যাশ) subsection বাউন্ডারি হিসেবে ধরা হতো।
    // কখনো কখনো কনটেন্টে একটা বড় সেকশনের ভেতরে ## (২-হ্যাশ) দিয়ে ক্যাটাগরি
    // sub-group লেখা হয় (যেমন "৫০টা Design Idea"-কে "## A. Bedroom Designs"
    // ইত্যাদিতে ভাগ করা) — আগে এই ## লাইনগুলো subsection বাউন্ডারি হিসেবে
    // চেনা যেত না, ফলে পুরো ক্যাটাগরি-সহ সব আইটেম আগের ### সেকশনের ভেতরে একটা
    // বিশাল paragraph blob হয়ে মিশে যেত। এখন ## ও ### — দুটোই আলাদা subsection
    // শুরু করে, প্রতিটা ক্যাটাগরি নিজের মতো cardGrid হয়ে সুন্দরভাবে বসে।
    const h = rawLine.match(/^#{2,3}\s+(.*)$/);
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
  // 🛠️ ফিক্স: আগে শুধু "আরও পড়ুন" ধরত, তাই "সংশ্লিষ্ট গাইড ও পেজসমূহ"-এর
  // মতো হেডিং এই ব্লক-টাইপ হিসেবে চেনা যেত না — সেটা bullet-list প্যাটার্নে
  // মিলে গিয়ে ভুলভাবে plain checklist ব্লক হয়ে যেত (ভেতরের লিংকগুলো তখনও
  // কাজ করত, কিন্তু সুন্দর related-links কার্ড-গ্রিড না দেখিয়ে চেকবক্স-লিস্ট
  // হিসেবে দেখাত)।
  return /আরও পড়ুন|related (guides|links)|see also|সংশ্লিষ্ট/i.test(heading);
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
  // 🛠️ ফিক্স: আগে শুধু `[title]` ধরত, `(url)` অংশটা কখনো ক্যাপচার হতো না —
  // ফলে href সবসময় '' থাকত আর প্রতিটা related-link কার্ড লাইভ পেজে অকেজো '#'-এ
  // ক্লিক হতো। এখন পুরো `[title](url)` প্যাটার্ন থেকেই দুটোই বের করা হয়।
  const matches = text.matchAll(/\[([^\]\n]+)\]\(([^)\s]+)\)/g);
  for (const m of matches) {
    const rawTitle = m[1].replace(/→\s*$/, '').trim();
    const title = cleanHeadingText(rawTitle);
    const href = m[2].trim();
    if (title) items.push({ title: loc(title), href, icon: inferIconKey(rawTitle) });
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
// [হার্ডেনিং] "**Title** — description" — টাইটেল ও বর্ণনা একই লাইনে, কমপ্যাক্ট
// স্টাইলে লেখা আইটেমও card হিসেবে চিনতে
const BOLD_LINE_INLINE = /^\*\*(.+?)\*\*\s*[-–—:]\s*(.+)$/;

/** body-তে ≥২টা "bold টাইটেল + বর্ণনা" জোড়া পাওয়া গেলে card-গুলো বের করা —
 *  বর্ণনা টাইটেলের নিচের লাইনে থাকুক বা একই লাইনে " — "-এর পরে, দুটোই সাপোর্টেড */
function extractCardPairs(body: string[]): CardItem[] | null {
  const blocks = body.join('\n').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const cards: CardItem[] = [];

  for (const block of blocks) {
    const blockLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (blockLines.length < 1) continue;

    const inlineMatch = blockLines[0].match(BOLD_LINE_INLINE);
    if (inlineMatch) {
      const rawTitle = inlineMatch[1].trim();
      const title = cleanHeadingText(rawTitle);
      const description = [inlineMatch[2].trim(), ...blockLines.slice(1)].join(' ').trim();
      cards.push({ icon: inferIconKey(rawTitle), title: loc(title), description: loc(description || title) });
      continue;
    }

    const boldMatch = blockLines[0].match(BOLD_LINE);
    if (!boldMatch) return null; // একটাও non-bold-led ব্লক থাকলে এটা card-প্যাটার্ন না
    const rawTitle = boldMatch[1].trim();
    const title = cleanHeadingText(rawTitle);
    const description = blockLines.slice(1).join(' ').trim();
    cards.push({
      icon: inferIconKey(rawTitle),
      title: loc(title),
      description: loc(description || title),
    });
  }

  return cards.length >= 2 ? cards : null;
}

// [হার্ডেনিং] হাইফেন/বুলেট (-, •) ছাড়াও en-dash/em-dash (–, —) দিয়ে শুরু করা
// লাইনও বুলেট হিসেবে ধরা হয় — কেউ কেউ লিস্ট লিখতে গিয়ে হাইফেনের বদলে ড্যাশ
// ব্যবহার করে ফেলতে পারে, এতে সেটাও ভুলে fallback RichText-এ না গিয়ে ঠিকঠাক
// checklist হিসেবে চিনবে।
const BULLET_PREFIX = /^\s*[-–—•]\s+/;

function extractBulletItems(body: string[]): string[] | null {
  const bulletLines = body.filter((l) => BULLET_PREFIX.test(l));
  if (bulletLines.length < 2) return null;
  // পুরো সেকশন প্রায় পুরোটাই বুলেট হওয়া উচিত (নাহলে এটা আসলে বুলেটসহ একটা paragraph section)
  const nonBlankLines = body.filter((l) => !isBlank(l));
  if (bulletLines.length < nonBlankLines.length * 0.6) return null;
  const items = bulletLines.map((l) => l.replace(BULLET_PREFIX, '').trim());
  // 🛠️ ফিক্স: বুলেট-লিস্টের পরে একটা ব্যাখ্যামূলক বাক্য (বুলেট-ফরম্যাটে না
  // লেখা) থাকলে সেটা আগে চুপচাপ বাদ পড়ে যেত (শুধু bulletLines রিটার্ন হতো,
  // বাকি non-bullet লাইন কোথাও ব্যবহার হতো না)। এখন এমন কোনো অতিরিক্ত লাইন
  // থাকলে সেটাও তালিকার শেষে একটা আইটেম হিসেবে যোগ হয় — কনটেন্ট হারায় না।
  const leftover = nonBlankLines.filter((l) => !BULLET_PREFIX.test(l)).join(' ').trim();
  if (leftover) items.push(leftover);
  return items;
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
  // raw heading-এ emoji থাকলেও (🌈💰🎯...) সেটা লাইভ পেজে দেখানো হয় না —
  // পরিষ্কার heading টেক্সট + একটা অর্থবহ headingIcon (GuideIcon key) আলাদা
  // করে বের করা হয়, BlockHeading এই দুটো দিয়েই ব্র্যান্ড-কালার আইকন-সার্কেল
  // বানায়। ইনফারেন্স raw heading (ইমোজি-সহ) থেকেই করা হয় — কোনো সমস্যা নেই,
  // কারণ ICON_RULES emoji উপেক্ষা করে শুধু বাংলা/ইংরেজি শব্দ দেখে।
  const heading = loc(cleanHeadingText(sub.heading));
  const headingIcon = inferIconKey(sub.heading);

  if (isFaqHeading(sub.heading)) {
    return {
      structured: true,
      block: { id: newId('faq'), type: 'faq', heading, headingIcon, items: parseFaqBody(sub.body) },
    };
  }

  if (isRelatedLinksHeading(sub.heading)) {
    return {
      structured: true,
      block: {
        id: newId('relatedlinks'),
        type: 'relatedLinks',
        heading,
        headingIcon,
        items: parseRelatedLinksBody(sub.body),
      },
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
      return {
        structured: true,
        block: { id: newId('pricetable'), type: 'priceTable', heading, headingIcon, rows },
      };
    }
    const columnHeaders = header.slice(1).map(loc);
    const rows: ComparisonRow[] = dataRows.map((r) => ({
      label: loc(r[0] ?? ''),
      values: r.slice(1).map(loc),
    }));
    return {
      structured: true,
      block: { id: newId('comparisontable'), type: 'comparisonTable', heading, headingIcon, columnHeaders, rows },
    };
  }

  const cards = extractCardPairs(sub.body);
  if (cards) {
    const columns = cards.length >= 4 ? 4 : cards.length === 3 ? 3 : 2;
    return {
      structured: true,
      block: { id: newId('cardgrid'), type: 'cardGrid', heading, headingIcon, columns, cards },
    };
  }

  const steps = extractNumberedSteps(sub.body);
  if (steps) {
    return {
      structured: true,
      block: { id: newId('steps'), type: 'steps', heading, headingIcon, steps },
    };
  }

  const bullets = extractBulletItems(sub.body);
  if (bullets) {
    return {
      structured: true,
      block: { id: newId('checklist'), type: 'checklist', heading, headingIcon, items: bullets.map(loc) },
    };
  }

  // ফলব্যাক — সাধারণ RichText, তবু heading + headingIcon + সব প্যারাগ্রাফ ঠিকমতো বসানো থাকে
  return {
    structured: false,
    block: { id: newId('richtext'), type: 'richText', heading, headingIcon, paragraphs: toParagraphs(sub.body) },
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
        // 🛠️ ফিক্স: আগে এখানে heading: loc(sub.heading) (মানে "ভূমিকা"/
        // "Introduction") বসানো হতো, ফলে হিরো-ইন্ট্রোর বাড়তি প্যারাগ্রাফগুলো
        // লাইভ পেজে একটা দৃশ্যমান "ভূমিকা" শিরোনাম-সহ আলাদা সেকশন হিসেবে
        // দেখা যেত — যেটা ভিজিটরের কাছে অপ্রয়োজনীয়/অসম্পূর্ণ লাগে, কারণ এটা
        // আসলে হিরোর-ই ধারাবাহিক অংশ। ইচ্ছাকৃতভাবে heading বাদ দেওয়া হলো, যাতে
        // এটা শুধু hero-এর পরের চলমান প্যারাগ্রাফ হিসেবে বসে, আলাদা লেবেল ছাড়া।
        blocks.push({
          id: newId('richtext'),
          type: 'richText',
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
