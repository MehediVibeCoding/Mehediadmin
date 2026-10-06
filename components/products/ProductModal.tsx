'use client';

import { useEffect, useRef, useState } from 'react';
import type { Product } from '@/types';
import type { CategoryOption } from '@/lib/constants/categories';
import type { ProductFormInput } from '@/app/actions/products';
import { createProduct, updateProduct, linkColorVariant, unlinkColorVariant } from '@/app/actions/products';
import CategoryPicker from './CategoryPicker';
import ImageManager from './ImageManager';
import SectionHeading from '@/components/common/SectionHeading';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Field, FIELD_CLS, TEXTAREA_CLS, SelectBox } from '@/components/common/FormField';
import { notifyCatalogSyncCheck } from '@/lib/catalogSyncEvent';

type Tab = 'basic' | 'layout' | 'images';

interface Props {
  categories: CategoryOption[];
  editingProduct?: Product;
  initialState: ProductFormInput;
  titleOverride?: string; // যেমন AI Parser থেকে খোলা হলে '🤖 AI Parse — প্রোডাক্ট যোগ করুন'
  allProducts?: Product[]; // 🆕 কালার ভ্যারিয়েন্ট লিংক-পিকারে সার্চ করার জন্য — বাকি সব প্রোডাক্টের তালিকা
  onClose: () => void;
  onSaved: (product: Product) => void;
}

const TABS: [Tab, string][] = [
  ['basic', 'Basic Info'],
  ['layout', 'Full Layout'],
  ['images', 'Images'],
];

