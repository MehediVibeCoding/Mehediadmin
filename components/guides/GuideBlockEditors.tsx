// ফাইলের পাথ: components/guides/GuideBlockEditors.tsx
// [NEW] প্রতিটা ব্লক-টাইপের নিজস্ব এডিটর ফর্ম + নতুন খালি ব্লক বানানোর ফ্যাক্টরি +
// টাইপ অনুযায়ী সঠিক এডিটর বেছে দেখানোর সুইচ। Vangcur-এর app/components/guides/
// GuideBlocks.tsx-এর প্রতিটা ব্লক-টাইপের হুবহু "এডিটেবল" ভার্সন এটা।

'use client';

import type {
  GuideBlock,
  HeroBlock,
  RichTextBlock,
  CardGridBlock,
  PriceTableBlock,
  ComparisonTableBlock,
  StepsBlock,
  ChecklistBlock,
  ImageTextBlock,
  ProductRecommendationBlock,
  FaqBlock,
  RelatedLinksBlock,
  GalleryBlock,
  CtaBlock,
  LocalizedText,
  CardItem,
  PriceRow,
  ComparisonRow,
  StepItem,
  FaqItem,
  RelatedLinkItem,
  GalleryItem,
} from '@/types/guides';
import { LocalizedTextInput, LocalizedTextarea, TextField, SelectField, RepeatingSection, GUIDE_ICON_KEYS } from './GuideFieldPrimitives';

const EMPTY_LOC = { bn: '', en: '' };

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/** "ব্লক যোগ করুন" ড্রপডাউনে দেখানো লেবেল */
export const BLOCK_TYPE_LABELS: Record<GuideBlock['type'], string> = {
  hero: 'হিরো ব্যানার',
  richText: 'সাধারণ টেক্সট',
  cardGrid: 'কার্ড গ্রিড',
  priceTable: 'দামের টেবিল',
  comparisonTable: 'কম্প্যারিজন টেবিল',
  steps: 'ধাপে-ধাপে (Steps)',
  checklist: 'চেকলিস্ট',
  imageText: 'ছবি + টেক্সট',
  productRecommendation: 'প্রোডাক্ট রেকমেন্ডেশন',
  faq: 'FAQ',
  relatedLinks: 'রিলেটেড লিংক',
  gallery: 'গ্যালারি',
  cta: 'CTA বাটন',
};

export function createEmptyBlock(type: GuideBlock['type']): GuideBlock {
  switch (type) {
    case 'hero':
      return { id: newId('hero'), type, title: { ...EMPTY_LOC } };
    case 'richText':
      return { id: newId('richtext'), type, paragraphs: [] };
    case 'cardGrid':
      return { id: newId('cardgrid'), type, columns: 3, cards: [] };
    case 'priceTable':
      return { id: newId('pricetable'), type, rows: [] };
    case 'comparisonTable':
      return { id: newId('comparison'), type, columnHeaders: [], rows: [] };
    case 'steps':
      return { id: newId('steps'), type, steps: [] };
    case 'checklist':
      return { id: newId('checklist'), type, items: [] };
    case 'imageText':
      return { id: newId('imagetext'), type, paragraphs: [], image: { url: '', alt: { ...EMPTY_LOC } }, imageSide: 'right' };
    case 'productRecommendation':
      return { id: newId('productrec'), type, productId: 0 };
    case 'faq':
      return { id: newId('faq'), type, items: [] };
    case 'relatedLinks':
      return { id: newId('related'), type, items: [] };
    case 'gallery':
      return { id: newId('gallery'), type, items: [] };
    case 'cta':
      return { id: newId('cta'), type, heading: { ...EMPTY_LOC }, buttonLabel: { ...EMPTY_LOC }, href: '' };
  }
}

/* ────────────────────────────── HERO ────────────────────────────── */

