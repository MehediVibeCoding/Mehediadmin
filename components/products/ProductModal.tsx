'use client';

import { useState } from 'react';
import type { Product } from '@/types';
import type { CategoryOption } from '@/lib/constants/categories';
import type { ProductFormInput } from '@/app/actions/products';
import { createProduct, updateProduct } from '@/app/actions/products';
import CategoryPicker from './CategoryPicker';
import ImageManager from './ImageManager';

type Tab = 'basic' | 'layout' | 'images';

interface Props {
  categories: CategoryOption[];
  editingProduct?: Product;
  initialState: ProductFormInput;
  titleOverride?: string; // যেমন AI Parser থেকে খোলা হলে '🤖 AI Parse — প্রোডাক্ট যোগ করুন'
  onClose: () => void;
  onSaved: (product: Product) => void;
}

export default function ProductModal({ categories, editingProduct, initialState, titleOverride, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>('basic');
  const [form, setForm] = useState<ProductFormInput>(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof ProductFormInput>(key: K, val: ProductFormInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave(forceDuplicate = false) {
    setError('');
    if (!form.name.trim() || !form.price) {
      setError('প্রোডাক্টের নাম ও মূল্য আবশ্যক');
      return;
    }
    setSaving(true);
    try {
      const result = editingProduct
        ? await updateProduct(editingProduct.id, form)
        : await createProduct(form, { forceDuplicate });

      if (result.status === 'duplicate') {
        const ok = window.confirm(
          `"${form.name}" নামে একটি প্রোডাক্ট ইতিমধ্যে আছে। তবুও যোগ করবেন?`
        );
        if (ok) await handleSave(true);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-[780px] overflow-y-auto rounded-brand bg-brand-surface p-6 shadow-sh3">
        <h3 className="mb-4 font-bold text-lg text-ink">
          {titleOverride || (editingProduct ? 'প্রোডাক্ট এডিট করুন' : 'প্রোডাক্ট যোগ করুন')}
        </h3>

        {/* Tabs */}
        <div className="mb-4 flex gap-1.5 border-b border-border-base">
          {([
            ['basic', '📋 Basic Info'],
            ['layout', '🗂️ Full Layout'],
            ['images', '🖼️ Images'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-2 text-sm font-semibold transition-brand ${
                tab === id ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</div>
        )}

        {/* TAB: BASIC */}
        {tab === 'basic' && (
          <div className="rounded-lg bg-[#F9F7FF] p-3.5">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#7C3AED]">
              🔝 TOP SECTION — Name → Price → Warranty → Buttons
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">প্রোডাক্টের নাম *</label>
                <input
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="সম্পূর্ণ নাম লিখুন"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">
                  প্রোডাক্টের বাংলা নাম{' '}
                  <span className="text-[11px] font-normal text-muted">(বাংলায় সার্চ করলে এই নাম দিয়েই মিলবে)</span>
                </label>
                <input
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="যেমন: নিয়ন লাইট"
                  value={form.nameBn}
                  onChange={(e) => set('nameBn', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-3">
              <CategoryPicker categories={categories} value={form.cats} onChange={(v) => set('cats', v)} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">বর্তমান মূল্য (৳) *</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="1490"
                  value={form.price || ''}
                  onChange={(e) => set('price', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">পুরনো মূল্য (৳)</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="1800"
                  value={form.old || ''}
                  onChange={(e) => set('old', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">স্টক পরিমাণ</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="20"
                  value={form.stock || ''}
                  onChange={(e) => set('stock', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">
                  প্রফিট (৳) <span className="text-[11px] font-normal text-muted">(শুধু এডমিন দেখবে)</span>
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="200"
                  value={form.profit || ''}
                  onChange={(e) => set('profit', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Badge</label>
                <input
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="HOT / NEW / SALE"
                  value={form.badge}
                  onChange={(e) => set('badge', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">ছাড়ের ব্যাজ রং</label>
                <select
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  value={form.discountColor}
                  onChange={(e) => set('discountColor', e.target.value as '' | 'green')}
                >
                  <option value="">ডিফল্ট (কমলা)</option>
                  <option value="green">সবুজ (স্পেশাল ডিসকাউন্ট)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">ওয়ারেন্টি</label>
                <input
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="৬ মাস রিপ্লেসমেন্ট"
                  value={form.warranty}
                  onChange={(e) => set('warranty', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">রেটিং (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="4.5"
                  value={form.rating || ''}
                  onChange={(e) => set('rating', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: FULL LAYOUT — এখন থেকে সিরিয়াল সরাসরি SEO কনটেন্ট টেমপ্লেটের
            ক্রম অনুযায়ী: SEO মেটা → এক নজরে → বিবরণ → ফিচারস → স্পেসিফিকেশন →
            পাওয়ার তথ্য → Packaging → অতিরিক্ত তথ্য → FAQ। প্রতিটা লেবেল
            ইচ্ছাকৃতভাবে মেইন সাইটে যে নামে সেকশনটা দেখা যায় সেই নামেই রাখা হলো,
            যাতে এডমিন আর সাইটের মধ্যে কোনো বিভ্রান্তি না থাকে। */}
        {tab === 'layout' && (
          <>
            <div className="rounded-lg bg-[#F5F3FF] p-3.5">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#5B21B6]">
                🔎 SEO মেটা তথ্য{' '}
                <span className="text-[11px] font-normal normal-case text-muted">
                  (সবগুলো ঐচ্ছিক — খালি রাখলে সাইট নিজে থেকেই নাম/দাম দিয়ে বানিয়ে নেবে)
                </span>
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold text-ink">H1 (পেজের মূল হেডিং)</label>
                <input
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="খালি রাখলে প্রোডাক্টের নামই দেখাবে"
                  value={form.h1}
                  onChange={(e) => set('h1', e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold text-ink">Meta Title</label>
                <input
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="যেমন: প্রোডাক্টের নাম | Vangcur"
                  value={form.metaTitle}
                  onChange={(e) => set('metaTitle', e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold text-ink">Meta Description</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="সার্চ রেজাল্টে যে ছোট বিবরণ দেখাবে..."
                  value={form.metaDescription}
                  onChange={(e) => set('metaDescription', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">
                  Open Graph Description <span className="text-[11px] font-normal text-muted">(সোশ্যাল শেয়ার প্রিভিউ)</span>
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="খালি রাখলে Meta Description-ই ব্যবহার হবে"
                  value={form.ogDescription}
                  onChange={(e) => set('ogDescription', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-3.5 rounded-lg bg-[#EFF6FF] p-3.5">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#1D4ED8]">
                🔍 স্পেসিফিকেশন এক নজরে{' '}
                <span className="text-[11px] font-normal normal-case text-muted">(প্রোডাক্ট পেজে ছোট পিল/ব্যাজ আকারে দেখায়)</span>
              </div>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                placeholder={'5 Meter (16.4 Feet) • App + Remote Control • 16M+ Colour Options • Bluetooth • 6 Months Replacement Warranty'}
                value={form.quickSpecsText}
                onChange={(e) => set('quickSpecsText', e.target.value)}
              />
              <div className="mt-1.5 text-[11px] text-muted">
                &ldquo;•&rdquo; দিয়ে আলাদা করে যত ইচ্ছা পয়েন্ট লিখুন — প্রতিটা আলাদা পিল হিসেবে দেখাবে।
              </div>
            </div>

            <div className="mt-3.5 rounded-lg bg-[#F0FDF4] p-3.5">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#065F46]">
                📄 প্রোডাক্টের বিস্তারিত বিবরণ → প্রধান ফিচারস → কারিগরি স্পেসিফিকেশন → FAQ
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold text-ink">
                  প্রোডাক্টের বিস্তারিত বিবরণ <span className="text-[11px] font-normal text-muted">(একাধিক প্যারা লিখতে চাইলে মাঝে একটা ফাঁকা লাইন দিন)</span>
                </label>
                <textarea
                  rows={5}
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder={'প্রথম প্যারা...\n\nদ্বিতীয় প্যারা...'}
                  value={form.desc}
                  onChange={(e) => set('desc', e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold text-ink">
                  প্রধান ফিচারস{' '}
                  <span className="text-[11px] font-normal text-muted">
                    (প্রতিটা ফিচার আলাদা প্যারায় — চাইলে শুধু এক লাইনের বুলেট, অথবা আইকন+টাইটেল লাইন তারপর বিবরণ লাইন)
                  </span>
                </label>
                <textarea
                  rows={5}
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder={'🌈 16 Million+ Colour Options\nআপনার পছন্দের রং বেছে নিন, অথবা নিজের custom shade তৈরি করুন।\n\n📱 App + Remote, দুটোই একসাথে\nফোন হাতের কাছে না থাকলে Remote দিয়ে কাজ চালান।'}
                  value={form.featuresRaw}
                  onChange={(e) => set('featuresRaw', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">
                  কারিগরি স্পেসিফিকেশন <span className="text-[11px] font-normal text-muted">(Key: Value, প্রতিটি লাইনে)</span>
                </label>
                <textarea
                  rows={5}
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder={'Brand: GearUP\nModel: NRGB50\nLength: 5 Meter\nConnectivity: Bluetooth'}
                  value={form.techSpecsRaw}
                  onChange={(e) => set('techSpecsRaw', e.target.value)}
                />
                <div className="mt-1.5 text-[11px] text-muted">
                  &ldquo;Power Adapter:&rdquo; / &ldquo;Connection:&rdquo; দিয়ে শুরু কোনো লাইন এখানে থাকলে সেটা এখানে না বসিয়ে নিচের &ldquo;পাওয়ার / কানেকশন তথ্য&rdquo; বক্সে বসান।
                </div>
              </div>
            </div>

            {/* Power Info + Packaging Content — দুটোই সম্পূর্ণ optional, খালি
                রাখলে প্রোডাক্ট পেজে সংশ্লিষ্ট অংশ একদম দেখাবে না। মেইন সাইটে
                Power Info থাকলে তার ঠিক পরে, না থাকলে স্পেসিফিকেশন টেবিলের
                পরে Packaging Content বক্স দেখায় (কোনো অতিরিক্ত সেটিং লাগে না)। */}
            <div className="mt-3.5 rounded-lg bg-[#FFF7ED] p-3.5">
              <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[#9A3412]">
                🔌 পাওয়ার / কানেকশন তথ্য{' '}
                <span className="text-[11px] font-normal normal-case text-muted">
                  (ঐচ্ছিক — যে প্রোডাক্টে power adapter নেই, সেটার জন্য খালি রাখুন)
                </span>
              </div>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                placeholder={'Power Adapter: Input AC 100–240V, 50/60Hz → Output DC 24V, 1A → 2-pin plug\nConnection flow: Wall Socket → Adapter → Inline Switch → Neon Light'}
                value={form.powerInfo}
                onChange={(e) => set('powerInfo', e.target.value)}
              />
            </div>

            <div className="mt-3.5 rounded-lg bg-[#ECFEFF] p-3.5">
              <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[#155E75]">
                📦 Packaging Content{' '}
                <span className="text-[11px] font-normal normal-case text-muted">(ঐচ্ছিক — বক্সে কী কী থাকবে, প্রতি লাইনে একটা আইটেম)</span>
              </div>
              <textarea
                rows={4}
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                placeholder={'1 × GearUP NRGB50 5 Meter RGB Neon Light\n1 × 24V 1A DC Power Adapter\n1 × Remote Control'}
                value={form.packagingContent}
                onChange={(e) => set('packagingContent', e.target.value)}
              />
            </div>

            <div className="mt-3.5 rounded-lg bg-[#F0F9FF] p-3.5">
              <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[#0C4A6E]">
                🗂️ অতিরিক্ত তথ্য{' '}
                <span className="text-[11px] font-normal normal-case text-muted">
                  (ঐচ্ছিক — &ldquo;অতিরিক্ত তথ্য&rdquo; ট্যাবে আলাদা কার্ড হিসেবে দেখায়, যতগুলো ইচ্ছা যোগ করুন)
                </span>
              </div>
              <textarea
                rows={5}
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                placeholder={'### কোথায় ব্যবহার করবেন\nBedroom, gaming room, study table...\n\n### 5 Meter আসলে কতটা\nপ্রায় 16.4 Feet, মেপে নেওয়া ভালো...'}
                value={form.infoBoxesRaw}
                onChange={(e) => set('infoBoxesRaw', e.target.value)}
              />
              <div className="mt-1.5 text-[11px] text-muted">
                প্রতিটা বক্স <code className="rounded bg-white px-1 py-0.5">### শিরোনাম</code> দিয়ে শুরু করুন, তারপরের লাইনগুলো সেই বক্সের বডি — নতুন বক্সের আগে একটা ফাঁকা লাইন দিন।
              </div>
            </div>

            <div className="mt-3.5 rounded-lg bg-[#FDF2F8] p-3.5">
              <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[#9D174D]">
                ❓ কমন প্রশ্নোত্তর (FAQ) <span className="text-[11px] font-normal normal-case text-muted">(Q: ... A: ... ফরম্যাটে)</span>
              </div>
              <textarea
                rows={5}
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                placeholder={'Q: পানিতে ব্যবহার করা যাবে?\nA: হ্যাঁ, IP68 রেটিং আছে।\n\nQ: চার্জ কতক্ষণ যায়?\nA: সাধারণত ৫-৭ দিন।'}
                value={form.faqsRaw}
                onChange={(e) => set('faqsRaw', e.target.value)}
              />
            </div>
          </>
        )}

        {/* TAB: IMAGES */}
        {tab === 'images' && <ImageManager images={form.imgs} onChange={(v) => set('imgs', v)} />}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-brand border border-border-base py-2.5 text-sm font-medium text-ink transition-brand hover:border-brand-primary"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="flex-[2] rounded-brand bg-ink py-2.5 text-sm font-semibold text-white transition-brand disabled:opacity-60"
          >
            {saving ? 'সেভ হচ্ছে...' : '💾 সেভ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
