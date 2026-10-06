'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Sparkles, SlidersHorizontal } from 'lucide-react';
import { StoreData, Product } from '@/components/templates/types';
import BuyerTopBar from './BuyerTopBar';
import BuyerBottomNav from './BuyerBottomNav';
import BuyerProductCard from './BuyerProductCard';
import { UniversalImage } from '@/components/templates/ImagePlaceholder';
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

  // 1. Categories (Universal - No Gender)
  const rawCategories = store.categories || [];
  const categories = ['Semua', ...rawCategories.filter((c) => c !== 'Semua')];
  const [activeCategory, setActiveCategory] = useState('Semua');

  // 2. Banner
  const bannerImage = hero.bannerImage || (hero.bannerImages && hero.bannerImages[0]) || null;
  const heroTitle = hero.headline || settings.branding?.tagline || store.tagline || 'Koleksi Pilihan Terbaik';
  const heroSubtitle = hero.description || 'Temukan produk berkualitas dengan kurasi terbaik untuk kebutuhan Anda.';

  // 3. Products
  const allProducts: Product[] = store.products || [];

  const filteredProducts = activeCategory === 'Semua'
    ? allProducts
    : allProducts.filter((p) => p.category?.toLowerCase() === activeCategory.toLowerCase());

  // Split into trending / newest for richer layout
  const trendingProducts = filteredProducts.slice(0, 8);
  const secondaryProducts = filteredProducts.slice(8);

  return (
    <div className="min-h-screen bg-stone-50/50 text-neutral-900 flex flex-col font-sans antialiased pb-28 md:pb-16">
      {/* ── 1. Top Bar: Search Bar + Chat + Keranjang (Mobile & Desktop) ── */}
      <BuyerTopBar
        storeSlug={storeSlug}
        storeName={store.storeName}
        phoneNumber={store.phone_number}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-3 sm:pt-6">
        {/* ── 2. Editorial Hero Banner (Mobile & Desktop Clean Luxury) ── */}
        <section className="relative rounded-3xl overflow-hidden border border-neutral-200/60 shadow-xs bg-linear-to-br from-neutral-100 to-stone-200">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[220px] sm:min-h-[320px]">
            {/* Banner Text / CTA */}
            <div className="p-6 sm:p-10 md:col-span-7 flex flex-col justify-center space-y-3 sm:space-y-4 z-10">
              <div className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs text-[11px] font-bold text-neutral-800 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Koleksi Unggulan</span>
              </div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 leading-tight">
                {heroTitle}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 max-w-md leading-relaxed">
                {heroSubtitle}
              </p>
              <div className="pt-1">
                <Link
                  href={`/${storeSlug}/shop`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all"
                >
                  <span>Belanja Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Banner Visual / Fallback */}
            <div className="relative h-44 sm:h-64 md:h-full md:col-span-5 overflow-hidden flex items-center justify-center">
              <UniversalImage
                src={bannerImage}
                alt={heroTitle}
                fallbackText="Banner Toko"
                aspectRatio="auto"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* ── 3. Category Bar (Universal Horizontal Pills) ── */}
        {categories.length > 1 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Kategori Pilihan
              </h2>
              <Link
                href={`/${storeSlug}/shop`}
                className="text-xs font-semibold text-neutral-700 hover:text-black flex items-center gap-1"
              >
                <span>Semua</span>
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
                    className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-white border border-neutral-200/80 text-neutral-700 hover:border-neutral-400'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 4. Main Product Grid (2 Kolom Mobile, 3-4 Kolom Desktop) ── */}
        <section className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-xl font-extrabold text-neutral-900">
                {activeCategory === 'Semua' ? 'Produk Pilihan' : `Kategori: ${activeCategory}`}
              </h2>
              <p className="text-xs text-neutral-500">
                {filteredProducts.length} produk tersedia
              </p>
            </div>

            <Link
              href={`/${storeSlug}/shop`}
              className="text-xs font-bold text-neutral-700 hover:text-black flex items-center gap-1"
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
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

        {/* ── 5. Minimalist Footer Info (Quiet Luxury Touch) ── */}
        <footer className="pt-8 pb-4 border-t border-neutral-200/70 text-center space-y-2">
          <p className="text-xs font-bold text-neutral-800 tracking-wider uppercase">
            {store.storeName}
          </p>
          <p className="text-[11px] text-neutral-400 max-w-md mx-auto">
            {store.tagline || 'Pengalaman berbelanja online yang cepat, aman, dan terpercaya.'}
          </p>
          <p className="text-[10px] text-neutral-400 pt-2">
            Powered by Alurelab E-Commerce Platform
          </p>
        </footer>
      </main>

      {/* ── 6. Floating Bottom Navigation Bar (Mobile Pill) ── */}
      <BuyerBottomNav storeSlug={storeSlug} />
    </div>
  );
}
