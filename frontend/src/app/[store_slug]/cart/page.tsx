'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import BuyerTopBar from '@/components/buyer/BuyerTopBar';
import BuyerBottomNav from '@/components/buyer/BuyerBottomNav';
import { UniversalImage } from '@/components/templates/ImagePlaceholder';

export default function CartPage({
  params,
}: {
  params: Promise<{ store_slug: string }>;
}) {
  const { store_slug: storeSlug } = use(params);
  const { items, updateQuantity, removeItem, clearCart, getSubtotal, getTotalItems } = useCartStore();

  const subtotal = getSubtotal();
  const totalItems = getTotalItems();
  const storeDisplayName = storeSlug.replace(/-/g, ' ');

  return (
    <div className="min-h-screen bg-stone-50/50 text-neutral-900 flex flex-col font-sans antialiased pb-28 md:pb-16">
      {/* ── Top Bar ── */}
      <BuyerTopBar
        storeSlug={storeSlug}
        storeName={storeDisplayName}
        showBackButton={true}
      />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/${storeSlug}/shop`}
              className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-neutral-600 hover:text-black transition-colors"
              aria-label="Kembali ke Katalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold text-neutral-900">
                Keranjang Belanja
              </h1>
              <p className="text-xs text-neutral-500">
                {totalItems} barang terpilih
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Kosongkan Keranjang
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="py-20 text-center space-y-4 max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-neutral-900">
                Keranjang Masih Kosong
              </h2>
              <p className="text-xs text-neutral-500">
                Belum ada produk yang Anda tambahkan ke keranjang belanja.
              </p>
            </div>
            <Link
              href={`/${storeSlug}/shop`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Mulai Belanja</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Cart Grid: Items List + Order Summary */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-7 space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="bg-white rounded-2xl border border-stone-200/80 p-3 sm:p-4 shadow-2xs flex gap-3 sm:gap-4 items-center"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-stone-100">
                    <UniversalImage
                      src={item.imageUrl}
                      alt={item.title}
                      fallbackText={item.title}
                      aspectRatio="square"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                      {item.title}
                    </h3>
                    {item.variantTitle && (
                      <p className="text-[11px] text-neutral-500">
                        Varian: <span className="font-medium text-neutral-700">{item.variantTitle}</span>
                      </p>
                    )}
                    <div className="text-xs sm:text-sm font-extrabold text-neutral-950 pt-0.5">
                      Rp {item.price.toLocaleString('id-ID')}
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-neutral-700 hover:bg-stone-200 transition-colors"
                          aria-label="Kurangi"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-neutral-700 hover:bg-stone-200 transition-colors"
                          aria-label="Tambah"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                        aria-label="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-2xs space-y-4 lg:sticky lg:top-24">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-neutral-800">
                Ringkasan Pesanan
              </h2>

              <div className="space-y-2.5 text-xs text-neutral-600 border-b border-stone-100 pb-4">
                <div className="flex justify-between">
                  <span>Total Produk ({totalItems} item)</span>
                  <span className="font-semibold text-neutral-900">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkos Kirim</span>
                  <span className="text-emerald-600 font-semibold">
                    Dihitung saat checkout
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-bold text-neutral-900">Total Pembayaran</span>
                <span className="text-lg sm:text-xl font-black text-neutral-950">
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              <Link
                href={`/${storeSlug}/checkout`}
                className="w-full bg-neutral-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <span>Lanjut ke Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Trust Badges */}
              <div className="pt-3 border-t border-stone-100 space-y-2 text-[11px] text-neutral-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pembayaran aman dengan escrow resmi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pengiriman resmi kurir terpercaya</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Nav */}
      <BuyerBottomNav storeSlug={storeSlug} />
    </div>
  );
}