import { getHomeShowcase, getCollectionCounts } from '@/app/actions/home-showcase';
import { getCategories } from '@/app/actions/categories';
import HomeShowcasePageClient from '@/components/design/HomeShowcasePageClient';

export const dynamic = 'force-dynamic';

export default async function HomeShowcasePage() {
  const [config, categories, collectionCounts] = await Promise.all([getHomeShowcase(), getCategories(), getCollectionCounts()]);

  return (
    <div className="mx-auto max-w-5xl">
      <HomeShowcasePageClient
        config={config}
        categories={categories.filter((c) => c.id !== 'all')}
        collectionCounts={collectionCounts}
      />
    </div>
  );
}
