// ফাইলের পাথ: components/guides/GuidePagesListModal.tsx
// [NEW] প্রোডাক্ট/ক্যাটাগরি লিস্টের "গাইড পেজ" বাটনে ক্লিক করলে এটা খোলে —
// এই প্রোডাক্ট/ক্যাটাগরির সব গাইড পেজ দেখায়, নতুন পেজ তৈরির ফর্মও এখানেই।

'use client';

import { useEffect, useState } from 'react';
import type { GuidePage, GuidePageType } from '@/types/guides';
import { GUIDE_PAGE_TYPE_LABELS, GUIDE_PAGE_SCOPE } from '@/types/guides';
import { listGuidePagesByProduct, listGuidePagesByCategory, createGuidePage } from '@/app/actions/guidePages';
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
  const [editing, setEditing] = useState<GuidePage | null>(null);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<GuidePageType>(scope === 'product' ? 'installation_guide' : 'pillar');
  const [newSlug, setNewSlug] = useState('');
  const [newH1Bn, setNewH1Bn] = useState('');
  const [newH1En, setNewH1En] = useState('');
  const [saving, setSaving] = useState(false);

  const availableTypes = (Object.keys(GUIDE_PAGE_SCOPE) as GuidePageType[]).filter((t) => GUIDE_PAGE_SCOPE[t] === scope);

  async function load() {
    const data = scope === 'product' ? await listGuidePagesByProduct(Number(entityId)) : await listGuidePagesByCategory(String(entityId));
    setPages(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    if (!newSlug.trim() || !newH1Bn.trim()) {
      showToast('স্লাগ আর টাইটেল (বাংলা) দিতে হবে');
      return;
    }
    setSaving(true);
    const res = await createGuidePage({
      page_type: newType,
      slug: newSlug,
      category_id: scope === 'category' ? String(entityId) : null,
      product_id: scope === 'product' ? Number(entityId) : null,
      h1_bn: newH1Bn,
      h1_en: newH1En || newH1Bn,
    });
    setSaving(false);
    if (!res.ok || !res.page) {
      showToast('❌ ' + (res.message || 'তৈরি ব্যর্থ'));
      return;
    }
    showToast('✅ নতুন পেজ তৈরি হয়েছে — এখন এডিট করুন');
    setCreating(false);
    setNewSlug('');
    setNewH1Bn('');
    setNewH1En('');
    await load();
    setEditing(res.page);
  }

  return (
    <>
      <div className="fixed inset-0 z-[105] flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:items-center sm:p-6">
        <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
        <div className="relative my-4 w-full max-w-lg rounded-brand bg-brand-surface p-5 shadow-sh3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-ink">গাইড পেজ — {entityLabel}</div>
              <div className="text-[11px] text-muted">{scope === 'product' ? 'এই প্রোডাক্টের' : 'এই ক্যাটাগরির'} SEO পেজগুলো</div>
            </div>
            <button onClick={onClose} className="rounded-md border border-border-base bg-white px-2.5 py-1.5 text-xs">বন্ধ করুন</button>
          </div>

          {pages === null && <div className="py-6 text-center text-sm text-muted">লোড হচ্ছে...</div>}

          {pages && pages.length === 0 && !creating && (
            <div className="rounded-lg border border-dashed border-border-base p-5 text-center text-[12.5px] text-muted">এখনো কোনো গাইড পেজ তৈরি হয়নি</div>
          )}

          {pages && pages.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {pages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setEditing(p)}
                  className="flex w-full items-center justify-between rounded-lg border border-border-base bg-white p-2.5 text-left transition-brand hover:border-brand-primary"
                >
                  <div>
                    <div className="text-[12.5px] font-semibold text-ink">{p.h1_bn}</div>
                    <div className="text-[10.5px] text-muted">
                      {GUIDE_PAGE_TYPE_LABELS[p.page_type].bn} · /guides/{p.slug}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${p.is_published ? 'bg-green-50 text-[#065F46]' : 'bg-amber-50 text-amber-700'}`}>
                    {p.is_published ? 'লাইভ' : 'ড্রাফট'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-brand bg-ink py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              + নতুন গাইড পেজ যোগ করুন
            </button>
          ) : (
            <div className="rounded-lg border border-border-base bg-white p-3">
              <div className="mb-2.5">
                <label className="mb-1 block text-[11px] font-semibold text-ink">পেজের ধরন</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value as GuidePageType)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]">
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>{GUIDE_PAGE_TYPE_LABELS[t].bn}</option>
                  ))}
                </select>
              </div>
              <div className="mb-2.5">
                <label className="mb-1 block text-[11px] font-semibold text-ink">URL Slug</label>
                <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="neon-light-bangladesh-guide" className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
              </div>
              <div className="mb-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-ink">টাইটেল (বাংলা)</label>
                  <input value={newH1Bn} onChange={(e) => setNewH1Bn(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-ink">টাইটেল (English)</label>
                  <input value={newH1En} onChange={(e) => setNewH1En(e.target.value)} className="w-full rounded-lg border border-border-base px-2.5 py-1.5 text-[12.5px]" />
                </div>
              </div>
              <div className="flex gap-2">
                <button disabled={saving} onClick={handleCreate} className="flex-1 rounded-brand bg-ink py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                  {saving ? 'তৈরি হচ্ছে...' : 'তৈরি করুন ও এডিট করুন'}
                </button>
                <button onClick={() => setCreating(false)} className="rounded-brand border border-border-base px-4 py-2 text-sm">বাতিল</button>
              </div>
            </div>
          )}
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
