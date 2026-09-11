// ফাইলের পাথ: components/guides/GuideEditorModal.tsx
// [NEW] একটা guide_pages রো-এর পুরো এডিটর — মেটা ফিল্ড (slug/title/description/keywords)
// + ব্লক লিস্ট (যোগ/মুছা/উপরে-নিচে সরানো, প্রতিটা এক্সপ্যান্ড করলে তার এডিটর ফর্ম) +
// সেভ ড্রাফট / পাবলিশ-আনপাবলিশ।

'use client';

import { useState } from 'react';
import type { GuideBlock, GuidePage } from '@/types/guides';
import { updateGuidePage, setGuidePagePublished, deleteGuidePage } from '@/app/actions/guidePages';
import { useToast } from '@/components/admin/Toast';
import { BlockEditorSwitch, BLOCK_TYPE_LABELS, createEmptyBlock } from './GuideBlockEditors';

const ALL_BLOCK_TYPES = Object.keys(BLOCK_TYPE_LABELS) as GuideBlock['type'][];

export default function GuideEditorModal({ page, onClose, onSaved }: { page: GuidePage; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [slug, setSlug] = useState(page.slug);
  const [metaTitleBn, setMetaTitleBn] = useState(page.meta_title_bn);
  const [metaTitleEn, setMetaTitleEn] = useState(page.meta_title_en);
  const [metaDescBn, setMetaDescBn] = useState(page.meta_description_bn);
  const [metaDescEn, setMetaDescEn] = useState(page.meta_description_en);
  const [h1Bn, setH1Bn] = useState(page.h1_bn);
  const [h1En, setH1En] = useState(page.h1_en);
  const [keywords, setKeywords] = useState(page.target_keywords.join(', '));
  const [blocks, setBlocks] = useState<GuideBlock[]>(page.blocks);
  const [openBlockId, setOpenBlockId] = useState<string | null>(blocks[0]?.id ?? null);
  const [addType, setAddType] = useState<GuideBlock['type']>('richText');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  function moveBlock(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  }

  function removeBlock(id: string) {
    if (!confirm('এই ব্লকটা মুছে দেবেন?')) return;
    setBlocks(blocks.filter((b) => b.id !== id));
  }

  function addBlock() {
    const b = createEmptyBlock(addType);
    setBlocks([...blocks, b]);
    setOpenBlockId(b.id);
  }

  function updateBlock(id: string, next: GuideBlock) {
    setBlocks(blocks.map((b) => (b.id === id ? next : b)));
  }

  async function handleSave() {
    setSaving(true);
    const res = await updateGuidePage({
      id: page.id,
      slug,
      meta_title_bn: metaTitleBn,
      meta_title_en: metaTitleEn,
      meta_description_bn: metaDescBn,
      meta_description_en: metaDescEn,
      h1_bn: h1Bn,
      h1_en: h1En,
      target_keywords: keywords.split(',').map((s) => s.trim()).filter(Boolean),
      blocks,
    });
    setSaving(false);
    if (!res.ok) {
      showToast('❌ ' + (res.message || 'সেভ ব্যর্থ'));
      return;
    }
    showToast('✅ সেভ হয়েছে');
    onSaved();
  }

  async function handlePublishToggle() {
    setPublishing(true);
    const res = await setGuidePagePublished(page.id, !page.is_published);
    setPublishing(false);
    if (!res.ok) {
      showToast('❌ ' + (res.message || 'ব্যর্থ'));
      return;
    }
    showToast(page.is_published ? 'আনপাবলিশ করা হয়েছে' : '✅ পাবলিশ করা হয়েছে');
    onSaved();
  }

  async function handleDelete() {
    if (!confirm('এই পুরো পেজটা মুছে দেবেন? এই কাজ ফিরিয়ে আনা যাবে না।')) return;
    const res = await deleteGuidePage(page.id);
    if (!res.ok) {
      showToast('❌ ' + (res.message || 'ডিলিট ব্যর্থ'));
      return;
    }
    showToast('🗑 মুছে ফেলা হয়েছে');
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-6">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative my-2 w-full max-w-3xl rounded-brand bg-brand-surface p-5 shadow-sh3">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-ink">{BLOCK_TYPE_LABELS[page.page_type as keyof typeof BLOCK_TYPE_LABELS] ?? page.page_type} এডিটর</div>
            <div className="text-[11px] text-muted">
              স্ট্যাটাস: {page.is_published ? <span className="font-bold text-[#065F46]">লাইভ</span> : <span className="font-bold text-amber-700">ড্রাফট</span>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-md border border-border-base bg-white px-2.5 py-1.5 text-xs">
            বন্ধ করুন
          </button>
        </div>

        {/* ── মেটা ফিল্ড ── */}
        <div className="mb-4 rounded-lg border border-border-base bg-white p-3">
          <div className="mb-2 text-[11px] font-bold text-ink">SEO মেটা</div>
          <div className="mb-2.5">
            <label className="mb-1 block text-[11px] font-semibold text-ink">URL Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
            <div className="mt-1 text-[10.5px] text-muted">/guides/{slug || '...'}</div>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink">H1 (বাংলা)</label>
              <input value={h1Bn} onChange={(e) => setH1Bn(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink">H1 (English)</label>
              <input value={h1En} onChange={(e) => setH1En(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink">Meta Title (বাংলা)</label>
              <input value={metaTitleBn} onChange={(e) => setMetaTitleBn(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink">Meta Title (English)</label>
              <input value={metaTitleEn} onChange={(e) => setMetaTitleEn(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink">Meta Description (বাংলা)</label>
              <textarea value={metaDescBn} onChange={(e) => setMetaDescBn(e.target.value)} rows={2} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-ink">Meta Description (English)</label>
              <textarea value={metaDescEn} onChange={(e) => setMetaDescEn(e.target.value)} rows={2} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
            </div>
          </div>
          <div className="mt-2.5">
            <label className="mb-1 block text-[11px] font-semibold text-ink">টার্গেট কিওয়ার্ড (কমা দিয়ে আলাদা)</label>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
          </div>
        </div>

        {/* ── ব্লক লিস্ট ── */}
        <div className="mb-3 text-[11px] font-bold text-ink">পেজের ব্লক ({blocks.length}টা)</div>
        <div className="mb-3 space-y-2">
          {blocks.map((b, i) => {
            const open = openBlockId === b.id;
            return (
              <div key={b.id} className="rounded-lg border border-border-base bg-white">
                <div className="flex items-center justify-between gap-2 p-2.5">
                  <button type="button" onClick={() => setOpenBlockId(open ? null : b.id)} className="flex-1 text-left text-[12.5px] font-semibold text-ink">
                    {i + 1}. {BLOCK_TYPE_LABELS[b.type]}
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" disabled={i === 0} onClick={() => moveBlock(i, -1)} className="rounded border border-border-base px-1.5 py-0.5 text-[10px] disabled:opacity-30">↑</button>
                    <button type="button" disabled={i === blocks.length - 1} onClick={() => moveBlock(i, 1)} className="rounded border border-border-base px-1.5 py-0.5 text-[10px] disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => removeBlock(b.id)} className="rounded border border-[#FECACA] bg-[#FEE2E2] px-1.5 py-0.5 text-[10px] text-[#991B1B]">মুছুন</button>
                  </div>
                </div>
                {open && (
                  <div className="border-t border-border-base p-2.5">
                    <BlockEditorSwitch block={b} onChange={(next) => updateBlock(b.id, next)} />
                  </div>
                )}
              </div>
            );
          })}
          {blocks.length === 0 && <div className="rounded-lg border border-dashed border-border-base p-4 text-center text-[11.5px] text-muted">এখনো কোনো ব্লক যোগ করা হয়নি</div>}
        </div>

        <div className="mb-5 flex items-center gap-2 rounded-lg border border-border-base bg-white p-2.5">
          <select value={addType} onChange={(e) => setAddType(e.target.value as GuideBlock['type'])} className="flex-1 rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]">
            {ALL_BLOCK_TYPES.map((t) => (
              <option key={t} value={t}>{BLOCK_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <button type="button" onClick={addBlock} className="rounded-lg bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">
            + ব্লক যোগ করুন
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button disabled={saving} onClick={handleSave} className="flex-1 rounded-brand bg-ink py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90 disabled:opacity-50">
            {saving ? 'সেভ হচ্ছে...' : '💾 ড্রাফট সেভ করুন'}
          </button>
          <button disabled={publishing} onClick={handlePublishToggle} className={`flex-1 rounded-brand py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90 disabled:opacity-50 ${page.is_published ? 'bg-amber-600' : 'bg-[#065F46]'}`}>
            {publishing ? '...' : page.is_published ? 'আনপাবলিশ করুন' : '🚀 পাবলিশ করুন'}
          </button>
          <button onClick={handleDelete} className="rounded-brand border border-[#FECACA] bg-[#FEE2E2] px-4 py-2.5 text-sm font-semibold text-[#991B1B] hover:bg-[#FECACA]">
            পেজ ডিলিট
          </button>
        </div>
        <div className="mt-2 text-[10.5px] text-muted">সেভ না করে বন্ধ করলে পরিবর্তন হারিয়ে যাবে। পাবলিশ করার আগে আগে ড্রাফট সেভ করে নেওয়া ভালো।</div>
      </div>
    </div>
  );
}
