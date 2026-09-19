'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, ArrowUpDown, Tag, PackageSearch } from 'lucide-react';
import { Product, StoreData } from '@/components/templates/types';
import BuyerTopBar from './BuyerTopBar';
import BuyerBottomNav from './BuyerBottomNav';
import BuyerProductCard from './BuyerProductCard';

function ShopPageContent({
  storeSlug,
  store,
}: {
  storeSlug: string;
  store: StoreData;
}) {
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get('cat') || 'Semua';
  const initialSearchParam = searchParams.get('q') || '';

  const [category, setCategory] = useState(initialCategoryParam);
  const [query, setQuery] = useState(initialSearchParam);
  const [sortBy, setSortBy] = useState<'populer' | 'terbaru' | 'termurah' | 'termahal'>('populer');

  // Sync if URL query params change
  useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('cat');
    if (q !== null) setQuery(q);
    if (cat !== null) setCategory(cat);
  }, [searchParams]);

  const categories = store.categories || ['Semua'];

  // Filter & Sort Logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = (store.products || []).filter((prod) => {
      const matchCat = category === 'Semua' || prod.category === category;
      const matchQuery =
        !query ||
        prod.title.toLowerCase().includes(query.toLowerCase()) ||
        prod.category.toLowerCase().includes(query.toLowerCase()) ||
        (prod.description && prod.description.toLowerCase().includes(query.toLowerCase()));
      return matchCat && matchQuery;
    });

    // Sorting
    if (sortBy === 'termurah') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'termahal') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'terbaru') {
      // Latest first
      result.reverse();
    }
    // 'populer' retains default curated sort

    return result;
  }, [store.products, category, query, sortBy]);

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 flex flex-col font-sans antialiased pb-20">
      {/* ── 1. Navbar Atas: Search Bar + Chat + Keranjang ── */}
      <BuyerTopBar
        storeSlug={storeSlug}
        storeName={store.storeName}
        phoneNumber={store.phone_number}
        initialQuery={query}
        placeholder="Cari semua produk..."
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-3 space-y-3">
        {/* ── 2. Filter & Sort Bar ── */}
        <div className="bg-white rounded-xl border border-stone-200/80 p-3 shadow-2xs space-y-3">
          {/* Category Filter Chips (Horizontal Scroll) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-stone-600 pl-1 pr-2 shrink-0">
              <Tag className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>
            {categories.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Sort By & Product Counter */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
            <div className="flex items-center gap-1.5 text-stone-600 font-medium">
              <span>Menampilkan:</span>
              <span className="font-extrabold text-slate-950">
                {filteredAndSortedProducts.length} Produk
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-stone-100 border border-stone-200 text-slate-900 text-xs font-bold rounded-lg py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                <option value="populer">Terpopuler</option>
                <option value="terbaru">Terbaru</option>
                <option value="termurah">Harga Termurah</option>
                <option value="termahal">Harga Termahal</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 3. Grid: 2 Card Kanan Kiri Saja ── */}
        {filteredAndSortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 pt-1">
            {filteredAndSortedProducts.map((product) => (
              <BuyerProductCard
                key={product.id}
                product={product}
                storeSlug={storeSlug}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-stone-300 py-16 px-4 text-center space-y-3">
            <PackageSearch className="w-10 h-10 text-stone-400 mx-auto stroke-[1.5]" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                Produk Tidak Ditemukan
              </h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Coba gunakan kata kunci lain atau pilih kategori yang berbeda.
              </p>
            </div>
            <button
              onClick={() => {
                setCategory('Semua');
                setQuery('');
              }}
              className="text-xs font-bold text-slate-900 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-xl transition-colors inline-block"
            >
              Reset Filter
            </button>
          </div>
        )}
      </main>

      {/* ── 4. Sticky Bottom Navigation (Tab PRODUK Aktif) ── */}
      <BuyerBottomNav storeSlug={storeSlug} />
    </div>
  );
}

export default function ShopPageClient(props: { storeSlug: string; store: StoreData }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 flex items-center justify-center text-xs text-stone-500">Memuat katalog...</div>}>
      <ShopPageContent {...props} />
    </Suspense>
  );
}