export default function ProductModal({ categories, editingProduct, initialState, titleOverride, allProducts = [], onClose, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>('basic');
  const [form, setForm] = useState<ProductFormInput>(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dupAsk, setDupAsk] = useState(false); // একই নামে প্রোডাক্ট আছে — নিশ্চিতকরণ ডায়ালগ
  const bodyRef = useRef<HTMLDivElement>(null);

  // 🆕 কালার ভ্যারিয়েন্ট — group id নিয়মিত ফর্ম সেভের অংশ না (link/unlink
  // সাথে সাথে সার্ভারে সেভ হয়ে যায়), তাই এটা আলাদা লোকাল স্টেটে রাখা
  const [colorGroupId, setColorGroupId] = useState<string | null>(editingProduct?.color_group_id || null);
  const [linkQuery, setLinkQuery] = useState('');
  const [linking, setLinking] = useState(false);

  const groupMembers = editingProduct && colorGroupId
    ? allProducts.filter((p) => p.color_group_id === colorGroupId && p.id !== editingProduct.id)
    : [];
  const linkCandidates = editingProduct && linkQuery.trim()
    ? allProducts
        .filter((p) => (
          p.id !== editingProduct.id &&
          !(colorGroupId && p.color_group_id === colorGroupId) &&
          p.name.toLowerCase().includes(linkQuery.trim().toLowerCase())
        ))
        .slice(0, 8)
    : [];

  // ব্যাকগ্রাউন্ড স্ক্রল লক (মডাল খোলা থাকলে নিচের পেজ নড়বে না)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function switchTab(next: Tab) {
    setTab(next);
    bodyRef.current?.scrollTo({ top: 0 });
  }

  async function handleLink(otherId: number) {
    if (!editingProduct) return;
    setLinking(true);
    setError('');
    try {
      const result = await linkColorVariant(editingProduct.id, otherId);
      if (result.ok) {
        setColorGroupId(result.groupId || null);
        setLinkQuery('');
      } else {
        setError(result.message || 'লিংক ব্যর্থ হয়েছে');
      }
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink(idToUnlink: number) {
    setLinking(true);
    setError('');
    try {
      const result = await unlinkColorVariant(idToUnlink);
      if (result.ok) {
        if (editingProduct && idToUnlink === editingProduct.id) setColorGroupId(null);
      } else {
        setError(result.message || 'আনলিংক ব্যর্থ হয়েছে');
      }
    } finally {
      setLinking(false);
    }
  }

  function set<K extends keyof ProductFormInput>(key: K, val: ProductFormInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave(forceDuplicate = false) {
    setError('');
    if (!form.name.trim() || !form.price) {
      setError('প্রোডাক্টের নাম ও মূল্য আবশ্যক');
      switchTab('basic');
      return;
    }
    setSaving(true);
    try {
      const result = editingProduct
        ? await updateProduct(editingProduct.id, form)
        : await createProduct(form, { forceDuplicate });
      notifyCatalogSyncCheck();

      if (result.status === 'duplicate') {
        setDupAsk(true);
        return;
      }
      if (result.status === 'error') {
        setError(result.message || 'সেভ ব্যর্থ হয়েছে');
        return;
      }
      if (result.product) onSaved(result.product);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* z-[60] > নিচের ট্যাব বার (z-40) — সেভ/বাতিল বোতাম আর কখনো ঢাকা পড়ে না */}
      <div
        className="animate-soft-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
      >
        <div className="animate-sheet-up flex max-h-[94dvh] w-full max-w-[820px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:max-h-[92dvh] md:rounded-[28px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)]">
          {/* ══ হেডার + ট্যাব (আটকে থাকে) ══ */}
          <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.12] to-white px-5 pb-3.5 pt-2.5 md:pt-5">
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 md:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-body text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">
                  {editingProduct ? 'প্রোডাক্ট এডিটর' : 'নতুন প্রোডাক্ট'}
                </div>
                <h3 className="mt-1 font-body text-[22px] font-black leading-tight tracking-tight text-ink">
                  {titleOverride || (editingProduct ? 'প্রোডাক্ট এডিট করুন' : 'প্রোডাক্ট যোগ করুন')}
                </h3>
                {editingProduct && (
                  <p className="mt-1 truncate font-body text-[12px] font-semibold text-muted">
                    #{editingProduct.id} · {editingProduct.name}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="বন্ধ করুন"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sh1 transition-all duration-brand hover:bg-border-base active:scale-90"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-3.5 flex rounded-full bg-surface-muted p-1">
              {TABS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchTab(id)}
                  className={`h-10 flex-1 rounded-full font-body text-[13px] font-extrabold transition-all duration-brand ${
                    tab === id ? 'bg-brand-light text-white shadow-[0_4px_12px_rgba(68,167,252,0.4)]' : 'text-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ══ বডি (স্ক্রল হয়) ══ */}
          <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
            {/* ───────── TAB: BASIC ───────── */}
            {tab === 'basic' && (
              <div className="space-y-8">
                <section>
                  <SectionHeading>নাম ও ক্যাটাগরি</SectionHeading>
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <Field label="প্রোডাক্টের নাম" required>
                      <input
                        className={FIELD_CLS}
                        placeholder="সম্পূর্ণ নাম লিখুন"
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                      />
                    </Field>
                    <Field label="প্রোডাক্টের বাংলা নাম" hint="(বাংলায় সার্চ করলে এই নাম দিয়েই মিলবে)">
                      <input
                        className={FIELD_CLS}
                        placeholder="যেমন: নিয়ন লাইট"
                        value={form.nameBn}
                        onChange={(e) => set('nameBn', e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="mt-3.5">
                    <CategoryPicker categories={categories} value={form.cats} onChange={(v) => set('cats', v)} />
                  </div>
                </section>

                <section>
                  <SectionHeading>মূল্য ও স্টক</SectionHeading>
                  <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                    <Field label="বর্তমান মূল্য (৳)" required>
                      <input
                        type="number"
                        inputMode="numeric"
                        className={FIELD_CLS}
                        placeholder="1490"
                        value={form.price || ''}
                        onChange={(e) => set('price', Number(e.target.value))}
                      />
                    </Field>
                    <Field label="পুরনো মূল্য (৳)">
                      <input
                        type="number"
                        inputMode="numeric"
                        className={FIELD_CLS}
                        placeholder="1800"
                        value={form.old || ''}
                        onChange={(e) => set('old', Number(e.target.value))}
                      />
                    </Field>
                    <Field label="স্টক পরিমাণ">
                      <input
                        type="number"
                        inputMode="numeric"
                        className={FIELD_CLS}
                        placeholder="20"
                        value={form.stock || ''}
                        onChange={(e) => set('stock', Number(e.target.value))}
                      />
                    </Field>
                    <Field label="প্রফিট (৳)" hint="(শুধু এডমিন দেখবে)">
                      <input
                        type="number"
                        inputMode="numeric"
                        className={FIELD_CLS}
                        placeholder="200"
                        value={form.profit || ''}
                        onChange={(e) => set('profit', Number(e.target.value))}
                      />
                    </Field>
                  </div>
                </section>

                <section>
                  <SectionHeading>ব্যাজ, ওয়ারেন্টি ও রেটিং</SectionHeading>
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <Field label="Badge">
                      <input
                        className={FIELD_CLS}
                        placeholder="HOT / NEW / SALE"
                        value={form.badge}
                        onChange={(e) => set('badge', e.target.value)}
                      />
                    </Field>
                    <Field label="ছাড়ের ব্যাজ রং">
                      <SelectBox value={form.discountColor} onChange={(v) => set('discountColor', v as '' | 'green')}>
                        <option value="">ডিফল্ট (কমলা)</option>
                        <option value="green">সবুজ (স্পেশাল ডিসকাউন্ট)</option>
                      </SelectBox>
                    </Field>
                    <Field label="ওয়ারেন্টি">
                      <input
                        className={FIELD_CLS}
                        placeholder="৬ মাস রিপ্লেসমেন্ট"
                        value={form.warranty}
                        onChange={(e) => set('warranty', e.target.value)}
                      />
                    </Field>
                    <Field label="রেটিং (1-5)">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={1}
                        max={5}
                        step={0.1}
                        className={FIELD_CLS}
                        placeholder="4.5"
                        value={form.rating || ''}
                        onChange={(e) => set('rating', Number(e.target.value))}
                      />
                    </Field>
                  </div>
                </section>

                {/* কালার ভ্যারিয়েন্ট */}
                <section className="rounded-[24px] border border-brand-light/30 bg-brand-light/[0.07] p-4 sm:p-5">
                  <SectionHeading hint="(ঐচ্ছিক — একই আইটেমের ভিন্ন কালার প্রোডাক্টগুলো একে অপরের সাথে লিংক করুন)">
                    কালার ভ্যারিয়েন্ট
                  </SectionHeading>
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <Field label="কালারের নাম">
                      <input
                        className={FIELD_CLS}
                        placeholder="যেমন: Baby Pink"
                        value={form.colorName}
                        onChange={(e) => set('colorName', e.target.value)}
                      />
                    </Field>
                    <Field label="সোয়াচ কালার">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="h-12 w-14 shrink-0 cursor-pointer rounded-2xl border border-border-base/90 bg-white p-1"
                          value={/^#[0-9a-fA-F]{6}$/.test(form.colorSwatch) ? form.colorSwatch : '#44A7FC'}
                          onChange={(e) => set('colorSwatch', e.target.value)}
                        />
                        <input
                          className={`${FIELD_CLS} min-w-0 flex-1`}
                          placeholder="#F9C5D1"
                          value={form.colorSwatch}
                          onChange={(e) => set('colorSwatch', e.target.value)}
                        />
                      </div>
                    </Field>
                  </div>

                  {!editingProduct ? (
                    <div className="mt-3.5 rounded-2xl bg-white/80 px-4 py-3 font-body text-[12px] font-semibold leading-snug text-muted">
                      প্রথমে প্রোডাক্টটা সেভ করুন, তারপর এডিট করে অন্য কালারের প্রোডাক্টের সাথে লিংক করা যাবে।
                    </div>
                  ) : (
                    <div className="mt-3.5">
                      {groupMembers.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {groupMembers.map((m) => (
                            <span
                              key={m.id}
                              className="flex items-center gap-2 rounded-full border border-border-base/80 bg-white py-1.5 pl-3 pr-1.5 font-body text-[12.5px] font-bold text-ink"
                            >
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/10"
                                style={{ backgroundColor: m.color_swatch || '#ccc' }}
                              />
                              {m.color_name || m.name}
                              <button
                                type="button"
                                disabled={linking}
                                onClick={() => handleUnlink(m.id)}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-muted transition-all duration-brand hover:bg-danger hover:text-white disabled:opacity-50"
                                title="আনলিংক করুন"
                                aria-label="আনলিংক করুন"
                              >
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round">
                                  <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="relative">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-brand-light"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                          className={`${FIELD_CLS} pl-11`}
                          placeholder="অন্য কালারের প্রোডাক্টের নাম লিখে লিংক করুন"
                          value={linkQuery}
                          onChange={(e) => setLinkQuery(e.target.value)}
                          disabled={linking}
                        />
                      </div>
                      {/* রেজাল্ট ইনলাইন — ভাসমান নয়, তাই স্ক্রল এরিয়ায় কখনো কাটা পড়ে না */}
                      {linkQuery.trim() && (
                        <div className="mt-2 overflow-hidden rounded-2xl border border-border-base/80 bg-white">
                          {linkCandidates.length === 0 ? (
                            <div className="px-4 py-3 font-body text-[12.5px] font-semibold text-muted">কোনো প্রোডাক্ট পাওয়া যায়নি</div>
                          ) : (
                            <div className="divide-y divide-border-base/60">
                              {linkCandidates.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleLink(c.id)}
                                  className="block w-full px-4 py-3 text-left font-body text-[13px] font-bold text-ink transition-colors hover:bg-brand-light/10 active:bg-brand-light/15"
                                >
                                  {c.name}
                                  {c.color_name ? ` (${c.color_name})` : ''}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {colorGroupId && groupMembers.length === 0 && (
                        <div className="mt-2 font-body text-[11.5px] font-medium text-muted">
                          এই গ্রুপে আর কোনো প্রোডাক্ট নেই — লিংক করলে এখানে দেখাবে।
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ───────── TAB: FULL LAYOUT ─────────
                সিরিয়াল সরাসরি SEO কনটেন্ট টেমপ্লেটের ক্রম অনুযায়ী: SEO মেটা → এক নজরে →
                বিবরণ → ফিচারস → স্পেসিফিকেশন → পাওয়ার তথ্য → Packaging → অতিরিক্ত তথ্য → FAQ।
                প্রতিটা লেবেল ইচ্ছাকৃতভাবে মেইন সাইটে যে নামে সেকশনটা দেখা যায় সেই নামেই রাখা
                হলো, যাতে এডমিন আর সাইটের মধ্যে কোনো বিভ্রান্তি না থাকে। */}
            {tab === 'layout' && (
              <div className="space-y-8">
                <section>
                  <SectionHeading hint="(সবগুলো ঐচ্ছিক — খালি রাখলে সাইট নিজে থেকেই নাম/দাম দিয়ে বানিয়ে নেবে)">SEO মেটা তথ্য</SectionHeading>
                  <div className="space-y-3.5">
                    <Field label="H1 (পেজের মূল হেডিং)">
                      <input
                        className={FIELD_CLS}
                        placeholder="খালি রাখলে প্রোডাক্টের নামই দেখাবে"
                        value={form.h1}
                        onChange={(e) => set('h1', e.target.value)}
                      />
                    </Field>
                    <Field label="Meta Title">
                      <input
                        className={FIELD_CLS}
                        placeholder="যেমন: প্রোডাক্টের নাম | Vangcur"
                        value={form.metaTitle}
                        onChange={(e) => set('metaTitle', e.target.value)}
                      />
                    </Field>
                    <Field label="Meta Description">
                      <textarea
                        rows={2}
                        className={TEXTAREA_CLS}
                        placeholder="সার্চ রেজাল্টে যে ছোট বিবরণ দেখাবে..."
                        value={form.metaDescription}
                        onChange={(e) => set('metaDescription', e.target.value)}
                      />
                    </Field>
                    <Field label="Open Graph Description" hint="(সোশ্যাল শেয়ার প্রিভিউ)">
                      <textarea
                        rows={2}
                        className={TEXTAREA_CLS}
                        placeholder="খালি রাখলে Meta Description-ই ব্যবহার হবে"
                        value={form.ogDescription}
                        onChange={(e) => set('ogDescription', e.target.value)}
                      />
                    </Field>
                  </div>
                </section>

                <section>
                  <SectionHeading hint="(প্রোডাক্ট পেজে ছোট পিল/ব্যাজ আকারে দেখায়)">স্পেসিফিকেশন এক নজরে</SectionHeading>
                  <textarea
                    rows={2}
                    className={TEXTAREA_CLS}
                    placeholder={'5 Meter (16.4 Feet) • App + Remote Control • 16M+ Colour Options • Bluetooth • 6 Months Replacement Warranty'}
                    value={form.quickSpecsText}
                    onChange={(e) => set('quickSpecsText', e.target.value)}
                  />
                  <div className="mt-1.5 font-body text-[11px] font-medium text-muted">
                    &ldquo;•&rdquo; দিয়ে আলাদা করে যত ইচ্ছা পয়েন্ট লিখুন — প্রতিটা আলাদা পিল হিসেবে দেখাবে।
                  </div>
                </section>

                <section>
                  <SectionHeading hint="প্রোডাক্টের বিস্তারিত বিবরণ → প্রধান ফিচারস → কারিগরি স্পেসিফিকেশন">বিবরণ, ফিচারস ও স্পেসিফিকেশন</SectionHeading>
                  <div className="space-y-3.5">
                    <Field label="প্রোডাক্টের বিস্তারিত বিবরণ" hint="(একাধিক প্যারা লিখতে চাইলে মাঝে একটা ফাঁকা লাইন দিন)">
                      <textarea
                        rows={5}
                        className={TEXTAREA_CLS}
                        placeholder={'প্রথম প্যারা...\n\nদ্বিতীয় প্যারা...'}
                        value={form.desc}
                        onChange={(e) => set('desc', e.target.value)}
                      />
                    </Field>
                    <Field
                      label="প্রধান ফিচারস"
                      hint="(প্রতিটা ফিচার আলাদা প্যারায় — চাইলে শুধু এক লাইনের বুলেট, অথবা আইকন+টাইটেল লাইন তারপর বিবরণ লাইন)"
                    >
                      <textarea
                        rows={5}
                        className={TEXTAREA_CLS}
                        placeholder={'🌈 16 Million+ Colour Options\nআপনার পছন্দের রং বেছে নিন, অথবা নিজের custom shade তৈরি করুন।\n\n📱 App + Remote, দুটোই একসাথে\nফোন হাতের কাছে না থাকলে Remote দিয়ে কাজ চালান।'}
                        value={form.featuresRaw}
                        onChange={(e) => set('featuresRaw', e.target.value)}
                      />
                    </Field>
                    <Field
                      label="কারিগরি স্পেসিফিকেশন"
                      hint="(Key: Value, প্রতিটি লাইনে)"
                      help={
                        <>
                          &ldquo;Power Adapter:&rdquo; / &ldquo;Connection:&rdquo; দিয়ে শুরু কোনো লাইন এখানে থাকলে সেটা এখানে না বসিয়ে নিচের &ldquo;পাওয়ার / কানেকশন তথ্য&rdquo; বক্সে বসান।
                        </>
                      }
                    >
                      <textarea
                        rows={5}
                        className={TEXTAREA_CLS}
                        placeholder={'Brand: GearUP\nModel: NRGB50\nLength: 5 Meter\nConnectivity: Bluetooth'}
                        value={form.techSpecsRaw}
                        onChange={(e) => set('techSpecsRaw', e.target.value)}
                      />
                    </Field>
                  </div>
                </section>

                {/* Power Info + Packaging Content — দুটোই সম্পূর্ণ optional, খালি রাখলে প্রোডাক্ট পেজে
                    সংশ্লিষ্ট অংশ একদম দেখাবে না। মেইন সাইটে Power Info থাকলে তার ঠিক পরে, না থাকলে
                    স্পেসিফিকেশন টেবিলের পরে Packaging Content বক্স দেখায় (কোনো অতিরিক্ত সেটিং লাগে না)। */}
                <section>
                  <SectionHeading hint="(ঐচ্ছিক — যে প্রোডাক্টে power adapter নেই, সেটার জন্য খালি রাখুন)">পাওয়ার / কানেকশন তথ্য</SectionHeading>
                  <textarea
                    rows={3}
                    className={TEXTAREA_CLS}
                    placeholder={'Power Adapter: Input AC 100–240V, 50/60Hz → Output DC 24V, 1A → 2-pin plug\nConnection flow: Wall Socket → Adapter → Inline Switch → Neon Light'}
                    value={form.powerInfo}
                    onChange={(e) => set('powerInfo', e.target.value)}
                  />
                </section>

                <section>
                  <SectionHeading hint="(ঐচ্ছিক — বক্সে কী কী থাকবে, প্রতি লাইনে একটা আইটেম)">Packaging Content</SectionHeading>
                  <textarea
                    rows={4}
                    className={TEXTAREA_CLS}
                    placeholder={'1 × GearUP NRGB50 5 Meter RGB Neon Light\n1 × 24V 1A DC Power Adapter\n1 × Remote Control'}
                    value={form.packagingContent}
                    onChange={(e) => set('packagingContent', e.target.value)}
                  />
                </section>

                <section>
                  <SectionHeading hint="(ঐচ্ছিক — “অতিরিক্ত তথ্য” ট্যাবে আলাদা কার্ড হিসেবে দেখায়, যতগুলো ইচ্ছা যোগ করুন)">অতিরিক্ত তথ্য</SectionHeading>
                  <textarea
                    rows={5}
                    className={TEXTAREA_CLS}
                    placeholder={'### কোথায় ব্যবহার করবেন\nBedroom, gaming room, study table...\n\n### 5 Meter আসলে কতটা\nপ্রায় 16.4 Feet, মেপে নেওয়া ভালো...'}
                    value={form.infoBoxesRaw}
                    onChange={(e) => set('infoBoxesRaw', e.target.value)}
                  />
                  <div className="mt-1.5 font-body text-[11px] font-medium leading-snug text-muted">
                    প্রতিটা বক্স <code className="rounded-md bg-brand-light/15 px-1.5 py-0.5 font-mono text-ink">### শিরোনাম</code> দিয়ে শুরু করুন, তারপরের লাইনগুলো সেই বক্সের বডি — নতুন বক্সের আগে একটা ফাঁকা লাইন দিন।
                  </div>
                </section>

                <section>
                  <SectionHeading hint="(Q: ... A: ... ফরম্যাটে)">কমন প্রশ্নোত্তর (FAQ)</SectionHeading>
                  <textarea
                    rows={5}
                    className={TEXTAREA_CLS}
                    placeholder={'Q: পানিতে ব্যবহার করা যাবে?\nA: হ্যাঁ, IP68 রেটিং আছে।\n\nQ: চার্জ কতক্ষণ যায়?\nA: সাধারণত ৫-৭ দিন।'}
                    value={form.faqsRaw}
                    onChange={(e) => set('faqsRaw', e.target.value)}
                  />
                </section>
              </div>
            )}

            {/* ───────── TAB: IMAGES ───────── */}
            {tab === 'images' && (
              <div>
                <SectionHeading hint="প্রথম ছবিটাই প্রোডাক্ট তালিকা ও ওয়েবসাইটে কভার ছবি হিসেবে দেখাবে">প্রোডাক্টের ছবি</SectionHeading>
                <ImageManager images={form.imgs} onChange={(v) => set('imgs', v)} />
              </div>
            )}
          </div>

          {/* ══ ফুটার (আটকে থাকে): এরর + বাতিল + সেভ ══ */}
          <div
            className="shrink-0 border-t border-border-base/70 bg-white px-5 pt-3.5"
            style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
          >
            {error && (
              <div className="mb-3 rounded-2xl border border-red-200/80 bg-red-50 px-4 py-2.5 font-body text-[12.5px] font-bold text-danger">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-12 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98]"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-light font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? (
                  'সেভ হচ্ছে...'
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    সেভ করুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {dupAsk && (
        <ConfirmDialog
          tone="brand"
          title="একই নামে প্রোডাক্ট আছে"
          message={
            <>
              <span className="font-extrabold text-ink">&ldquo;{form.name}&rdquo;</span> নামে একটি প্রোডাক্ট ইতিমধ্যে আছে। তবুও যোগ করবেন?
            </>
          }
          confirmLabel="হ্যাঁ, যোগ করুন"
          busy={saving}
          busyLabel="সেভ হচ্ছে..."
          onConfirm={async () => {
            setDupAsk(false);
            await handleSave(true);
          }}
          onCancel={() => setDupAsk(false)}
        />
      )}
    </>
  );
}
