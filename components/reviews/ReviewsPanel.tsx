'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProductReview, ReviewModerationStatus } from '@/types';
import { approveReview, rejectReview, deleteProductReview } from '@/app/actions/product-reviews';
import { useToast } from '@/components/admin/Toast';
import Pagination, { PAGE_SIZE } from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';

interface Props {
  reviews: ProductReview[];
  onReviewsChange: (updater: (prev: ProductReview[]) => ProductReview[]) => void;
}

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'pending', label: 'অনুমোদনের অপেক্ষায়' },
  { key: 'approved', label: 'অনুমোদিত' },
  { key: 'rejected', label: 'বাতিলকৃত' },
  { key: 'all', label: 'সব রিভিউ' },
];

const QUICK_REASONS = [
  'স্প্যাম বা অপ্রাসঙ্গিক রিভিউ',
  'অশালীন শব্দ ব্যবহার করা হয়েছে',
  'ভুয়া বা অসত্য তথ্য',
  'ভুল প্রোডাক্টের জন্য রিভিউ',
];

function getReviewStatus(r: Pick<ProductReview, 'is_approved' | 'is_rejected'>): ReviewModerationStatus {
  if (r.is_rejected) return 'rejected';
  if (r.is_approved) return 'approved';
  return 'pending';
}

const STATUS_META: Record<ReviewModerationStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: 'অপেক্ষায়', bg: 'bg-amber-50', text: 'text-[#92400E]', dot: 'bg-amber-500' },
  approved: { label: 'অনুমোদিত', bg: 'bg-emerald-50', text: 'text-[#065F46]', dot: 'bg-success' },
  rejected: { label: 'বাতিল', bg: 'bg-red-50', text: 'text-danger', dot: 'bg-danger' },
};

