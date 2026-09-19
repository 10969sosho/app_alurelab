'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Star,
  ShieldCheck,
  Search,
  Truck,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { TemplateProps, Product, ProductVariant } from './types';

export default function ModernTemplate({
  storeSlug,
  store,
  buyer,
  onOpenCart,
  onOpenProfile,
  onOpenTrackOrder,
  onAddToCart,
  getTotalItems,
}: TemplateProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const filteredProducts = useMemo(() => {
    return store.products.filter((prod) => {
      const matchSearch = prod.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'Semua' || prod.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [store.products, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Hero Banner */}
      {store.settings?.sections?.showHero !== false && (
        <section className="bg-gradient-to-b from-white to-slate-100/60 border-b border-slate-200/80 py-10 px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-2">
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full font-bold inline-block">
              {store.settings?.hero?.badgeText || '✨ Sub-300ms Storefront Performance'}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {store.settings?.hero?.headline || store.tagline}
            </h2>
            <p className="text-xs text-slate-500 max-w-xl mx-auto">
               {store.settings?.hero?.description || ''}
            </p>
          </div>
        </section>
      )}

      {/* Category Pills & Catalog */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Category Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {store.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-500 font-medium">
             <span className="font-bold text-slate-900">{filteredProducts.length}</span> produk
          </div>
        </div>

        {/* Product Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              {/* Image Thumbnail */}
              <Link href={`/${storeSlug}/products/${product.slug}`} className="aspect-square bg-slate-100 relative overflow-hidden group block">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.compare_at_price && (
                  <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    Diskon {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                  </span>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> 4.9
                </div>
              </Link>

              {/* Detail */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                    {product.category}
                  </span>
                  <Link href={`/${storeSlug}/products/${product.slug}`}>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1 hover:text-emerald-600 transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-black text-slate-900">
                      Rp {product.price.toLocaleString('id-ID')}
                    </span>
                    {product.compare_at_price && (
                      <span className="text-xs text-slate-400 line-through">
                        Rp {product.compare_at_price.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  {/* Varian & Beli */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-600 block">Pilihan Varian:</span>
                    <div className="space-y-1">
                      {product.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => onAddToCart(product, v)}
                          className="w-full flex items-center justify-between text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all font-medium text-slate-700"
                        >
                          <span>{v.title}</span>
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            + Masuk Keranjang
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              A
            </div>
            <span className="font-bold text-slate-900">{store.storeName}</span>
            <span>• Didukung oleh infrastruktur ALURELAB</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onOpenTrackOrder} className="hover:text-slate-900 transition-colors">
              Lacak Pesanan
            </button>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">
              Syarat & Ketentuan
            </Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              Kebijakan Privasi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
