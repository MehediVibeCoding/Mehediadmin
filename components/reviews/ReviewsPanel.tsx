'use client';

import { useMemo, useState } from 'react';
import type { ProductReview, ReviewModerationStatus } from '@/types';
import { approveReview, rejectReview, deleteProductReview } from '@/app/actions/product-reviews';
import { useToast } from '@/components/admin/Toast';
import ReviewCard from '@/components/reviews/ReviewCard';
import { reviewStatus } from '@/components/reviews/ModerationStatusPill';
import RejectReviewModal from '@/components/reviews/RejectReviewModal';
import ImageZoomModal from '@/components/reviews/ImageZoomModal';
import Pagination, { PAGE_SIZE } from '@/components/common/Pagination';

interface Props {
  reviews: ProductReview[];
  onReviewsChange: (updater: (prev: ProductReview[]) => ProductReview[]) => void;
}

type FilterTab = 'all' | ReviewModerationStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'pending', label: 'অনুমোদনের অপেক্ষায়' },
  { key: 'approved', label: 'অনুমোদিত' },
  { key: 'rejected', label: 'বাতিল' },
  { key: 'all', label: 'সবগুলো' },
];

export default function ReviewsPanel({ reviews, onReviewsChange }: Props) {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ProductReview | null>(null);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = { all: reviews.length, pending: 0, approved: 0, rejected: 0 };
    reviews.forEach((r) => {
      c[reviewStatus(r)]++;
    });
    return c;
  }, [reviews]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (filter !== 'all' && reviewStatus(r) !== filter) return false;
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
      showToast(res.message || '❌ ব্যর্থ হয়েছে');
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
      showToast(res.message || '❌ ব্যর্থ হয়েছে');
      return;
    }
    onReviewsChange((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_approved: false, is_rejected: true, rejection_reason: reason.trim() } : r))
    );
    showToast('✅ রিভিউ বাতিল করা হয়েছে');
    setRejectTarget(null);
  }

  async function handleDelete(id: number) {
    if (!confirm('এই রিভিউটি স্থায়ীভাবে মুছে ফেলবেন?')) return;
    setBusyId(id);
    const res = await deleteProductReview(id);
    setBusyId(null);
    if (!res.ok) {
      showToast(res.message || '❌ মুছতে ব্যর্থ হয়েছে');
      return;
    }
    onReviewsChange((prev) => prev.filter((r) => r.id !== id));
    showToast('✅ রিভিউ মুছে ফেলা হয়েছে');
  }

  return (
    <div>
      {/* ফিল্টার ট্যাব */}
      <div className="mb-3.5 flex flex-wrap justify-center gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => changeFilter(t.key)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-brand ${
              filter === t.key
                ? 'border-transparent bg-brand-grad text-white shadow-sh1'
                : 'border-border-base bg-brand-surface text-[#374151] hover:border-brand-accent'
            }`}
          >
            {t.label}
            <span
              className={`inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                filter === t.key ? 'bg-white/25' : 'bg-surface-muted text-muted'
              }`}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* সার্চ */}
      <div className="mx-auto mb-4 max-w-md">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-brand-accent">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="প্রোডাক্ট / গ্রাহকের নাম / রিভিউ টেক্সট..."
            className="h-[38px] w-full rounded-[10px] border border-border-base bg-brand-surface pl-9 pr-3 text-xs text-ink outline-none transition-brand placeholder:text-muted focus:border-brand-accent"
          />
        </div>
      </div>

      <div className="rounded-brand bg-brand-surface p-4 shadow-sh1">
        {paginated.length === 0 ? (
          <div className="p-10 text-center text-muted">
            <div className="mb-2.5 text-4xl">⭐</div>
            <div className="text-sm font-semibold">এই ফিল্টারে কোনো রিভিউ নেই</div>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                busy={busyId === r.id}
                onApprove={handleApprove}
                onReject={setRejectTarget}
                onDelete={handleDelete}
                onZoomImage={setZoomUrl}
              />
            ))}
          </div>
        )}
        <Pagination page={page} total={filtered.length} onPageChange={setPage} />
      </div>

      {rejectTarget && (
        <RejectReviewModal
          reviewerName={rejectTarget.user_name || 'গ্রাহক'}
          busy={busyId === rejectTarget.id}
          onCancel={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
        />
      )}

      {zoomUrl && <ImageZoomModal url={zoomUrl} onClose={() => setZoomUrl(null)} />}
    </div>
  );
}
