import { listReviews } from '@/app/actions/reviews';
import ReviewGalleryPageClient from '@/components/reviews/ReviewGalleryPageClient';

export const dynamic = 'force-dynamic';

export default async function ReviewGalleryPage() {
  const reviews = await listReviews();

  return (
    <div className="mx-auto max-w-5xl">
      <ReviewGalleryPageClient reviews={reviews} />
    </div>
  );
}
