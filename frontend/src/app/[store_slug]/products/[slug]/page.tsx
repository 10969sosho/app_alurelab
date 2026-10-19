'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
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
      weightGrams: product.weight_grams,
      storeSlug,
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
      weightGrams: product.weight_grams,
      storeSlug,
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

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10 pt-4 md:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-6 lg:gap-12">
          <section className="relative lg:col-span-7 lg:sticky lg:top-28">
            <div className="relative aspect-square md:aspect-[1.08/1] w-full overflow-hidden rounded-2xl bg-stone-100">
              {images.map((img, idx) => (
                <div key={idx} className={`absolute inset-0 transition-opacity duration-500 ${idx === activeImageIdx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                  <img src={img} alt={`${product.title} gambar ${idx + 1}`} className="w-full h-full object-cover object-center" />
                </div>
              ))}
              {images.length > 1 && <>
                <button type="button" onClick={() => setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1))} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 text-neutral-900 flex items-center justify-center backdrop-blur-sm hover:bg-white transition-colors" aria-label="Gambar Sebelumnya"><ChevronLeft className="w-5 h-5" /></button>
                <button type="button" onClick={() => setActiveImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1))} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 text-neutral-900 flex items-center justify-center backdrop-blur-sm hover:bg-white transition-colors" aria-label="Gambar Selanjutnya"><ChevronRight className="w-5 h-5" /></button>
              </>}
              <div className="absolute bottom-4 right-4 z-20 rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">{activeImageIdx + 1} / {images.length}</div>
              <button type="button" onClick={handleShare} className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 text-slate-700 hover:text-black flex items-center justify-center shadow-sm backdrop-blur-sm transition" aria-label="Bagikan Produk"><Share2 className="w-4 h-4" /></button>
            </div>
            {images.length > 1 && <div className="mt-3 flex items-center gap-3 overflow-x-auto no-scrollbar">
              {images.map((img, idx) => <button key={idx} type="button" onClick={() => setActiveImageIdx(idx)} aria-label={`Lihat gambar ${idx + 1}`} className={`relative h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${idx === activeImageIdx ? 'border-neutral-900' : 'border-transparent opacity-65 hover:opacity-100'}`}><img src={img} alt="" className="h-full w-full object-cover" /></button>)}
            </div>}
          </section>

          <div className="lg:col-span-5 space-y-5 md:space-y-6">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">{product.category_name || 'Koleksi Toko'}</span>
                <span className={`text-xs font-medium flex items-center gap-2 ${isOutOfStock ? 'text-rose-600' : 'text-emerald-700'}`}><span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-rose-500' : 'bg-emerald-500'}`} />{isOutOfStock ? 'Stok Habis' : 'Tersedia'}</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight text-neutral-950">{product.title}</h1>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-950">Rp {currentPrice.toLocaleString('id-ID')}</span>
                {comparePrice && comparePrice > currentPrice && <><span className="text-sm text-stone-400 line-through">Rp {comparePrice.toLocaleString('id-ID')}</span><span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-700">-{discountPercent}%</span></>}
              </div>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-4 md:p-5 space-y-5">
              {variants.length > 0 && <div className="space-y-3">
                <div className="flex justify-between items-center"><label className="text-xs font-semibold text-neutral-800">Pilih varian</label>{activeVariant?.stock > 0 && <span className="text-[11px] text-stone-500">Sisa {activeVariant.stock}</span>}</div>
                <div className="flex flex-wrap gap-2">{variants.map((v: any) => {
                  const isSelected = activeVariant?.id === v.id;
                  const outOfStock = typeof v.stock === 'number' && v.stock <= 0;
                  return <button key={v.id} type="button" disabled={outOfStock} onClick={() => { setSelectedVariantId(v.id); setQuantity(1); }} className={`min-h-10 rounded-full border px-4 py-2 text-xs font-medium transition ${isSelected ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-stone-200 bg-white text-neutral-700 hover:border-neutral-500'} disabled:cursor-not-allowed disabled:border-stone-100 disabled:bg-stone-50 disabled:text-stone-400`}>{v.title}{outOfStock ? ' · Habis' : ''}</button>;
                })}</div>
              </div>}
              <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                <span className="text-xs font-semibold text-neutral-800">Jumlah</span>
                <div className="flex items-center rounded-full border border-stone-200 bg-white">
                  <button type="button" disabled={isOutOfStock || quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-neutral-700 hover:bg-stone-50 rounded-l-full disabled:opacity-40" aria-label="Kurangi jumlah"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="w-9 text-center text-xs font-semibold">{quantity}</span>
                  <button type="button" disabled={isOutOfStock || quantity >= stockAvailable} onClick={() => setQuantity((q) => Math.min(stockAvailable, q + 1))} className="w-10 h-10 flex items-center justify-center text-neutral-700 hover:bg-stone-50 rounded-r-full disabled:opacity-40" aria-label="Tambah jumlah"><Plus className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="hidden lg:grid grid-cols-[auto_1fr_1fr] gap-2">
                <button type="button" onClick={() => setIsChatModalOpen(true)} className="h-12 w-12 rounded-xl border border-stone-200 text-neutral-700 hover:bg-stone-50 flex items-center justify-center" aria-label="Chat toko"><MessageCircle className="w-4 h-4" /></button>
                <button type="button" disabled={isOutOfStock} onClick={handleAddToCart} className="h-12 rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 hover:bg-stone-50 transition disabled:opacity-50">Tambah ke Keranjang</button>
                <button type="button" disabled={isOutOfStock} onClick={handleBuyNow} className="h-12 rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white hover:bg-neutral-700 transition disabled:opacity-50">Beli Sekarang</button>
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-stone-200/80 bg-white p-3.5 flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" /><span className="text-xs font-medium text-neutral-700">Pembayaran terlindungi</span></div>
              <div className="rounded-xl border border-stone-200/80 bg-white p-3.5 flex items-center gap-3"><Truck className="w-4 h-4 text-emerald-700 shrink-0" /><span className="text-xs font-medium text-neutral-700">Pengiriman terlacak</span></div>
            </section>

            <section className="divide-y divide-stone-200 border-y border-stone-200">
              <details open className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-neutral-900">Deskripsi produk <span className="text-lg font-normal text-stone-400 group-open:rotate-45 transition-transform">+</span></summary>
                <div className="pt-3 text-sm leading-7 text-stone-600 whitespace-pre-line">{product.description || 'Tidak ada deskripsi rinci untuk produk ini.'}</div>
              </details>
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-neutral-900">Penyajian & penyimpanan <span className="text-lg font-normal text-stone-400 group-open:rotate-45 transition-transform">+</span></summary>
                <p className="pt-3 text-sm leading-7 text-stone-600">Ikuti petunjuk penggunaan atau penyimpanan yang tercantum pada kemasan produk.</p>
              </details>
              <details className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-neutral-900">Pengiriman <span className="text-lg font-normal text-stone-400 group-open:rotate-45 transition-transform">+</span></summary>
                <p className="pt-3 text-sm leading-7 text-stone-600">Pilihan kurir dan estimasi ongkir tersedia setelah alamat tujuan diisi saat checkout.</p>
              </details>
            </section>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="pt-5 space-y-4">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 lg:gap-7">
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
      <aside aria-label="Action Pembelian" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-2xl lg:hidden">
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
