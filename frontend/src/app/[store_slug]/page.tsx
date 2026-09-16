import StorefrontClient from '@/components/templates/StorefrontClient';
import { Product, StoreData } from '@/components/templates/types';
import { Metadata } from 'next';

export const revalidate = 0; // Fresh SSR on every request

async function getStoreData(storeSlug: string): Promise<StoreData> {
  const baseUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://app.alurelab.com/api/v1';

  const [storeRes, prodRes] = await Promise.all([
      fetch(`${baseUrl}/store`, {
        headers: { 'x-store-slug': storeSlug, Accept: 'application/json' },
        cache: 'no-store',
        }).then((r) => {
          if (!r.ok) throw new Error(`Store request failed: ${r.status}`);
          return r.json();
        }),
      fetch(`${baseUrl}/products`, {
        headers: { 'x-store-slug': storeSlug, Accept: 'application/json' },
        cache: 'no-store',
        }).then((r) => {
          if (!r.ok) throw new Error(`Product request failed: ${r.status}`);
          return r.json();
        }),
      ]);

    const storeData = storeRes?.data;
    if (!storeData) throw new Error('Store not found.');
    const productsRaw = prodRes?.data?.data || prodRes?.data || [];

    const mappedProducts: Product[] = Array.isArray(productsRaw)
      ? productsRaw.map((p: any) => ({
          id: p.id,
          title: p.title,
          category: p.category_name || 'Koleksi',
          slug: p.slug,
          description: p.description || '',
          price: Number(p.price) || 0,
          compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : undefined,
           images: Array.isArray(p.images) ? p.images : [],
          variants:
            p.variants && p.variants.length > 0
              ? p.variants.map((v: any) => ({
                  id: v.id,
                  sku: v.sku,
                  title: v.title,
                   price: Number(v.price),
                   stock: Number(v.stock),
                 }))
               : [],
        }))
      : [];

    const categoriesSet = new Set<string>(['Semua']);
    mappedProducts.forEach((p) => {
      if (p.category) categoriesSet.add(p.category);
    });

    const initialStore: StoreData = {
      storeName: storeData.name,
      tagline: storeData.settings?.branding?.tagline || storeData.settings?.tagline || '',
      categories: Array.from(categoriesSet),
      products: mappedProducts,
      settings: storeData?.settings || {},
    };

  return initialStore;
}

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
