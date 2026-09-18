'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  User,
  ShoppingBag,
  ArrowRight,
  Instagram,
  Facebook,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  TemplateProps,
  Product,
  ProductVariant,
  CmsBranding,
  CmsHero,
  CmsNavigation,
  CmsSections,
  CmsHighlights,
} from './types';

export default function EditorialTemplate({
  storeSlug,
  store,
  buyer,
  onOpenCart,
  onOpenProfile,
  onAddToCart,
  getTotalItems,
}: TemplateProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Scroll listener for nav transparency -> solid
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    return store.products.filter((p) => {
      return selectedCategory === 'Semua' || p.category === selectedCategory;
    });
  }, [store.products, selectedCategory]);

  // Dynamic CMS Settings
  const cms = store.settings || {};
  const branding: CmsBranding = cms.branding || {};
  const hero: CmsHero = cms.hero || {};
  const navigation: CmsNavigation = cms.navigation || { menuItems: [] };
  const sections: CmsSections = cms.sections || {};
  const highlights: CmsHighlights = cms.highlights || {};

  const bgColor = branding.backgroundColor || '#F5F5F3';
  const textColor = branding.textColor || '#111111';
  const accentColor = branding.accentColor || '#059669';
  const fontHeadingClass = branding.fontHeading === 'playfair'
    ? 'font-serif'
    : branding.fontHeading === 'montserrat'
    ? 'font-sans font-black tracking-wide'
    : branding.fontHeading === 'inter'
    ? 'font-sans font-black'
    : 'font-bebas';

  const defaultNavMenuItems = [
    { id: 'm1', label: 'HOME', url: '#top' },
    { id: 'm2', label: 'SHOP', url: '#shop' },
    { id: 'm3', label: 'BAG', url: `/${storeSlug}/cart` },
    { id: 'm4', label: buyer ? 'ACCOUNT' : 'LOGIN', url: buyer ? `/${storeSlug}/account` : '#login' },
  ];
  const navMenuItems = navigation?.menuItems?.filter((item) =>
    item.enabled && (
      item.url === '#top' ||
      item.url === '#shop' ||
      item.url === `/${storeSlug}/cart` ||
      item.url === `/${storeSlug}/account` ||
      item.isExternal
    )
  );
  const visibleNavMenuItems = navMenuItems?.length ? navMenuItems : defaultNavMenuItems;

  // Hero Banner Carousel
  const bannerSlides: string[] = useMemo(() => {
    if (hero.bannerImages && hero.bannerImages.length > 0) {
      const valid = hero.bannerImages.filter(Boolean);
      if (valid.length > 0) return valid;
    }
    if (hero.bannerImage) {
      return [hero.bannerImage];
    }
    return [
      store.products[0]?.images[0] ||
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1600&auto=format&fit=crop&q=80',
    ];
  }, [hero.bannerImages, hero.bannerImage, store.products]);

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (bannerSlides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % bannerSlides.length);
    }, (hero.autoPlayInterval || 5) * 1000);
    return () => clearInterval(interval);
  }, [bannerSlides.length, hero.autoPlayInterval]);

  // First letter of store name for the monogram logo mark
  const logoInitial = store.storeName.charAt(0).toUpperCase();

  return (
    <div
      className="buyer-page min-h-screen font-sans antialiased selection:bg-[#111111] selection:text-[#F5F5F3]"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* ── 0. ANNOUNCEMENT BAR ─────────────────────────────────────── */}
      {sections.showAnnouncementBar !== false && (
        <div
          className="fixed top-0 left-0 right-0 z-50 text-[11px] font-medium py-1.5 px-4 text-center tracking-wider transition-all"
          style={{ backgroundColor: textColor, color: bgColor }}
        >
           {highlights.announcementText || store.storeName}
        </div>
      )}

      {/* ── 1. FIXED TOP NAVIGATION BAR (90px) ─────────────────────────── */}
      <header
        className={`fixed ${sections.showAnnouncementBar !== false ? 'top-[28px]' : 'top-0'} left-0 right-0 h-[90px] z-40 transition-all duration-500 flex items-center px-6 md:px-12 ${
          isScrolled
            ? 'backdrop-blur-md border-b border-[#DADADA] shadow-xs'
            : 'bg-gradient-to-b from-black/80 via-black/35 to-transparent text-white border-b border-white/10'
        }`}
        style={isScrolled ? { backgroundColor: `${bgColor}f2`, color: textColor } : {}}
      >
        {/* Left: Hamburger + Menu Label */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setIsMenuOpen(true)}
          className="flex items-center gap-3.5 cursor-pointer group select-none"
        >
          <div className="w-5 h-5 flex flex-col justify-center gap-[5px]">
            <span className="w-4 h-[1.5px] bg-current block transition-transform group-hover:translate-x-0.5" />
            <span className="w-4 h-[1.5px] bg-current block transition-transform group-hover:translate-x-1" />
            <span className="w-4 h-[1.5px] bg-current block transition-transform group-hover:translate-x-0.5" />
          </div>
          <span className="text-[12px] font-semibold tracking-[0.24em] uppercase">
            MENU
          </span>
        </button>

        {/* Center: Monogram Logo Mark & Store Name */}
        <Link
          href={`/${storeSlug}`}
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 group select-none"
        >
          <div
            className={`w-[30px] h-[30px] border flex items-center justify-center ${fontHeadingClass} text-xl leading-none transition-colors ${
              isScrolled ? 'border-current' : 'border-white/60 text-white'
            }`}
          >
            {logoInitial}
          </div>
          <span className="text-[12px] font-bold tracking-[0.22em] uppercase whitespace-nowrap hidden sm:inline">
            {store.storeName}
          </span>
        </Link>

        {/* Right: Login/Profile & Cart */}
        <div className="ml-auto flex items-center gap-6 sm:gap-8">
          {/* Login / Profile */}
          {buyer ? (
            <Link
              href={`/${storeSlug}/account`}
              className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.22em] uppercase hover:opacity-75 transition-opacity"
            >
              <User className="w-4 h-4 stroke-[1.6]" />
              <span className="hidden sm:inline">
                {buyer.fullName.split(' ')[0]}
              </span>
            </Link>
          ) : (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.22em] uppercase hover:opacity-75 transition-opacity"
            >
              <User className="w-4 h-4 stroke-[1.6]" />
              <span className="hidden sm:inline">LOGIN</span>
            </button>
          )}

          {/* Cart Bag */}
          <Link
            href={`/${storeSlug}/cart`}
            className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.22em] uppercase hover:opacity-75 transition-opacity relative"
          >
            <ShoppingBag className="w-4 h-4 stroke-[1.6]" />
            <span>BAG ({getTotalItems()})</span>
          </Link>
        </div>
      </header>

      {/* ── 2. LEFT SLIDE-OUT DRAWER MENU ─────────────────────────────── */}
      {/* Backdrop Overlay */}
      <div
        onClick={() => setIsMenuOpen(false)}
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-500 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-[min(420px,92vw)] border-r border-[#DADADA] z-50 flex flex-col justify-between p-8 md:p-10 transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.2,1)] ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <div>
          {/* Close button */}
          <div className="flex justify-end mb-8">
            <button
              onClick={() => setIsMenuOpen(false)}
              aria-label="Tutup Menu"
              className="p-2 -mr-2 text-2xl hover:opacity-70 transition-opacity"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Big Editorial Menu Items */}
          <nav className="flex flex-col space-y-2.5">
            {visibleNavMenuItems.map((item: any) => {
              const isLoginTrigger = item.url === '#login' || item.label === 'LOGIN';
              return (
                <a
                  key={item.id || item.label}
                  href={item.url}
                  onClick={(e) => {
                    if (isLoginTrigger && !buyer) {
                      e.preventDefault();
                      setIsMenuOpen(false);
                      onOpenProfile();
                    } else {
                      setIsMenuOpen(false);
                    }
                  }}
                  className={`${fontHeadingClass} text-[38px] sm:text-[44px] leading-[0.95] tracking-[0.03em] uppercase hover:pl-2 transition-all duration-300`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Drawer Bottom */}
        <div className="pt-8 border-t border-[#DADADA] space-y-4">
          <div className="flex items-center gap-5">
            {navigation?.socialLinks?.instagram && (
              <a href={navigation.socialLinks.instagram} target="_blank" rel="noreferrer" className="hover:opacity-70">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {navigation?.socialLinks?.whatsapp && (
              <a href={`https://wa.me/${navigation.socialLinks.whatsapp}`} target="_blank" rel="noreferrer" className="hover:opacity-70 font-mono text-xs font-bold">
                WA
              </a>
            )}
            {navigation?.socialLinks?.tiktok && (
              <a href={navigation.socialLinks.tiktok} target="_blank" rel="noreferrer" className="hover:opacity-70 font-mono text-xs font-bold">
                TIKTOK
              </a>
            )}
          </div>
          <div className="text-[11px] uppercase tracking-[0.14em] opacity-60 flex justify-between">
            <span>{store.storeName}</span>
            <span>© 2026</span>
          </div>
        </div>
      </aside>

       {/* ── 3. HERO SECTION ────────────────────────────────────────────── */}
      {sections.showHero !== false && (
        <section id="top" className="relative">
          {/* Editorial Banner Carousel starting from top: 0 behind the navbar */}
          <div className="relative w-full h-[58vh] sm:h-[68vh] md:h-[78vh] min-h-[460px] overflow-hidden bg-stone-900 group">
            {bannerSlides.map((slideUrl, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  activeSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={slideUrl}
                  alt={`${store.storeName} Banner ${idx + 1}`}
                  className="w-full h-full object-cover object-center filter contrast-[1.05] saturate-[0.92]"
                />
              </div>
            ))}

            {/* Subtle gradient vignette for top navbar contrast and bottom text contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/15 to-black/60 pointer-events-none z-20" />
            
            {/* Small badge at bottom left of banner */}
            <div className="absolute bottom-6 left-6 md:left-12 text-white/90 text-[11px] uppercase tracking-[0.24em] font-medium z-30">
               {hero.badgeText || store.storeName}
            </div>

            {/* Carousel Controls (Prev/Next & Slide Dots) if multiple slides */}
            {bannerSlides.length > 1 && (
              <>
                {/* Arrow Controls */}
                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
                  className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlide((prev) => (prev + 1) % bannerSlides.length)}
                  className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Bottom Right Carousel Pagination Indicators */}
                <div className="absolute bottom-6 right-6 md:right-12 z-30 flex items-center gap-3 bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/15">
                  <span className="text-[10px] tracking-[0.2em] font-mono text-white/80 font-bold">
                    0{activeSlide + 1} / 0{bannerSlides.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {bannerSlides.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => setActiveSlide(dotIdx)}
                        className={`h-1.5 rounded-full transition-all ${
                          activeSlide === dotIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${dotIdx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Hero Title & Editorial Statement Block */}
          <div className="max-w-4xl mx-auto px-6 pt-12 pb-16 text-center">
            <div className="text-[12px] font-semibold tracking-[0.28em] uppercase mb-4 opacity-60">
               {hero.badgeText || 'NEW COLLECTION'}
            </div>

            <h1 className={`${fontHeadingClass} text-[68px] sm:text-[104px] md:text-[148px] lg:text-[180px] leading-[0.8] tracking-tight uppercase my-2`}>
              {hero.headline || store.storeName}
            </h1>

            <p className="text-sm md:text-base font-medium mt-6 mb-3 tracking-wide">
              {store.tagline || 'Minimal wardrobe curated for modern individuals.'}
            </p>

            <p className="text-xs md:text-sm max-w-2xl mx-auto leading-relaxed opacity-70">
              {hero.description || ''}
            </p>

            <div className="flex items-center justify-center gap-8 mt-8 flex-wrap">
               <a href={hero.ctaLink || '#shop'} className="editorial-link">
                {hero.ctaText || 'SHOP PRODUCTS →'}
              </a>
            </div>
          </div>
        </section>
      )}

       {/* ── 4. CATALOG / SHOP GRID SECTION ─────────────────────────────── */}
      {sections.showFeaturedProducts !== false && (
        <section id="shop" className="max-w-6xl mx-auto px-6 md:px-10 py-16 border-t border-[#DADADA]">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 pb-6">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.22em] opacity-60 uppercase block mb-1">
                 SHOP
              </span>
              <h2 className={`${fontHeadingClass} text-5xl md:text-6xl tracking-wide uppercase`}>
                 PRODUCTS
              </h2>
            </div>
            <p className="text-xs opacity-60">
               <span className="font-bold opacity-100">{filteredProducts.length}</span> products
            </p>
          </div>

          {/* Minimalist Category Filter Underlines */}
          <div className="flex items-center gap-6 overflow-x-auto pb-4 mb-8 border-b border-[#DADADA]">
            {store.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs uppercase tracking-[0.16em] whitespace-nowrap pb-1 transition-all ${
                  selectedCategory === cat
                    ? 'font-bold border-b-2 border-current'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid: 3-column editorial 3:4 aspect ratio */}
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-[#DADADA] p-8 space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wider opacity-80">
                Belum ada produk di kategori ini
              </p>
              <p className="text-xs opacity-50">
                Pilih kategori lain atau kembali ke Semua untuk melihat seluruh katalog toko.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory('Semua')}
                className="mt-3 inline-block text-xs uppercase tracking-widest font-bold border-b border-current pb-0.5 hover:opacity-75"
              >
                Tampilkan Semua Produk
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group flex flex-col justify-between">
                <div>
                  {/* Image Container with 3:4 aspect ratio linking to full page */}
                  <Link
                    href={`/${storeSlug}/products/${product.slug}`}
                    className="relative aspect-[3/4] bg-stone-100 overflow-hidden block"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover object-center filter contrast-[1.03] saturate-[0.95] group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {product.compare_at_price && (
                      <span className="absolute top-3 left-3 bg-[#111111] text-[#F5F5F3] text-[10px] uppercase tracking-wider font-bold px-2 py-1">
                        SALE
                      </span>
                    )}
                  </Link>

                  {/* Meta details */}
                  <div className="pt-4 space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-[0.16em] opacity-60">
                        {product.category}
                      </p>
                      <span className="text-xs font-semibold">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <Link href={`/${storeSlug}/products/${product.slug}`} className="block">
                      <h3 className="text-xs font-bold uppercase tracking-[0.06em] hover:opacity-75 transition-opacity leading-snug">
                        {product.title}
                      </h3>
                    </Link>

                    <p className="text-xs opacity-60 line-clamp-2 leading-relaxed pt-1">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Action */}
                <div className="pt-4 flex items-center justify-between border-t border-[#DADADA] mt-4">
                  <Link
                    href={`/${storeSlug}/products/${product.slug}`}
                    className="editorial-link text-[11px]"
                  >
                     VIEW →
                  </Link>
                  <button
                    onClick={() => onAddToCart(product, product.variants[0])}
                    className="text-[11px] uppercase tracking-[0.14em] font-semibold hover:underline"
                  >
                     ADD TO BAG
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </section>
      )}

       {/* ── 5. ABOUT SECTION ───────────────────────────────────────────── */}
       {sections.showAbout !== false && (
         <section id="about" className="max-w-6xl mx-auto px-6 md:px-10 py-14 border-t border-[#DADADA]">
           <h2 className={`${fontHeadingClass} text-5xl md:text-6xl tracking-wide uppercase`}>
             {highlights.aboutHeading || `ABOUT ${store.storeName}`}
           </h2>
           {highlights.aboutStory && (
             <p className="mt-5 max-w-2xl text-sm opacity-70 leading-relaxed whitespace-pre-line">
               {highlights.aboutStory}
             </p>
           )}
         </section>
       )}
       {/* ── 6. FOOTER ─────────────────────────────────────────────────── */}
      <footer className="border-t border-[#DADADA] px-6 md:px-10 py-12" style={{ backgroundColor: bgColor }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-md space-y-2">
            <h3 className={`${fontHeadingClass} text-3xl uppercase tracking-wide`}>
              {store.storeName}
            </h3>
            {store.tagline && <p className="text-xs opacity-60 leading-relaxed">{store.tagline}</p>}
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs uppercase tracking-[0.16em]">
            <a href="#top" className="hover:opacity-70">HOME</a>
            <a href="#shop" className="hover:opacity-70">SHOP</a>
            <a href="#about" className="hover:opacity-70">ABOUT</a>
            <Link href={`/${storeSlug}/cart`} className="hover:opacity-70">BAG</Link>
            <Link href={`/${storeSlug}/account`} className="hover:opacity-70">ACCOUNT</Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 mt-8 border-t border-[#DADADA] text-[11px] opacity-60 uppercase tracking-[0.14em] flex flex-col sm:flex-row justify-between gap-4">
          <span>© 2026 {store.storeName}. All rights reserved.</span>
          <span>Secured with Xendit Escrow & Biteship Logistics</span>
        </div>
      </footer>
    </div>
  );
}
