'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  Check,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import axios from 'axios';
import { useCartStore } from '@/store/cart-store';
import { useBuyerStore } from '@/store/buyer-store';
import BuyerLoginModal from '@/components/buyer/BuyerLoginModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Preset demo products matching Kalmora editorial theme
const KALMORA_PRODUCTS: Record<string, any> = {
  'essential-oversized-tee': {
    id: 'klm-prod-1',
    title: 'ESSENTIAL OVERSIZED TEE',
    category_name: 'ESSENTIALS',
    season: 'CURATED 2026',
    price: 139000,
    compare_at_price: 189000,
    description:
      'The Essential Oversized Tee is designed as a relaxed everyday staple for children who need comfort, softness, and flexibility throughout daily movement.\n\nMade using lightweight premium cotton with a clean oversized silhouette, this piece balances modern minimalist styling with practical daily wear.\n\nThe neutral color palette allows easy layering and effortless matching with joggers, shorts, sneakers, and outerwear. Suitable for indoor activities, casual outings, travel, or calm weekend routines.',
    details: [
      'PREMIUM SOFT COTTON (100% COMBED)',
      'RELAXED OVERSIZED EDITORIAL FIT',
      'BREATHABLE & LIGHTWEIGHT FEEL',
      'UNISEX MODERN SILHOUETTE',
      'NON-RESTRICTIVE CREW NECKLINE',
      'PRE-SHRUNK FABRIC TREATMENT',
    ],
    images: [
      'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1600&auto=format&fit=crop&q=80',
    ],
    variants: [
      { id: 'klm-1', sku: 'KLM-TEE-S-BEI', title: 'Size 4-5Y / Sand Beige', price: 139000, stock: 25 },
      { id: 'klm-2', sku: 'KLM-TEE-M-BEI', title: 'Size 6-7Y / Sand Beige', price: 139000, stock: 30 },
      { id: 'klm-3', sku: 'KLM-TEE-L-WHT', title: 'Size 8-9Y / Bone White', price: 139000, stock: 20 },
    ],
  },
  'relaxed-studio-jogger': {
    id: 'klm-prod-2',
    title: 'RELAXED STUDIO JOGGER',
    category_name: 'ESSENTIALS',
    season: 'CURATED 2026',
    price: 179000,
    compare_at_price: 229000,
    description:
      'A minimal jogger designed to move with kids. Soft structure, easy styling, and an elevated fit that feels premium without trying too hard.\n\nCrafted with flexible cotton french-terry fabric, deep pockets, and a gentle elastic waistband designed not to pinch or restrict movement.',
    details: [
      'SOFT COTTON FRENCH TERRY',
      'RELAXED TAPERED CUT',
      'COMFORT ELASTIC WAISTBAND WITH DRAWSTRING',
      'DEEP SIDE POCKETS',
      'ALL-SEASON WEARABLE',
    ],
    images: [
      'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=1600&auto=format&fit=crop&q=80',
    ],
    variants: [
      { id: 'klm-4', sku: 'KLM-JOG-S', title: 'Size 4-5Y / Warm Grey', price: 179000, stock: 20 },
      { id: 'klm-5', sku: 'KLM-JOG-M', title: 'Size 6-7Y / Charcoal', price: 179000, stock: 15 },
    ],
  },
  'mono-minimalist-set': {
    id: 'klm-prod-3',
    title: 'MONO MINIMALIST SET',
    category_name: 'MONO SERIES',
    season: 'CURATED 2026',
    price: 249000,
    compare_at_price: 319000,
    description:
      'Monochrome simplicity made practical—easy layering, calm tones, and a premium editorial feel for everyday routines.\n\nIncludes an oversized drop-shoulder top and matching relaxed culotte pants for a cohesive studio look.',
    details: [
      '2-PIECE MATCHING SET',
      'MONOCHROME EDITORIAL PALETTE',
      'BREATHABLE LINEN-COTTON BLEND',
      'EASY MOVE & PLAY COMFORT',
    ],
    images: [
      'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=1600&auto=format&fit=crop&q=80',
    ],
    variants: [
      { id: 'klm-6', sku: 'KLM-SET-M', title: 'Size 5-6Y / Off-White & Black', price: 249000, stock: 18 },
      { id: 'klm-7', sku: 'KLM-SET-L', title: 'Size 7-8Y / Off-White & Black', price: 249000, stock: 12 },
    ],
  },
  'soft-dailywear-sweatshirt': {
    id: 'klm-prod-4',
    title: 'SOFT DAILYWEAR SWEATSHIRT',
    category_name: 'SOFT DAILYWEAR',
    season: 'CURATED 2026',
    price: 199000,
    compare_at_price: 259000,
    description:
      'Breathable lightweight knit sweatshirt made for active routines, indoor comfort, and calm daily moments. Gentle against sensitive skin with ribbed collar and cuffs.',
    details: [
      'BABY-SOFT FLEECE LINING',
      'LIGHTWEIGHT LAYERABILITY',
      'DURABLE DOUBLE-STITCHED HEMS',
      'CALM EARTHY TONAL PALETTE',
    ],
    images: [
      'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=1600&auto=format&fit=crop&q=80',
    ],
    variants: [
      { id: 'klm-8', sku: 'KLM-SWT-S', title: 'Size 4-5Y / Oat Milk', price: 199000, stock: 22 },
      { id: 'klm-9', sku: 'KLM-SWT-M', title: 'Size 6-7Y / Warm Cocoa', price: 199000, stock: 16 },
    ],
  },
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ store_slug: string; slug: string }>;
}) {
  const router = useRouter();
  const { store_slug: storeSlug, slug } = use(params);

  const { addItem, getTotalItems } = useCartStore();
  const { buyer } = useBuyerStore();

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const { data: product, isError } = useQuery({
    queryKey: ['buyer-product', storeSlug, slug],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/products/${slug}`, {
        headers: { 'X-Store-Slug': storeSlug },
      });

      if (!res.data?.data) throw new Error('Produk tidak ditemukan.');

      return res.data.data;
    },
  });

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-bold">Produk tidak ditemukan</h1>
          <p className="mt-2 text-sm text-[#666666]">Produk tidak tersedia atau toko sedang mengalami gangguan.</p>
          <Link href={`/${storeSlug}`} className="inline-block mt-5 underline text-sm">Kembali ke katalog</Link>
        </div>
      </div>
    );
  }

  const images = product?.images?.length ? product.images : ['https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1600'];
  const variants = product?.variants && product.variants.length > 0
    ? product.variants
    : product
    ? [{ id: product.id, title: 'Standar', price: Number(product.price), stock: 50 }]
    : [];
  const activeVariant = variants.find((v: any) => v.id === selectedVariantId) || variants[0];
  const currentPrice = activeVariant ? Number(activeVariant.price) : Number(product?.price || 0);
  const comparePrice = product?.compare_at_price ? Number(product.compare_at_price) : null;
  const storeDisplayName = storeSlug.replace(/-/g, ' ').toUpperCase();

  const productDetails = product?.details && product.details.length > 0
    ? product.details
    : [
        `KATEGORI: ${(product?.category_name || 'KOLEKSI UTAMA').toUpperCase()}`,
        `BERAT PENGIRIMAN: ${product?.weight_grams || 200} GRAM`,
        'PRODUK 100% ORIGINAL BERGARANSI',
        'MULTI-KURIR INTEGRASI BITESHIP',
      ];

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      variantId: activeVariant?.id || product.id,
      title: product.title,
      variantTitle: activeVariant?.title || 'Standar',
      price: currentPrice,
      quantity,
      imageUrl: images[0],
    });
    toast.success(`Berhasil ditambahkan ke Keranjang (${quantity} item)`);
  };

  const handleAddToCartAndOpen = () => {
    handleAddToCart();
    router.push(`/${storeSlug}/cart`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push(`/${storeSlug}/checkout`);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-[#111111] font-sans antialiased selection:bg-[#111111] selection:text-[#F5F5F3] flex flex-col">
      {/* ── Top Header Bar ──────────────────────────────────── */}
      <header className="h-[80px] border-b border-[#DADADA] bg-[#F5F5F3] px-6 md:px-12 flex items-center justify-between sticky top-0 z-30">
        <Link
          href={`/${storeSlug}`}
          className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#666666] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>KEMBALI KE KATALOG</span>
        </Link>

        {/* Monogram Brand */}
        <Link href={`/${storeSlug}`} className="flex items-center gap-2.5">
          <div className="w-7 h-7 border border-[#111111] flex items-center justify-center font-bebas text-lg leading-none">
            {storeDisplayName.charAt(0)}
          </div>
          <span className="text-[12px] font-bold tracking-[0.22em] uppercase hidden sm:inline">
            {storeDisplayName}
          </span>
        </Link>

        {/* Right Nav: Login/Account & Cart Bag */}
        <div className="flex items-center gap-6">
          {buyer ? (
            <Link
              href={`/${storeSlug}/account`}
              className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#111111] hover:opacity-75 transition-opacity"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{buyer.fullName.split(' ')[0]}</span>
            </Link>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#666666] hover:text-[#111111] transition-opacity"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LOGIN</span>
            </button>
          )}

          <Link
            href={`/${storeSlug}/cart`}
            className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#111111] hover:opacity-75 transition-opacity"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>BAG ({getTotalItems()})</span>
          </Link>
        </div>
      </header>

      {/* ── Product Detail 2-Column Section ────────────────── */}
      <main className="max-w-6xl mx-auto w-full px-6 md:px-10 py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Gallery Images (Aspect 3:4) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[3/4] w-full bg-stone-200 overflow-hidden border border-[#DADADA]">
              <img
                src={images[selectedImageIdx] || images[0]}
                alt={product?.title || 'Product'}
                className="w-full h-full object-cover object-center filter contrast-[1.04] saturate-[0.94]"
              />
            </div>

            {/* Thumbnail switcher if multiple images */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-20 aspect-[3/4] bg-stone-200 overflow-hidden border transition-all shrink-0 ${
                      selectedImageIdx === idx
                        ? 'border-[#111111] ring-1 ring-[#111111]'
                        : 'border-[#DADADA] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Editorial Product Information */}
          <div className="lg:col-span-5 space-y-6">
            {/* Kicker & Title */}
            <div className="space-y-2 border-b border-[#DADADA] pb-6">
              <div className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#666666]">
                {product?.category_name || 'COLLECTION'} — {product?.season || 'CURATED 2026'}
              </div>

              <h1 className="font-bebas text-4xl sm:text-5xl md:text-6xl tracking-tight uppercase text-[#111111] leading-[0.9]">
                {product?.title}
              </h1>

              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-2xl font-bold text-[#111111]">
                  Rp {currentPrice.toLocaleString('id-ID')}
                </span>
                {comparePrice && comparePrice > currentPrice && (
                  <span className="text-sm text-[#666666] line-through">
                    Rp {comparePrice.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3 text-xs md:text-sm text-[#666666] leading-relaxed">
              {product?.description?.split('\n\n').map((paragraph: string, idx: number) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {/* Variant Pills */}
            {variants.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-[#DADADA]">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#111111]">
                    PILIHAN VARIAN / UKURAN:
                  </span>
                  {activeVariant?.stock && (
                    <span className="text-[10px] uppercase text-[#666666] tracking-wider">
                      Stok: {activeVariant.stock} Tersedia
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`text-xs px-4 py-2.5 uppercase tracking-wider transition-all font-medium ${
                        activeVariant?.id === v.id
                          ? 'bg-[#111111] text-[#F5F5F3] border border-[#111111]'
                          : 'bg-white text-[#111111] border border-[#DADADA] hover:border-[#111111]'
                      }`}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#111111]">
                JUMLAH:
              </span>
              <div className="flex items-center border border-[#DADADA] bg-white text-xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center hover:bg-stone-100 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-10 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 flex items-center justify-center hover:bg-stone-100 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Actions: Add to Bag & Buy Now */}
            <div className="space-y-3 pt-6 border-t border-[#DADADA]">
              <button
                onClick={handleAddToCartAndOpen}
                className="w-full bg-[#111111] text-[#F5F5F3] py-4 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <span>+ MASUKKAN KE KERANJANG</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleBuyNow}
                className="w-full bg-white text-[#111111] border border-[#111111] py-3.5 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-stone-100 transition-all"
              >
                BELI SEKARANG (FAST CHECKOUT)
              </button>
            </div>

            {/* Specifications List */}
            {productDetails.length > 0 && (
              <div className="pt-6 border-t border-[#DADADA] space-y-3">
                <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#111111] block">
                  SPESIFIKASI & DETAIL:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] tracking-wider uppercase text-[#666666]">
                  {productDetails.map((item: string, i: number) => (
                    <div key={i} className="py-1.5 border-b border-[#DADADA] flex items-center gap-2">
                      <span className="w-1 h-1 bg-[#111111] rounded-full shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust Badges */}
            <div className="pt-6 border-t border-[#DADADA] space-y-2 text-[11px] text-[#666666] uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Pembayaran Aman dengan Escrow Xendit</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Pengiriman Multi-Kurir Cepat via Biteship</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-[#DADADA] bg-[#F5F5F3] py-8 px-6 text-center text-[11px] uppercase tracking-[0.14em] text-[#666666]">
        <div>© 2026 {storeDisplayName} • Didukung oleh ALURELAB E-Commerce</div>
      </footer>

      {/* Login Popup Modal */}
      <BuyerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        storeSlug={storeSlug}
        storeName={storeDisplayName}
      />
    </div>
  );
}
