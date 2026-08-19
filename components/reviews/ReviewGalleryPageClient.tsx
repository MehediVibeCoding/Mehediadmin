'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Review } from '@/types';
import { addReview, updateReview, deleteReview, uploadReviewImage } from '@/app/actions/reviews';
import { useToast } from '@/components/admin/Toast';

interface Props {
  reviews: Review[];
}

interface EditorState {
  id: number | null; // null মানে নতুন ছবি (legacy reviewEditId খালি)
  imageUrl: string;
}

export default function ReviewGalleryPageClient({ reviews }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openAdd() {
    setEditor({ id: null, imageUrl: '' });
  }

  function openEdit(r: Review) {
    setEditor({ id: r.id, imageUrl: r.image_url || '' });
  }

  function closeEditor() {
    setEditor(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await uploadReviewImage(formData);
    setUploading(false);
    if (!res.ok || !res.url) {
      showToast(res.message || 'আপলোড ব্যর্থ হয়েছে');
      return;
    }
    setEditor({ ...editor, imageUrl: res.url });
  }

  async function handleSave() {
    if (!editor) return;
    setSaving(true);
    const res = editor.id === null ? await addReview(editor.imageUrl) : await updateReview(editor.id, editor.imageUrl);
    setSaving(false);
    if (!res.ok) {
      showToast(res.message || 'ব্যর্থ হয়েছে');
      return;
    }
    showToast(editor.id === null ? '✅ নতুন রিভিউ যোগ হয়েছে!' : '✅ রিভিউ আপডেট হয়েছে!');
    closeEditor();
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm('এই রিভিউটি মুছে ফেলবেন?')) return;
    const res = await deleteReview(id);
    if (!res.ok) {
      showToast(res.message || 'ব্যর্থ হয়েছে');
      return;
    }
    showToast('✅ রিভিউ মুছে ফেলা হয়েছে');
    router.refresh();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl text-ink">🖼️ রিভিউ গ্যালারি ম্যানেজমেন্ট</h1>
          <p className="mt-0.5 text-sm text-muted">গ্রাহকদের আনবক্সিং ও চ্যাট রিভিউ স্ক্রিনশট পরিচালনা করুন</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-brand bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90"
        >
          + নতুন রিভিউ যোগ করুন
        </button>
      </div>

      <div className="rounded-brand bg-brand-surface p-4 shadow-sh1">
        <div className="mb-4 text-xs text-muted">{reviews.length}টি ছবি</div>

        {reviews.length === 0 ? (
          <div className="p-10 text-center text-muted">
            <div className="mb-2.5 text-4xl">🖼️</div>
            <div className="text-sm font-semibold">কোনো রিভিউ নেই</div>
            <div className="mt-1 text-xs">উপরের বাটন থেকে রিভিউ যোগ করুন</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="overflow-hidden rounded-xl border border-border-base bg-white shadow-sh1 transition-brand hover:shadow-sh2"
              >
                <div
                  className="relative aspect-[4/3] cursor-zoom-in bg-surface-muted"
                  onClick={() => r.image_url && setPreviewUrl(r.image_url)}
                >
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.image_url}
                      alt="Review"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.parentElement!.innerHTML =
                          '<div class="flex items-center justify-center h-full text-xs text-[#9CA3AF] p-5 text-center">ছবি লোড হয়নি</div>';
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-[#D1D5DB]">🖼️</div>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-[11px] text-muted">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('bn-BD') : ''}
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="flex-1 rounded-lg border border-border-base py-1.5 text-center text-xs font-medium text-ink transition-brand hover:border-brand-primary"
                    >
                      ✏️ এডিট
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-2.5 py-1.5 text-xs font-medium text-[#991B1B] transition-brand hover:bg-[#FECACA]"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {editor && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="fixed inset-0" onClick={closeEditor} aria-hidden="true" />
          <div className="relative my-6 w-full max-w-md rounded-brand bg-brand-surface p-5 shadow-sh3">
            <h3 className="mb-4 text-sm font-bold text-ink">
              {editor.id === null ? 'নতুন ছবি যোগ করুন' : 'ছবি এডিট করুন'}
            </h3>

            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-bold text-ink">ছবির URL</label>
              <input
                type="text"
                value={editor.imageUrl}
                onChange={(e) => setEditor({ ...editor, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-border-base px-3 py-2 text-sm"
              />
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-semibold text-muted">অথবা ফাইল আপলোড করুন</label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1 text-xs"
                />
                {uploading && <span className="text-xs text-muted">আপলোড হচ্ছে...</span>}
              </div>
            </div>

            {editor.imageUrl && (
              <div className="mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={editor.imageUrl}
                  alt="Preview"
                  className="max-h-[200px] max-w-full rounded-[10px] border border-border-base"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-brand border border-border-base px-4 py-2.5 text-sm font-medium text-ink transition-brand hover:border-brand-primary"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="rounded-brand bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-brand hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'সেভ হচ্ছে...' : '💾 সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[110] flex cursor-zoom-out items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="block max-h-[90vh] max-w-[90vw] rounded-xl" />
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              className="absolute -right-3.5 -top-3.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-base shadow-sh2"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
