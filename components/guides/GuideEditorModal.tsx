// ফাইলের পাথ: components/guides/GuideEditorModal.tsx
// [REPLACE] একটা guide_pages রো-এর পুরো এডিটর — এখন ৩ ট্যাবে ভাগ করা:
//   ১) পেস্ট করে বসান — raw SEO content পেস্ট করলে guide-content-parser.ts দিয়ে
//      পার্স হয়ে ব্লক + মেটা ফিল্ড অটো-ফিল হয়ে যায় (কোনো external AI/API লাগে না)
//   ২) ব্লক এডিট করুন — আগের ম্যানুয়াল ব্লক এডিটর (GuideBlockListEditor, এখন শেয়ার্ড)
//   ৩) SEO মেটা — slug/title/description/keywords
// পেস্ট ট্যাবে "পার্স করুন" চাপলে বর্তমান ব্লক-লিস্ট সম্পূর্ণ replace হয়ে যায় —
// তাই আগে থেকে ম্যানুয়াল এডিট করা থাকলে সেটা হারিয়ে যাবে, এই সতর্কতা UI-তেই আছে।

'use client';

import { useEffect, useState } from 'react';
import type { GuideBlock, GuidePage } from '@/types/guides';
import { updateGuidePage, setGuidePagePublished, deleteGuidePage, listAllGuidePagesForLinking } from '@/app/actions/guidePages';
import { useToast } from '@/components/admin/Toast';
import { GuideBlockListEditor } from './GuideBlockEditors';
import { LinkablePagesProvider } from './GuideFieldPrimitives';
import { parseGuideContent, GUIDE_PARSER_EXAMPLE, type ParsedGuideContent } from '@/lib/guide-content-parser';

type Tab = 'paste' | 'blocks' | 'meta';

