import { listProductReviews } from '@/app/actions/product-reviews';
import { listProductQuestions } from '@/app/actions/product-qa';
import ProductReviewsQnAPageClient from '@/components/reviews/ProductReviewsQnAPageClient';

export const dynamic = 'force-dynamic';

export default async function ReviewsQnAPage() {
  try {
    const [reviews, questions] = await Promise.all([listProductReviews(), listProductQuestions()]);
    return <ProductReviewsQnAPageClient initialReviews={reviews} initialQuestions={questions} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <div className="rounded-brand border border-red-200 bg-red-50 p-6 text-red-700">
        <h1 className="mb-2 font-bold text-lg">রিভিউ / প্রশ্নোত্তর লোড করতে সমস্যা হয়েছে</h1>
        <p className="text-sm">{message}</p>
        <p className="mt-3 text-xs text-red-500">
          সাধারণত এর কারণ: Vercel-এ SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL ভুল বা
          missing, অথবা Supabase-এ product_reviews / product_questions / product_question_answers
          টেবিল এখনো তৈরি হয়নি।
        </p>
      </div>
    );
  }
}
