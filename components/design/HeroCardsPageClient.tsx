'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HeroCard, HeroLinkType, HeroProductOption } from '@/lib/constants/heroCards';
import { HERO_CARDS_MAX } from '@/lib/constants/heroCards';
import type { CategoryOption } from '@/lib/constants/categories';
import { getCleanIcon } from '@/lib/constants/categories';
import {
  addHeroCard,
  updateHeroCard,
  deleteHeroCard,
  resetHeroCardsToDefault,
  uploadHeroCardImage,
} from '@/app/actions/hero-cards';
import { useToast } from '@/components/admin/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import SectionHeading from '@/components/common/SectionHeading';
import { Field, SelectBox, FIELD_CLS } from '@/components/common/FormField';
import { notifyCatalogSyncCheck } from '@/lib/catalogSyncEvent';

interface Props {
  cards: HeroCard[];
  categories: CategoryOption[];
  products: HeroProductOption[];
}

interface EditorState {
  index: number; // -1 মানে নতুন কার্ড (legacy _cathEditIdx কনভেনশন)
  label: string;
  catId: string;
  img: string;
  linkType: HeroLinkType;
  productId?: number;
  productName?: string;
}

const LINK_TYPES: { id: HeroLinkType; title: string; hint: string }[] = [
  { id: 'category', title: 'ক্যাটাগরি', hint: 'ক্লিকে ওই ক্যাটাগরির পণ্য ফিল্টার হয়ে দেখাবে' },
  { id: 'grid', title: 'প্রোডাক্ট গ্রিড', hint: 'হোমপেজের প্রোডাক্ট লিস্টে ওই প্রোডাক্টের কাছে স্ক্রল করে হাইলাইট করবে' },
  { id: 'product', title: 'প্রোডাক্ট পেজ', hint: 'সরাসরি ওই প্রোডাক্টের ডিটেলস পেজে নিয়ে যাবে' },
];

const isImgSrc = (v: string) => !!v && (v.startsWith('http') || v.startsWith('/') || v.startsWith('data:'));

