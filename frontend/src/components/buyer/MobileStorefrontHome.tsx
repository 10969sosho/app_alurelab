'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles, Tag, Flame, Star, Truck } from 'lucide-react';
import { StoreData, Product } from '@/components/templates/types';
import BuyerTopBar from './BuyerTopBar';
import BuyerBottomNav from './BuyerBottomNav';
import BuyerProductCard from './BuyerProductCard';
import { toast } from 'sonner';

interface MobileStorefrontHomeProps {
  storeSlug: string;
  store: StoreData;
}

export default function MobileStorefrontHome({
  storeSlug,
  store: initialStore,
}: MobileStorefrontHomeProps) {
  const store = initialStore;
  const settings = store.settings || {};
  const highlights = settings.highlights || {};
  const hero = settings.hero || {};

  // 1. Promo Buttons from Seller (CMS or Smart Fallback)
  const promoButtons: string[] =
    settings.promos && Array.isArray(settings.promos) && settings.promos.length > 0
      ? settings.promos
      : [
          '🚚 Gratis Ongkir Rp0',
          '⚡ Diskon 50% Khusus Hari Ini',
          '🎟️ Voucher Toko Rp 25.000',
          '🛡️ Jaminan Produk 100% Asli',
        ];

  // 2. Categories
  const categories = store.categories || ['Semua'];
  const [activeCategory, setActiveCategory] = useState('Semua');

  // 3. Carousel Banners
  const defaultBanners = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&auto=format&fit=crop&q=80',
  ];

  const banners =
    hero.bannerImages && hero.bannerImages.length > 0
      ? hero.bannerImages
      : hero.bannerImage
      ? [hero.bannerImage]
      : defaultBanners;

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  // Auto slide carousel every 4s
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // 4. Products Splitting for Highlights
  const allProducts = store.products || [];

  // Highlight A (e.g. Produk Terlaris / CMS Section A)
  const highlightATitle =
    highlights.sectionA_title || highlights.highlightA_title || '🔥 Produk Terlaris';
  const highlightASubtitle =
    highlights.sectionA_subtitle || 'Favorit paling banyak dicari pembeli';
  
  // Highlight B (e.g. Produk Terbaru / CMS Section B)
  const highlightBTitle =
    highlights.sectionB_title || highlights.highlightB_title || '✨ Produk Terbaru';
  const highlightBSubtitle =
    highlights.sectionB_subtitle || 'Koleksi pilihan rilis teranyar';

  // Smart partition for A and B
  const productsA = allProducts.slice(0, 4);
  const productsB = allProducts.length > 4 ? allProducts.slice(4, 10) : allProducts.slice(0, 4);

  // Optional extra highlight sections (C, D, E from CMS)
  const extraSections: Array<{ title: string; subtitle?: string; products: Product[] }> =
    highlights.extraSections && Array.isArray(highlights.extraSections)
      ? highlights.extraSections
      : [];

  const handlePromoClick = (promoText: string) => {
    toast.success(`Promo Diaktifkan: ${promoText}`, {
      description: 'Potongan akan otomatis diterapkan saat checkout.',
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 flex flex-col font-sans antialiased pb-20">
      {/* ── 1. Top Bar: Search Bar + Chat + Keranjang ── */}
      <BuyerTopBar
        storeSlug={storeSlug}
        storeName={store.storeName}
        phoneNumber={store.phone_number}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto space-y-4 pt-2">
        {/* ── 2. Tombol-tombol Promo dari Seller (Horizontal Scroll) ── */}
        <section className="px-3 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {promoButtons.map((promo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromoClick(promo)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200/90 text-amber-900 text-[11px] font-bold shadow-2xs hover:shadow-xs active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>{promo}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 3. Kategori List dari Seller ── */}
        <section className="px-3 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <Link
                  key={cat}
                  href={`/${storeSlug}/shop?cat=${encodeURIComponent(cat)}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-100'
                  }`}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── 4. Banner A Carousel (Bisa Carousel) ── */}
        <section className="px-3 sm:px-6">
          <div className="relative rounded-2xl overflow-hidden shadow-xs bg-stone-200 aspect-[21/9] sm:aspect-[24/9]">
            {banners.map((bannerUrl, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  idx === activeBannerIdx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={bannerUrl}
                  alt={`Promo Banner ${idx + 1}`}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-300">
                    Spesial Penawaran Toko
                  </span>
                  <h2 className="text-base sm:text-2xl font-black leading-tight drop-shadow-xs">
                    {hero.headline || store.tagline || store.storeName}
                  </h2>
                </div>
              </div>
            ))}

            {/* Carousel Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-2.5 right-3 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-full">
                {banners.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => setActiveBannerIdx(dotIdx)}
                    className={`h-1.5 rounded-full transition-all ${
                      dotIdx === activeBannerIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                    aria-label={`Slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── 5. Section Card Produk Highlight A (Bisa diatur di CMS) ── */}
        <section className="px-3 sm:px-6 pt-2">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-950 flex items-center gap-1.5">
                {highlightATitle}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                {highlightASubtitle}
              </p>
            </div>
            <Link
              href={`/${storeSlug}/shop`}
              className="text-xs font-bold text-slate-800 hover:text-black flex items-center gap-0.5 shrink-0"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 2 Card Kanan Kiri */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
            {productsA.map((prod) => (
              <BuyerProductCard
                key={prod.id}
                product={prod}
                storeSlug={storeSlug}
              />
            ))}
          </div>
        </section>

        {/* ── 6. Section Card Produk Highlight B (Bisa diatur di CMS) ── */}
        <section className="px-3 sm:px-6 pt-3">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-950 flex items-center gap-1.5">
                {highlightBTitle}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                {highlightBSubtitle}
              </p>
            </div>
            <Link
              href={`/${storeSlug}/shop`}
              className="text-xs font-bold text-slate-800 hover:text-black flex items-center gap-0.5 shrink-0"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 2 Card Kanan Kiri */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
            {productsB.map((prod) => (
              <BuyerProductCard
                key={prod.id}
                product={prod}
                storeSlug={storeSlug}
              />
            ))}
          </div>
        </section>

        {/* ── 7. Extensible Highlight C, D, E (Jika diatur di CMS) ── */}
        {extraSections.map((sec, sIdx) => (
          <section key={sIdx} className="px-3 sm:px-6 pt-3">
            <div className="flex items-end justify-between mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-950 flex items-center gap-1.5">
                  {sec.title}
                </h3>
                {sec.subtitle && (
                  <p className="text-[11px] text-stone-500 font-medium">
                    {sec.subtitle}
                  </p>
                )}
              </div>
              <Link
                href={`/${storeSlug}/shop`}
                className="text-xs font-bold text-slate-800 hover:text-black flex items-center gap-0.5 shrink-0"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
              {sec.products.map((prod) => (
                <BuyerProductCard
                  key={prod.id}
                  product={prod}
                  storeSlug={storeSlug}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Store Trust / Guarantee Footer Mini */}
        <section className="px-3 sm:px-6 pt-6 pb-4">
          <div className="bg-white rounded-xl border border-stone-200/80 p-4 grid grid-cols-2 gap-3 text-center">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-900">🛡️ Belanja Aman</div>
              <p className="text-[10px] text-stone-500">Escrow resmi Xendit & WhatsApp verified</p>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-900">🚚 Kurir Lengkap</div>
              <p className="text-[10px] text-stone-500">JNE, J&T, SiCepat & Anteraja real-time</p>
            </div>
          </div>
        </section>
      </main>

      {/* ── 8. Sticky Bottom Navigation: HOME, PRODUK, TRANSAKSI, AKUN ── */}
      <BuyerBottomNav storeSlug={storeSlug} />
    </div>
  );
}
