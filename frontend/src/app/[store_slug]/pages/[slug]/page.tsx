'use client';

import { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useBuyerStore } from '@/store/buyer-store';
import BuyerLoginModal from '@/components/buyer/BuyerLoginModal';
import { CmsPage, CmsSettings, CmsBranding, CmsNavigation } from '@/components/templates/types';
import { fetchApi } from '@/lib/api-client';
import { BuyerNavbar, BuyerThemeFrame } from '@/components/buyer/BuyerTheme';

export default function StorefrontCustomPage({
  params,
}: {
  params: Promise<{ store_slug: string; slug: string }>;
}) {
  const { store_slug: storeSlug, slug: pageSlug } = use(params);
  const { getTotalItems } = useCartStore();
  const { buyer } = useBuyerStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [storeData, setStoreData] = useState<any>(null);
  const [cmsSettings, setCmsSettings] = useState<CmsSettings>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStore() {
      try {
        const json = await fetchApi('/store', { tenantIdOrSlug: storeSlug });
        const store = json.data;
        setStoreData(store);
        if (store?.settings) {
          setCmsSettings(store.settings);
        }
      } catch {
        setStoreData(null);
        setCmsSettings({});
      } finally {
        setIsLoading(false);
      }
    }

    fetchStore();
  }, [storeSlug]);

  const branding: CmsBranding = cmsSettings.branding || {};
  const navigation: CmsNavigation = cmsSettings.navigation || { menuItems: [] };
  const bgColor = branding.backgroundColor || '#F5F5F3';
  const textColor = branding.textColor || '#111111';
  const storeName = storeData?.storeName || storeData?.name || storeSlug.toUpperCase();
  const logoInitial = storeName.charAt(0).toUpperCase();

  const fontHeadingClass =
    branding.fontHeading === 'playfair'
      ? 'font-serif'
      : branding.fontHeading === 'montserrat'
      ? 'font-sans font-black tracking-wide'
      : branding.fontHeading === 'inter'
      ? 'font-sans font-black'
      : 'font-bebas';

  // Cari custom page berdasarkan slug
  const page: CmsPage | undefined = useMemo(() => {
    if (cmsSettings.pages && cmsSettings.pages.length > 0) {
      const found = cmsSettings.pages.find(
        (p) => p.slug.toLowerCase() === pageSlug.toLowerCase() && p.isPublished !== false
      );
      if (found) return found;
    }

    return undefined;
  }, [cmsSettings.pages, pageSlug, storeName, cmsSettings.hero?.bannerImage]);

  // Menu Drawer Items
  const navMenuItems =
    navigation?.menuItems && navigation.menuItems.length > 0
      ? navigation.menuItems.filter((m) => m.enabled)
      : [
          { id: 'm1', label: 'HOME', url: `/${storeSlug}` },
          { id: 'm2', label: 'CATALOG', url: `/${storeSlug}#shop` },
          { id: 'm3', label: 'COLLECTIONS', url: `/${storeSlug}#collections` },
          { id: 'm4', label: 'SHOPPING BAG', url: `/${storeSlug}/cart` },
          { id: 'm5', label: 'ABOUT', url: `/${storeSlug}/pages/about` },
          { id: 'm6', label: 'MY ACCOUNT', url: `/${storeSlug}/account` },
        ];

  return (
    <BuyerThemeFrame storeSlug={storeSlug} className="font-sans antialiased flex flex-col">
      <BuyerNavbar storeSlug={storeSlug} storeName={storeName} />

      {/* ── 3. MAIN CUSTOM PAGE CONTENT ─────────────────────────────────── */}
      <main className="flex-1 w-full pb-20">
        {!page ? (
          /* 404 / Belum Diterbitkan */
          <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-6">
            <div className="text-[12px] font-semibold tracking-[0.28em] uppercase opacity-40">
              404 • HALAMAN TIDAK DITEMUKAN
            </div>
            <h1 className={`${fontHeadingClass} text-5xl sm:text-6xl uppercase tracking-tight`}>
              Halaman Belum Diterbitkan
            </h1>
            <p className="text-sm opacity-60 leading-relaxed max-w-md mx-auto">
              Halaman &ldquo;{pageSlug}&rdquo; belum dibuat atau masih dalam mode draft oleh pemilik toko.
            </p>
            <div className="pt-4">
              <Link
                href={`/${storeSlug}`}
                className="inline-flex items-center gap-2 px-6 py-3 border border-current text-[11px] font-semibold tracking-[0.22em] uppercase hover:bg-black hover:text-white transition-colors"
              >
                Kembali ke Beranda Toko
              </Link>
            </div>
          </div>
        ) : (
          /* Halaman Kustom Tersedia */
          <div>
            {/* Optional Banner Hero Halaman */}
            {page.bannerImage && (
              <div className="relative w-full h-[38vh] sm:h-[48vh] min-h-[300px] max-h-[500px] overflow-hidden bg-stone-900 border-b border-[#DADADA]">
                <img
                  src={page.bannerImage}
                  alt={page.title}
                  className="w-full h-full object-cover object-center filter contrast-[1.05] saturate-[0.92]"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-8 left-6 md:left-16 text-white max-w-2xl">
                  <div className="text-[11px] uppercase tracking-[0.28em] font-medium text-white/80 mb-2">
                    {page.subtitle || 'CURATED EDITORIAL ARCHIVE'}
                  </div>
                  <h1 className={`${fontHeadingClass} text-5xl sm:text-7xl uppercase tracking-tight leading-none`}>
                    {page.title}
                  </h1>
                </div>
              </div>
            )}

            {/* Content Container */}
            <div className="max-w-5xl mx-auto px-6 md:px-12 pt-12 md:pt-16 space-y-12">
              {/* Title Header if no banner image */}
              {!page.bannerImage && (
                <div className="border-b border-[#DADADA] pb-8 space-y-2">
                  <div className="text-[11px] font-semibold tracking-[0.28em] uppercase opacity-50">
                    {page.subtitle || 'EDITORIAL ARCHIVE / PAGES'}
                  </div>
                  <h1 className={`${fontHeadingClass} text-5xl sm:text-7xl lg:text-8xl uppercase tracking-tight`}>
                    {page.title}
                  </h1>
                </div>
              )}

              {/* Grid 2-Kolom jika ada Side Image, atau 1-Kolom Lebar */}
              <div
                className={`grid gap-12 lg:gap-16 items-start ${
                  page.sideImage ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 max-w-3xl'
                }`}
              >
                {/* Left/Main Column: Text Narrative */}
                <div
                  className={`space-y-6 text-sm sm:text-base leading-relaxed opacity-80 ${
                    page.sideImage
                      ? page.sideImagePosition === 'left'
                        ? 'lg:col-span-7 lg:order-2'
                        : 'lg:col-span-7 lg:order-1'
                      : 'w-full'
                  }`}
                >
                  {page.content.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx} className="leading-relaxed text-justify sm:text-left">
                      {paragraph}
                    </p>
                  ))}

                  {/* Blockquote jika ada */}
                  {page.quoteText && (
                    <blockquote className="border-l-2 border-current pl-6 py-2 my-8 italic font-serif text-lg opacity-90">
                      &ldquo;{page.quoteText}&rdquo;
                      {page.quoteAuthor && (
                        <cite className="block not-italic text-[11px] uppercase tracking-[0.2em] font-sans font-semibold opacity-60 mt-2">
                          — {page.quoteAuthor}
                        </cite>
                      )}
                    </blockquote>
                  )}
                </div>

                {/* Side Image Column jika ada */}
                {page.sideImage && (
                  <div
                    className={`space-y-3 ${
                      page.sideImagePosition === 'left'
                        ? 'lg:col-span-5 lg:order-1'
                        : 'lg:col-span-5 lg:order-2'
                    }`}
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden border border-[#DADADA] bg-stone-200 shadow-xs">
                      <img
                        src={page.sideImage}
                        alt={page.title}
                        className="w-full h-full object-cover filter contrast-[1.04] saturate-[0.95]"
                      />
                    </div>
                    <div className="text-[10px] tracking-[0.2em] uppercase opacity-50 text-right font-medium">
                      ARCHIVE • {storeName}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom CTA to catalog */}
              <div className="pt-16 border-t border-[#DADADA] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <div className={`${fontHeadingClass} text-2xl uppercase tracking-wider`}>
                    Jelajahi Koleksi Toko Kami
                  </div>
                  <p className="text-xs opacity-60">
                    Temukan potongan kurasi busana dan perlengkapan harian berkualitas tinggi.
                  </p>
                </div>

                <Link
                  href={`/${storeSlug}#collections`}
                  className="px-6 py-3 border border-current text-[11px] font-semibold tracking-[0.22em] uppercase hover:bg-black hover:text-white transition-colors shrink-0"
                >
                  Lihat Koleksi Terbaru →
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── 4. FOOTER ─────────────────────────────────────────────────── */}
      <footer className="border-t border-[#DADADA] py-10 px-6 md:px-12 bg-black/[0.02]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] uppercase tracking-[0.16em] opacity-60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Escrow Guarantee Protected by Xendit & Biteship</span>
          </div>
          <div>
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── 5. BUYER AUTH MODAL ────────────────────────────────────────── */}
      <BuyerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        storeSlug={storeSlug}
        storeName={storeName}
        onSuccess={() => setIsLoginModalOpen(false)}
      />
    </BuyerThemeFrame>
  );
}