function HeroEditor({ block, onChange }: { block: HeroBlock; onChange: (b: HeroBlock) => void }) {
  return (
    <>
      <LocalizedTextInput label="Eyebrow (ঐচ্ছিক)" value={block.eyebrow ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, eyebrow: v })} />
      <LocalizedTextInput label="টাইটেল (H1)" value={block.title} onChange={(v) => onChange({ ...block, title: v })} />
      <LocalizedTextarea label="সাবটাইটেল (ঐচ্ছিক)" value={block.subtitle ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, subtitle: v })} rows={2} />
      <TextField label="ছবির URL (ঐচ্ছিক — Cloudinary লিংক)" value={block.image?.url ?? ''} onChange={(url) => onChange({ ...block, image: { url, alt: block.image?.alt ?? EMPTY_LOC } })} placeholder="https://res.cloudinary.com/..." />
      {block.image?.url ? (
        <LocalizedTextInput label="Alt টেক্সট" value={block.image.alt} onChange={(alt) => onChange({ ...block, image: { url: block.image!.url, alt } })} />
      ) : null}
    </>
  );
}

/* ────────────────────────────── RICH TEXT ────────────────────────────── */

function RichTextEditor({ block, onChange }: { block: RichTextBlock; onChange: (b: RichTextBlock) => void }) {
  return (
    <>
      <LocalizedTextInput label="হেডিং (ঐচ্ছিক)" value={block.heading ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, heading: v })} />
      <RepeatingSection<LocalizedText>
        label="প্যারাগ্রাফ"
        items={block.paragraphs}
        newItem={() => ({ ...EMPTY_LOC })}
        onChange={(paragraphs) => onChange({ ...block, paragraphs })}
        itemLabel={(i) => `প্যারাগ্রাফ ${i + 1}`}
        renderItem={(p, update) => <LocalizedTextarea label="" value={p} onChange={update} rows={3} />}
      />
    </>
  );
}

/* ────────────────────────────── CARD GRID ────────────────────────────── */

function CardGridEditor({ block, onChange }: { block: CardGridBlock; onChange: (b: CardGridBlock) => void }) {
  return (
    <>
      <LocalizedTextInput label="হেডিং (ঐচ্ছিক)" value={block.heading ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, heading: v })} />
      <SelectField label="কলাম সংখ্যা" value={String(block.columns) as '2' | '3' | '4'} onChange={(v) => onChange({ ...block, columns: Number(v) as 2 | 3 | 4 })} options={[{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }]} />
      <RepeatingSection<CardItem>
        label="কার্ড"
        items={block.cards}
        newItem={() => ({ title: { ...EMPTY_LOC }, description: { ...EMPTY_LOC } })}
        onChange={(cards) => onChange({ ...block, cards })}
        itemLabel={(i) => `কার্ড ${i + 1}`}
        renderItem={(card, update) => (
          <>
            <SelectField label="আইকন" value={card.icon ?? ''} onChange={(icon) => update({ ...card, icon })} options={GUIDE_ICON_KEYS.map((k) => ({ value: k, label: k || '(কোনোটাই না)' }))} />
            <LocalizedTextInput label="ট্যাগ (ঐচ্ছিক)" value={card.tag ?? EMPTY_LOC} onChange={(tag) => update({ ...card, tag })} />
            <LocalizedTextInput label="টাইটেল" value={card.title} onChange={(title) => update({ ...card, title })} />
            <LocalizedTextarea label="বর্ণনা" value={card.description} onChange={(description) => update({ ...card, description })} rows={2} />
          </>
        )}
      />
    </>
  );
}

/* ────────────────────────────── PRICE TABLE ────────────────────────────── */

function PriceTableEditor({ block, onChange }: { block: PriceTableBlock; onChange: (b: PriceTableBlock) => void }) {
  return (
    <>
      <LocalizedTextInput label="হেডিং (ঐচ্ছিক)" value={block.heading ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, heading: v })} />
      <LocalizedTextarea label="নোট (ঐচ্ছিক)" value={block.note ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, note: v })} rows={2} />
      <RepeatingSection<PriceRow>
        label="দামের সারি"
        items={block.rows}
        newItem={() => ({ label: { ...EMPTY_LOC }, priceRangeBdt: '' })}
        onChange={(rows) => onChange({ ...block, rows })}
        itemLabel={(i) => `সারি ${i + 1}`}
        renderItem={(row, update) => (
          <>
            <LocalizedTextInput label="লেবেল (ধরন)" value={row.label} onChange={(label) => update({ ...row, label })} />
            <LocalizedTextInput label="ইউনিট (ঐচ্ছিক)" value={row.unit ?? EMPTY_LOC} onChange={(unit) => update({ ...row, unit })} />
            <TextField label="দামের রেঞ্জ (BDT)" value={row.priceRangeBdt} onChange={(priceRangeBdt) => update({ ...row, priceRangeBdt })} placeholder="৳৫০০ – ৳১,৩৫০" />
          </>
        )}
      />
    </>
  );
}