/* ── রেটিং স্টার কম্পোনেন্ট ── */
function StarRating({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${r} এর মধ্যে ৫ স্টার`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill={i < r ? '#F59E0B' : 'none'}
          stroke={i < r ? '#F59E0B' : '#D1D5DB'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

/* ── ইমেজ জুম মডাল ── */
function ImageZoomModal({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="animate-soft-fade-in fixed inset-0 z-[110] flex cursor-zoom-out items-center justify-center bg-ink/75 p-4 backdrop-blur-[3px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-h-[90dvh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="রিভিউ ছবি" className="block max-h-[88dvh] max-w-[90vw] rounded-2xl object-contain shadow-sh3" />
        <button
          type="button"
          onClick={onClose}
          aria-label="বন্ধ করুন"
          className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-sh2 transition-all duration-brand hover:bg-border-base active:scale-90"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ── রিজেকশন বটম-শীট / মডাল ── */
function RejectReviewModal({
  reviewerName,
  busy,
  onCancel,
  onConfirm,
}: {
  reviewerName: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [busy, onCancel]);

  return (
    <div
      className="animate-soft-fade-in fixed inset-0 z-[70] flex items-end justify-center bg-ink/45 backdrop-blur-[3px] md:items-center md:p-5"
      onClick={(e) => e.target === e.currentTarget && !busy && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-sheet-up flex max-h-[90dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-12px_50px_rgba(26,26,26,0.22)] md:rounded-[26px] md:shadow-[0_24px_70px_rgba(26,26,26,0.28)]"
        style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="shrink-0 border-b border-brand-light/20 bg-gradient-to-b from-brand-light/[0.12] to-white px-5 pb-3.5 pt-2.5 md:pt-4">
          <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-brand-light/30 md:hidden" />
          <div className="flex items-center justify-between">
            <h3 className="font-body text-[16px] font-black text-ink">রিভিউ বাতিল করুন</h3>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              aria-label="বন্ধ করুন"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-sh1 transition-all duration-brand hover:bg-border-base active:scale-90 disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 font-body text-[11.5px] font-medium leading-snug text-muted">
            <span className="font-bold text-ink">{reviewerName}</span>-এর রিভিউ বাতিলের কারণ লিখুন:
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setReason(q)}
                className={`rounded-full border px-3 py-1.5 font-body text-[11px] font-bold transition-all duration-brand active:scale-95 ${
                  reason === q
                    ? 'border-brand-light bg-brand-light/10 text-brand-light'
                    : 'border-border-base/80 bg-surface-muted text-muted hover:border-brand-light hover:text-ink'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="রিজেকশনের সুনির্দিষ্ট কারণ লিখুন..."
            autoFocus
            className="w-full rounded-2xl border border-border-base/90 bg-white p-3 font-body text-[13px] font-medium leading-relaxed text-ink transition-all duration-brand placeholder:text-muted/60"
          />
        </div>

        <div className="shrink-0 border-t border-border-base/70 px-5 pt-3">
          <div className="grid grid-cols-[1fr_2fr] gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="h-12 rounded-full bg-surface-muted font-body text-[13.5px] font-extrabold text-ink transition-all duration-brand hover:bg-border-base active:scale-[0.98] disabled:opacity-50"
            >
              বাতিল
            </button>
            <button
              type="button"
              disabled={busy || !reason.trim()}
              onClick={() => onConfirm(reason)}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-danger font-body text-[13.5px] font-black text-white shadow-[0_4px_14px_rgba(230,57,70,0.35)] transition-all duration-brand hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {busy ? 'বাতিল হচ্ছে...' : 'রিজেক্ট করুন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── রিভিউ আইটেম কার্ড ── */
function ReviewCardItem({
  review: r,
  busy,
  onApprove,
  onReject,
  onDelete,
  onZoom,
}: {
  review: ProductReview;
  busy: boolean;
  onApprove: (id: number) => void;
  onReject: (review: ProductReview) => void;
  onDelete: (id: number) => void;
  onZoom: (url: string) => void;
}) {
  const status = getReviewStatus(r);
  const meta = STATUS_META[status];
  const images = r.image_url ? r.image_url.split(',').map((u) => u.trim()).filter(Boolean) : [];

  return (
    <article className="flex flex-col rounded-[22px] border border-white/90 bg-white p-4 shadow-sh1 transition-all duration-brand">
      {/* প্রোডাক্ট টাইটেল ও স্ট্যাটাস ব্যাজ */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-1 font-body text-[14px] font-extrabold text-ink">
            {r.product_name || `প্রোডাক্ট #${r.product_id}`}
          </h4>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-body text-[12px] font-bold text-ink">{r.user_name || 'অজ্ঞাত গ্রাহক'}</span>
            {r.is_verified_buyer && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 font-body text-[10px] font-extrabold text-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                ভেরিফায়েড বায়ার
              </span>
            )}
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-body text-[10.5px] font-extrabold leading-none ${meta.bg} ${meta.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      {/* রেটিং স্টার ও লাইক সংখ্যা */}
      <div className="mt-2.5 flex items-center gap-2.5">
        <StarRating rating={r.rating} />
        {r.like_count > 0 && (
          <span className="flex items-center gap-1 font-body text-[11px] font-bold text-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-brand-light">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            {r.like_count}
          </span>
        )}
      </div>

      {/* রিভিউ টেক্সট */}
      {r.review_text && (
        <p className="mt-2.5 whitespace-pre-wrap font-body text-[13px] font-medium leading-relaxed text-ink/90">
          {r.review_text}
        </p>
      )}

      {/* গ্রাহকের দেওয়া ছবিগুলোর থাম্বনেইল */}
      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((imgUrl, i) => (
            <button
              key={`${imgUrl}-${i}`}
              type="button"
              onClick={() => onZoom(imgUrl)}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border-base/80 bg-surface-muted transition-all duration-brand active:scale-95"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgUrl} alt="রিভিউ ইমেজ" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* রিজেকশনের কারণ (যদি বাতিল করা থাকে) */}
      {status === 'rejected' && r.rejection_reason && (
        <div className="mt-3 rounded-xl border border-red-200/80 bg-red-50 p-2.5 font-body text-[12px] font-bold text-danger">
          <span className="font-black">বাতিলের কারণ:</span> {r.rejection_reason}
        </div>
      )}

      {/* ফুটার: তারিখ ও অ্যাকশন বাটন সারি */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-border-base/60 pt-3">
        <span className="font-body text-[11px] font-semibold text-muted">
          {r.created_at ? new Date(r.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>

        <div className="flex items-center gap-1.5">
          {status !== 'approved' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onApprove(r.id)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-success px-4 font-body text-[12px] font-black text-white shadow-[0_3px_10px_rgba(16,185,129,0.32)] transition-all duration-brand hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              অনুমোদন
            </button>
          )}

          {status !== 'rejected' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onReject(r)}
              className="flex h-9 items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-3.5 font-body text-[12px] font-extrabold text-[#92400E] transition-all duration-brand hover:bg-amber-100 active:scale-95 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="h-3 w-3">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              বাতিল
            </button>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(r.id)}
            title="রিভিউ মুছুন"
            aria-label="রিভিউ মুছুন"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-danger transition-all duration-brand hover:bg-danger hover:text-white active:scale-90 disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════
   মূল রিভিউজ প্যানেল কম্পোনেন্ট
   ══════════════════════════════════════════════════════════════ */
export default function ReviewsPanel({ reviews, onReviewsChange }: Props) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ProductReview | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = { all: reviews.length, pending: 0, approved: 0, rejected: 0 };
    reviews.forEach((r) => {
      c[getReviewStatus(r)]++;
    });
    return c;
  }, [reviews]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (filter !== 'all' && getReviewStatus(r) !== filter) return false;
      if (q) {
        const hay = `${r.product_name || ''} ${r.user_name || ''} ${r.review_text || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reviews, filter, search]);

  const paginated = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return filtered.slice(from, from + PAGE_SIZE);
  }, [filtered, page]);

  function changeFilter(f: FilterTab) {
    setFilter(f);
    setPage(1);
  }

  async function handleApprove(id: number) {
    setBusyId(id);
    const res = await approveReview(id);
    setBusyId(null);
    if (!res.ok) {
      showToast(res.message || '❌ অনুমোদন ব্যর্থ');
      return;
    }
    onReviewsChange((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_approved: true, is_rejected: false, rejection_reason: null } : r))
    );
    showToast('✅ রিভিউ অনুমোদিত হয়েছে');
  }

  async function handleRejectConfirm(reason: string) {
    if (!rejectTarget) return;
    const id = rejectTarget.id;
    setBusyId(id);
    const res = await rejectReview(id, reason);
    setBusyId(null);
    if (!res.ok) {
      showToast(res.message || '❌ বাতিল করতে ব্যর্থ');
      return;
    }
    onReviewsChange((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_approved: false, is_rejected: true, rejection_reason: reason.trim() } : r))
    );
    showToast('✅ রিভিউ বাতিল করা হয়েছে');
    setRejectTarget(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setBusyId(id);
    const res = await deleteProductReview(id);
    setBusyId(null);
    if (!res.ok) {
      showToast(res.message || '❌ মুছতে ব্যর্থ হয়েছে');
      return;
    }
    onReviewsChange((prev) => prev.filter((r) => r.id !== id));
    showToast('🗑️ রিভিউ মুছে ফেলা হয়েছে');
    setDeleteTargetId(null);
  }

  return (
    <div>
      {/* ══ টুলবার কার্ড: সার্চ + ফিল্টার চিপস ══ */}
      <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-3.5 shadow-sh1 sm:p-4">
        {/* সার্চ বার */}
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-light"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="প্রোডাক্টের নাম, গ্রাহক বা টেক্সট দিয়ে খুঁজুন..."
            className="h-11 w-full rounded-full border border-border-base/80 bg-surface-muted/50 pl-11 pr-10 font-body text-[13px] font-medium text-ink transition-all duration-brand placeholder:text-muted/70 focus:bg-white lg:h-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              aria-label="সার্চ মুছুন"
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-border-base/70 text-muted transition-colors hover:bg-brand-light hover:text-white"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ফিল্টার চিপস (কাউন্টসহ সাইড-স্ক্রল) */}
        <div className="no-scrollbar -mx-3.5 mt-3 flex gap-2 overflow-x-auto px-3.5 pb-0.5 sm:-mx-4 sm:px-4">
          {TABS.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => changeFilter(t.key)}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 font-body text-[12px] font-extrabold transition-all duration-brand active:scale-95 ${
                  active
                    ? 'border-brand-light bg-brand-light text-white shadow-[0_4px_14px_rgba(68,167,252,0.36)]'
                    : 'border-border-base/80 bg-white text-ink hover:border-brand-light hover:text-brand-light'
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`min-w-[22px] rounded-full px-1.5 text-center text-[10.5px] font-black leading-[18px] ${
                    active ? 'bg-white/25 text-white' : 'bg-surface-muted text-muted'
                  }`}
                >
                  {counts[t.key]}
                </span>
              </button>
            );
          })}

          {(search || filter !== 'pending') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilter('pending');
                setPage(1);
              }}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-3.5 font-body text-[12px] font-extrabold text-danger transition-all duration-brand hover:bg-red-100 active:scale-95"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              রিসেট
            </button>
          )}
        </div>
      </div>

      {/* ══ রিভিউ কার্ড তালিকা ও খালি অবস্থা ══ */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] border border-white/90 bg-white px-6 py-16 text-center shadow-sh1">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/15 text-brand-light">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
          <span className="font-body text-[14px] font-extrabold text-ink">কোনো রিভিউ পাওয়া যায়নি</span>
          <span className="font-body text-[12px] font-medium text-muted">সার্চ বা ফিল্টার পরিবর্তন করে দেখুন</span>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((r) => (
            <ReviewCardItem
              key={r.id}
              review={r}
              busy={busyId === r.id}
              onApprove={handleApprove}
              onReject={setRejectTarget}
              onDelete={setDeleteTargetId}
              onZoom={setZoomUrl}
            />
          ))}
        </div>
      )}

      {/* পেজিনেশন */}
      {filtered.length > 0 && (
        <div className="mt-4 rounded-[20px] border border-white/90 bg-white p-3.5 shadow-sh1">
          <Pagination page={page} total={filtered.length} onPageChange={setPage} bare />
        </div>
      )}

      {/* রিজেক্ট মডাল */}
      {rejectTarget && (
        <RejectReviewModal
          reviewerName={rejectTarget.user_name || 'গ্রাহক'}
          busy={busyId === rejectTarget.id}
          onCancel={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
        />
      )}

      {/* ইমেজ জুম ভিউয়ার */}
      {zoomUrl && <ImageZoomModal url={zoomUrl} onClose={() => setZoomUrl(null)} />}

      {/* ডিলিট কনফার্মেশন ডায়ালগ */}
      {deleteTargetId && (
        <ConfirmDialog
          title="রিভিউ মুছে ফেলবেন?"
          message="এই রিভিউটি স্থায়ীভাবে মুছে যাবে — এই কাজ আর ফিরিয়ে আনা যাবে না।"
          confirmLabel="হ্যাঁ, মুছে ফেলুন"
          busyLabel="মুছে ফেলা হচ্ছে..."
          busy={busyId === deleteTargetId}
          tone="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}
