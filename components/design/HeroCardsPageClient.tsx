'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HeroCard } from '@/lib/constants/heroCards';
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

interface Props {
  cards: HeroCard[];
  categories: CategoryOption[];
}

interface EditorState {
  index: number; // -1 মানে নতুন কার্ড (legacy _cathEditIdx কনভেনশন)
  label: string;
  catId: string;
  img: string;
}

export default function HeroCardsPageClient({ cards, categories }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openAdd() {
    if (cards.length >= HERO_CARDS_MAX) {
      showToast(`মূল সাইটে সর্বোচ্চ ${HERO_CARDS_MAX}টা কার্ড সাপোর্ট করে — আগে একটা মুছুন`);
      return;
    }
    setEditor({ index: -1, label: '', catId: '', img: '' });
  }

  function openEdit(i: number) {
    const c = cards[i];
    setEditor({ index: i, label: c.label || '', catId: c.catId || '', img: c.img || '' });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await uploadHeroCardImage(formData);
    setUploading(false);
    if (!res.ok || !res.url) {
      showToast(res.message || 'আপলোড ব্যর্থ হয়েছে');
      return;
    }
    setEditor({ ...editor, img: res.url });
  }

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    const input = { label: editor.label, catId: editor.catId, img: editor.img };
    const res = editor.index === -1 ? await addHeroCard(input) : await updateHeroCard(editor.index, input);
    setSaving(false);

    if (!res.ok) {
      showToast(res.message || 'ব্যর্থ হয়েছে');
      return;
    }
    showToast(editor.index === -1 ? '✅ নতুন কার্ড যোগ হয়েছে!' : '✅ কার্ড আপডেট হয়েছে!');
    setEditor(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!editor || editor.index === -1) return;
    if (!confirm('এই কার্ড মুছে ফেলবেন?')) return;
    const res = await deleteHeroCard(editor.index);
    if (!res.ok) {
      showToast(res.message || 'ব্যর্থ হয়েছে');
      return;
    }
    showToast('🗑️ কার্ড মুছে ফেলা হয়েছে');
    setEditor(null);
    router.refresh();
  }

  async function handleReset() {
    if (!confirm(`মেইন ওয়েবসাইটের ${HERO_CARDS_MAX}টি ডিফল্ট কার্ডে রিসেট করবেন? বর্তমান পরিবর্তনগুলো মুছে যাবে।`)) return;
    await resetHeroCardsToDefault();
    showToast(`✅ ${HERO_CARDS_MAX}টি ডিফল্ট কার্ডে রিসেট হয়েছে!`);
    router.refresh();
  }

  const selectedCatLabel = (catId: string) => {
    if (!catId) return 'সব পণ্য';
    const c = categories.find((x) => x.id === catId);
    return c ? c.name : catId;
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl text-ink">🖼️ হিরো সেকশন কার্ড</h1>
          <p className="mt-0.5 text-sm text-muted">হোমপেজের স্লাইডার কার্ডগুলো ম্যানেজ করুন</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-brand border border-border-base px-3.5 py-2 text-sm font-medium text-ink transition-brand hover:border-brand-primary"
          >
            ↩️ ডিফল্টে রিসেট
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="rounded-brand bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90"
          >
            + নতুন কার্ড যোগ করুন
          </button>
        </div>
      </div>

      <div className="rounded-brand bg-brand-surface p-4 shadow-sh1">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold text-ink">বর্তমান কার্ডসমূহ</div>
          <div className="text-xs text-muted">
            {cards.length}টি কার্ড (সর্বোচ্চ {HERO_CARDS_MAX})
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="p-10 text-center text-muted">
            <div className="mb-2.5 text-4xl">🃏</div>
            <div className="text-sm font-semibold">কোনো কার্ড নেই</div>
            <div className="mt-1 text-xs">উপরের বাটন থেকে নতুন কার্ড যোগ করুন</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4">
            {cards.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openEdit(i)}
                className="group relative overflow-hidden rounded-2xl text-left shadow-sh1 transition-brand hover:shadow-sh2"
              >
                <div className="relative h-40 overflow-hidden" style={{ background: c.bg || '#111' }}>
                  {c.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%] text-3xl">
                      {c.emoji || '📦'}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-black/60" />
                  <span className="absolute bottom-2.5 left-2 right-2 inline-flex max-w-full items-center gap-1 truncate rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur">
                    {c.label || 'Shop Now'} →
                  </span>
                  <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                    ✏️ এডিট
                  </span>
                  <span className="absolute left-2 top-2 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    #{i + 1}
                  </span>
                </div>
                <div className="border-t border-border-base bg-white px-2.5 py-2">
                  <div className="truncate text-[11px] font-bold text-ink">{c.label || '—'}</div>
                  <div className="mt-0.5 text-[10px] text-muted">{selectedCatLabel(c.catId)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {editor && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="fixed inset-0" onClick={() => setEditor(null)} aria-hidden="true" />
          <div className="relative my-6 w-full max-w-md rounded-brand bg-brand-surface p-5 shadow-sh3">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-bold text-ink">
                {editor.index === -1 ? 'নতুন কার্ড যোগ করুন' : `কার্ড এডিট করুন #${editor.index + 1}`}
              </div>
              <button type="button" onClick={() => setEditor(null)} className="text-lg text-muted hover:text-ink">
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold text-ink">📸 ছবি</label>
              {editor.img ? (
                <div className="relative mb-2 overflow-hidden rounded-lg border border-border-base">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={editor.img} alt="preview" className="block max-h-40 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setEditor({ ...editor, img: '' })}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="mb-2 rounded-lg border border-dashed border-border-base p-3 text-center text-[11px] text-muted">
                  ছবি নেই — নিচে URL দিন অথবা আপলোড করুন
                </div>
              )}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={editor.img.startsWith('http') || editor.img.startsWith('/') ? editor.img : ''}
                  onChange={(e) => setEditor({ ...editor, img: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 rounded-lg border border-border-base px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 rounded-lg border border-border-base bg-white px-3 py-2 text-xs font-medium text-ink transition-brand hover:border-brand-primary disabled:opacity-50"
                >
                  {uploading ? '...' : '📤 আপলোড'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold text-ink">কার্ডের নিচে বাটন টেক্সট</label>
              <input
                type="text"
                value={editor.label}
                onChange={(e) => setEditor({ ...editor, label: e.target.value })}
                placeholder="যেমন: Shop Now  বা  Explore"
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
              />
              <div className="mt-1 text-[11px] text-muted">এই টেক্সটটা কার্ডের নিচে &quot;→&quot; সহ দেখাবে</div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold text-ink">🗂️ ক্লিক করলে কোন ক্যাটাগরিতে যাবে?</label>
              <select
                value={editor.catId}
                onChange={(e) => setEditor({ ...editor, catId: e.target.value })}
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
              >
                <option value="">-- সব পণ্য দেখাবে (ফাঁকা) --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCleanIcon(c)} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <div className="mb-2 text-xs font-bold text-ink">লাইভ প্রিভিউ</div>
              <div className="flex justify-center">
                <div className="relative h-52 w-32 overflow-hidden rounded-2xl bg-black shadow-sh2">
                  {editor.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editor.img} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl">🖼️</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent from-55% to-black/65" />
                  <span className="absolute bottom-3 left-2.5 right-2.5 inline-flex items-center gap-1 truncate rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur">
                    {(editor.label || 'SHOP NOW').toUpperCase()} →
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="rounded-brand bg-ink py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'সেভ হচ্ছে...' : '💾 কার্ড সেভ করুন'}
              </button>
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="rounded-brand border border-border-base py-2.5 text-sm font-medium text-ink transition-brand hover:border-brand-primary"
              >
                বাতিল
              </button>
              {editor.index !== -1 && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-brand border border-[#FECACA] bg-[#FEE2E2] py-2.5 text-sm font-semibold text-[#991B1B] transition-brand hover:bg-[#FECACA]"
                >
                  🗑️ এই কার্ড মুছে ফেলুন
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