/* ────────────────────────────── COMPARISON TABLE ────────────────────────────── */

function ComparisonTableEditor({ block, onChange }: { block: ComparisonTableBlock; onChange: (b: ComparisonTableBlock) => void }) {
  function syncRowLengths(columnHeaders: typeof block.columnHeaders) {
    const rows = block.rows.map((r) => {
      const values = [...r.values];
      while (values.length < columnHeaders.length) values.push({ ...EMPTY_LOC });
      values.length = columnHeaders.length;
      return { ...r, values };
    });
    onChange({ ...block, columnHeaders, rows });
  }

  return (
    <>
      <LocalizedTextInput label="হেডিং (ঐচ্ছিক)" value={block.heading ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, heading: v })} />
      <RepeatingSection<LocalizedText>
        label="কলাম হেডার (প্রোডাক্ট/অপশনের নাম)"
        items={block.columnHeaders}
        newItem={() => ({ ...EMPTY_LOC })}
        onChange={syncRowLengths}
        itemLabel={(i) => `কলাম ${i + 1}`}
        renderItem={(h, update) => <LocalizedTextInput label="" value={h} onChange={update} />}
      />
      <RepeatingSection<ComparisonRow>
        label="সারি"
        items={block.rows}
        newItem={() => ({ label: { ...EMPTY_LOC }, values: block.columnHeaders.map(() => ({ ...EMPTY_LOC })) })}
        onChange={(rows) => onChange({ ...block, rows })}
        itemLabel={(i) => `সারি ${i + 1}`}
        renderItem={(row, update) => (
          <>
            <LocalizedTextInput label="সারির লেবেল" value={row.label} onChange={(label) => update({ ...row, label })} />
            {row.values.map((v, ci) => (
              <LocalizedTextInput
                key={ci}
                label={`মান — ${block.columnHeaders[ci]?.bn || `কলাম ${ci + 1}`}`}
                value={v}
                onChange={(nv) => {
                  const values = [...row.values];
                  values[ci] = nv;
                  update({ ...row, values });
                }}
              />
            ))}
          </>
        )}
      />
    </>
  );
}

/* ────────────────────────────── STEPS ────────────────────────────── */

function StepsEditor({ block, onChange }: { block: StepsBlock; onChange: (b: StepsBlock) => void }) {
  return (
    <>
      <LocalizedTextInput label="হেডিং (ঐচ্ছিক)" value={block.heading ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, heading: v })} />
      <RepeatingSection<StepItem>
        label="ধাপ"
        items={block.steps}
        newItem={() => ({ title: { ...EMPTY_LOC }, description: { ...EMPTY_LOC } })}
        onChange={(steps) => onChange({ ...block, steps })}
        itemLabel={(i) => `ধাপ ${i + 1}`}
        renderItem={(step, update) => (
          <>
            <LocalizedTextInput label="ধাপের টাইটেল" value={step.title} onChange={(title) => update({ ...step, title })} />
            <LocalizedTextarea label="বিস্তারিত" value={step.description} onChange={(description) => update({ ...step, description })} rows={2} />
            <LocalizedTextInput label="সতর্কতা (ঐচ্ছিক)" value={step.warning ?? EMPTY_LOC} onChange={(warning) => update({ ...step, warning })} />
            <TextField label="ছবির URL (ঐচ্ছিক)" value={step.image?.url ?? ''} onChange={(url) => update({ ...step, image: { url, alt: step.image?.alt ?? EMPTY_LOC } })} />
          </>
        )}
      />
    </>
  );
}

/* ────────────────────────────── CHECKLIST ────────────────────────────── */

