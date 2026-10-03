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
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Field, FIELD_CLS, TEXTAREA_CLS } from '@/components/common/FormField';
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
  const [delAsk, setDelAsk] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    setDeleting(true);
    try {
      const res = await deleteGuidePage(page.id);
      if (!res.ok) {
        showToast('❌ ' + (res.message || 'ডিলিট ব্যর্থ'));
        setDelAsk(false);
        return;
      }
      showToast('🗑 মুছে ফেলা হয়েছে');
      onSaved();
    } finally {
      setDeleting(false);
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'paste', label: 'পেস্ট করে বসান' },
    { key: 'blocks', label: `ব্লক এডিট (${blocks.length})` },
    { key: 'meta', label: 'SEO মেটা' },
  ];

  return (
    <LinkablePagesProvider value={linkablePages}>
      <div
        className="animate-soft-fade-in fixed inset-0 z-[110] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="animate-sheet-up flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:max-h-[92dvh] md:rounded-[28px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)]">
          {/* ══ হেডার + ট্যাব (আটকে থাকে) ══ */}
          <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.12] to-white px-5 pb-3.5 pt-2.5 md:pt-5">
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 md:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-body text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">{page.page_type} এডিটর</div>
                <h3 className="mt-1 line-clamp-2 font-body text-[20px] font-black leading-snug tracking-tight text-ink">{page.h1_bn || 'গাইড পেজ'}</h3>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 font-body text-[11px] font-extrabold leading-none ${
                    page.is_published ? 'bg-emerald-50 text-[#065F46]' : 'bg-amber-50 text-[#92400E]'
                  }`}
                >
                  {page.is_published ? 'লাইভ' : 'ড্রাফট'}
                </span>
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
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`h-10 flex-1 rounded-full px-1 font-body text-[12.5px] font-extrabold transition-all duration-brand ${
                    tab === t.key ? 'bg-brand-light text-white shadow-[0_4px_12px_rgba(68,167,252,0.4)]' : 'text-muted hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ══ বডি (স্ক্রল হয়) ══ */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            {tab === 'paste' && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="font-body text-[12.5px] font-extrabold text-ink">SEO কনটেন্ট পেস্ট করুন</div>
                  <button
                    type="button"
                    onClick={() => setPasteText(GUIDE_PARSER_EXAMPLE)}
                    className="rounded-full border border-brand-light/40 bg-brand-light/10 px-3 py-1.5 font-body text-[11.5px] font-extrabold text-ink transition-all duration-brand active:scale-95"
                  >
                    উদাহরণ দেখুন
                  </button>
                </div>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={12}
                  placeholder="তোমার SEO কনটেন্ট .md ফাইলের পুরো টেক্সট এখানে পেস্ট করো..."
                  className={`${TEXTAREA_CLS} font-mono !text-[12px]`}
                />
                {blocks.length > 0 && (
                  <div className="mt-2.5 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-2.5 font-body text-[12px] font-bold text-[#92400E]">
                    পার্স করলে এখনকার {blocks.length}টা ব্লক সম্পূর্ণ replace হয়ে যাবে।
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleParse}
                  className="mt-3.5 h-12 w-full rounded-full bg-brand-light font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98]"
                >
                  পার্স করুন
                </button>
                {lastParse && (
                  <div className="mt-3.5 rounded-2xl border border-border-base/80 bg-surface-muted/60 px-4 py-3 font-body text-[12px] font-medium leading-relaxed text-muted">
                    {lastParse.stats.totalSections}টা সেকশনের মধ্যে {lastParse.stats.structuredSections}টা নির্দিষ্ট ব্লক-টাইপে (টেবিল/কার্ড/স্টেপ/চেকলিস্ট/FAQ) বসেছে,
                    বাকি {lastParse.stats.fallbackSections}টা সাধারণ টেক্সট ব্লক হিসেবে বসেছে — ওগুলো চাইলে &quot;ব্লক এডিট&quot; ট্যাবে গিয়ে অন্য কোনো ব্লক-টাইপে বদলে নিতে পারো।
                  </div>
                )}
              </div>
            )}

            {tab === 'blocks' && <GuideBlockListEditor blocks={blocks} onChange={setBlocks} />}

            {tab === 'meta' && (
              <div className="space-y-3.5">
                <Field label="URL Slug">
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} className={FIELD_CLS} />
                </Field>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <Field label="H1 (বাংলা)">
                    <input value={h1Bn} onChange={(e) => setH1Bn(e.target.value)} className={FIELD_CLS} />
                  </Field>
                  <Field label="H1 (English)">
                    <input value={h1En} onChange={(e) => setH1En(e.target.value)} className={FIELD_CLS} />
                  </Field>
                  <Field label="Meta Title (বাংলা)">
                    <input value={metaTitleBn} onChange={(e) => setMetaTitleBn(e.target.value)} className={FIELD_CLS} />
                  </Field>
                  <Field label="Meta Title (English)">
                    <input value={metaTitleEn} onChange={(e) => setMetaTitleEn(e.target.value)} className={FIELD_CLS} />
                  </Field>
                  <Field label="Meta Description (বাংলা)">
                    <textarea value={metaDescBn} onChange={(e) => setMetaDescBn(e.target.value)} rows={3} className={TEXTAREA_CLS} />
                  </Field>
                  <Field label="Meta Description (English)">
                    <textarea value={metaDescEn} onChange={(e) => setMetaDescEn(e.target.value)} rows={3} className={TEXTAREA_CLS} />
                  </Field>
                </div>
                <Field label="টার্গেট কিওয়ার্ড" hint="(কমা দিয়ে আলাদা)">
                  <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className={FIELD_CLS} />
                </Field>
              </div>
            )}

            <p className="mt-6 rounded-2xl bg-brand-light/[0.08] px-4 py-3 font-body text-[11.5px] font-medium leading-relaxed text-muted">
              সেভ বা পাবলিশ না করে বন্ধ করলে পরিবর্তন হারিয়ে যাবে। “পাবলিশ করুন” চাপলে বর্তমান সব পরিবর্তন নিজে থেকেই আগে সেভ হয়ে যায়।
            </p>
          </div>

          {/* ══ ফুটার (আটকে থাকে): সেভ · পাবলিশ · ডিলিট ══ */}
          <div
            className="shrink-0 border-t border-border-base/70 bg-white px-5 pt-3.5"
            style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="h-12 rounded-full bg-brand-light font-body text-[13.5px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? 'সেভ হচ্ছে...' : 'ড্রাফট সেভ করুন'}
              </button>
              <button
                type="button"
                disabled={publishing}
                onClick={handlePublishToggle}
                className={`h-12 rounded-full font-body text-[13.5px] font-black text-white transition-all duration-brand active:scale-[0.98] disabled:opacity-50 ${
                  page.is_published
                    ? 'bg-amber-500 shadow-[0_6px_18px_rgba(245,158,11,0.4)]'
                    : 'bg-success shadow-[0_6px_18px_rgba(16,185,129,0.4)]'
                }`}
              >
                {publishing ? '...' : page.is_published ? 'আনপাবলিশ করুন' : 'পাবলিশ করুন'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setDelAsk(true)}
              className="mt-2.5 h-10 w-full rounded-full border border-red-200/80 bg-red-50 font-body text-[12.5px] font-extrabold text-danger transition-all duration-brand hover:bg-red-100 active:scale-[0.98]"
            >
              পেজ ডিলিট
            </button>
          </div>
        </div>
      </div>

      {delAsk && (
        <ConfirmDialog
          title="পুরো পেজ মুছে দেবেন?"
          message="এই কাজ ফিরিয়ে আনা যাবে না।"
          confirmLabel="হ্যাঁ, ডিলিট করুন"
          busyLabel="ডিলিট হচ্ছে..."
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDelAsk(false)}
        />
      )}
    </LinkablePagesProvider>
  );
}
