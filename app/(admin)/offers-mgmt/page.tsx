import { getOfferConfig } from '@/app/actions/offers';
import { listProductsForPicker } from '@/app/actions/products';
import OffersPageClient from '@/components/offers/OffersPageClient';

export const dynamic = 'force-dynamic';

export default async function OffersMgmtPage() {
  const [config, products] = await Promise.all([getOfferConfig(), listProductsForPicker()]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <OffersPageClient config={config} products={products} />
    </div>
  );
}