function ChecklistEditor({ block, onChange }: { block: ChecklistBlock; onChange: (b: ChecklistBlock) => void }) {
  return (
    <>
      <LocalizedTextInput label="হেডিং (ঐচ্ছিক)" value={block.heading ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, heading: v })} />
      <RepeatingSection<LocalizedText>
        label="চেকলিস্ট আইটেম"
        items={block.items}
        newItem={() => ({ ...EMPTY_LOC })}
        onChange={(items) => onChange({ ...block, items })}
        itemLabel={(i) => `আইটেম ${i + 1}`}
        renderItem={(item, update) => <LocalizedTextInput label="" value={item} onChange={update} />}
      />
    </>
  );
}

/* ────────────────────────────── IMAGE + TEXT ────────────────────────────── */

function ImageTextEditor({ block, onChange }: { block: ImageTextBlock; onChange: (b: ImageTextBlock) => void }) {
  return (
    <>
      <LocalizedTextInput label="হেডিং (ঐচ্ছিক)" value={block.heading ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, heading: v })} />
      <SelectField label="ছবি কোন পাশে" value={block.imageSide} onChange={(imageSide) => onChange({ ...block, imageSide })} options={[{ value: 'left', label: 'বামে' }, { value: 'right', label: 'ডানে' }]} />
      <TextField label="ছবির URL" value={block.image.url} onChange={(url) => onChange({ ...block, image: { ...block.image, url } })} />
      <LocalizedTextInput label="Alt টেক্সট" value={block.image.alt} onChange={(alt) => onChange({ ...block, image: { ...block.image, alt } })} />
      <RepeatingSection<LocalizedText>
        label="প্যারাগ্রাফ"
        items={block.paragraphs}
        newItem={() => ({ ...EMPTY_LOC })}
        onChange={(paragraphs) => onChange({ ...block, paragraphs })}
        renderItem={(p, update) => <LocalizedTextarea label="" value={p} onChange={update} rows={2} />}
      />
    </>
  );
}

/* ────────────────────────────── PRODUCT RECOMMENDATION ────────────────────────────── */

function ProductRecommendationEditor({ block, onChange }: { block: ProductRecommendationBlock; onChange: (b: ProductRecommendationBlock) => void }) {
  return (
    <>
      <LocalizedTextInput label="হেডিং (ঐচ্ছিক)" value={block.heading ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, heading: v })} />
      <TextField label="প্রোডাক্ট আইডি" value={String(block.productId)} onChange={(v) => onChange({ ...block, productId: Number(v) || 0 })} placeholder="যেমন: 42" />
      <div className="mb-2 text-[10.5px] text-muted">প্রোডাক্ট আইডি প্রোডাক্ট ম্যানেজমেন্ট পেজের লিস্টে প্রতিটা প্রোডাক্টের পাশে পাবেন।</div>
      <LocalizedTextarea label="ব্লার্ব (ঐচ্ছিক)" value={block.blurb ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, blurb: v })} rows={2} />
    </>
  );
}

/* ────────────────────────────── FAQ ────────────────────────────── */

function FaqEditor({ block, onChange }: { block: FaqBlock; onChange: (b: FaqBlock) => void }) {
  return (
    <>
      <LocalizedTextInput label="হেডিং (ঐচ্ছিক)" value={block.heading ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, heading: v })} />
      <RepeatingSection<FaqItem>
        label="প্রশ্ন-উত্তর"
        items={block.items}
        newItem={() => ({ question: { ...EMPTY_LOC }, answer: { ...EMPTY_LOC } })}
        onChange={(items) => onChange({ ...block, items })}
        itemLabel={(i) => `প্রশ্ন ${i + 1}`}
        renderItem={(item, update) => (
          <>
            <LocalizedTextInput label="প্রশ্ন" value={item.question} onChange={(question) => update({ ...item, question })} />
            <LocalizedTextarea label="উত্তর" value={item.answer} onChange={(answer) => update({ ...item, answer })} rows={2} />
          </>
        )}
      />
    </>
  );
}

/* ────────────────────────────── RELATED LINKS ────────────────────────────── */

