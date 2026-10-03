'use client';

import { useState } from 'react';
import type { ProductReview, ProductQuestionWithAnswers } from '@/types';
import ReviewsPanel from '@/components/reviews/ReviewsPanel';
import QnAPanel from '@/components/reviews/QnAPanel';

interface Props {
  initialReviews: ProductReview[];
  initialQuestions: ProductQuestionWithAnswers[];
}

type Tab = 'reviews' | 'qa';

export default function ProductReviewsQnAPageClient({ initialReviews, initialQuestions }: Props) {
  const [tab, setTab] = useState<Tab>('reviews');
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [questions, setQuestions] = useState<ProductQuestionWithAnswers[]>(initialQuestions);

  const pendingReviewCount = reviews.filter((r) => !r.is_approved && !r.is_rejected).length;
  const unansweredCount = questions.filter((q) => q.answers.length === 0).length;

  return (
    <div>
      {/* ══ ১. টপ সেগমেন্টেড ট্যাব সুইচ (মাস্টার প্রম্পটের সিগনেচার স্কাই-ব্লু ক্যাপসুল) ══ */}
      <div className="mx-auto mb-4 flex w-full max-w-[420px] rounded-full border border-border-base/80 bg-white p-1.5 shadow-sh1">
        {/* রিভিউ ট্যাব */}
        <button
          type="button"
          onClick={() => setTab('reviews')}
          className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-full font-body text-[13px] font-black transition-all duration-brand active:scale-[0.98] ${
            tab === 'reviews'
              ? 'bg-brand-light text-white shadow-[0_4px_14px_rgba(68,167,252,0.38)]'
              : 'text-muted hover:bg-surface-muted/60 hover:text-ink'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>রিভিউ</span>
          {pendingReviewCount > 0 && (
            <span
              className={`min-w-[20px] rounded-full px-1.5 text-center text-[10px] font-black leading-[18px] ${
                tab === 'reviews'
                  ? 'bg-white/25 text-white'
                  : 'border border-amber-200/80 bg-amber-50 text-[#92400E]'
              }`}
            >
              {pendingReviewCount}
            </span>
          )}
        </button>

        {/* প্রশ্নোত্তর ট্যাব */}
        <button
          type="button"
          onClick={() => setTab('qa')}
          className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-full font-body text-[13px] font-black transition-all duration-brand active:scale-[0.98] ${
            tab === 'qa'
              ? 'bg-brand-light text-white shadow-[0_4px_14px_rgba(68,167,252,0.38)]'
              : 'text-muted hover:bg-surface-muted/60 hover:text-ink'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>প্রশ্নোত্তর</span>
          {unansweredCount > 0 && (
            <span
              className={`min-w-[20px] rounded-full px-1.5 text-center text-[10px] font-black leading-[18px] ${
                tab === 'qa'
                  ? 'bg-white/25 text-white'
                  : 'border border-amber-200/80 bg-amber-50 text-[#92400E]'
              }`}
            >
              {unansweredCount}
            </span>
          )}
        </button>
      </div>

      {/* ══ ২. সক্রিয় ট্যাব প্যানেল ══ */}
      {tab === 'reviews' ? (
        <ReviewsPanel reviews={reviews} onReviewsChange={setReviews} />
      ) : (
        <QnAPanel questions={questions} onQuestionsChange={setQuestions} />
      )}
    </div>
  );
}
