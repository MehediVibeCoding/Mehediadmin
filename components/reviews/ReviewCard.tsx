'use client';

import type { ProductReview } from '@/types';
import StarRatingDisplay from '@/components/reviews/StarRatingDisplay';
import ModerationStatusPill, { reviewStatus } from '@/components/reviews/ModerationStatusPill';

interface Props {
  review: ProductReview;
  busy: boolean;
  onApprove: (id: number) => void;
  onReject: (review: ProductReview) => void;
  onDelete: (id: number) => void;
  onZoomImage: (url: string) => void;
}

export default function ReviewCard({ review: r, busy, onApprove, onReject, onDelete, onZoomImage }: Props) {
  const status = reviewStatus(r);

  return (
    <div className="rounded-xl border border-border-base bg-white p-3.5 shadow-sh1 transition-brand hover:shadow-sh2 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        {r.image_url && (
          <button
            type="button"
            onClick={() => onZoomImage(r.image_url!)}
            className="h-24 w-full shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-border-base bg-surface-muted sm:h-24 sm:w-24"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.image_url}
              alt="রিভিউ ছবি"
              className="h-full w-full object-cover"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
              }}
            />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold text-brand-dark">{r.product_name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                <span className="font-semibold text-ink">{r.user_name || 'অজ্ঞাত গ্রাহক'}</span>
                {r.is_verified_buyer && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-info/10 px-1.5 py-0.5 text-[10px] font-bold text-info">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    ভেরিফায়েড বায়ার
                  </span>
                )}
              </div>
            </div>
            <ModerationStatusPill status={status} />
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <StarRatingDisplay rating={r.rating} />
            {r.like_count > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                  <path d="M7 10v12" />
                  <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                </svg>
                {r.like_count}
              </span>
            )}
          </div>

          {r.review_text && <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{r.review_text}</p>}

          {status === 'rejected' && r.rejection_reason && (
            <div className="mt-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1.5 text-[11.5px] text-[#991B1B]">
              <b>বাতিলের কারণ:</b> {r.rejection_reason}
            </div>
          )}

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-muted">
              {r.created_at ? new Date(r.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </span>

            <div className="flex flex-wrap gap-1.5">
              {status !== 'approved' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onApprove(r.id)}
                  className="flex items-center gap-1 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1.5 text-xs font-semibold text-[#065F46] transition-brand hover:bg-[#D1FAE5] disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Approve
                </button>
              )}
              {status !== 'rejected' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onReject(r)}
                  className="flex items-center gap-1 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-2.5 py-1.5 text-xs font-semibold text-[#92400E] transition-brand hover:bg-[#FEF3C7] disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                  Reject
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => onDelete(r.id)}
                className="flex items-center gap-1 rounded-lg border border-[#FECACA] bg-[#FEE2E2] px-2.5 py-1.5 text-xs font-medium text-[#991B1B] transition-brand hover:bg-[#FECACA] disabled:opacity-50"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
