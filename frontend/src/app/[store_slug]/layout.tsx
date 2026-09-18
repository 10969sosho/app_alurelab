import { getStoreData } from '@/lib/store';
import { BuyerThemeProvider } from '@/components/buyer/BuyerTheme';

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ store_slug: string }>;
}) {
  const { store_slug: storeSlug } = await params;

  // Validasi toko di tingkat layout SSR.
  // Jika storeSlug bukan nama toko yang valid di database, getStoreData langsung memicu notFound() (HTTP 404).
  // Melindungi seluruh sub-rute (/, /cart, /checkout, /products/[slug], /account, dll).
  const store = await getStoreData(storeSlug);

  return <BuyerThemeProvider settings={store.settings || {}}>{children}</BuyerThemeProvider>;
}
