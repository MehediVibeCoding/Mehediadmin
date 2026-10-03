// ফাইলের পাথ: components/guides/GuidePagesListModal.tsx
// [REPLACE] প্রোডাক্ট/ক্যাটাগরি লিস্টের "গাইড পেজ" বাটনে ক্লিক করলে এটা খোলে —
// এই প্রোডাক্ট/ক্যাটাগরির সব গাইড পেজ দেখায়, নতুন পেজ তৈরির ফর্মও এখানেই।
// আগে পেজ-টাইপের লিস্ট কোডে হার্ডকোড করা ছিল (GUIDE_PAGE_TYPE_LABELS) — এখন
// guide_page_templates থেকে লাইভ লোড হয়, তাই নতুন টেমপ্লেট যোগ করলে এখানে
// কোনো কোড পরিবর্তন ছাড়াই দেখা যাবে। নতুন পেজ তৈরি করলে টেমপ্লেটের block_skeleton
// অটো-ফিল হয়ে আসে (দেখুন app/actions/guidePages.ts-এর createGuidePage)।
//
// [২০২৬-০৯ আপডেট] আগে এখানে স্লাগ + টাইটেল (বাংলা/English) — তিনটাই আগে থেকে
// টাইপ করা বাধ্যতামূলক ছিল, তৈরি করার আগেই। কিন্তু আসল SEO কনটেন্ট paste করলে
// GuideEditorModal-এর "পেস্ট করে বসান" ট্যাব (lib/guide-content-parser.ts) এমনিতেই
// H1/Slug/Meta — সব parse করে বসিয়ে দেয়, তাই এই ফর্মে আগে থেকে সেগুলো চাওয়াটা
// শুধু ডাবল-এন্ট্রি তৈরি করছিল। এখন থেকে শুধু টেমপ্লেট বেছে নিলেই হয় — slug একটা
// অস্থায়ী ইউনিক draft-id দিয়ে অটো-জেনারেট হয়, h1 সার্ভার-সাইড ডিফল্ট ('শিরোনাম দিন')
// পায় (দেখুন createGuidePage), এডিটর সরাসরি পেস্ট-ট্যাব খোলা অবস্থায় ওপেন হয়ে যায়।

'use client';

import { useEffect, useState } from 'react';
import type { GuidePage, GuidePageTemplate } from '@/types/guides';
import { guidePageUrlPath } from '@/types/guides';
import { listGuidePagesByProduct, listGuidePagesByCategory, createGuidePage } from '@/app/actions/guidePages';
import { listGuideTemplates } from '@/app/actions/guideTemplates';
import { useToast } from '@/components/admin/Toast';
import GuideEditorModal from './GuideEditorModal';

type Scope = 'product' | 'category';

