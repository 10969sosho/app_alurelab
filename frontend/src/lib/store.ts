import { cache } from 'react';
import { notFound } from 'next/navigation';
import { Product, StoreData } from '@/components/templates/types';

/**
 * Fetch dan validasi toko publik ALURELAB.
 * Dibungkus dengan React cache() agar di-request maksimal 1x per lifecycle SSR
 * (dibagikan secara instan antara layout.tsx, page.tsx, dan generateMetadata).
 *
 * Jika slug bukan toko yang valid di database, otomatis memicu notFound() (HTTP 404).
 */
export const getStoreData = cache(async (storeSlug: string): Promise<StoreData> => {
  // Abaikan atau cegah slug statis internal yang tidak boleh dianggap sebagai toko
  const reservedSlugs = [
    'api',
    'dashboard',
    'login',
    'register',
    'forgot-password',
    'onboarding',
    'mock',
    '_next',
    'favicon.ico',
  ];

  if (reservedSlugs.includes(storeSlug.toLowerCase())) {
    notFound();
  }

  const baseUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://app.alurelab.com/api/v1';

  let storeRes: Response;
  let prodRes: Response | null = null;

  try {
    const responses = await Promise.all([
      fetch(`${baseUrl}/store`, {
        headers: { 'x-store-slug': storeSlug, Accept: 'application/json' },
        cache: 'no-store',
      }),
      fetch(`${baseUrl}/products`, {
        headers: { 'x-store-slug': storeSlug, Accept: 'application/json' },
        cache: 'no-store',
      }),
    ]);
    storeRes = responses[0];
    prodRes = responses[1];
  } catch {
    // Jika backend tidak dapat dihubungi atau network failure, lempar 404
    notFound();
  }

  // Jika response status bukan 200 (misal 404 TenantNotFound), panggil notFound()
  if (!storeRes.ok) {
    notFound();
  }

  let storeJson: any;
  try {
    storeJson = await storeRes.json();
  } catch {
    notFound();
  }

  const storeData = storeJson?.data;
  if (!storeData || !storeData.id) {
    notFound();
  }

  let productsRaw: any[] = [];
  if (prodRes && prodRes.ok) {
    try {
      const prodJson = await prodRes.json();
      productsRaw = prodJson?.data?.data || prodJson?.data || [];
    } catch {
      productsRaw = [];
    }
  }

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
    logo_url: storeData.logo_url || undefined,
    phone_number: storeData.phone_number || undefined,
    settings: storeData?.settings || {},
  };

  return initialStore;
});
