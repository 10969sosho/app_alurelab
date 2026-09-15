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
    // 1. Ambil data lokal preview jika ada
    const localSaved = localStorage.getItem(`alurelab_cms_${storeSlug}`);
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        setCmsSettings(parsed);
      } catch (e) {
        console.error('Failed to parse local CMS data', e);
      }
    }

    // 2. Fetch data toko dan settings dari server
    async function fetchStore() {
      try {
        const res = await fetch(`/api/v1/store?slug=${storeSlug}`, {
          headers: { 'X-Tenant-Slug': storeSlug },
        });
        if (res.ok) {
          const json = await res.json();
          const store = json.data || json;
          setStoreData(store);
          if (store.settings) {
            setCmsSettings((prev) => ({
              ...store.settings,
              ...prev,
            }));
          }
        }
      } catch (e) {
        console.warn('Using local fallback for custom page rendering', e);
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

    // Fallback default jika slug adalah 'about' dan belum dibuat manual oleh seller
    if (pageSlug.toLowerCase() === 'about' || pageSlug.toLowerCase() === 'tentang-kami') {
      return {
        id: 'default-about',
        slug: 'about',
        title: `ABOUT ${storeName}`,
        subtitle: 'CURATED ARCHIVE & STUDIO PHILOSOPHY',
        bannerImage:
          cmsSettings.hero?.bannerImage ||
          'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1600&auto=format&fit=crop&q=80',
        content:
          `${storeName} didirikan dengan dedikasi untuk menghadirkan kurasi pakaian dan perlengkapan modern dengan kenyamanan maksimal dan estetika visual yang abadi.\n\n` +
          `Setiap koleksi dirancang dengan inspirasi dari galeri seni modern, arsitektur minimalis, dan kehangatan momen keseharian. Kami percaya bahwa gaya terbaik adalah paduan antara material lembut bernapas, siluet longgar yang fungsional, serta palet warna netral yang menenangkan.\n\n` +
          `Kami mengawasi langsung pemilihan setiap bahan, potongan jahitan presisi, dan uji ketahanan untuk memastikan kenyamanan sepanjang hari di setiap rutinitas aktif Anda.`,
        sideImage:
          'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1200&auto=format&fit=crop&q=80',
        sideImagePosition: 'right',
        quoteText:
          'Kemurnian desain lahir saat semua elemen yang berlebihan dihilangkan, menyisakan kenyamanan murni dan keanggunan bentuk.',
        quoteAuthor: 'ATELIER TEAM 2026',
        isPublished: true,
      };
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
    <div
      className="min-h-screen font-sans antialiased selection:bg-[#111111] selection:text-[#F5F5F3] flex flex-col"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* ── 1. FIXED TOP NAVBAR ─────────────────────────────────────────── */}
      <header
        className="h-[80px] border-b border-[#DADADA] px-6 md:px-12 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md"
        style={{ backgroundColor: `${bgColor}f2` }}
      >
        {/* Left: Back to Home + Menu Trigger */}
        <div className="flex items-center gap-6">
          <Link
            href={`/${storeSlug}`}
            className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase opacity-60 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">KEMBALI KE TOKO</span>
          </Link>

          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] uppercase hover:opacity-75 transition-opacity"
          >
            <span>MENU</span>
          </button>
        </div>

        {/* Center: Monogram Brand Logo */}
        <Link
          href={`/${storeSlug}`}
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5"
        >
          <div className={`w-7 h-7 border border-current flex items-center justify-center ${fontHeadingClass} text-lg leading-none`}>
            {logoInitial}
          </div>
          <span className="text-[12px] font-bold tracking-[0.22em] uppercase hidden md:inline">
            {storeName}
          </span>
        </Link>

        {/* Right: Account & Cart */}
        <div className="flex items-center gap-6">
          {buyer ? (
            <Link
              href={`/${storeSlug}/account`}
              className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase hover:opacity-75 transition-opacity"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{buyer.fullName.split(' ')[0]}</span>
            </Link>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase opacity-60 hover:opacity-100 transition-opacity"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LOGIN</span>
            </button>
          )}

          <Link
            href={`/${storeSlug}/cart`}
            className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase hover:opacity-75 transition-opacity"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>BAG ({getTotalItems()})</span>
          </Link>
        </div>
      </header>

      {/* ── 2. DRAWER SIDEBAR MENU ───────────────────────────────────────── */}
      <div
        onClick={() => setIsMenuOpen(false)}
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-500 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        className={`fixed top-0 left-0 bottom-0 w-full sm:w-[380px] z-50 p-8 sm:p-12 flex flex-col justify-between transition-transform duration-500 ease-out border-r border-[#DADADA] ${
          isMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-[#DADADA] pb-4">
            <span className="text-[11px] uppercase tracking-[0.24em] font-medium opacity-60">
              NAVIGASI TOKO
            </span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-1 hover:opacity-60 transition-opacity"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col space-y-3">
            {navMenuItems.map((item: any) => (
              <a
                key={item.id || item.label}
                href={item.url}
                onClick={() => setIsMenuOpen(false)}
                className={`${fontHeadingClass} text-[36px] sm:text-[42px] leading-[0.95] tracking-[0.03em] uppercase hover:pl-2 transition-all`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="pt-8 border-t border-[#DADADA] text-[11px] uppercase tracking-[0.14em] opacity-60 flex justify-between">
          <span>{storeName}</span>
          <span>© 2026</span>
        </div>
      </aside>

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
    </div>
  );
}
