import { getHeroCards } from '@/app/actions/hero-cards';
import { getCategories } from '@/app/actions/categories';
import HeroCardsPageClient from '@/components/design/HeroCardsPageClient';

export const dynamic = 'force-dynamic';

export default async function HeroCardsPage() {
  const [cards, categories] = await Promise.all([getHeroCards(), getCategories()]);

  return (
    <div className="mx-auto max-w-5xl">
      <HeroCardsPageClient cards={cards} categories={categories.filter((c) => c.id !== 'all')} />
    </div>
  );
}
