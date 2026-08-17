'use client';

import { useState } from 'react';
import type { Product } from '@/types';
import type { CategoryOption } from '@/lib/constants/categories';
import type { ProductFormInput } from '@/app/actions/products';
import { createProduct, updateProduct } from '@/app/actions/products';
import CategoryPicker from './CategoryPicker';
import SpecEditor from './SpecEditor';
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
        <h3 className="mb-4 font-display text-lg text-ink">
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

        {/* TAB: FULL LAYOUT */}
        {tab === 'layout' && (
          <>
            <div className="rounded-lg bg-[#F0FDF4] p-3.5">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#065F46]">
                ⬇️ BOTTOM SECTION — Description → Features → Tech Specs → FAQs
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold text-ink">Description</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder="প্রোডাক্টের বিস্তারিত বিবরণ..."
                  value={form.desc}
                  onChange={(e) => set('desc', e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold text-ink">
                  Features <span className="text-[11px] font-normal text-muted">(প্রতিটি লাইনে একটি)</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder={'1.96 inch AMOLED display\nIP68 waterproof\nHeart rate + SpO2 + BP monitor\nBluetooth call feature'}
                  value={form.featuresRaw}
                  onChange={(e) => set('featuresRaw', e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold text-ink">
                  Technical Specs <span className="text-[11px] font-normal text-muted">(Key: Value, প্রতিটি লাইনে)</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder={'Display: 1.96 AMOLED\nBattery: 300mAh\nWater Resistance: IP68\nHealth: HR + SpO2 + BP'}
                  value={form.techSpecsRaw}
                  onChange={(e) => set('techSpecsRaw', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">
                  Product FAQ <span className="text-[11px] font-normal text-muted">(Q: ... A: ... format)</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
                  placeholder={'Q: পানিতে ব্যবহার করা যাবে?\nA: হ্যাঁ, IP68 রেটিং আছে।\n\nQ: চার্জ কতক্ষণ যায়?\nA: সাধারণত ৫-৭ দিন।'}
                  value={form.faqsRaw}
                  onChange={(e) => set('faqsRaw', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-3.5 rounded-lg bg-[#EFF6FF] p-3.5">
              <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[#1D4ED8]">
                🔍 স্পেসিফিকেশন এক নজরে{' '}
                <span className="text-[11px] font-normal normal-case text-muted">(প্রোডাক্ট কার্ড ও পেজে দেখায়)</span>
              </div>
              <SpecEditor rows={form.quickSpecs} onChange={(v) => set('quickSpecs', v)} />
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
