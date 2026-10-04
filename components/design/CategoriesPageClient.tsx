'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CategoryOption } from '@/lib/constants/categories';
import { getCleanIcon } from '@/lib/constants/categories';
import { sanitizeSvgHtml } from '@/lib/sanitizeSvg';
import {
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '@/app/actions/categories';
import { useToast } from '@/components/admin/Toast';
import GuidePagesListModal from '@/components/guides/GuidePagesListModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Field, FIELD_CLS } from '@/components/common/FormField';

interface Props {
  categories: CategoryOption[];
  productCounts: Record<string, number>;
}

interface EditorState {
  mode: 'add' | 'edit';
  originalId?: string;
  name: string;
  id: string;
  icon: string;
}

export default function CategoriesPageClient({ categories, productCounts }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [guidePagesFor, setGuidePagesFor] = useState<CategoryOption | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryOption | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const touchDragging = useRef(false);

  // ব্যাকগ্রাউন্ড স্ক্রল লক যখন এডিটর খোলা থাকে
  useEffect(() => {
    if (!editor) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) setEditor(null);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [editor, saving]);

  function openAdd() {
    setEditor({ mode: 'add', name: '', id: '', icon: '' });
  }

  function openEdit(c: CategoryOption) {
    setEditor({ mode: 'edit', originalId: c.id, name: c.name, id: c.id, icon: c.icon });
  }

  async function handleSave() {
    if (!editor) return;
    if (!editor.name.trim() || !editor.id.trim()) {
      showToast('❌ ক্যাটাগরির নাম ও ID আবশ্যক');
      return;
    }

    setSaving(true);
    const res =
      editor.mode === 'add'
        ? await addCategory({ id: editor.id, name: editor.name, icon: editor.icon })
        : await updateCategory(editor.originalId!, { name: editor.name, icon: editor.icon });
    setSaving(false);

    if (!res.ok) {
      showToast(res.message || '❌ সেভ ব্যর্থ হয়েছে');
      return;
    }

    showToast(editor.mode === 'add' ? '✅ নতুন ক্যাটাগরি তৈরি হয়েছে' : '✅ ক্যাটাগরি আপডেট হয়েছে');
    setEditor(null);
    router.refresh();
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteCategory(deleteTarget.id);
    setDeleting(false);

    if (!res.ok) {
      showToast(res.message || '❌ ডিলিট ব্যর্থ হয়েছে');
      return;
    }

    showToast('🗑️ ক্যাটাগরি মুছে ফেলা হয়েছে');
    setDeleteTarget(null);
    router.refresh();
  }

  async function commitReorder(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    const ids = categories.map((c) => c.id);
    const moved = ids.splice(fromIdx, 1)[0];
    ids.splice(toIdx, 0, moved);
    await reorderCategories(ids);
    showToast('✅ ক্যাটাগরির ক্রম সাজানো হয়েছে');
    router.refresh();
  }

  return (
    <div>
      {/* ══ ১. টুলবার কার্ড: কাউন্ট, ড্র্যাগ নির্দেশনা ও যোগ করুন বাটন ══ */}
      <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light/15 text-brand-light sm:h-10 sm:w-10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <div>
              <div className="font-body text-[14px] font-black text-ink">ক্যাটাগরি ম্যানেজমেন্ট</div>
              <div className="font-body text-[11px] font-semibold text-muted">
                মোট {categories.length}টি ক্যাটাগরি · টেনে সাজান
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-brand-light px-6 font-body text-[14px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.4)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] sm:h-10 sm:w-auto sm:text-[12.5px]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-3.5 w-3.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            নতুন ক্যাটাগরি যোগ করুন
          </button>
        </div>
      </div>

      {/* ══ ২. ক্যাটাগরি তালিকা (ড্র্যাগ অ্যান্ড ড্রপ সহ) ══ */}
      <div className="space-y-2.5">
        {categories.map((c, i) => {
          const isOver = dragOverIdx === i;
          const count = productCounts[c.id] || 0;
          return (
            <article
              key={c.id}
              draggable
              onDragStart={() => {
                dragIdx.current = i;
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIdx(i);
              }}
              onDragLeave={() => setDragOverIdx((cur) => (cur === i ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverIdx(null);
                if (dragIdx.current !== null) commitReorder(dragIdx.current, i);
                dragIdx.current = null;
              }}
              onDragEnd={() => {
                dragIdx.current = null;
                setDragOverIdx(null);
              }}
              onTouchStart={() => {
                touchDragging.current = true;
                dragIdx.current = i;
              }}
              onTouchMove={(e) => {
                if (!touchDragging.current) return;
                const touch = e.touches[0];
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                const row = el?.closest('[data-cat-row]');
                if (row) setDragOverIdx(Number(row.getAttribute('data-cat-row')));
              }}
              onTouchEnd={() => {
                touchDragging.current = false;
                if (dragIdx.current !== null && dragOverIdx !== null) {
                  commitReorder(dragIdx.current, dragOverIdx);
                }
                dragIdx.current = null;
                setDragOverIdx(null);
              }}
              data-cat-row={i}
              className={`flex items-center gap-2.5 rounded-[22px] border bg-white p-3 shadow-sh1 transition-all duration-brand sm:gap-3.5 sm:p-3.5 ${
                isOver ? 'scale-[1.01] border-brand-light ring-2 ring-brand-light/30' : 'border-white/90'
              }`}
            >
              {/* ড্র্যাগ গ্রিপ হ্যান্ডেল */}
              <div
                title="ধরে টেনে সাজান"
                className="flex h-10 w-8 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-xl text-muted/60 transition-colors hover:text-brand-light active:cursor-grabbing"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <circle cx="9" cy="6" r="1.6" />
                  <circle cx="15" cy="6" r="1.6" />
                  <circle cx="9" cy="12" r="1.6" />
                  <circle cx="15" cy="12" r="1.6" />
                  <circle cx="9" cy="18" r="1.6" />
                  <circle cx="15" cy="18" r="1.6" />
                </svg>
              </div>

              {/* ক্যাটাগরি আইকন */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border-base/70 bg-brand-light/10 text-[22px]">
                {c.icon.startsWith('<svg') ? (
                  <span dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(c.icon) }} />
                ) : (
                  getCleanIcon(c)
                )}
              </div>

              {/* নাম, আইডি ও প্রোডাক্ট সংখ্যা */}
              <div className="min-w-0 flex-1">
                <h4 className="truncate font-body text-[14px] font-extrabold text-ink">{c.name}</h4>
                <div className="mt-0.5 truncate font-body text-[11px] font-semibold text-muted">
                  <span className="font-mono text-ink/60">#{c.id}</span>
                  {' · '}
                  <span className="font-bold text-brand-light">{count}টি প্রোডাক্ট</span>
                </div>
              </div>

              {/* অ্যাকশন বাটনসমূহ */}
              <div className="flex shrink-0 items-center gap-1.5">
                {/* প্রোডাক্ট পেজে লিঙ্ক */}
                <a
                  href={`/products?openAdd=${encodeURIComponent(c.id)}`}
                  className="hidden h-9 items-center gap-1 rounded-full border border-border-base/80 bg-white px-3 font-body text-[11.5px] font-extrabold text-ink transition-all duration-brand hover:border-brand-light hover:text-brand-light active:scale-95 sm:inline-flex"
                  title="এই ক্যাটাগরিতে নতুন প্রোডাক্ট যোগ করুন"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-3 w-3 text-brand-light">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  +প্রোডাক্ট
                </a>

                {/* গাইড পেজ বাটন */}
                <button
                  type="button"
                  onClick={() => setGuidePagesFor(c)}
                  className="hidden h-9 items-center gap-1 rounded-full border border-brand-light/40 bg-brand-light/10 px-3 font-body text-[11.5px] font-extrabold text-ink transition-all duration-brand hover:bg-brand-light hover:text-white active:scale-95 md:inline-flex"
                  title="গাইড পেজ পরিচালনা"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-brand-light">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  গাইড
                </button>

                {/* এডিট বাটন */}
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  title="ক্যাটাগরি এডিট করুন"
                  aria-label="ক্যাটাগরি এডিট করুন"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-white shadow-[0_3px_10px_rgba(68,167,252,0.36)] transition-all duration-brand hover:bg-brand-light-hover active:scale-90"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>

                {/* ডিলিট বাটন */}
                <button
                  type="button"
                  onClick={() => setDeleteTarget(c)}
                  title="ক্যাটাগরি মুছুন"
                  aria-label="ক্যাটাগরি মুছুন"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-danger transition-all duration-brand hover:bg-danger hover:text-white active:scale-90"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* ══ ৩. ক্যাটাগরি তৈরি / এডিট মডাল ══ */}
      {editor && (
        <div
          className="animate-soft-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
          onClick={(e) => e.target === e.currentTarget && !saving && setEditor(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="animate-sheet-up flex max-h-[94dvh] w-full max-w-[500px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:max-h-[90dvh] md:rounded-[28px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)]"
            style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* হেডার */}
            <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.12] to-white px-5 pb-3.5 pt-2.5 md:pt-4">
              <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 md:hidden" />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-body text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">
                    {editor.mode === 'add' ? 'নতুন ক্যাটাগরি' : 'ক্যাটাগরি এডিটর'}
                  </div>
                  <h3 className="mt-0.5 font-body text-[18px] font-black text-ink">
                    {editor.mode === 'add' ? 'ক্যাটাগরি তৈরি করুন' : 'ক্যাটাগরি সম্পাদনা'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  disabled={saving}
                  aria-label="বন্ধ করুন"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-sh1 transition-all duration-brand hover:bg-border-base active:scale-90 disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ফর্ম বডি */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              <Field label="ক্যাটাগরির নাম" required hint="(বাংলা বা ইংরেজি)">
                <input
                  type="text"
                  value={editor.name}
                  onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                  placeholder="যেমন: Gaming Accessories"
                  className={FIELD_CLS}
                  autoFocus
                />
              </Field>

              <Field
                label="ক্যাটাগরি ID"
                required
                hint="(ছোট হাতের ইংরেজি, কোনো স্পেস ছাড়া)"
                help={editor.mode === 'edit' ? 'আইডি একবার তৈরি হলে পরিবর্তন করা যায় না।' : undefined}
              >
                <input
                  type="text"
                  value={editor.id}
                  disabled={editor.mode === 'edit'}
                  onChange={(e) =>
                    setEditor({ ...editor, id: e.target.value.toLowerCase().replace(/\s/g, '') })
                  }
                  placeholder="যেমন: gaming"
                  className={`${FIELD_CLS} disabled:bg-surface-muted disabled:text-muted`}
                />
              </Field>

              <Field label="আইকন (Emoji বা SVG)" hint="(যেমন: 🎮 বা 💡)">
                <input
                  type="text"
                  value={editor.icon}
                  onChange={(e) => setEditor({ ...editor, icon: e.target.value })}
                  placeholder="🎮"
                  className={FIELD_CLS}
                />
                <div className="mt-2.5 flex items-center gap-3 rounded-2xl border border-border-base/80 bg-surface-muted/60 p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sh1">
                    {editor.icon.startsWith('<svg') ? '📦' : editor.icon || '📦'}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-body text-[13px] font-extrabold text-ink">
                      {editor.name || 'ক্যাটাগরির নাম প্রিভিউ'}
                    </div>
                    <div className="font-mono text-[10.5px] font-semibold text-muted">
                      ID: {editor.id || 'id-preview'}
                    </div>
                  </div>
                </div>
              </Field>
            </div>

            {/* ফুটার */}
            <div className="shrink-0 border-t border-border-base/70 px-5 pt-3">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  disabled={saving}
                  className="h-12 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98] disabled:opacity-50"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={saving || !editor.name.trim() || !editor.id.trim()}
                  onClick={handleSave}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-light font-body text-[13.5px] font-black text-white shadow-[0_6px_18px_rgba(68,167,252,0.42)] transition-all duration-brand hover:bg-brand-light-hover active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? (
                    'সেভ হচ্ছে...'
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {editor.mode === 'add' ? 'তৈরি করুন' : 'আপডেট করুন'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ ৪. গাইড পেজ লিস্ট মডাল ══ */}
      {guidePagesFor && (
        <GuidePagesListModal
          scope="category"
          entityId={guidePagesFor.id}
          entityLabel={guidePagesFor.name}
          onClose={() => setGuidePagesFor(null)}
        />
      )}

      {/* ══ ৫. সেন্ট্রাল কনফার্মেশন ডায়ালগ ══ */}
      {deleteTarget && (
        <ConfirmDialog
          title="ক্যাটাগরি মুছে ফেলবেন?"
          message={
            <>
              <span className="font-extrabold text-ink">&ldquo;{deleteTarget.name}&rdquo;</span> ক্যাটাগরি মুছে দিলে এর সাথে যুক্ত প্রোডাক্টগুলো অন্য ক্যাটাগরিতে সরাতে হতে পারে।
            </>
          }
          confirmLabel="হ্যাঁ, মুছে ফেলুন"
          busyLabel="মুছে ফেলা হচ্ছে..."
          busy={deleting}
          tone="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
