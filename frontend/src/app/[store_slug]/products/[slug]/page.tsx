'use client';

import { use, useState, useRef } from 'react';
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
  MessageCircle,
  Tag,
  Share2,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
} from 'lucide-react';
import axios from 'axios';
import { useCartStore } from '@/store/cart-store';
import BuyerTopBar from '@/components/buyer/BuyerTopBar';
import BuyerChatModal from '@/components/buyer/BuyerChatModal';
import BuyerProductCard from '@/components/buyer/BuyerProductCard';
import { Product } from '@/components/templates/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ store_slug: string; slug: string }>;
}) {
  const router = useRouter();
  const { store_slug: storeSlug, slug } = use(params);

  const { addItem } = useCartStore();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Fetch product detail
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['buyer-product', storeSlug, slug],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/products/${slug}`, {
        headers: { 'X-Store-Slug': storeSlug },
      });
      if (!res.data?.data) throw new Error('Produk tidak ditemukan.');
      return res.data.data;
    },
  });

  // Fetch store info (for phone number and store name)
  const { data: storeInfo } = useQuery({
    queryKey: ['buyer-store-info', storeSlug],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/store`, {
        headers: { 'X-Store-Slug': storeSlug },
      });
      return res.data?.data || null;
    },
  });

  // Fetch related products
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['buyer-related-products', storeSlug, slug],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/products`, {
        headers: { 'X-Store-Slug': storeSlug },
      });
      const prods = res.data?.data?.data || res.data?.data || [];
      return (Array.isArray(prods) ? prods : [])
        .filter((p: any) => p.slug !== slug)
        .slice(0, 4)
        .map((p: any) => ({
          id: p.id,
          title: p.title,
          category: p.category_name || 'Koleksi',
          slug: p.slug,
          description: p.description || '',
          price: Number(p.price) || 0,
          compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : undefined,
          images: Array.isArray(p.images) ? p.images : [],
          variants: p.variants || [],
        }));
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 font-medium">Memuat detail produk...</p>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm max-w-sm w-full space-y-4">
          <h1 className="text-base font-bold text-slate-900">Produk Tidak Ditemukan</h1>
          <p className="text-xs text-stone-500">Produk ini mungkin telah dihapus atau stok sedang kosong.</p>
          <Link
            href={`/${storeSlug}/shop`}
            className="inline-block w-full bg-slate-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-black transition-colors"
          >
            Lihat Produk Lainnya
          </Link>
        </div>
      </div>
    );
  }

  const images: string[] = product.images?.length
    ? product.images
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80'];

  const variants = product.variants?.length
    ? product.variants
    : [{ id: product.id, title: 'Standar', price: Number(product.price), stock: 50 }];

  const activeVariant = variants.find((v: any) => v.id === selectedVariantId) || variants[0];
  const currentPrice = activeVariant ? Number(activeVariant.price) : Number(product.price || 0);
  const comparePrice = product.compare_at_price ? Number(product.compare_at_price) : null;
  const stockAvailable = typeof activeVariant?.stock === 'number' ? activeVariant.stock : 0;
  const isOutOfStock = stockAvailable <= 0;
  const storeName = storeInfo?.name || storeSlug.replace(/-/g, ' ');
  const phoneNumber = storeInfo?.phone_number;

  const discountPercent =
    comparePrice && comparePrice > currentPrice
      ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
      : null;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error('Stok habis. Pilih varian lain atau tunggu restock.');
      return;
    }
    addItem({
      productId: product.id,
      variantId: activeVariant?.id || product.id,
      title: product.title,
      variantTitle: activeVariant?.title || 'Standar',
      price: currentPrice,
      quantity,
      imageUrl: images[0],
      stock: stockAvailable,
    });
    toast.success(`${product.title} (${quantity} barang) masuk ke keranjang!`, {
      duration: 2500,
    });
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      toast.error('Stok habis. Pilih varian lain atau tunggu restock.');
      return;
    }
    addItem({
      productId: product.id,
      variantId: activeVariant?.id || product.id,
      title: product.title,
      variantTitle: activeVariant?.title || 'Standar',
      price: currentPrice,
      quantity,
      imageUrl: images[0],
      stock: stockAvailable,
    });
    router.push(`/${storeSlug}/checkout`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Cek ${product.title} di ${storeName}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Tautan produk berhasil disalin!');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 flex flex-col font-sans antialiased pb-24">
      {/* ── 1. Navbar Atas: Back + Search Bar + Chat + Keranjang ── */}
      <BuyerTopBar
        storeSlug={storeSlug}
        storeName={storeName}
        phoneNumber={phoneNumber}
        showBackButton={true}
        productTitleForChat={product.title}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto space-y-3 pt-0 sm:pt-3">
        {/* ── 2. Langsung 1 Image Besar Bisa di Slide Kanan Kiri ── */}
        <section className="relative bg-white sm:rounded-2xl border-b sm:border border-stone-200 overflow-hidden">
          <div className="relative aspect-square w-full bg-stone-100 overflow-hidden">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-300 ${
                  idx === activeImageIdx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={img}
                  alt={`${product.title} gambar ${idx + 1}`}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            ))}

            {/* Slide Navigation Arrows (If more than 1 image) */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                  }
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-xs hover:bg-black/60 transition-colors"
                  aria-label="Gambar Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-xs hover:bg-black/60 transition-colors"
                  aria-label="Gambar Selanjutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Slide Index Counter (e.g. 1/3) */}
            <div className="absolute bottom-3 right-3 z-20 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs">
              {activeImageIdx + 1} / {images.length}
            </div>

            {/* Share Button Floating */}
            <button
              type="button"
              onClick={handleShare}
              className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/90 text-slate-700 hover:text-black flex items-center justify-center shadow-md backdrop-blur-xs active:scale-95 transition-all"
              aria-label="Bagikan Produk"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnail Strip (If multiple images) */}
          {images.length > 1 && (
            <div className="p-3 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-stone-100">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    idx === activeImageIdx
                      ? 'border-slate-900 ring-1 ring-slate-900'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── 3. Section HARGA & JUDUL ── */}
        <section className="bg-white p-4 sm:p-6 sm:rounded-2xl border-y sm:border border-stone-200/80 shadow-2xs space-y-2.5">
          {/* HARGA */}
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-950">
              Rp {currentPrice.toLocaleString('id-ID')}
            </span>
            {comparePrice && comparePrice > currentPrice && (
              <span className="text-sm text-stone-600 line-through">
                Rp {comparePrice.toLocaleString('id-ID')}
              </span>
            )}
            {discountPercent !== null && (
              <span className="bg-rose-600 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                Hemat {discountPercent}%
              </span>
            )}
          </div>

          {/* JUDUL */}
          <h1 className="text-base sm:text-xl font-extrabold text-slate-900 leading-snug">
            {product.title}
          </h1>

          {/* Category & Status */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
              {product.category_name || 'Koleksi Toko'}
            </span>
            <span className="text-xs font-semibold flex items-center gap-1">
              {isOutOfStock ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-rose-600">Stok Habis</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700">Stok Tersedia</span>
                </>
              )}
            </span>
          </div>
        </section>

        {/* ── 4. Section PROMO Dari Seller ── */}
        <section className="bg-white p-4 sm:p-5 sm:rounded-2xl border-y sm:border border-stone-200/80 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-600" />
              <span>Promo Toko Tersedia</span>
            </h2>
            <span className="text-[10px] text-stone-600">Otomatis saat checkout</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-3 bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                %
              </div>
              <div className="text-xs">
                <div className="font-bold text-amber-900">Voucher Diskon Toko</div>
                <div className="text-[11px] text-amber-700">Potongan langsung untuk pembelian hari ini</div>
              </div>
            </div>

            <div className="p-3 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-emerald-900">Gratis Ongkir Xtra</div>
                <div className="text-[11px] text-emerald-700">Tersedia via kurir JNE, J&T, SiCepat</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Section PILIH VARIAN & DESKRIPSI ── */}
        <section className="bg-white p-4 sm:p-6 sm:rounded-2xl border-y sm:border border-stone-200/80 shadow-2xs space-y-4">
          {/* Variant Selector */}
          {variants.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Pilih Varian
                </label>
                {activeVariant?.stock && (
                  <span className="text-[11px] text-stone-500">
                    Sisa stok: <strong>{activeVariant.stock}</strong>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {variants.map((v: any) => {
                  const isSelected = activeVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setQuantity(1);
                      }}
                      className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-stone-50 text-slate-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {v.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Jumlah Pembelian
            </span>
            <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden">
              <button
                type="button"
                disabled={isOutOfStock || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-stone-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-xs font-bold text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                disabled={isOutOfStock || quantity >= stockAvailable}
                onClick={() => setQuantity((q) => Math.min(stockAvailable, q + 1))}
                className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-stone-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* DESKRIPSI PRODUK */}
          <div className="pt-4 border-t border-stone-100 space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Deskripsi Produk
            </h2>
            <div className="text-xs text-stone-600 leading-relaxed space-y-2 whitespace-pre-line">
              {product.description || 'Tidak ada deskripsi rinci untuk produk ini.'}
            </div>
          </div>

          {/* Trust Guarantee */}
          <div className="pt-4 border-t border-stone-100 grid grid-cols-2 gap-2 text-stone-600 text-[11px]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Garansi 100% Produk Original</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pengiriman Cepat & Terlacak</span>
            </div>
          </div>
        </section>

        {/* ── 6. Section PRODUK TERKAIT ── */}
        {relatedProducts.length > 0 && (
          <section className="px-3 sm:px-0 pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900">
                Produk Terkait Dari Toko Ini
              </h2>
              <Link
                href={`/${storeSlug}/shop`}
                className="text-xs font-bold text-slate-700 hover:text-black"
              >
                Lihat Semua →
              </Link>
            </div>

            {/* 2 Card Kanan Kiri */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              {relatedProducts.map((p) => (
                <BuyerProductCard
                  key={p.id}
                  product={p}
                  storeSlug={storeSlug}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── 7. Nav Bawah Sticky PDP: Chat, Beli Langsung, + Keranjang ── */}
      <aside aria-label="Action Pembelian" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-2xl">
        <div className="mx-auto max-w-lg px-3 py-2 flex items-center gap-2">
          {/* Chat Button */}
          <button
            type="button"
            onClick={() => setIsChatModalOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-700 hover:text-emerald-600 hover:bg-stone-100 transition-colors shrink-0"
            title="Chat Penjual"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-bold mt-0.5">Chat</span>
          </button>

          {/* + Keranjang Button */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className="flex-1 bg-stone-100 hover:bg-stone-200 text-slate-900 text-xs font-extrabold py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isOutOfStock ? (
              <span>Stok Habis</span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Keranjang</span>
              </>
            )}
          </button>

          {/* Beli Langsung Button */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleBuyNow}
            className="flex-1 bg-slate-900 hover:bg-black text-white text-xs font-extrabold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <span>{isOutOfStock ? 'Stok Habis' : 'Beli Langsung'}</span>
          </button>
        </div>
        {/* iOS Safe Area Spacer */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </aside>

      {/* Chat Modal */}
      <BuyerChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        storeName={storeName}
        phoneNumber={phoneNumber}
        productTitle={product.title}
      />
    </div>
  );
}
