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
      <div className="mx-auto mb-4 mt-2.5 max-w-full text-center">
        <h1 className="font-display text-xl text-ink">⭐ রিভিউ ও প্রশ্নোত্তর মডারেশন</h1>
        <p className="mt-0.5 text-[12.5px] text-muted">কাস্টমার রিভিউ অনুমোদন করুন এবং প্রোডাক্ট প্রশ্নের উত্তর দিন</p>
      </div>

      <div className="mx-auto mb-5 flex max-w-[420px] gap-1.5 rounded-[14px] border border-border-base bg-brand-surface p-1.5 shadow-sh1">
        <button
          type="button"
          onClick={() => setTab('reviews')}
          className={`relative flex-1 rounded-[10px] py-2.5 text-sm font-semibold transition-brand ${
            tab === 'reviews' ? 'bg-brand-grad text-white shadow-sh1' : 'text-muted hover:text-ink'
          }`}
        >
          ⭐ রিভিউ
          {pendingReviewCount > 0 && (
            <span
              className={`ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                tab === 'reviews' ? 'bg-white/25 text-white' : 'bg-warn/15 text-[#92400E]'
              }`}
            >
              {pendingReviewCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('qa')}
          className={`relative flex-1 rounded-[10px] py-2.5 text-sm font-semibold transition-brand ${
            tab === 'qa' ? 'bg-brand-grad text-white shadow-sh1' : 'text-muted hover:text-ink'
          }`}
        >
          💬 প্রশ্নোত্তর
          {unansweredCount > 0 && (
            <span
              className={`ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                tab === 'qa' ? 'bg-white/25 text-white' : 'bg-warn/15 text-[#92400E]'
              }`}
            >
              {unansweredCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'reviews' ? (
        <ReviewsPanel reviews={reviews} onReviewsChange={setReviews} />
      ) : (
        <QnAPanel questions={questions} onQuestionsChange={setQuestions} />
      )}
    </div>
  );
}
