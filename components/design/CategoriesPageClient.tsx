'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CategoryOption } from '@/lib/constants/categories';
import { getCleanIcon } from '@/lib/constants/categories';
import { sanitizeSvgHtml } from '@/lib/sanitizeSvg';
import { addCategory, updateCategory, deleteCategory, reorderCategories } from '@/app/actions/categories';
import { useToast } from '@/components/admin/Toast';

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
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const touchDragging = useRef(false);

  function openAdd() {
    setEditor({ mode: 'add', name: '', id: '', icon: '' });
  }

  function openEdit(c: CategoryOption) {
    setEditor({ mode: 'edit', originalId: c.id, name: c.name, id: c.id, icon: c.icon });
  }

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    const res =
      editor.mode === 'add'
        ? await addCategory({ id: editor.id, name: editor.name, icon: editor.icon })
        : await updateCategory(editor.originalId!, { name: editor.name, icon: editor.icon });
    setSaving(false);

    if (!res.ok) {
      showToast(res.message || 'ব্যর্থ হয়েছে');
      return;
    }
    showToast(editor.mode === 'add' ? '✅ নতুন ক্যাটাগরি যোগ হয়েছে!' : '✅ ক্যাটাগরি আপডেট হয়েছে!');
    setEditor(null);
    router.refresh();
  }

  async function handleDelete(c: CategoryOption) {
    if (!confirm('এই ক্যাটাগরি মুছে দিবেন?')) return;
    const res = await deleteCategory(c.id);
    if (!res.ok) {
      showToast(res.message || 'ব্যর্থ হয়েছে');
      return;
    }
    showToast('🗑️ ক্যাটাগরি মুছে গেছে');
    router.refresh();
  }

  async function commitReorder(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    const ids = categories.map((c) => c.id);
    const moved = ids.splice(fromIdx, 1)[0];
    ids.splice(toIdx, 0, moved);
    await reorderCategories(ids);
    showToast('✅ ক্যাটাগরি সাজানো হয়েছে ও সেভ হয়েছে!');
    router.refresh();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-xl text-ink">ক্যাটাগরি ম্যানেজমেন্ট</h1>
          <p className="mt-0.5 text-sm text-muted">ক্যাটাগরি যোগ করুন, সম্পাদনা করুন</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-brand bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90"
        >
          + নতুন ক্যাটাগরি যোগ করুন
        </button>
      </div>

      <div className="rounded-brand bg-brand-surface p-4 shadow-sh1">
        <div className="mb-3">
          <div className="text-sm font-bold text-ink">বর্তমান ক্যাটাগরি সমূহ</div>
          <div className="text-xs text-muted">এই ক্যাটাগরিগুলো ওয়েবসাইটের কার্ড ও ন্যাভে দেখা যাবে</div>
        </div>

        <div className="flex flex-col gap-1">
          {categories.map((c, i) => (
            <div
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
              className={`mb-1 flex items-center gap-3 rounded-lg border p-3 transition-brand ${
                dragOverIdx === i ? 'border-brand-primary' : 'border-border-base bg-surface-muted'
              }`}
            >
              <span
                className="shrink-0 cursor-grab select-none text-lg text-muted"
                title="ড্র্যাগ করে সাজান"
              >
                ⠿
              </span>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[22px]">
                {c.icon.startsWith('<svg') ? (
                  <span dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(c.icon) }} />
                ) : (
                  getCleanIcon(c)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-ink">{c.name}</div>
                <div className="text-[11px] text-muted">
                  ID: {c.id} · <span className="font-semibold text-info">{productCounts[c.id] || 0} টি প্রোডাক্ট</span>
                </div>
              </div>
              <a
                href={`/products?openAdd=${encodeURIComponent(c.id)}`}
                className="shrink-0 rounded-md border border-border-base bg-white px-2.5 py-1.5 text-xs font-medium text-ink transition-brand hover:border-brand-primary"
              >
                + প্রোডাক্ট
              </a>
              <button
                type="button"
                onClick={() => openEdit(c)}
                className="shrink-0 rounded-md border border-border-base bg-white p-1.5 text-ink transition-brand hover:border-brand-primary"
                title="এডিট করুন"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={() => handleDelete(c)}
                className="shrink-0 rounded-md border border-[#FECACA] bg-[#FEE2E2] p-1.5 text-[#991B1B] transition-brand hover:bg-[#FECACA]"
                title="মুছে ফেলুন"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {editor && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="fixed inset-0" onClick={() => setEditor(null)} aria-hidden="true" />
          <div className="relative my-6 w-full max-w-md rounded-brand bg-brand-surface p-5 shadow-sh3">
            <div className="mb-4 text-sm font-bold text-ink">
              {editor.mode === 'add' ? 'নতুন ক্যাটাগরি যোগ করুন' : 'ক্যাটাগরি এডিট করুন'}
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-ink">
                ক্যাটাগরির নাম <span className="text-muted">(বাংলা বা ইংরেজি)</span>
              </label>
              <input
                type="text"
                value={editor.name}
                onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                placeholder="যেমন: Gaming Accessories"
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-ink">
                ID <span className="text-muted">(ছোট হাতে, কোনো স্পেস নয়)</span>
              </label>
              <input
                type="text"
                value={editor.id}
                disabled={editor.mode === 'edit'}
                onChange={(e) => setEditor({ ...editor, id: e.target.value.toLowerCase().replace(/\s/g, '') })}
                placeholder="যেমন: gaming"
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm disabled:bg-surface-muted disabled:text-muted"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold text-ink">আইকন (Emoji)</label>
              <input
                type="text"
                value={editor.icon}
                onChange={(e) => setEditor({ ...editor, icon: e.target.value })}
                placeholder="🎮"
                className="w-full rounded-lg border border-border-base px-3 py-2 text-lg"
              />
              <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-border-base bg-surface-muted p-2.5">
                <span className="text-2xl">{editor.icon.startsWith('<svg') ? '📦' : editor.icon || '📦'}</span>
                <span className="text-[13px] font-semibold text-ink">{editor.name || 'ক্যাটাগরির নাম'}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="flex-1 rounded-brand bg-ink py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'সেভ হচ্ছে...' : '💾 সেভ করুন'}
              </button>
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="flex-1 rounded-brand border border-border-base py-2.5 text-sm font-medium text-ink transition-brand hover:border-brand-primary"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
