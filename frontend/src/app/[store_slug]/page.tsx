'use client';

import { use, useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api-client';
import {
  ShoppingBag,
  Star,
  ShieldCheck,
  Search,
  Truck,
  User,
  Clock,
  X,
  Plus,
  Minus,
  Trash2,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useBuyerStore } from '@/store/buyer-store';
import SlideOver from '@/components/SlideOver';
import ModernTemplate from '@/components/templates/ModernTemplate';
import EditorialTemplate from '@/components/templates/EditorialTemplate';
import BuyerLoginModal from '@/components/buyer/BuyerLoginModal';
import { Product, ProductVariant, StoreData } from '@/components/templates/types';

const DEMO_STORES: Record<string, StoreData> = {
  'kalmora': {
    storeName: 'KALMORA',
    tagline: 'Minimal Kidswear Curated for Modern Little Ones',
    categories: ['Semua', 'ESSENTIALS', 'MONO SERIES', 'SOFT DAILYWEAR', 'WEEKEND STUDIO'],
    products: [
      {
        id: 'klm-prod-1',
        title: 'ESSENTIAL OVERSIZED TEE',
        category: 'ESSENTIALS',
        slug: 'essential-oversized-tee',
        description: 'Minimal oversized kidswear designed with soft breathable cotton for effortless everyday comfort and clean modern styling.',
        price: 139000,
        compare_at_price: 189000,
        images: [
          'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { id: 'klm-1', sku: 'KLM-TEE-S-BEI', title: 'Size 4-5Y / Sand Beige', price: 139000, stock: 25 },
          { id: 'klm-2', sku: 'KLM-TEE-M-BEI', title: 'Size 6-7Y / Sand Beige', price: 139000, stock: 30 },
          { id: 'klm-3', sku: 'KLM-TEE-L-WHT', title: 'Size 8-9Y / Bone White', price: 139000, stock: 20 },
        ],
        details: ['PREMIUM SOFT COTTON', 'RELAXED OVERSIZED FIT', 'BREATHABLE MATERIAL', 'UNISEX DESIGN', 'MINIMAL EVERYDAY STYLE'],
      },
      {
        id: 'klm-prod-2',
        title: 'RELAXED STUDIO JOGGER',
        category: 'ESSENTIALS',
        slug: 'relaxed-studio-jogger',
        description: 'Relaxed-fit joggers with a clean silhouette—made for movement, play, and calm everyday routines.',
        price: 179000,
        compare_at_price: 229000,
        images: [
          'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { id: 'klm-4', sku: 'KLM-JOG-S', title: 'Size 4-5Y / Warm Grey', price: 179000, stock: 20 },
          { id: 'klm-5', sku: 'KLM-JOG-M', title: 'Size 6-7Y / Charcoal', price: 179000, stock: 15 },
        ],
        details: ['RELAXED FIT', 'SOFT TOUCH', 'EASY WAIST', 'DAILYWEAR READY'],
      },
      {
        id: 'klm-prod-3',
        title: 'MONO MINIMALIST SET',
        category: 'MONO SERIES',
        slug: 'mono-minimalist-set',
        description: 'A monochrome-focused matching set inspired by editorial fashion photography and minimalist styling for kids.',
        price: 249000,
        compare_at_price: 319000,
        images: [
          'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { id: 'klm-6', sku: 'KLM-SET-M', title: 'Size 5-6Y / Off-White & Black', price: 249000, stock: 18 },
          { id: 'klm-7', sku: 'KLM-SET-L', title: 'Size 7-8Y / Off-White & Black', price: 249000, stock: 12 },
        ],
        details: ['MATCHING SET', 'MONOCHROME LOOK', 'SOFT TOUCH', 'BREATHABLE'],
      },
      {
        id: 'klm-prod-4',
        title: 'SOFT DAILYWEAR SWEATSHIRT',
        category: 'SOFT DAILYWEAR',
        slug: 'soft-dailywear-sweatshirt',
        description: 'Breathable lightweight knit sweatshirt made for active routines, indoor comfort, and calm daily moments.',
        price: 199000,
        compare_at_price: 259000,
        images: [
          'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { id: 'klm-8', sku: 'KLM-SWT-S', title: 'Size 4-5Y / Oat Milk', price: 199000, stock: 22 },
          { id: 'klm-9', sku: 'KLM-SWT-M', title: 'Size 6-7Y / Warm Cocoa', price: 199000, stock: 16 },
        ],
        details: ['BREATHABLE KNIT', 'EASY MOVE', 'SOFT FEEL', 'CALM PALETTE'],
      },
      {
        id: 'klm-prod-5',
        title: 'WEEKEND STUDIO HOODIE',
        category: 'WEEKEND STUDIO',
        slug: 'weekend-studio-hoodie',
        description: 'Relaxed silhouettes and layered essentials inspired by slow weekends, soft natural lighting, and modern studio aesthetics.',
        price: 229000,
        compare_at_price: 289000,
        images: [
          'https://images.unsplash.com/photo-1519238327474-7104db5765b8?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { id: 'klm-10', sku: 'KLM-HOD-S', title: 'Size 5-6Y / Stone Grey', price: 229000, stock: 14 },
          { id: 'klm-11', sku: 'KLM-HOD-M', title: 'Size 7-8Y / Stone Grey', price: 229000, stock: 10 },
        ],
        details: ['LAYER READY', 'RELAXED FIT', 'SOFT TOUCH', 'CALM TONE'],
      },
      {
        id: 'klm-prod-6',
        title: 'BREATHABLE SUMMER SHORTS',
        category: 'SOFT DAILYWEAR',
        slug: 'breathable-summer-shorts',
        description: 'Lightweight shorts made for movement—clean lines, calm neutral tones, and effortless daily comfort.',
        price: 119000,
        compare_at_price: 159000,
        images: [
          'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { id: 'klm-12', sku: 'KLM-SHT-S', title: 'Size 4-5Y / Khaki', price: 119000, stock: 30 },
          { id: 'klm-13', sku: 'KLM-SHT-M', title: 'Size 6-7Y / Khaki', price: 119000, stock: 25 },
        ],
        details: ['LIGHTWEIGHT', 'SOFT TOUCH', 'EASY WAIST', 'MINIMAL LOOK'],
      },
    ],
  },
  'hijab-mevvah': {
    storeName: 'Hijab Mevvah Official',
    tagline: 'Koleksi Busana Muslimah Modern Indonesia - Sutra Premium Halus & Sejuk',
    categories: ['Semua', 'Hijab Silk', 'Pashmina', 'Voal'],
    products: [
      {
        id: 'hm-prod-1',
        title: 'Hijab Silk Premium Emerald Glow',
        category: 'Hijab Silk',
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
        category: 'Pashmina',
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
      {
        id: 'hm-prod-3',
        title: 'Voal Miracle Plain Lasercut Signature',
        category: 'Voal',
        slug: 'voal-miracle-plain-lasercut',
        description: 'Tepi lasercut rapi, bahan voal premium mudah dibentuk dan tidak menerawang.',
        price: 65000,
        compare_at_price: 85000,
        images: ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600'],
        variants: [
          { id: 'v5', sku: 'HM-VOAL-NUDE', title: 'Nude Beige', price: 65000, stock: 60 },
          { id: 'v6', sku: 'HM-VOAL-SAGE', title: 'Sage Green', price: 65000, stock: 50 },
        ],
      },
    ],
  },
  'vibe-sneakers': {
    storeName: 'Vibe Sneakers Surabaya',
    tagline: 'Curated Streetwear & 100% Authentic Kicks',
    categories: ['Semua', 'Sneakers', 'Running', 'Streetwear'],
    products: [
      {
        id: 'vs-prod-1',
        title: 'Retro Runner Glide 90s Edition',
        category: 'Running',
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

function StorefrontContent({ storeSlug }: { storeSlug: string }) {
  const searchParams = useSearchParams();
  const queryTemplate = searchParams.get('template');

  const defaultStore = DEMO_STORES[storeSlug] || {
    storeName: storeSlug.replace(/-/g, ' ').toUpperCase(),
    tagline: 'Toko Resmi ALURELAB E-Commerce Storefront',
    categories: ['Semua', 'Koleksi Utama'],
    products: DEMO_STORES['kalmora'].products,
  };

  const [liveStore, setLiveStore] = useState<StoreData | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadStoreAndProducts() {
      try {
        const [storeRes, prodRes] = await Promise.all([
          fetchApi('/store', { headers: { 'x-store-slug': storeSlug } }),
          fetchApi('/products', { headers: { 'x-store-slug': storeSlug } }),
        ]);

        if (!isMounted) return;

        const storeData = storeRes?.data || storeRes?.store;
        const productsRaw = prodRes?.data?.data || prodRes?.data || [];

        if (storeData || (Array.isArray(productsRaw) && productsRaw.length > 0)) {
          const mappedProducts: Product[] = Array.isArray(productsRaw) && productsRaw.length > 0
            ? productsRaw.map((p: any) => ({
                id: p.id,
                title: p.title,
                category: p.category_name || 'Koleksi',
                slug: p.slug,
                description: p.description || '',
                price: Number(p.price) || 0,
                compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : undefined,
                images: p.images && p.images.length > 0
                  ? p.images
                  : ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600'],
                variants: p.variants && p.variants.length > 0
                  ? p.variants.map((v: any) => ({
                      id: v.id,
                      sku: v.sku,
                      title: v.title,
                      price: Number(v.price) || Number(p.price) || 0,
                      stock: v.stock ?? 10,
                    }))
                  : [{ id: p.id + '-v1', sku: 'STD-1', title: 'All Size', price: Number(p.price), stock: 20 }],
              }))
            : defaultStore.products;

          const categoriesSet = new Set<string>(['Semua']);
          mappedProducts.forEach((p) => {
            if (p.category) categoriesSet.add(p.category);
          });

          setLiveStore({
            storeName: storeData?.name || defaultStore.storeName,
            tagline: storeData?.settings?.tagline || defaultStore.tagline,
            categories: Array.from(categoriesSet),
            products: mappedProducts,
            settings: storeData?.settings || {},
          });
        }
      } catch (e) {
        // Fallback to default demo store
      }
    }
    loadStoreAndProducts();
    return () => {
      isMounted = false;
    };
  }, [storeSlug]);

  const store = liveStore || defaultStore;

  // Local CMS override (allows instant sync from seller admin /dashboard/cms)
  const [localCms, setLocalCms] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`alurelab_cms_${storeSlug}`);
      if (cached) {
        try {
          setLocalCms(JSON.parse(cached));
        } catch (e) {}
      }
    }
  }, [storeSlug]);

  const effectiveSettings = useMemo(() => {
    return {
      ...(store.settings || {}),
      ...(localCms || {}),
      branding: {
        ...(store.settings?.branding || {}),
        ...(localCms?.branding || {}),
      },
      hero: {
        ...(store.settings?.hero || {}),
        ...(localCms?.hero || {}),
      },
      navigation: {
        ...(store.settings?.navigation || {}),
        ...(localCms?.navigation || {}),
      },
      sections: {
        ...(store.settings?.sections || {}),
        ...(localCms?.sections || {}),
      },
      highlights: {
        ...(store.settings?.highlights || {}),
        ...(localCms?.highlights || {}),
      },
    };
  }, [store.settings, localCms]);

  const effectiveStore: StoreData = useMemo(() => {
    return {
      ...store,
      storeName: effectiveSettings.branding?.storeName || store.storeName,
      tagline: effectiveSettings.branding?.tagline || store.tagline,
      settings: effectiveSettings,
    };
  }, [store, effectiveSettings]);

  // Active template selection
  // 1. query param ?template=editorial / modern takes highest priority
  // 2. effectiveSettings.template
  // 3. 'kalmora' defaults to 'editorial', others to 'modern'
  const activeTemplate = queryTemplate || effectiveSettings.template || (storeSlug === 'kalmora' ? 'editorial' : 'modern');

  const { items, addItem, removeItem, updateQuantity, getTotalItems, getSubtotal } = useCartStore();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [trackNumber, setTrackNumber] = useState('ORD-20260914-00192');
  const [trackResult, setTrackResult] = useState<any>(null);

  // ── Buyer Session ───────────────────────────────────────────────────
  const { buyer } = useBuyerStore();

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
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackResult({
      orderNumber: trackNumber,
      courier: 'SiCepat Ekspres (REG)',
      awb: '004289127819',
      status: 'IN_TRANSIT',
      statusText: 'Paket sedang dalam perjalanan ke alamat tujuan.',
      timeline: [
        { time: '14 Sep 2026, 14:15', desc: 'Pesanan terbayar via QRIS (Dana aman di Escrow Xendit)' },
        { time: '14 Sep 2026, 15:30', desc: 'Resi AWB diterbitkan oleh Biteship' },
        { time: '14 Sep 2026, 17:00', desc: 'Kurir SiCepat telah pick-up paket dari toko penjual' },
        { time: '14 Sep 2026, 20:45', desc: 'Paket tiba di Hub Sortir Surabaya Timur' },
      ],
    });
  };

  return (
    <>
      {/* Dynamic Template Switcher */}
      {activeTemplate === 'editorial' ? (
        <EditorialTemplate
          storeSlug={storeSlug}
          store={effectiveStore}
          buyer={buyer}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenProfile={() => setIsLoginModalOpen(true)}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onAddToCart={handleAddToCart}
          getTotalItems={getTotalItems}
        />
      ) : (
        <ModernTemplate
          storeSlug={storeSlug}
          store={effectiveStore}
          buyer={buyer}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenProfile={() => setIsLoginModalOpen(true)}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onAddToCart={handleAddToCart}
          getTotalItems={getTotalItems}
        />
      )}

      {/* Floating Theme Switcher Badge (Allows instant live preview of both templates) */}
      <div className="fixed bottom-4 right-6 z-40 bg-black/85 backdrop-blur-md text-white text-[11px] font-medium py-1.5 px-3.5 rounded-full flex items-center gap-2 shadow-xl border border-white/20">
        <Layers className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-white/60">Template:</span>
        <Link
          href={`/${storeSlug}?template=editorial`}
          className={`px-2.5 py-0.5 rounded-full transition-colors ${
            activeTemplate === 'editorial'
              ? 'bg-white text-black font-bold'
              : 'text-white/70 hover:text-white'
          }`}
        >
          L-Kids Editorial
        </Link>
        <span className="text-white/30">|</span>
        <Link
          href={`/${storeSlug}?template=modern`}
          className={`px-2.5 py-0.5 rounded-full transition-colors ${
            activeTemplate === 'modern'
              ? 'bg-white text-black font-bold'
              : 'text-white/70 hover:text-white'
          }`}
        >
          Modern
        </Link>
      </div>

      {/* DRAWER 1: SLIDE-OVER KERANJANG BELANJA (CART) */}
      <SlideOver
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title={`Keranjang Belanja (${getTotalItems()} Barang)`}
        subtitle="Barang terpilih siap diproses ke pengiriman Biteship."
        footer={
          <div className="w-full space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Estimasi Subtotal:</span>
              <span className="text-base font-black text-slate-900">
                Rp {getSubtotal().toLocaleString('id-ID')}
              </span>
            </div>
            <Link
              href={`/${storeSlug}/checkout`}
              className="w-full bg-[#111111] hover:bg-black text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all uppercase tracking-wider"
            >
              Lanjut ke Checkout 1-Halaman <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        }
      >
        {items.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Keranjang Masih Kosong</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Pilih produk dan varian favorit Anda dari katalog untuk mulai berbelanja.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <div key={idx} className="py-4 flex gap-3 text-xs">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{item.title}</h4>
                  <div className="text-slate-500 text-[11px] mb-2">{item.variantTitle}</div>
                  <div className="font-bold text-slate-900">
                    Rp {item.price.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                      className="px-2 py-1 text-slate-500 hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 font-bold text-slate-800 text-[11px]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                      className="px-2 py-1 text-slate-500 hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SlideOver>

      {/* DRAWER 2: MODAL / SLIDE-OVER LACAK PESANAN REAL-TIME */}
      <SlideOver
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
        title="Lacak Status Pesanan & Ekspedisi"
        subtitle="Masukkan nomor pesanan atau resi untuk melihat status real-time Biteship."
      >
        <div className="space-y-6">
          <form onSubmit={handleTrackOrder} className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Nomor Pesanan / Resi AWB:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={trackNumber}
                onChange={(e) => setTrackNumber(e.target.value)}
                placeholder="Contoh: ORD-20260914-00192"
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="submit"
                className="bg-[#111111] hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
              >
                Cek Resi
              </button>
            </div>
          </form>

          {trackResult && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="bg-slate-100 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Kurir:</span>
                  <span className="font-bold text-slate-900">{trackResult.courier}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nomor AWB:</span>
                  <span className="font-mono font-bold text-slate-900">{trackResult.awb}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status:</span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    {trackResult.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-3">Perjalanan Paket:</h4>
                <div className="relative pl-5 border-l-2 border-slate-200 space-y-4 text-xs">
                  {trackResult.timeline.map((event: any, i: number) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[25px] top-0 w-3 h-3 rounded-full bg-slate-900" />
                      <div className="text-[10px] text-slate-400 font-mono">{event.time}</div>
                      <div className="text-slate-700 font-medium mt-0.5">{event.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </SlideOver>

      {/* BUYER LOGIN POPUP MODAL */}
      <BuyerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        storeSlug={storeSlug}
        storeName={store.storeName}
      />
    </>
  );
}

export default function StorefrontPage({ params }: { params: Promise<{ store_slug: string }> }) {
  const resolvedParams = use(params);
  const storeSlug = resolvedParams.store_slug;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center text-xs tracking-widest uppercase">Loading Store...</div>}>
      <StorefrontContent storeSlug={storeSlug} />
    </Suspense>
  );
}
