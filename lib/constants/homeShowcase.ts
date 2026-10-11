// ফাইলের পাথ: lib/constants/homeShowcase.ts
// ─────────────────────────────────────────────────────────────────────────────
// হোম পেজের "ক্যাটাগরি কার্ড (৪টি)" ও "স্পটলাইট প্রোডাক্ট (২টি)" সেকশনের টাইপ, ডিফল্ট ও সানিটাইজার।
// store_settings key: 'vc_home_showcase' (JSON) — মূল সাইট (Vangcur) ঠিক এই key থেকেই পড়ে।
//
// ⚠️ এই ফাইলের টাইপ ও ডিফল্ট Vangcur-এর lib/showcaseData.ts-এর সাথে হুবহু মিল রাখতে হবে।
// একটা বদলালে অন্যটাও বদলান।
// ─────────────────────────────────────────────────────────────────────────────

export const SHOWCASE_SETTING_KEY = 'vc_home_showcase';
export const SHOWCASE_CARD_COUNT = 4;
export const SHOWCASE_SPOTLIGHT_COUNT = 2;

// অক্ষর সীমা — মোবাইলে ডান-বাম লেআউটে লেখা যাতে উপচে না পড়ে
export const SHOWCASE_LIMITS = {
  headingLead: 60,
  headingHl: 24,
  cardLead: 16,
  cardTitle: 22,
  cardBtn: 16,
  badge: 20,
  title: 40,
  desc: 90,
  spotBtn: 22,
} as const;

export interface ShowcaseHeading {
  /** প্রথম লাইনের ধূসর লেখা */
  lead: string;
  leadEn: string;
  /** দ্বিতীয় লাইনের ইটালিক হাইলাইট শব্দ */
  hl: string;
  hlEn: string;
}

export interface ShowcaseCard {
  img: string;
  /** ছোট প্রথম লাইন, যেমন "দেখুন" / "Explore" */
  lead: string;
  leadEn: string;
  /** বড় ইটালিক শিরোনাম */
  title: string;
  titleEn: string;
  /** বাটনের লেখা */
  btn: string;
  btnEn: string;
  /** কোন ক্যাটাগরিতে যাবে ('' = সব পণ্য) */
  catId: string;
}

export type SpotlightLinkType = 'product' | 'category';

export interface ShowcaseSpotlight {
  enabled: boolean;
  img: string;
  badge: string;
  badgeEn: string;
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  /** ঐচ্ছিক — ০ বা ফাঁকা হলে দাম দেখাবে না */
  price: number;
  btn: string;
  btnEn: string;
  linkType: SpotlightLinkType;
  productId?: number;
  productName?: string;
  catId: string;
}

export interface ShowcaseConfig {
  enabled: boolean;
  heading: ShowcaseHeading;
  cards: ShowcaseCard[];
  spotlights: ShowcaseSpotlight[];
}

// ডেমো ছবি (পরে অ্যাডমিন প্যানেল থেকে বদলানো হবে)
const IMG_SQUARE = 'https://res.cloudinary.com/dkjzleczw/image/upload/v1790567648/vangcur/reviews/ujkyrgbuz0ajb0eeebws.webp';
const IMG_WIDE = 'https://res.cloudinary.com/dkjzleczw/image/upload/v1791453080/ChatGPT_Image_Oct_8_2026_03_41_59_PM_mjfh7t.png';
const IMG_TALL = 'https://res.cloudinary.com/dkjzleczw/image/upload/v1789009718/9f60ce93-82e1-4b01-8764-374a9560cf30_lnrcrq.png';

export const DEFAULT_SHOWCASE: ShowcaseConfig = {
  enabled: true,
  heading: {
    lead: 'আপনার পছন্দের গ্যাজেট খুঁজে নিন',
    leadEn: 'Find your favourite gadgets by',
    hl: 'ক্যাটাগরি',
    hlEn: 'Category',
  },
  cards: [
    { img: IMG_TALL, lead: 'দেখুন', leadEn: 'Explore', title: 'টি ডব্লিউ এস', titleEn: 'TWS Earbuds', btn: 'এখনই কিনুন', btnEn: 'Shop', catId: 'tws' },
    { img: IMG_WIDE, lead: 'দেখুন', leadEn: 'Explore', title: 'পাওয়ার ব্যাংক', titleEn: 'Power Bank', btn: 'এখনই কিনুন', btnEn: 'Shop', catId: 'powerbank' },
    { img: IMG_SQUARE, lead: 'দেখুন', leadEn: 'Explore', title: 'স্মার্ট ওয়াচ', titleEn: 'Smart Watch', btn: 'এখনই কিনুন', btnEn: 'Shop', catId: 'smartwatch' },
    { img: IMG_TALL, lead: 'দেখুন', leadEn: 'Explore', title: 'আরজিবি লাইট', titleEn: 'RGB Light', btn: 'এখনই কিনুন', btnEn: 'Shop', catId: 'rgb' },
  ],
  spotlights: [
    {
      enabled: true,
      img: IMG_SQUARE,
      badge: 'হট সেলিং',
      badgeEn: 'Hot Selling',
      title: 'সবার পছন্দের হট সেলিং গ্যাজেট',
      titleEn: 'Our most loved hot-selling gadget',
      desc: 'গ্রাহকদের সবচেয়ে বেশি অর্ডার পাওয়া প্রোডাক্ট — সেরা মানে, দ্রুত হোম ডেলিভারিতে।',
      descEn: 'The product our customers order the most — great quality, fast home delivery.',
      price: 0,
      btn: 'এখনই অর্ডার করুন',
      btnEn: 'Order now',
      linkType: 'category',
      catId: '',
    },
    {
      enabled: true,
      img: IMG_WIDE,
      badge: 'ইউনিক কালেকশন',
      badgeEn: 'Unique Pick',
      title: 'ইউনিক গ্যাজেট, যা সবার চোখে পড়বে',
      titleEn: 'A unique gadget that stands out',
      desc: 'স্টাইলিশ আর কাজের গ্যাজেট এক জায়গায় — দেখলেই পছন্দ হয়ে যাবে।',
      descEn: 'Stylish and useful gadgets in one place — you will love it at first sight.',
      price: 0,
      btn: 'এখনই অর্ডার করুন',
      btnEn: 'Order now',
      linkType: 'category',
      catId: '',
    },
  ],
};

