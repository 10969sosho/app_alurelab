'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Star, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';

interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price: number;
  stock: number;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number;
  images: string[];
  variants: ProductVariant[];
}

// Fallback demo data jika backend API belum dinyalakan
const DEMO_PRODUCTS: Record<string, { storeName: string; tagline: string; products: Product[] }> = {
  'hijab-mevvah': {
    storeName: 'Hijab Mevvah Official',
    tagline: 'Elegansi Muslimah Modern Indonesia - Sutra Premium Halus & Sejuk',
    products: [
      {
        id: 'hm-prod-1',
        title: 'Hijab Silk Premium Emerald Glow',
        slug: 'hijab-silk-premium-emerald-glow',
        description: 'Hijab sutra premium dengan kilau mewah elegan, tegak di dahi tanpa kusut.',
        price: 149000,
        compare_at_price: 199000,
        images: ['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600'],
        variants: [
          { id: 'v1', sku: 'HM-EMR-OS', title: 'Emerald Green', price: 149000, stock: 45 },
          { id: 'v2', sku: 'HM-ROSE-OS', title: 'Dusty Rose', price: 149000, stock: 30 },
        ],
      },
      {
        id: 'hm-prod-2',
        title: 'Pashmina Plisket Ceruty Babydoll',
        slug: 'pashmina-plisket-ceruty-babydoll',
        description: 'Plisket lidi rapi, bahan jatuh, adem, dan tidak perlu disetrika.',
        price: 89000,
        compare_at_price: 129000,
        images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600'],
        variants: [
          { id: 'v3', sku: 'HM-PLIS-BLK', title: 'Onyx Black', price: 89000, stock: 100 },
          { id: 'v4', sku: 'HM-PLIS-MOCHA', title: 'Warm Mocha', price: 89000, stock: 80 },
        ],
      },
    ],
  },
  'vibe-sneakers': {
    storeName: 'Vibe Sneakers Surabaya',
    tagline: 'Curated Streetwear & 100% Authentic Kicks',
    products: [
      {
        id: 'vs-prod-1',
        title: 'Retro Runner Glide 90s Edition',
        slug: 'retro-runner-glide-90s-edition',
        description: 'Sneakers vintage dengan bantalan cloud-foam ultra empuk untuk aktivitas harian.',
        price: 589000,
        compare_at_price: 749000,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
        variants: [
          { id: 'vs-1', sku: 'VS-41-RED', title: 'Size 41 / Red Core', price: 589000, stock: 15 },
          { id: 'vs-2', sku: 'VS-42-RED', title: 'Size 42 / Red Core', price: 589000, stock: 20 },
        ],
      },
    ],
  },
};

export default function StorefrontPage({ params }: { params: Promise<{ store_slug: string }> }) {
  const resolvedParams = use(params);
  const storeSlug = resolvedParams.store_slug;

  const demo = DEMO_PRODUCTS[storeSlug] || {
    storeName: storeSlug.replace('-', ' ').toUpperCase(),
    tagline: 'Toko Resmi ALURELAB E-Commerce Storefront',
    products: DEMO_PRODUCTS['hijab-mevvah'].products,
  };

  const { items, addItem, getTotalItems } = useCartStore();
  const [addedItem, setAddedItem] = useState<string | null>(null);

  const handleAddToCart = (product: Product, variant: ProductVariant) => {
    addItem({
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      imageUrl: product.images[0],
    });
    setAddedItem(variant.id);
    setTimeout(() => setAddedItem(null), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 text-center font-medium px-4">
        ⚡ Garansi Pengiriman Cepat Biteship & Rekening Escrow Terproteksi Xendit (Bank Indonesia PJP)
      </div>

      {/* Store Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg text-slate-900 tracking-tight">{demo.storeName}</h1>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Toko Resmi Terverifikasi
            </p>
          </div>

          <Link
            href={`/${storeSlug}/checkout`}
            className="relative inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Keranjang</span>
            {getTotalItems() > 0 && (
              <span className="ml-1 bg-emerald-500 text-slate-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {getTotalItems()}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Hero Tagline */}
      <div className="bg-gradient-to-b from-slate-100 to-transparent py-10 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-mono text-emerald-700 bg-emerald-100/60 inline-block px-3 py-1 rounded-full mb-3">
            ✨ Powered by ALURELAB Sub-300ms Storefront
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {demo.tagline}
          </h2>
        </div>
      </div>

      {/* Product Catalog */}
      <main className="max-w-6xl mx-auto px-4 mt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {demo.products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Image */}
              <div className="aspect-square bg-slate-100 relative overflow-hidden group">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.compare_at_price && (
                  <span className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                    Diskon {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug mb-1">
                    {product.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {product.description}
                  </p>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-xl font-extrabold text-slate-900">
                      Rp {product.price.toLocaleString('id-ID')}
                    </span>
                    {product.compare_at_price && (
                      <span className="text-xs text-slate-400 line-through">
                        Rp {product.compare_at_price.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Variant Options & Add to Cart */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-medium text-slate-600 block">Pilih Varian:</span>
                  <div className="space-y-1.5">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => handleAddToCart(product, variant)}
                        className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg border font-medium transition-all ${
                          addedItem === variant.id
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-700'
                        }`}
                      >
                        <span>{variant.title}</span>
                        <span className="flex items-center gap-1 font-semibold">
                          {addedItem === variant.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Masuk Keranjang
                            </>
                          ) : (
                            `Stok: ${variant.stock} | Beli`
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Checkout Button on Mobile */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
          <Link
            href={`/${storeSlug}/checkout`}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-xl flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Checkout ({getTotalItems()} Barang)
            </span>
            <span>Lanjut Bayar →</span>
          </Link>
        </div>
      )}
    </div>
  );
}
