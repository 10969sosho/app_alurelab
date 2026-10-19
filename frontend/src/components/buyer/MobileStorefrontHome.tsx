'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Sparkles, MessageCircle, Instagram, ShieldCheck, Truck, Headphones } from 'lucide-react';
import { StoreData, Product } from '@/components/templates/types';
import BuyerTopBar from './BuyerTopBar';
import BuyerBottomNav from './BuyerBottomNav';
import BuyerProductCard from './BuyerProductCard';
import { UniversalImage } from '@/components/templates/ImagePlaceholder';

interface MobileStorefrontHomeProps {
  storeSlug: string;
  store: StoreData;
}

const FONT_CLASSES: Record<string, string> = {
  bebas: 'font-black tracking-tight uppercase',
  playfair: 'font-serif italic tracking-normal',
  montserrat: 'font-extrabold tracking-tight uppercase',
  inter: 'font-semibold tracking-normal',
  serif: 'font-serif tracking-normal',
};

export default function MobileStorefrontHome({
  storeSlug,
  store: initialStore,
}: MobileStorefrontHomeProps) {
  const store = initialStore;
  const settings = store.settings || {};
  const branding = settings.branding || {};
  const hero = settings.hero || {};
  const sections = settings.sections || {};
  const highlights = settings.highlights || {};
  const social = settings.navigation?.socialLinks || {};

  // Theme Variables
  const primaryColor = branding.primaryColor || '#111111';
  const accentColor = branding.accentColor || '#C8FF3D';
  const bgColor = branding.backgroundColor || '#FAF9F6';
  const textColor = branding.textColor || '#111111';
  const fontHeadingKey = branding.fontHeading || 'inter';
  const fontHeadingClass = FONT_CLASSES[fontHeadingKey] || 'font-bold';

  // 1. Categories
  const rawCategories = store.categories || [];
  const categories = ['Semua', ...rawCategories.filter((c) => c !== 'Semua')];
  const [activeCategory, setActiveCategory] = useState('Semua');

  // 2. Banner & Hero
  const bannerImage = hero.bannerImage || (hero.bannerImages && hero.bannerImages[0]) || null;
  const heroTitle = hero.headline || branding.storeName || store.storeName || 'Koleksi Pilihan Terbaik';
  const heroSubtitle = hero.description || branding.tagline || store.tagline || 'Temukan produk berkualitas dengan kurasi terbaik untuk kebutuhan Anda.';
  const ctaText = hero.ctaText || 'Belanja Sekarang';
  const ctaRawLink = hero.ctaLink || '/shop';
  const ctaLink = ctaRawLink.startsWith('http')
    ? ctaRawLink
    : `/${storeSlug}${ctaRawLink.startsWith('/') ? (ctaRawLink === '/' ? '' : ctaRawLink) : `/${ctaRawLink}`}`;

  // 3. Products
  const allProducts: Product[] = store.products || [];

  // Filtered Products for Catalog
  const filteredProducts = activeCategory === 'Semua'
    ? allProducts
    : allProducts.filter((p) => p.category?.toLowerCase() === activeCategory.toLowerCase());

  // 4. Featured Products (Section Produk Unggulan)
  const featuredProducts = useMemo(() => {
    const featCat = highlights.featuredCategory || 'Semua';
    const featCount = Math.max(1, Number(highlights.featuredCount) || 4);

    let list = allProducts;
    if (featCat !== 'Semua') {
      const matched = allProducts.filter((p) => p.category?.toLowerCase() === featCat.toLowerCase());
      if (matched.length > 0) list = matched;
    }
    return list.slice(0, featCount);
  }, [allProducts, highlights.featuredCategory, highlights.featuredCount]);

  const showAnnouncement = sections.showAnnouncementBar !== false && Boolean(highlights.announcementText);
  const showHero = sections.showHero !== false;
  const showFeatured = sections.showFeaturedProducts !== false && featuredProducts.length > 0;
  const showAbout = sections.showAbout !== false;

  return (
    <div
      className="min-h-screen flex flex-col font-sans antialiased pb-28 md:pb-16 transition-colors duration-200"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* ── 0. Announcement Bar (Top of storefront) ── */}
      {showAnnouncement && (
        <div
          className="w-full text-center py-2 px-4 text-[11px] sm:text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-xs transition-colors"
          style={{ backgroundColor: primaryColor, color: '#FAFAF8' }}
        >
          <span>{highlights.announcementText}</span>
        </div>
      )}

      {/* ── 1. Top Bar: Search Bar + Chat + Keranjang (Mobile & Desktop) ── */}
      <BuyerTopBar
        storeSlug={storeSlug}
        storeName={branding.storeName || store.storeName}
        phoneNumber={store.phone_number}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8 md:space-y-12 pt-3 sm:pt-6 md:pt-10">
        {/* ── 2. Hero Banner (Sesuai Konfigurasi CMS) ── */}
        {showHero && (
          <section className="relative overflow-hidden rounded-3xl border border-neutral-200/70 shadow-sm bg-linear-to-br from-neutral-100 via-white to-stone-100">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[240px] sm:min-h-[340px] md:min-h-[480px]">
              {/* Banner Text / CTA */}
              <div className="p-6 sm:p-10 md:col-span-6 lg:col-span-5 md:pl-12 lg:pl-16 md:py-16 flex flex-col justify-center space-y-3 sm:space-y-5 z-10">
                <div
                  className="inline-flex items-center gap-1.5 self-start px-3.5 py-1 rounded-full text-[11px] font-bold shadow-2xs"
                  style={{ backgroundColor: `${accentColor}40`, color: primaryColor }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Koleksi Pilihan</span>
                </div>
                <h1
                  className={`text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight max-w-xl ${fontHeadingClass}`}
                  style={{ color: textColor }}
                >
                  {heroTitle}
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-neutral-600 max-w-md leading-relaxed">
                  {heroSubtitle}
                </p>
                <div className="pt-1">
                  <Link
                    href={ctaLink}
                    className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-200"
                    style={{ backgroundColor: primaryColor, color: accentColor }}
                  >
                    <span>{ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Banner Visual / Fallback */}
              <div className="relative h-48 sm:h-64 md:h-[420px] lg:h-[460px] md:col-span-6 lg:col-span-7 md:my-5 md:mr-5 overflow-hidden flex items-center justify-center md:rounded-2xl">
                <UniversalImage
                  src={bannerImage}
                  alt={heroTitle}
                  fallbackText="Banner Toko"
                  aspectRatio="auto"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.025]"
                />
              </div>
            </div>
          </section>
        )}

        {/* ── 3. Featured Products Section (Produk Unggulan) ── */}
        {showFeatured && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className={`text-base sm:text-2xl font-bold ${fontHeadingClass}`} style={{ color: textColor }}>
                  PRODUK UNGGULAN
                </h2>
                {highlights.featuredCategory && highlights.featuredCategory !== 'Semua' && (
                  <span
                    className="text-[10px] sm:text-xs font-bold rounded-full px-2.5 py-0.5 border"
                    style={{ backgroundColor: `${accentColor}30`, borderColor: `${primaryColor}20`, color: textColor }}
                  >
                    {highlights.featuredCategory}
                  </span>
                )}
              </div>
              <Link
                href={`/${storeSlug}/shop`}
                className="text-xs font-bold hover:opacity-75 flex items-center gap-1"
                style={{ color: textColor }}
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-7">
              {featuredProducts.map((product) => (
                <BuyerProductCard
                  key={product.id}
                  product={product}
                  storeSlug={storeSlug}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Category Bar (Universal Horizontal Pills) ── */}
        {categories.length > 1 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Kategori Pilihan
              </h2>
              <Link
                href={`/${storeSlug}/shop`}
                className="text-xs font-semibold hover:opacity-75 flex items-center gap-1"
                style={{ color: textColor }}
              >
                <span>Semua Kategori</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer"
                    style={
                      isActive
                        ? { backgroundColor: primaryColor, color: accentColor, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
                        : { backgroundColor: '#ffffff', color: textColor, border: '1px solid rgba(0,0,0,0.1)' }
                    }
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 5. Main Product Grid ── */}
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-base sm:text-xl font-bold ${fontHeadingClass}`} style={{ color: textColor }}>
                {activeCategory === 'Semua' ? 'Katalog Produk' : `Kategori: ${activeCategory}`}
              </h2>
              <p className="text-xs text-neutral-500">
                {filteredProducts.length} produk tersedia
              </p>
            </div>

            <Link
              href={`/${storeSlug}/shop`}
              className="text-xs font-bold hover:opacity-75 flex items-center gap-1"
              style={{ color: textColor }}
            >
              <span>Katalog Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-neutral-800">Belum Ada Produk</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Produk untuk kategori ini sedang disiapkan oleh pemilik toko.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-7">
              {filteredProducts.map((product) => (
                <BuyerProductCard
                  key={product.id}
                  product={product}
                  storeSlug={storeSlug}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── 6. About Toko / Brand Story (Sesuai Konfigurasi CMS) ── */}
        {showAbout && (
          highlights.aboutHeading || highlights.aboutStory ? (
            <section
              className="rounded-3xl border p-6 sm:p-10 md:p-12 space-y-4 shadow-xs"
              style={{
                backgroundColor: '#ffffff',
                borderColor: `${primaryColor}15`,
              }}
            >
              <h2
                className={`text-lg sm:text-2xl md:text-3xl font-bold ${fontHeadingClass}`}
                style={{ color: textColor }}
              >
                {highlights.aboutHeading || 'TENTANG TOKO KAMI'}
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-neutral-600 leading-relaxed whitespace-pre-line max-w-3xl">
                {highlights.aboutStory}
              </p>
            </section>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-3 border-y border-neutral-200/80 py-6 md:py-8 divide-y md:divide-y-0 md:divide-x divide-neutral-200/80">
              {[
                { number: '01', title: 'Kurasi dengan cermat', description: 'Setiap produk dipilih untuk kualitas dan pengalaman terbaik bagi Anda.', icon: ShieldCheck },
                { number: '02', title: 'Pengiriman Cepat & Aman', description: 'Didukung multi-kurir terpercaya dengan pelacakan resi instan.', icon: Truck },
                { number: '03', title: 'Layanan Responsif', description: 'Chat langsung dengan kami untuk konsultasi dan bantuan pemesanan.', icon: Headphones },
              ].map(({ number, title, description, icon: Icon }) => (
                <div key={number} className="flex gap-4 px-0 md:px-7 py-4 md:py-0 first:md:pl-0 last:md:pr-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${accentColor}40`, color: primaryColor }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
                    <p className="max-w-sm text-xs leading-relaxed text-neutral-500">{description}</p>
                  </div>
                </div>
              ))}
            </section>
          )
        )}

        {/* ── 7. Footer: Brand, Social Links, & Alurelab Touch ── */}
        <footer
          className="rounded-3xl p-8 sm:p-10 text-center space-y-4 transition-colors"
          style={{ backgroundColor: primaryColor, color: '#FAFAF8' }}
        >
          <p className={`text-base sm:text-lg font-bold tracking-wider uppercase ${fontHeadingClass}`}>
            {branding.storeName || store.storeName}
          </p>
          <p className="text-xs text-neutral-300 max-w-md mx-auto">
            {branding.tagline || store.tagline || 'Pengalaman berbelanja online yang cepat, aman, dan terpercaya.'}
          </p>

          {/* Social Links */}
          {(social.instagram || social.whatsapp || social.tiktok) && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {social.whatsapp && (
                <a
                  href={`https://wa.me/${social.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
              )}
              {social.instagram && (
                <a
                  href={social.instagram.startsWith('http') ? social.instagram : `https://instagram.com/${social.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-xs transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-400" />
                  <span>Instagram</span>
                </a>
              )}
              {social.tiktok && (
                <a
                  href={social.tiktok.startsWith('http') ? social.tiktok : `https://tiktok.com/@${social.tiktok.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-xs transition-colors"
                >
                  <span className="text-xs font-bold">♪</span>
                  <span>TikTok</span>
                </a>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-white/10 text-[10px] text-neutral-400">
            <p>© {new Date().getFullYear()} {branding.storeName || store.storeName} • Ditenagai oleh ALURELAB E-Commerce</p>
          </div>
        </footer>
      </main>

      {/* ── 8. Floating Bottom Navigation Bar (Mobile Pill) ── */}
      <BuyerBottomNav storeSlug={storeSlug} />
    </div>
  );
}