// ── সানিটাইজ: ডিবি থেকে আসা যেকোনো অদ্ভুত ডেটা নিরাপদ টাইপে আনে ─────────────────────────
function str(v: unknown, fallback: string, max: number): string {
  if (typeof v !== 'string') return fallback;
  return v.trim().slice(0, max);
}

function imgUrl(v: unknown, fallback: string): string {
  if (typeof v !== 'string') return fallback;
  const t = v.trim();
  // শুধু https ছবি বা সাইটের নিজস্ব পাথ — javascript:/data: ইত্যাদি বাদ
  if (/^https:\/\//i.test(t) || (t.startsWith('/') && !t.startsWith('//'))) return t;
  return fallback;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function normalizeCard(raw: unknown, fb: ShowcaseCard): ShowcaseCard {
  const r = isObj(raw) ? raw : {};
  const L = SHOWCASE_LIMITS;
  return {
    img: imgUrl(r.img, fb.img) || fb.img,
    lead: str(r.lead, fb.lead, L.cardLead),
    leadEn: str(r.leadEn, fb.leadEn, L.cardLead),
    title: str(r.title, fb.title, L.cardTitle),
    titleEn: str(r.titleEn, fb.titleEn, L.cardTitle),
    btn: str(r.btn, fb.btn, L.cardBtn),
    btnEn: str(r.btnEn, fb.btnEn, L.cardBtn),
    catId: typeof r.catId === 'string' ? r.catId.trim().slice(0, 60) : fb.catId,
  };
}

function normalizeSpotlight(raw: unknown, fb: ShowcaseSpotlight): ShowcaseSpotlight {
  const r = isObj(raw) ? raw : {};
  const L = SHOWCASE_LIMITS;
  const linkType: SpotlightLinkType = r.linkType === 'product' ? 'product' : 'category';
  const pidNum = Number(r.productId);
  const productId = Number.isFinite(pidNum) && pidNum > 0 ? pidNum : undefined;
  const priceNum = Number(r.price);
  return {
    enabled: typeof r.enabled === 'boolean' ? r.enabled : fb.enabled,
    img: imgUrl(r.img, fb.img) || fb.img,
    badge: str(r.badge, fb.badge, L.badge),
    badgeEn: str(r.badgeEn, fb.badgeEn, L.badge),
    title: str(r.title, fb.title, L.title),
    titleEn: str(r.titleEn, fb.titleEn, L.title),
    desc: str(r.desc, fb.desc, L.desc),
    descEn: str(r.descEn, fb.descEn, L.desc),
    price: Number.isFinite(priceNum) && priceNum > 0 ? Math.round(priceNum) : 0,
    btn: str(r.btn, fb.btn, L.spotBtn),
    btnEn: str(r.btnEn, fb.btnEn, L.spotBtn),
    // প্রোডাক্ট বেছে না থাকলে প্রোডাক্ট-লিংক অচল — ক্যাটাগরি লিংকে ফিরিয়ে দেওয়া হয়
    linkType: linkType === 'product' && productId ? 'product' : 'category',
    productId: linkType === 'product' ? productId : undefined,
    productName: linkType === 'product' && typeof r.productName === 'string' ? r.productName.slice(0, 120) : undefined,
    catId: typeof r.catId === 'string' ? r.catId.trim().slice(0, 60) : fb.catId,
  };
}

export function normalizeShowcase(raw: unknown): ShowcaseConfig {
  const d = DEFAULT_SHOWCASE;
  if (!isObj(raw)) return d;
  const L = SHOWCASE_LIMITS;
  const h = isObj(raw.heading) ? raw.heading : {};
  const cards = Array.isArray(raw.cards) ? raw.cards : [];
  const spots = Array.isArray(raw.spotlights) ? raw.spotlights : [];
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : d.enabled,
    heading: {
      lead: str(h.lead, d.heading.lead, L.headingLead),
      leadEn: str(h.leadEn, d.heading.leadEn, L.headingLead),
      hl: str(h.hl, d.heading.hl, L.headingHl),
      hlEn: str(h.hlEn, d.heading.hlEn, L.headingHl),
    },
    cards: d.cards.map((fb, i) => normalizeCard(cards[i], fb)).slice(0, SHOWCASE_CARD_COUNT),
    spotlights: d.spotlights.map((fb, i) => normalizeSpotlight(spots[i], fb)).slice(0, SHOWCASE_SPOTLIGHT_COUNT),
  };
}
