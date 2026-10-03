'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Review } from '@/types';
import {
  addReview,
  updateReview,
  deleteReview,
  uploadReviewImage,
  toggleReviewActive,
} from '@/app/actions/reviews';
import { useToast } from '@/components/admin/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Field, FIELD_CLS } from '@/components/common/FormField';

interface Props {
  reviews: Review[];
}

interface EditorState {
  id: number | null; // null মানে নতুন রিভিউ ছবি
  imageUrl: string;
}

export default function ReviewGalleryPageClient({ reviews }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ব্যাকগ্রাউন্ড স্ক্রল লক (এডিটর বা প্রিভিউ খোলা থাকলে)
  useEffect(() => {
    if (!editor && !previewUrl) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) {
        setEditor(null);
        setPreviewUrl(null);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [editor, previewUrl, saving]);

  function openAdd() {
    setEditor({ id: null, imageUrl: '' });
  }

  function openEdit(r: Review) {
    setEditor({ id: r.id, imageUrl: r.image_url || '' });
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
      showToast(res.message || '❌ ছবি আপলোড ব্যর্থ হয়েছে');
      return;
    }
    setEditor({ ...editor, imageUrl: res.url });
    showToast('✅ ছবি সফলভাবে আপলোড হয়েছে');
  }

  async function handleSave() {
    if (!editor) return;
    if (!editor.imageUrl.trim()) {
      showToast('❌ ছবির লিংক দিন অথবা ফাইল আপলোড করুন');
      return;
    }

    setSaving(true);
    const res =
      editor.id === null
        ? await addReview(editor.imageUrl)
        : await updateReview(editor.id, editor.imageUrl);
    setSaving(false);

    if (!res.ok) {
      showToast(res.message || '❌ সেভ ব্যর্থ হয়েছে');
      return;
    }

    showToast(editor.id === null ? '✅ নতুন রিভিউ ছবি যোগ হয়েছে' : '✅ রিভিউ ছবি আপডেট হয়েছে');
    setEditor(null);
    router.refresh();
  }

  async function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    setDeleting(true);
    const res = await deleteReview(deleteTargetId);
    setDeleting(false);

    if (!res.ok) {
      showToast(res.message || '❌ ডিলিট ব্যর্থ হয়েছে');
      return;
    }

    showToast('🗑️ রিভিউ ছবি মুছে ফেলা হয়েছে');
    setDeleteTargetId(null);
    router.refresh();
  }

  async function handleToggleActive(r: Review) {
    const res = await toggleReviewActive(r.id, !r.is_active);
    if (!res.ok) {
      showToast(res.message || '❌ স্ট্যাটাস পরিবর্তন ব্যর্থ');
      return;
    }
    showToast(r.is_active ? '🙈 ড্রাফট করা হয়েছে (লুকানো)' : '✅ ওয়েবসাইটে পাবলিশ করা হয়েছে');
    router.refresh();
  }

  return (
    <div>
      {/* ══ ১. টুলবার কার্ড: কাউন্ট ও নতুন রিভিউ বাটন ══ */}
      <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light/15 text-brand-light">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </span>
            <div>
              <div className="font-body text-[14px] font-black text-ink">রিভিউ গ্যালারি</div>
              <div className="font-body text-[11px] font-semibold text-muted">
                মোট {reviews.length}টি আনবক্সিং ও চ্যাট স্ক্রিনশট
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
            নতুন রিভিউ ছবি যোগ করুন
          </button>
        </div>
      </div>

      {/* ══ ২. রিভিউ ইমেজ গ্রিড ও খালি অবস্থা ══ */}
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 text-center shadow-sh1">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/15 text-brand-light">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </span>
          <span className="font-body text-[14px] font-extrabold text-ink">কোনো রিভিউ ছবি নেই</span>
          <span className="font-body text-[12px] font-medium text-muted">উপরের বাটন চেপে নতুন রিভিউ ছবি যোগ করুন</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {reviews.map((r) => (
            <article
              key={r.id}
              className={`flex flex-col overflow-hidden rounded-[22px] border bg-white shadow-sh1 transition-all duration-brand ${
                r.is_active ? 'border-white/90' : 'border-dashed border-border-base/90 opacity-60'
              }`}
            >
              {/* ছবির প্রিভিউ ফ্রেম (ক্লিক করলে ফুলস্ক্রিন জুম) */}
              <div
                className="relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden bg-surface-muted"
                onClick={() => r.image_url && setPreviewUrl(r.image_url)}
                title="বড় করে দেখতে ক্লিক করুন"
              >
                {!r.is_active && (
                  <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-ink/75 px-2 py-0.5 font-body text-[9.5px] font-extrabold text-white backdrop-blur-sm">
                    ড্রাফট (লুকানো)
                  </span>
                )}

                {r.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.image_url}
                    alt="রিভিউ স্ক্রিনশট"
                    className="h-full w-full object-cover transition-transform duration-brand hover:scale-105"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl text-muted/40">
                    🖼️
                  </div>
                )}
              </div>

              {/* কার্ড ফুটার: তারিখ ও অ্যাকশন বাটন */}
              <div className="flex flex-1 flex-col justify-between p-3">
                <span className="font-body text-[10.5px] font-semibold text-muted">
                  {r.created_at
                    ? new Date(r.created_at).toLocaleDateString('bn-BD', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </span>

                <div className="mt-2.5 flex items-center gap-1.5">
                  {/* ড্রাফট/পাবলিশ টগল */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(r)}
                    title={r.is_active ? 'লুকিয়ে রাখুন (ড্রাফট)' : 'ওয়েবসাইটে পাবলিশ করুন'}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-brand active:scale-90 ${
                      r.is_active
                        ? 'border-border-base/80 bg-surface-muted text-muted hover:border-brand-light hover:text-ink'
                        : 'border-emerald-200/80 bg-emerald-50 text-success hover:bg-emerald-100'
                    }`}
                  >
                    {r.is_active ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>

                  {/* এডিট বাটন */}
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="flex h-9 flex-1 items-center justify-center gap-1 rounded-full border border-brand-light/40 bg-brand-light/10 font-body text-[11.5px] font-extrabold text-ink transition-all duration-brand hover:bg-brand-light hover:text-white active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-brand-light">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    এডিট
                  </button>

                  {/* ডিলিট বাটন */}
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(r.id)}
                    title="ছবি মুছে ফেলুন"
                    aria-label="ছবি মুছে ফেলুন"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-danger transition-all duration-brand hover:bg-danger hover:text-white active:scale-90"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ══ ৩. এডিটর মডাল (মোবাইলে বটম-শীট, ডেস্কটপে সেন্টার্ড) ══ */}
      {editor && (
        <div
          className="animate-soft-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
          onClick={(e) => e.target === e.currentTarget && !saving && !uploading && setEditor(null)}
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
                    {editor.id === null ? 'নতুন রিভিউ' : 'রিভিউ এডিটর'}
                  </div>
                  <h3 className="mt-0.5 font-body text-[18px] font-black text-ink">
                    {editor.id === null ? 'নতুন রিভিউ ছবি যোগ করুন' : 'ছবি এডিট করুন'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  disabled={saving || uploading}
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
              {/* ছবির URL */}
              <Field label="ছবির সরাসরি লিংক (URL)" hint="(Cloudinary বা যেকোনো পাবলিক লিংক)">
                <input
                  type="text"
                  value={editor.imageUrl}
                  onChange={(e) => setEditor({ ...editor, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className={FIELD_CLS}
                />
              </Field>

              {/* ফাইল আপলোড এলাকা */}
              <div>
                <label className="mb-1.5 block font-body text-[12px] font-extrabold text-ink">
                  অথবা ডিভাইস থেকে ফাইল আপলোড করুন
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-light/50 bg-brand-light/[0.08] font-body text-[13px] font-extrabold text-ink transition-all duration-brand hover:bg-brand-light/15 active:scale-[0.98] disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-brand-light">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {uploading ? 'ছবি আপলোড হচ্ছে...' : 'ডিভাইস থেকে ছবি বেছে নিন'}
                </button>
              </div>

              {/* লাইভ ছবির প্রিভিউ */}
              {editor.imageUrl && (
                <div className="overflow-hidden rounded-2xl border border-border-base/80 bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={editor.imageUrl}
                    alt="প্রিভিউ"
                    className="max-h-[220px] w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* ফুটার */}
            <div className="shrink-0 border-t border-border-base/70 px-5 pt-3">
              <div className="grid grid-cols-[1fr_2fr] gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  disabled={saving || uploading}
                  className="h-12 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98] disabled:opacity-50"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={saving || uploading || !editor.imageUrl.trim()}
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
                      {editor.id === null ? 'যোগ করুন' : 'আপডেট করুন'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ ৪. ফুল-স্ক্রিন ইমেজ জুম ভিউয়ার ══ */}
      {previewUrl && (
        <div
          className="animate-soft-fade-in fixed inset-0 z-[110] flex cursor-zoom-out items-center justify-center bg-ink/75 p-4 backdrop-blur-[3px]"
          onClick={() => setPreviewUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90dvh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="রিভিউ প্রিভিউ" className="block max-h-[88dvh] max-w-[90vw] rounded-2xl object-contain shadow-sh3" />
            <button
              type="button"
              onClick={() => setPreviewUrl(null)}
              aria-label="বন্ধ করুন"
              className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-sh2 transition-all duration-brand hover:bg-border-base active:scale-90"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ══ ৫. সেন্ট্রাল কনফার্মেশন ডায়ালগ ══ */}
      {deleteTargetId && (
        <ConfirmDialog
          title="রিভিউ ছবি মুছে ফেলবেন?"
          message="এই ছবিটি গ্যালারি থেকে স্থায়ীভাবে মুছে যাবে — এই কাজ আর ফিরিয়ে আনা যাবে না।"
          confirmLabel="হ্যাঁ, মুছে ফেলুন"
          busyLabel="মুছে ফেলা হচ্ছে..."
          busy={deleting}
          tone="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
