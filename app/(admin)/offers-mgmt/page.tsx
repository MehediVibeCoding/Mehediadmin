import { getOfferConfig } from '@/app/actions/offers';
import { listProducts } from '@/app/actions/products';
import OffersPageClient from '@/components/offers/OffersPageClient';

export const dynamic = 'force-dynamic';

export default async function OffersMgmtPage() {
  const [config, products] = await Promise.all([getOfferConfig(), listProducts()]);

  return (
    <div className="mx-auto max-w-3xl">
      <OffersPageClient config={config} products={products} />
    </div>
  );
}
