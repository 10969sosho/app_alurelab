'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ShoppingBag,
  Star,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  Check,
  Share2,
  Phone,
  Package,
  Loader2,
} from 'lucide-react';
import axios from 'axios';
import { useCartStore } from '@/store/cart-store';
import { formatRupiah } from '@/lib/utils';
import SlideOver from '@/components/SlideOver';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ store_slug: string; slug: string }>;
}) {
  const router = useRouter();
  const { store_slug: storeSlug, slug } = use(params);

  const { addItem, items, removeItem, updateQuantity, getTotalItems, getSubtotal } = useCartStore();

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Fetch product detail
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['buyer-product', storeSlug, slug],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_BASE}/products/${slug}`, {
          headers: { 'X-Store-Slug': storeSlug },
        });
        return res.data?.data;
      } catch {
        // Fallback demo data jika backend belum tersedia
        return {
          id: 'demo-prod-1',
          title: slug.replace(/-/g, ' ').toUpperCase(),
          description: 'Koleksi eksklusif dengan bahan pilihan terbaik, nyaman dipakai seharian, dan bergaransi retur apabila cacat produksi.',
          category_name: 'Koleksi Utama',
          price: 149000,
          compare_at_price: 199000,
          weight_grams: 250,
          images: [
            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
            'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800',
          ],
          variants: [
            { id: 'var-1', title: 'Ukuran M', price: 149000, stock: 25 },
            { id: 'var-2', title: 'Ukuran L', price: 149000, stock: 15 },
          ],
        };
      }
    },
  });

  const images = product?.images?.length ? product.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'];
  const variants = product?.variants || [];
  const activeVariant = variants.find((v: any) => v.id === selectedVariantId) || variants[0];
  const currentPrice = activeVariant ? Number(activeVariant.price) : Number(product?.price || 0);
  const comparePrice = product?.compare_at_price ? Number(product.compare_at_price) : null;
  const discountPercent = comparePrice && comparePrice > currentPrice
    ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
    : 0;

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
    toast.success('Berhasil ditambahkan ke keranjang!');
    setIsCartOpen(true);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push(`/${storeSlug}/checkout`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={`/${storeSlug}`}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Toko</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-slate-700 hover:text-emerald-600 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            {getTotalItems() > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {getTotalItems()}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          {/* Left: Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={images[selectedImageIdx] || images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImageIdx === idx ? 'border-emerald-500 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info & Actions */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg uppercase tracking-wider">
                {product.category_name || 'Katalog'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-3 mt-3 text-sm text-slate-500">
                <div className="flex items-center gap-1 text-amber-500 font-semibold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>4.9</span>
                </div>
                <span>•</span>
                <span>Terjual 120+</span>
                <span>•</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Stok Siap Kirim
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-emerald-600">
                  {formatRupiah(currentPrice)}
                </span>
                {comparePrice && comparePrice > currentPrice && (
                  <span className="text-base text-slate-400 line-through">
                    {formatRupiah(comparePrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 font-bold text-xs rounded-md">
                    Hemat {discountPercent}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Harga sudah termasuk PPN & perlindungan transaksi Escrow Xendit
              </p>
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Pilih Varian
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {variants.map((v: any) => {
                    const isSelected = (selectedVariantId || variants[0]?.id) === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {v.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Jumlah Pesanan
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-400">
                  Subtotal: <strong className="text-slate-800">{formatRupiah(currentPrice * quantity)}</strong>
                </span>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3.5 px-6 border-2 border-emerald-600 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                Tambah ke Keranjang
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 py-3.5 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                Beli Sekarang
              </button>
            </div>

            {/* Description & Logistics Feature */}
            <div className="border-t border-slate-100 pt-6 space-y-4 text-sm text-slate-600">
              <h3 className="font-bold text-slate-900">Deskripsi Produk</h3>
              <p className="whitespace-pre-line leading-relaxed text-slate-600 text-xs sm:text-sm">
                {product.description || 'Tidak ada deskripsi rinci untuk produk ini.'}
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-700">Auto Resi Biteship</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium text-slate-700">Berat {product.weight_grams || 200}g</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Mobile Bottom Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 p-3.5 flex items-center gap-2.5 shadow-lg">
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 py-3 border border-emerald-600 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
        >
          <ShoppingBag className="w-4 h-4" />
          + Keranjang
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          className="flex-1 py-3 bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
        >
          Beli Sekarang
        </button>
      </div>

      {/* SlideOver Keranjang Belanja */}
      <SlideOver
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title={`Keranjang Belanja (${getTotalItems()})`}
      >
        <div className="flex flex-col h-full">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-semibold text-slate-700">Keranjang Masih Kosong</p>
              <p className="text-xs mt-1">Pilih produk favorit Anda untuk mulai belanja.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-4 space-y-3">
                {items.map((it) => (
                  <div key={`${it.productId}-${it.variantId}`} className="pt-3 flex gap-3">
                    <img
                      src={it.imageUrl}
                      alt={it.title}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-50"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{it.title}</p>
                      <p className="text-[11px] text-slate-400">{it.variantTitle}</p>
                      <p className="text-xs font-bold text-emerald-600 mt-1">{formatRupiah(it.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(it.productId, it.variantId, it.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{it.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(it.productId, it.variantId, it.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                  <span>Subtotal</span>
                  <span className="text-emerald-600 text-base">{formatRupiah(getSubtotal())}</span>
                </div>
                <Link
                  href={`/${storeSlug}/checkout`}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  Lanjut ke Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      </SlideOver>
    </div>
  );
}
