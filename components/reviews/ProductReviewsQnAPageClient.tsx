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

const TAB_LABELS: Record<Tab, string> = {
  reviews: 'রিভিউ',
  qa: 'প্রশ্নোত্তর',
};

// রিভিউ ও প্রশ্নোত্তর পেজের মূল ক্লায়েন্ট — দুটো ট্যাব (রিভিউ / প্রশ্নোত্তর), দুই প্যানেলের স্টেট এখানে।
// ReviewsPanel ও QnAPanel-এর props আগের মতোই: (reviews, onReviewsChange) / (questions, onQuestionsChange)।
export default function ProductReviewsQnAPageClient({ initialReviews, initialQuestions }: Props) {
  const [tab, setTab] = useState<Tab>('reviews');
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [questions, setQuestions] = useState<ProductQuestionWithAnswers[]>(initialQuestions);

  const pendingReviewCount = reviews.filter((r) => !r.is_approved && !r.is_rejected).length;
  const unansweredCount = questions.filter((q) => q.answers.length === 0).length;

  const counts: Record<Tab, number> = {
    reviews: pendingReviewCount,
    qa: unansweredCount,
  };

  return (
    <div>
      {/* ট্যাব বার — সলিড স্কাই-ব্লু অ্যাকটিভ, গাঢ় নীল/গ্রেডিয়েন্ট নেই */}
      <div className="mb-4 rounded-[24px] border border-white/90 bg-white p-2 shadow-sh1">
        <div className="flex rounded-full bg-surface-muted p-1">
          {(Object.keys(TAB_LABELS) as Tab[]).map((key) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-full font-body text-[13px] font-extrabold transition-all duration-brand active:scale-[0.98] ${
                  active ? 'bg-brand-light text-white shadow-[0_4px_12px_rgba(68,167,252,0.4)]' : 'text-muted hover:text-ink'
                }`}
              >
                {TAB_LABELS[key]}
                {counts[key] > 0 && (
                  <span
                    className={`min-w-[22px] rounded-full px-1.5 text-center text-[10.5px] font-black leading-[18px] ${
                      active ? 'bg-white/25 text-white' : 'bg-amber-100 text-[#92400E]'
                    }`}
                  >
                    {counts[key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'reviews' ? (
        <ReviewsPanel reviews={reviews} onReviewsChange={setReviews} />
      ) : (
        <QnAPanel questions={questions} onQuestionsChange={setQuestions} />
      )}
    </div>
  );
    }