function Svg({ children, className = 'h-4 w-4', sw = 2.2 }: { children: React.ReactNode; className?: string; sw?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

export default function HeroCardsPageClient({ cards, categories, products }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productQuery, setProductQuery] = useState('');
  const [confirm, setConfirm] = useState<'delete' | 'reset' | null>(null);
  const [busy, setBusy] = useState(false);

  // এডিটর খোলা থাকলে ব্যাকগ্রাউন্ড স্ক্রল লক (সেভ-ফর্মে Esc দিয়ে বন্ধ হয় না — অসংরক্ষিত তথ্য হারাতে পারে)
  useEffect(() => {
    if (!editor) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [editor]);

  const atMax = cards.length >= HERO_CARDS_MAX;

  function openAdd() {
    if (atMax) {
      showToast(`❌ মূল সাইটে সর্বোচ্চ ${HERO_CARDS_MAX}টা কার্ড সাপোর্ট করে — আগে একটা মুছুন`);
      return;
    }
    setProductQuery('');
    setEditor({ index: -1, label: '', catId: '', img: '', linkType: 'category' });
  }

  function openEdit(i: number) {
    const c = cards[i];
    setProductQuery('');
    setEditor({
      index: i,
      label: c.label || '',
      catId: c.catId || '',
      img: c.img || '',
      linkType: c.linkType || 'category',
      productId: c.productId,
      productName: c.productName,
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // একই ফাইল আবার বাছাই করা যাবে
    if (!file || !editor) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await uploadHeroCardImage(formData);
    setUploading(false);
    if (!res.ok || !res.url) {
      showToast(res.message || '❌ আপলোড ব্যর্থ হয়েছে');
      return;
    }
    setEditor((cur) => (cur ? { ...cur, img: res.url! } : cur));
  }

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    const input = {
      label: editor.label,
      catId: editor.catId,
      img: editor.img,
      linkType: editor.linkType,
      productId: editor.productId,
      productName: editor.productName,
    };
    const res = editor.index === -1 ? await addHeroCard(input) : await updateHeroCard(editor.index, input);
    notifyCatalogSyncCheck();
    setSaving(false);

    if (!res.ok) {
      showToast(res.message || '❌ ব্যর্থ হয়েছে');
      return;
    }
    showToast(editor.index === -1 ? '✅ নতুন কার্ড যোগ হয়েছে!' : '✅ কার্ড আপডেট হয়েছে!');
    setEditor(null);
    router.refresh();
  }

  async function handleConfirm() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm === 'delete') {
        if (!editor || editor.index === -1) return;
        const res = await deleteHeroCard(editor.index);
        notifyCatalogSyncCheck();
        if (!res.ok) {
          showToast(res.message || '❌ ব্যর্থ হয়েছে');
          return;
        }
        showToast('🗑️ কার্ড মুছে ফেলা হয়েছে');
        setEditor(null);
      } else {
        await resetHeroCardsToDefault();
        showToast(`✅ ${HERO_CARDS_MAX}টি ডিফল্ট কার্ডে রিসেট হয়েছে!`);
      }
      setConfirm(null);
      router.refresh();
    } catch {
      showToast('❌ ব্যর্থ হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setBusy(false);
    }
  }

  const cardSubLabel = (card: HeroCard) => {
    if ((card.linkType === 'grid' || card.linkType === 'product') && card.productName) {
      return `${card.linkType === 'product' ? 'পেজ' : 'গ্রিড'}: ${card.productName}`;
    }
    if (!card.catId) return 'সব পণ্য';
    const c = categories.find((x) => x.id === card.catId);
    return c ? c.name : card.catId;
  };

  const q = productQuery.trim().toLowerCase();
  const filteredProducts = products.filter((p) => !q || p.name.toLowerCase().includes(q) || String(p.id) === q).slice(0, 40);

  return (
    <div>
      {/* ══ ১. টুলবার কার্ড ══ */}
      <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light/15 text-brand-light sm:h-10 sm:w-10">
              <Svg className="h-5 w-5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
              </Svg>
            </span>
            <div className="min-w-0">
              <div className="font-body text-[14px] font-black text-ink">হিরো সেকশন কার্ড</div>
              <div className="font-body text-[11px] font-semibold text-muted">হোমপেজের স্লাইডার কার্ড ম্যানেজ করুন</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirm('reset')}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border-base/80 bg-white px-4 font-body text-[13px] font-extrabold text-ink transition-all duration-brand hover:border-brand-light hover:text-brand-light active:scale-[0.98] sm:h-10 sm:flex-none sm:text-[12.5px]"
            >
              <Svg className="h-3.5 w-3.5">
                <path d="M3 12a9 9 0 1 0 2.6-6.4" />
                <path d="M3 3v6h6" />
              </Svg>
              ডিফল্টে রিসেট
            </button>
            <button
              type="button"
              onClick={openAdd}
              className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-brand-light px-5 font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] sm:h-10 sm:flex-none sm:text-[12.5px]"
            >
              <Svg className="h-3.5 w-3.5" sw={3}>
                <path d="M12 5v14M5 12h14" />
              </Svg>
              নতুন কার্ড
            </button>
          </div>
        </div>

        {/* স্লট-ব্যবহার বার */}
        <div className="mt-3.5">
          <div className="mb-1.5 flex items-center justify-between font-body text-[11px] font-extrabold">
            <span className="uppercase tracking-wide text-muted">কার্ডের স্লট</span>
            <span className={atMax ? 'text-danger' : 'text-ink'}>
              {cards.length} / {HERO_CARDS_MAX}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className={`h-full rounded-full transition-all duration-brand ${atMax ? 'bg-danger' : 'bg-brand-light'}`}
              style={{ width: `${Math.min(100, (cards.length / HERO_CARDS_MAX) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ══ ২. কার্ড গ্রিড ══ */}
      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 text-center shadow-sh1">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/15 text-brand-light">
            <Svg className="h-6 w-6">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M12 8v8M8 12h8" />
            </Svg>
          </span>
          <span className="font-body text-[14px] font-extrabold text-ink">কোনো কার্ড নেই</span>
          <span className="font-body text-[12px] font-medium text-muted">উপরের বাটন থেকে নতুন কার্ড যোগ করুন</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {cards.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => openEdit(i)}
              aria-label={`কার্ড #${i + 1} এডিট করুন`}
              className="group overflow-hidden rounded-[20px] border border-white/90 bg-white text-left shadow-sh1 transition-all duration-brand hover:shadow-sh2 active:scale-[0.98]"
            >
              <div className="relative h-40 overflow-hidden" style={{ background: c.bg || '#111' }}>
                {c.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] text-3xl">{c.emoji || '📦'}</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-black/60" />
                <span className="absolute bottom-2.5 left-2 right-2 inline-flex max-w-full items-center truncate rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                  {c.label || 'Shop Now'}
                </span>
                <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-black/50 px-1.5 text-[10px] font-black text-white">
                  {i + 1}
                </span>
                <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-light text-white shadow-[0_3px_10px_rgba(68,167,252,0.5)]">
                  <Svg className="h-3.5 w-3.5">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </Svg>
                </span>
              </div>
              <div className="px-3 py-2.5">
                <div className="truncate font-body text-[12.5px] font-extrabold text-ink">{c.label || '—'}</div>
                <div className="mt-0.5 truncate font-body text-[11px] font-semibold text-muted">{cardSubLabel(c)}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ══ ৩. কার্ড এডিটর (বটম শীট) ══ */}
      {editor && (
        <div
          className="animate-soft-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
          onClick={(e) => e.target === e.currentTarget && !saving && setEditor(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="animate-sheet-up flex max-h-[94dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:max-h-[92dvh] md:rounded-[28px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)]">
            {/* হেডার */}
            <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.12] to-white px-5 pb-3.5 pt-2.5 md:pt-5">
              <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 md:hidden" />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-body text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">
                    {editor.index === -1 ? 'নতুন কার্ড' : `কার্ড #${editor.index + 1}`}
                  </div>
                  <h3 className="mt-0.5 font-body text-[22px] font-black leading-tight text-ink">
                    {editor.index === -1 ? 'কার্ড যোগ করুন' : 'কার্ড এডিট করুন'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  disabled={saving}
                  aria-label="বন্ধ করুন"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sh1 transition-all duration-brand hover:bg-border-base active:scale-90 disabled:opacity-50"
                >
                  <Svg className="h-3.5 w-3.5" sw={2.8}>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </Svg>
                </button>
              </div>
            </div>

            {/* বডি */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
              <div className="space-y-8">
                {/* লাইভ প্রিভিউ */}
                <section>
                  <SectionHeading hint="হোমপেজে কার্ডটা এমন দেখাবে">প্রিভিউ</SectionHeading>
                  <div className="flex justify-center">
                    <div className="relative h-52 w-32 overflow-hidden rounded-[20px] bg-ink shadow-sh2">
                      {isImgSrc(editor.img) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editor.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40">
                          <Svg className="h-9 w-9" sw={1.6}>
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
                          </Svg>
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent from-55% to-black/65" />
                      <span className="absolute bottom-3 left-2.5 right-2.5 inline-flex items-center truncate rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                        {(editor.label || 'SHOP NOW').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </section>

                {/* ছবি + টেক্সট */}
                <section>
                  <SectionHeading>কার্ডের কনটেন্ট</SectionHeading>
                  <div className="space-y-3.5">
                    <Field label="ছবি" help="URL পেস্ট করুন অথবা ফোন/কম্পিউটার থেকে আপলোড করুন">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="url"
                          value={editor.img}
                          onChange={(e) => setEditor({ ...editor, img: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                          className={FIELD_CLS}
                        />
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-brand-light/40 bg-brand-light/10 px-4 font-body text-[12.5px] font-extrabold text-ink transition-all duration-brand active:scale-95 disabled:opacity-50"
                        >
                          <Svg className="h-4 w-4 text-brand-light">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <path d="m17 8-5-5-5 5M12 3v12" />
                          </Svg>
                          {uploading ? 'আপলোড...' : 'আপলোড'}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
                      </div>
                      {editor.img && (
                        <button
                          type="button"
                          onClick={() => setEditor({ ...editor, img: '' })}
                          className="mt-2 flex h-9 items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3.5 font-body text-[11.5px] font-extrabold text-danger transition-all duration-brand active:scale-95"
                        >
                          ছবি সরান
                        </button>
                      )}
                    </Field>

                    <Field label="কার্ডের নিচের বাটন টেক্সট" help="এই লেখাটা কার্ডের নিচে দেখাবে">
                      <input
                        type="text"
                        value={editor.label}
                        onChange={(e) => setEditor({ ...editor, label: e.target.value })}
                        placeholder="যেমন: Shop Now বা Explore"
                        className={FIELD_CLS}
                      />
                    </Field>
                  </div>
                </section>

                {/* লিংক */}
                <section>
                  <SectionHeading hint={LINK_TYPES.find((x) => x.id === editor.linkType)?.hint}>ক্লিক করলে কোথায় যাবে</SectionHeading>

                  <div className="mb-4 flex rounded-full bg-surface-muted p-1">
                    {LINK_TYPES.map((lt) => {
                      const active = editor.linkType === lt.id;
                      return (
                        <button
                          key={lt.id}
                          type="button"
                          onClick={() => setEditor({ ...editor, linkType: lt.id })}
                          className={`h-10 flex-1 rounded-full font-body text-[11.5px] font-extrabold transition-all duration-brand active:scale-[0.98] ${
                            active ? 'bg-brand-light text-white shadow-[0_4px_12px_rgba(68,167,252,0.4)]' : 'text-ink'
                          }`}
                        >
                          {lt.title}
                        </button>
                      );
                    })}
                  </div>

                  {editor.linkType === 'category' ? (
                    <Field label="কোন ক্যাটাগরিতে যাবে?">
                      <SelectBox value={editor.catId} onChange={(v) => setEditor({ ...editor, catId: v })}>
                        <option value="">সব পণ্য দেখাবে (ফাঁকা)</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {getCleanIcon(c)} {c.name}
                          </option>
                        ))}
                      </SelectBox>
                    </Field>
                  ) : (
                    <Field label="কোন প্রোডাক্ট?" required>
                      {editor.productId && (
                        <div className="mb-2.5 flex items-center justify-between gap-2 rounded-2xl border border-brand-light/40 bg-brand-light/10 px-3.5 py-2.5">
                          <span className="min-w-0 truncate font-body text-[12.5px] font-extrabold text-ink">
                            {editor.productName} <span className="font-semibold text-muted">#{editor.productId}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditor({ ...editor, productId: undefined, productName: undefined })}
                            aria-label="প্রোডাক্ট সরান"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-muted shadow-sh1 active:scale-90"
                          >
                            <Svg className="h-3 w-3" sw={2.8}>
                              <path d="M18 6 6 18M6 6l12 12" />
                            </Svg>
                          </button>
                        </div>
                      )}
                      <input
                        type="text"
                        value={productQuery}
                        onChange={(e) => setProductQuery(e.target.value)}
                        placeholder="প্রোডাক্টের নাম বা আইডি লিখে খুঁজুন..."
                        className={`${FIELD_CLS} mb-2`}
                      />
                      <div className="max-h-56 overflow-y-auto overscroll-contain rounded-2xl border border-border-base/80">
                        {filteredProducts.map((p) => {
                          const selected = editor.productId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setEditor({ ...editor, productId: p.id, productName: p.name, catId: p.cat || editor.catId })}
                              className={`flex min-h-12 w-full items-center gap-2.5 border-b border-border-base/50 px-3 py-2 text-left transition-colors duration-brand last:border-b-0 active:bg-brand-bg/40 ${
                                selected ? 'bg-brand-light/10' : 'hover:bg-brand-bg/25'
                              }`}
                            >
                              {p.img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.img} alt="" className="h-9 w-9 shrink-0 rounded-xl border border-border-base/70 object-cover" />
                              ) : (
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-muted">
                                  <Svg className="h-4 w-4">
                                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                  </Svg>
                                </span>
                              )}
                              <span className="min-w-0 flex-1 truncate font-body text-[12.5px] font-bold text-ink">{p.name}</span>
                              <span className="shrink-0 font-body text-[10.5px] font-semibold text-muted">#{p.id}</span>
                              {selected && (
                                <Svg className="h-4 w-4 shrink-0 text-brand-light" sw={3}>
                                  <polyline points="20 6 9 17 4 12" />
                                </Svg>
                              )}
                            </button>
                          );
                        })}
                        {filteredProducts.length === 0 && (
                          <div className="p-4 text-center font-body text-[12px] font-semibold text-muted">কোনো প্রোডাক্ট পাওয়া যায়নি</div>
                        )}
                      </div>
                    </Field>
                  )}
                </section>
              </div>
            </div>

            {/* ফুটার */}
            <div className="shrink-0 border-t border-border-base/70 bg-white px-5 pt-3.5" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
              <div className="grid grid-cols-[1fr_2fr] gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  disabled={saving}
                  className="h-12 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98] disabled:opacity-60"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={saving || uploading}
                  onClick={handleSave}
                  className="h-12 rounded-full bg-brand-light font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-60"
                >
                  {saving ? 'সেভ হচ্ছে...' : 'কার্ড সেভ করুন'}
                </button>
              </div>
              {editor.index !== -1 && (
                <button
                  type="button"
                  onClick={() => setConfirm('delete')}
                  disabled={saving}
                  className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-red-200/80 bg-red-50 font-body text-[13px] font-extrabold text-danger transition-all duration-brand active:scale-[0.98] disabled:opacity-60"
                >
                  <Svg className="h-4 w-4">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </Svg>
                  এই কার্ড মুছে ফেলুন
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirm === 'delete' && (
        <ConfirmDialog
          title="কার্ডটা মুছে ফেলবেন?"
          message="এই কার্ড হোমপেজের স্লাইডার থেকে সরে যাবে।"
          confirmLabel="হ্যাঁ, মুছুন"
          busyLabel="মুছছি..."
          busy={busy}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'reset' && (
        <ConfirmDialog
          title="ডিফল্টে রিসেট করবেন?"
          message={`মেইন ওয়েবসাইটের ${HERO_CARDS_MAX}টি ডিফল্ট কার্ডে ফিরে যাবে। বর্তমান সব পরিবর্তন মুছে যাবে।`}
          confirmLabel="হ্যাঁ, রিসেট করুন"
          busyLabel="রিসেট হচ্ছে..."
          busy={busy}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