function RelatedLinksEditor({ block, onChange }: { block: RelatedLinksBlock; onChange: (b: RelatedLinksBlock) => void }) {
  return (
    <>
      <LocalizedTextInput label="হেডিং (ঐচ্ছিক)" value={block.heading ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, heading: v })} />
      <RepeatingSection<RelatedLinkItem>
        label="লিংক"
        items={block.items}
        newItem={() => ({ title: { ...EMPTY_LOC }, href: '' })}
        onChange={(items) => onChange({ ...block, items })}
        renderItem={(item, update) => (
          <>
            <SelectField label="আইকন" value={item.icon ?? ''} onChange={(icon) => update({ ...item, icon })} options={GUIDE_ICON_KEYS.map((k) => ({ value: k, label: k || '(কোনোটাই না)' }))} />
            <LocalizedTextInput label="টাইটেল" value={item.title} onChange={(title) => update({ ...item, title })} />
            <TextField label="URL" value={item.href} onChange={(href) => update({ ...item, href })} placeholder="/guides/..." />
          </>
        )}
      />
    </>
  );
}

/* ────────────────────────────── GALLERY ────────────────────────────── */

function GalleryEditor({ block, onChange }: { block: GalleryBlock; onChange: (b: GalleryBlock) => void }) {
  return (
    <>
      <LocalizedTextInput label="হেডিং (ঐচ্ছিক)" value={block.heading ?? EMPTY_LOC} onChange={(v) => onChange({ ...block, heading: v })} />
      <RepeatingSection<GalleryItem>
        label="গ্যালারি আইটেম"
        items={block.items}
        newItem={() => ({ image: { url: '', alt: { ...EMPTY_LOC } } })}
        onChange={(items) => onChange({ ...block, items })}
        renderItem={(item, update) => (
          <>
            <TextField label="ছবির URL" value={item.image.url} onChange={(url) => update({ ...item, image: { ...item.image, url } })} />
            <LocalizedTextInput label="Alt টেক্সট" value={item.image.alt} onChange={(alt) => update({ ...item, image: { ...item.image, alt } })} />
            <LocalizedTextInput label="ক্যাপশন (ঐচ্ছিক)" value={item.caption ?? EMPTY_LOC} onChange={(caption) => update({ ...item, caption })} />
            <TextField label="ট্যাগ (কমা দিয়ে আলাদা, ঐচ্ছিক)" value={(item.tags ?? []).join(', ')} onChange={(v) => update({ ...item, tags: v.split(',').map((s) => s.trim()).filter(Boolean) })} />
          </>
        )}
      />
    </>
  );
}

/* ────────────────────────────── CTA ────────────────────────────── */

function CtaEditor({ block, onChange }: { block: CtaBlock; onChange: (b: CtaBlock) => void }) {
  return (
    <>
      <LocalizedTextInput label="হেডিং" value={block.heading} onChange={(heading) => onChange({ ...block, heading })} />
      <LocalizedTextInput label="বাটনের টেক্সট" value={block.buttonLabel} onChange={(buttonLabel) => onChange({ ...block, buttonLabel })} />
      <TextField label="বাটনের লিংক" value={block.href} onChange={(href) => onChange({ ...block, href })} placeholder="/product/..." />
    </>
  );
}

/* ────────────────────────────── MASTER SWITCH ────────────────────────────── */

export function BlockEditorSwitch({ block, onChange }: { block: GuideBlock; onChange: (b: GuideBlock) => void }) {
  switch (block.type) {
    case 'hero':
      return <HeroEditor block={block} onChange={onChange} />;
    case 'richText':
      return <RichTextEditor block={block} onChange={onChange} />;
    case 'cardGrid':
      return <CardGridEditor block={block} onChange={onChange} />;
    case 'priceTable':
      return <PriceTableEditor block={block} onChange={onChange} />;
    case 'comparisonTable':
      return <ComparisonTableEditor block={block} onChange={onChange} />;
    case 'steps':
      return <StepsEditor block={block} onChange={onChange} />;
    case 'checklist':
      return <ChecklistEditor block={block} onChange={onChange} />;
    case 'imageText':
      return <ImageTextEditor block={block} onChange={onChange} />;
    case 'productRecommendation':
      return <ProductRecommendationEditor block={block} onChange={onChange} />;
    case 'faq':
      return <FaqEditor block={block} onChange={onChange} />;
    case 'relatedLinks':
      return <RelatedLinksEditor block={block} onChange={onChange} />;
    case 'gallery':
      return <GalleryEditor block={block} onChange={onChange} />;
    case 'cta':
      return <CtaEditor block={block} onChange={onChange} />;
    default:
      return null;
  }
}
