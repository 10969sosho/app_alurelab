import StorefrontClient from '@/components/templates/StorefrontClient';
import { getStoreData } from '@/lib/store';
import { Metadata } from 'next';

export const revalidate = 0; // Fresh SSR on every request

export async function generateMetadata({
  params,
}: {
  params: Promise<{ store_slug: string }>;
}): Promise<Metadata> {
  const { store_slug: storeSlug } = await params;
  const store = await getStoreData(storeSlug);

  return {
    title: `${store.storeName} — Toko Resmi Online`,
    description: store.tagline || 'Storefront resmi di ALURELAB',
  };
}

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ store_slug: string }>;
  searchParams?: Promise<{ template?: string }>;
}) {
  const { store_slug: storeSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const queryTemplate = resolvedSearchParams.template;

  const initialStore = await getStoreData(storeSlug);

  return (
    <StorefrontClient
      storeSlug={storeSlug}
      initialStore={initialStore}
      queryTemplate={queryTemplate}
    />
  );
}