export default function GuideEditorModal({ page, onClose, onSaved }: { page: GuidePage; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>(page.blocks.length === 0 ? 'paste' : 'blocks');
  const [linkablePages, setLinkablePages] = useState<Awaited<ReturnType<typeof listAllGuidePagesForLinking>>>([]);

  const [slug, setSlug] = useState(page.slug);
  const [metaTitleBn, setMetaTitleBn] = useState(page.meta_title_bn);
  const [metaTitleEn, setMetaTitleEn] = useState(page.meta_title_en);
  const [metaDescBn, setMetaDescBn] = useState(page.meta_description_bn);
  const [metaDescEn, setMetaDescEn] = useState(page.meta_description_en);
  const [h1Bn, setH1Bn] = useState(page.h1_bn);
  const [h1En, setH1En] = useState(page.h1_en);
  const [keywords, setKeywords] = useState(page.target_keywords.join(', '));
  const [blocks, setBlocks] = useState<GuideBlock[]>(page.blocks);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [pasteText, setPasteText] = useState('');
  const [lastParse, setLastParse] = useState<ParsedGuideContent | null>(null);

  useEffect(() => {
    listAllGuidePagesForLinking().then(setLinkablePages);
  }, []);

  function currentPayload() {
    return {
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
    };
  }

  function handleParse() {
    if (!pasteText.trim()) {
      showToast('আগে কনটেন্ট পেস্ট করুন');
      return;
    }
    const result = parseGuideContent(pasteText);
    setLastParse(result);

    // মেটা ফিল্ড অটো-ফিল — raw content এক-ভাষার লেখা হওয়ায় bn/en দুটোতেই একই
    // টেক্সট বসে; en আলাদা করে ইংরেজিতে লেখা/টিউন করা "SEO মেটা" ট্যাবের কাজ
    if (result.meta.h1) { setH1Bn(result.meta.h1); setH1En(result.meta.h1); }
    if (result.meta.metaTitle) { setMetaTitleBn(result.meta.metaTitle); setMetaTitleEn(result.meta.metaTitle); }
    if (result.meta.metaDescription) { setMetaDescBn(result.meta.metaDescription); setMetaDescEn(result.meta.metaDescription); }
    if (result.meta.slug) setSlug(result.meta.slug);
    if (result.meta.keywords.length > 0) setKeywords(result.meta.keywords.join(', '));

    setBlocks(result.blocks);
    showToast(`✅ পার্স হয়েছে — ${result.blocks.length}টা ব্লক তৈরি হয়েছে, এখন "ব্লক এডিট করুন" ট্যাবে গিয়ে দেখে নিন`);
    setTab('blocks');
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await updateGuidePage(currentPayload());
      if (!res.ok) {
        showToast('❌ ' + (res.message || 'সেভ ব্যর্থ'));
        return;
      }
      showToast('✅ সেভ হয়েছে');
      onSaved();
    } catch (err) {
      // ⚠️ [বাগফিক্স] আগে try/catch ছিল না — এখানে কোনো unexpected এরর/টাইমআউট হলে
      // setSaving(false) কখনো কল হতো না, বাটন চিরস্থায়ীভাবে "..." দেখাতে থাকত
      showToast('❌ অপ্রত্যাশিত এরর: ' + (err instanceof Error ? err.message : 'আবার চেষ্টা করুন'));
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishToggle() {
    setPublishing(true);
    try {
      const saveRes = await updateGuidePage(currentPayload());
      if (!saveRes.ok) {
        showToast('❌ সেভ ব্যর্থ হয়েছে, তাই পাবলিশ করা হয়নি: ' + (saveRes.message || ''));
        return;
      }
      const res = await setGuidePagePublished(page.id, !page.is_published);
      if (!res.ok) {
        showToast('❌ ' + (res.message || 'ব্যর্থ'));
        return;
      }
      showToast(page.is_published ? 'আনপাবলিশ করা হয়েছে' : '✅ সেভ + পাবলিশ করা হয়েছে');
      onSaved();
    } catch (err) {
      // ⚠️ [বাগফিক্স] উপরের মতোই — try/catch/finally ছাড়া এরর হলে বাটন আটকে থাকত
      showToast('❌ অপ্রত্যাশিত এরর: ' + (err instanceof Error ? err.message : 'আবার চেষ্টা করুন'));
    } finally {
      setPublishing(false);
    }
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

  const TABS: { key: Tab; label: string }[] = [
    { key: 'paste', label: '📋 পেস্ট করে বসান' },
    { key: 'blocks', label: `🧱 ব্লক এডিট করুন (${blocks.length})` },
    { key: 'meta', label: '🔍 SEO মেটা' },
  ];

  return (
    <LinkablePagesProvider value={linkablePages}>
      <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:p-6">
        <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
        <div className="relative my-2 w-full max-w-3xl rounded-brand bg-brand-surface p-5 shadow-sh3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-ink">{page.page_type} এডিটর</div>
              <div className="text-[11px] text-muted">
                {page.h1_bn} · স্ট্যাটাস: {page.is_published ? <span className="font-bold text-[#065F46]">লাইভ</span> : <span className="font-bold text-amber-700">ড্রাফট</span>}
              </div>
            </div>
            <button onClick={onClose} className="rounded-md border border-border-base bg-white px-2.5 py-1.5 text-xs">
              বন্ধ করুন
            </button>
          </div>

          <div className="mb-4 flex gap-1.5 rounded-lg bg-black/5 p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex-1 rounded-md py-2 text-[12.5px] font-semibold transition-brand ${
                  tab === t.key ? 'bg-white text-ink shadow-xs' : 'text-muted hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'paste' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-bold text-ink">SEO কনটেন্ট পেস্ট করুন</div>
                <button type="button" onClick={() => setPasteText(GUIDE_PARSER_EXAMPLE)} className="text-[11px] font-semibold text-brand-light underline">
                  উদাহরণ দেখুন
                </button>
              </div>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={12}
                placeholder="তোমার SEO কনটেন্ট .md ফাইলের পুরো টেক্সট এখানে পেস্ট করো..."
                className="w-full rounded-lg border border-border-base bg-white px-3 py-2 font-mono text-[12px]"
              />
              {blocks.length > 0 && (
                <div className="mt-2 rounded-md bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
                  ⚠️ পার্স করলে এখনকার {blocks.length}টা ব্লক সম্পূর্ণ replace হয়ে যাবে।
                </div>
              )}
              <button
                type="button"
                onClick={handleParse}
                className="mt-3 w-full rounded-brand bg-ink py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                পার্স করুন
              </button>
              {lastParse && (
                <div className="mt-3 rounded-lg border border-border-base bg-white p-3 text-[11.5px] text-muted">
                  {lastParse.stats.totalSections}টা সেকশনের মধ্যে {lastParse.stats.structuredSections}টা নির্দিষ্ট ব্লক-টাইপে (টেবিল/কার্ড/স্টেপ/চেকলিস্ট/FAQ) বসেছে,
                  বাকি {lastParse.stats.fallbackSections}টা সাধারণ টেক্সট ব্লক হিসেবে বসেছে — ওগুলো চাইলে &quot;ব্লক এডিট করুন&quot; ট্যাবে গিয়ে অন্য কোনো ব্লক-টাইপে বদলে নিতে পারো।
                </div>
              )}
            </div>
          )}

          {tab === 'blocks' && <GuideBlockListEditor blocks={blocks} onChange={setBlocks} />}

          {tab === 'meta' && (
            <div className="rounded-lg border border-border-base bg-white p-3">
              <div className="mb-2.5">
                <label className="mb-1 block text-[11px] font-semibold text-ink">URL Slug</label>
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
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
          )}

          <div className="mt-5 flex flex-wrap gap-2">
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
          <div className="mt-2 text-[10.5px] text-muted">সেভ বা পাবলিশ না করে বন্ধ করলে পরিবর্তন হারিয়ে যাবে। “পাবলিশ করুন” চাপলে বর্তমান সব পরিবর্তন নিজে থেকেই আগে সেভ হয়ে যায়।</div>
        </div>
      </div>
    </LinkablePagesProvider>
  );
}
