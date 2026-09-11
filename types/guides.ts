// ফাইলের পাথ: types/guides.ts (Vangcur রিপোর সাথে হুবহু মিলিয়ে রাখা — GuideBlock শেপ দুই রিপোতেই একই থাকা জরুরি)
// [NEW] প্রোগ্রামেটিক SEO "Guide Pages" সিস্টেমের সব টাইপ ডেফিনিশন।
// এখানে টাইপ পাল্টালে guide_pages টেবিলের `blocks` কলামের শেপও সেভাবেই বদলাতে হবে।

/** প্রতিটা টেক্সট ফিল্ড বাংলা ও ইংরেজি — দুটোই লাগবে, খালি রাখা যাবে না */
export interface LocalizedText {
  bn: string;
  en: string;
}

interface BaseBlock {
  /** অ্যাডমিনে drag-reorder ও React key-এর জন্য স্টেবল আইডি, যেমন 'hero-1' */
  id: string;
}

export interface HeroBlock extends BaseBlock {
  type: 'hero';
  eyebrow?: LocalizedText;
  title: LocalizedText;
  subtitle?: LocalizedText;
  image?: { url: string; alt: LocalizedText };
}

export interface RichTextBlock extends BaseBlock {
  type: 'richText';
  heading?: LocalizedText;
  paragraphs: LocalizedText[];
}

export interface CardItem {
  /** app/components/guides/GuideIcon.tsx-এর ICON_REGISTRY-তে থাকা key, যেমন 'bedroom' | 'shop' | 'camera' */
  icon?: string;
  title: LocalizedText;
  description: LocalizedText;
  tag?: LocalizedText;
}

export interface CardGridBlock extends BaseBlock {
  type: 'cardGrid';
  heading?: LocalizedText;
  columns: 2 | 3 | 4;
  cards: CardItem[];
}

export interface PriceRow {
  label: LocalizedText;
  unit?: LocalizedText;
  /** রেঞ্জ হওয়ায় ফ্রি-টেক্সট, যেমন "৫০০ – ১,৩৫০" */
  priceRangeBdt: string;
}

export interface PriceTableBlock extends BaseBlock {
  type: 'priceTable';
  heading?: LocalizedText;
  note?: LocalizedText;
  rows: PriceRow[];
}

export interface ComparisonRow {
  /** এই সারির লেবেল, যেমন "Glow-এর ধরন" */
  label: LocalizedText;
  /** columnHeaders-এর সাথে ইনডেক্স মিলিয়ে মান — length অবশ্যই columnHeaders.length-এর সমান */
  values: LocalizedText[];
}

export interface ComparisonTableBlock extends BaseBlock {
  type: 'comparisonTable';
  heading?: LocalizedText;
  columnHeaders: LocalizedText[];
  rows: ComparisonRow[];
}

export interface StepItem {
  title: LocalizedText;
  description: LocalizedText;
  image?: { url: string; alt: LocalizedText };
  warning?: LocalizedText;
}

export interface StepsBlock extends BaseBlock {
  type: 'steps';
  heading?: LocalizedText;
  steps: StepItem[];
}

export interface ChecklistBlock extends BaseBlock {
  type: 'checklist';
  heading?: LocalizedText;
  items: LocalizedText[];
}

export interface ImageTextBlock extends BaseBlock {
  type: 'imageText';
  heading?: LocalizedText;
  paragraphs: LocalizedText[];
  image: { url: string; alt: LocalizedText };
  imageSide: 'left' | 'right';
}

export interface ProductRecommendationBlock extends BaseBlock {
  type: 'productRecommendation';
  heading?: LocalizedText;
  productId: number;
  blurb?: LocalizedText;
}

export interface FaqItem {
  question: LocalizedText;
  answer: LocalizedText;
}

export interface FaqBlock extends BaseBlock {
  type: 'faq';
  heading?: LocalizedText;
  items: FaqItem[];
}

export interface RelatedLinkItem {
  title: LocalizedText;
  href: string;
  icon?: string;
}

export interface RelatedLinksBlock extends BaseBlock {
  type: 'relatedLinks';
  heading?: LocalizedText;
  items: RelatedLinkItem[];
}

export interface GalleryItem {
  image: { url: string; alt: LocalizedText };
  caption?: LocalizedText;
  tags?: string[];
}

export interface GalleryBlock extends BaseBlock {
  type: 'gallery';
  heading?: LocalizedText;
  items: GalleryItem[];
}

export interface CtaBlock extends BaseBlock {
  type: 'cta';
  heading: LocalizedText;
  buttonLabel: LocalizedText;
  href: string;
}

/** নতুন ব্লক-টাইপ যোগ করতে হলে এখানে union-এ একটা লাইন যোগ করলেই GuideBlockRenderer-এ সুইচ-কেস যোগ করার আগ পর্যন্ত TS এরর দেখাবে */
export type GuideBlock =
  | HeroBlock
  | RichTextBlock
  | CardGridBlock
  | PriceTableBlock
  | ComparisonTableBlock
  | StepsBlock
  | ChecklistBlock
  | ImageTextBlock
  | ProductRecommendationBlock
  | FaqBlock
  | RelatedLinksBlock
  | GalleryBlock
  | CtaBlock;

export type GuidePageType =
  | 'pillar'
  | 'comparison'
  | 'design_ideas'
  | 'installation_guide'
  | 'app_remote_guide';

export interface GuidePage {
  id: string;
  page_type: GuidePageType;
  slug: string;
  category_id: string | null;
  product_id: number | null;
  meta_title_bn: string;
  meta_title_en: string;
  meta_description_bn: string;
  meta_description_en: string;
  h1_bn: string;
  h1_en: string;
  target_keywords: string[];
  blocks: GuideBlock[];
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
}

/** অ্যাডমিনে "+" বাটনে ক্লিক করলে পেজ-টাইপ পিকারে যা দেখানো হবে */
export const GUIDE_PAGE_TYPE_LABELS: Record<GuidePageType, LocalizedText> = {
  pillar: { bn: 'পিলার / হাব পেজ', en: 'Pillar / Hub Page' },
  comparison: { bn: 'কম্প্যারিজন পেজ', en: 'Comparison Page' },
  design_ideas: { bn: 'ডিজাইন আইডিয়াস পেজ', en: 'Design Ideas Page' },
  installation_guide: { bn: 'ইনস্টলেশন গাইড', en: 'Installation Guide' },
  app_remote_guide: { bn: 'অ্যাপ/রিমোট গাইড', en: 'App & Remote Guide' },
};

/** কোন পেজ-টাইপ ক্যাটাগরির সাথে যুক্ত, কোনটা প্রোডাক্টের সাথে — UI-তে সঠিক পিকার দেখাতে ব্যবহার হয় */
export const GUIDE_PAGE_SCOPE: Record<GuidePageType, 'category' | 'product'> = {
  pillar: 'category',
  comparison: 'category',
  design_ideas: 'category',
  installation_guide: 'product',
  app_remote_guide: 'product',
};
