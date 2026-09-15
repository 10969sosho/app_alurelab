import StorefrontClient from '@/components/templates/StorefrontClient';
import { Product, StoreData } from '@/components/templates/types';
import { Metadata } from 'next';

export const revalidate = 0; // Fresh SSR on every request

async function getStoreData(storeSlug: string): Promise<StoreData> {
  const baseUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://app.alurelab.com/api/v1';

  try {
    const [storeRes, prodRes] = await Promise.all([
      fetch(`${baseUrl}/store`, {
        headers: { 'x-store-slug': storeSlug, Accept: 'application/json' },
        cache: 'no-store',
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${baseUrl}/products`, {
        headers: { 'x-store-slug': storeSlug, Accept: 'application/json' },
        cache: 'no-store',
      }).then((r) => (r.ok ? r.json() : null)),
    ]);

    const storeData = storeRes?.data || null;
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
          images:
            p.images && p.images.length > 0
              ? p.images
              : ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600'],
          variants:
            p.variants && p.variants.length > 0
              ? p.variants.map((v: any) => ({
                  id: v.id,
                  sku: v.sku,
                  title: v.title,
                  price: Number(v.price) || Number(p.price) || 0,
                  stock: v.stock ?? 10,
                }))
              : [{ id: p.id + '-std', sku: 'STD-1', title: 'Standard', price: Number(p.price), stock: 20 }],
        }))
      : [];

    const categoriesSet = new Set<string>(['Semua']);
    mappedProducts.forEach((p) => {
      if (p.category) categoriesSet.add(p.category);
    });

    const initialStore: StoreData = {
      storeName:
        storeData?.settings?.branding?.storeName ||
        storeData?.name ||
        storeSlug.replace(/-/g, ' ').toUpperCase(),
      tagline:
        storeData?.settings?.branding?.tagline ||
        storeData?.settings?.tagline ||
        'Toko Resmi ALURELAB E-Commerce',
      categories: Array.from(categoriesSet),
      products: mappedProducts,
      settings: storeData?.settings || {},
    };

    return initialStore;
  } catch (err) {
    return {
      storeName: storeSlug.replace(/-/g, ' ').toUpperCase(),
      tagline: 'Toko Resmi ALURELAB E-Commerce',
      categories: ['Semua'],
      products: [],
      settings: {},
    };
  }
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