export default function GuidePagesListModal({
  scope,
  entityId,
  entityLabel,
  onClose,
}: {
  scope: Scope;
  entityId: number | string;
  entityLabel: string;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [pages, setPages] = useState<GuidePage[] | null>(null);
  const [templates, setTemplates] = useState<GuidePageTemplate[] | null>(null);
  const [editing, setEditing] = useState<GuidePage | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTypeKey, setNewTypeKey] = useState<string>('');
  const [saving, setSaving] = useState(false);

  /** স্লাগ আপাতত অস্থায়ী — content paste করে parse করার সাথে সাথে আসল স্লাগ
   *  এটাকে ওভাররাইট করে দেয় (দেখুন GuideEditorModal-এর "পেস্ট করে বসান" ট্যাব)।
   *  শুধু DB-এর not-null/unique constraint সন্তুষ্ট করার জন্য একটা ইউনিক মান দরকার। */
  function generateDraftSlug(): string {
    return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const availableTemplates = (templates ?? []).filter((t) => t.is_active && t.scope === scope);

  async function load() {
    const [pageData, templateData] = await Promise.all([
      scope === 'product' ? listGuidePagesByProduct(Number(entityId)) : listGuidePagesByCategory(String(entityId)),
      listGuideTemplates(),
    ]);
    setPages(pageData);
    setTemplates(templateData);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!newTypeKey && availableTemplates.length > 0) setNewTypeKey(availableTemplates[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates]);

  function templateFor(pageType: string): GuidePageTemplate | undefined {
    return (templates ?? []).find((t) => t.key === pageType);
  }

  async function handleCreate() {
    if (!newTypeKey) {
      showToast('একটা টেমপ্লেট বেছে নিতে হবে');
      return;
    }
    setSaving(true);
    try {
      const res = await createGuidePage({
        page_type: newTypeKey,
        slug: generateDraftSlug(),
        category_id: scope === 'category' ? String(entityId) : null,
        product_id: scope === 'product' ? Number(entityId) : null,
        h1_bn: '',
        h1_en: '',
      });
      if (!res.ok || !res.page) {
        showToast('❌ ' + (res.message || 'তৈরি ব্যর্থ'));
        return;
      }
      setCreating(false);
      // ⚠️ [বাগফিক্স] আগে এখানে `await load()` করে পুরো লিস্ট আবার fetch করার পর
      // এডিটর খোলা হতো — এই অতিরিক্ত রাউন্ড-ট্রিপটাই "তৈরি করুন" চাপার পর এডিটর
      // খুলতে দেরি হওয়ার আসল কারণ ছিল। এখন নতুন পেজটা সরাসরি লোকাল লিস্টে যোগ করে
      // (optimistic update) সঙ্গে সঙ্গে এডিটর খুলে দেওয়া হচ্ছে — আলাদা fetch লাগছে না।
      setPages((prev) => (prev ? [...prev, res.page as GuidePage] : [res.page as GuidePage]));
      setEditing(res.page);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className="animate-soft-fade-in fixed inset-0 z-[105] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] sm:items-center sm:p-5"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="animate-sheet-up flex max-h-[92dvh] w-full max-w-[540px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] sm:rounded-[28px] sm:shadow-[0_24px_70px_rgba(26,26,26,0.28)]">
          {/* হেডার */}
          <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.12] to-white px-5 pb-4 pt-2.5 sm:pt-5">
            <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-body text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">গাইড পেজ</div>
                <h3 className="mt-1 line-clamp-2 font-body text-[20px] font-black leading-snug tracking-tight text-ink">{entityLabel}</h3>
                <p className="mt-1 font-body text-[12px] font-semibold text-muted">
                  {scope === 'product' ? 'এই প্রোডাক্টের' : 'এই ক্যাটাগরির'} SEO পেজগুলো
                </p>
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
          </div>

          {/* বডি */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            {pages === null && (
              <div className="py-8 text-center font-body text-[13px] font-semibold text-muted">লোড হচ্ছে...</div>
            )}

            {pages && pages.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-brand-light/40 bg-brand-light/[0.06] px-5 py-8 text-center font-body text-[13px] font-semibold text-muted">
                এখনো কোনো গাইড পেজ তৈরি হয়নি
              </div>
            )}

            {pages && pages.length > 0 && (
              <div className="space-y-2.5">
                {pages.map((p) => {
                  const t = templateFor(p.page_type);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setEditing(p)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border-base/80 border-l-[3.5px] border-l-brand-light bg-surface-muted/50 px-4 py-3 text-left transition-all duration-brand hover:bg-brand-light/10 active:scale-[0.99]"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-body text-[14px] font-extrabold text-ink">{p.h1_bn}</div>
                        <div className="mt-0.5 truncate font-body text-[11px] font-semibold text-muted">
                          {t?.name_bn ?? p.page_type} · {t ? guidePageUrlPath(p.slug, t.url_prefix) : `/${p.slug}`}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 font-body text-[11px] font-extrabold leading-none ${
                          p.is_published ? 'bg-emerald-50 text-[#065F46]' : 'bg-amber-50 text-[#92400E]'
                        }`}
                      >
                        {p.is_published ? 'লাইভ' : 'ড্রাফট'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ফুটার: নতুন পেজ তৈরি */}
          <div
            className="shrink-0 border-t border-border-base/70 bg-white px-5 pt-3.5"
            style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
          >
            {!creating ? (
              <button
                type="button"
                onClick={() => setCreating(true)}
                disabled={availableTemplates.length === 0}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-light font-body text-[13.5px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-3.5 w-3.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                টেমপ্লেট থেকে নতুন গাইড পেজ
              </button>
            ) : (
              <div>
                <label className="mb-1.5 block font-body text-[12.5px] font-extrabold text-ink">টেমপ্লেট বেছে নিন</label>
                <select
                  value={newTypeKey}
                  onChange={(e) => setNewTypeKey(e.target.value)}
                  className="select-chevron h-12 w-full appearance-none rounded-2xl border border-border-base/90 bg-white px-4 font-body text-[14px] font-semibold text-ink"
                >
                  {availableTemplates.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.name_bn}
                    </option>
                  ))}
                </select>
                <p className="mb-3 mt-2.5 font-body text-[11.5px] font-medium leading-snug text-muted">
                  পরের ধাপে সরাসরি এডিটরের &quot;পেস্ট করে বসান&quot; ট্যাব খুলবে — সেখানে কনটেন্ট পেস্ট করলেই URL Slug, টাইটেল, মেটা — সবকিছু নিজে থেকে বসে যাবে।
                </p>
                <div className="grid grid-cols-[1fr_2fr] gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="h-12 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98]"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleCreate}
                    className="h-12 rounded-full bg-brand-light font-body text-[13.5px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <GuideEditorModal
          page={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}
