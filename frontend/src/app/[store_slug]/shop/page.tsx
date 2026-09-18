import { getStoreData } from '@/lib/store';
import ShopPageClient from '@/components/buyer/ShopPageClient';

export const revalidate = 0;

export default async function ShopPage({ params }: { params: Promise<{ store_slug: string }> }) {
  const { store_slug: storeSlug } = await params;
  const store = await getStoreData(storeSlug);
  return <ShopPageClient storeSlug={storeSlug} store={store} />;
}
