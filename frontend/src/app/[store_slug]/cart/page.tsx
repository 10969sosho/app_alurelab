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
  CheckCircle2,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';

export default function CartPage({
  params,
}: {
  params: Promise<{ store_slug: string }>;
}) {
  const { store_slug: storeSlug } = use(params);
  const { items, updateQuantity, removeItem, clearCart, getSubtotal, getTotalItems } = useCartStore();

  const subtotal = getSubtotal();
  const totalItems = getTotalItems();
  const storeDisplayName = storeSlug.replace(/-/g, ' ').toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-[#111111] font-sans antialiased selection:bg-[#111111] selection:text-[#F5F5F3] flex flex-col">
      {/* ── Top Bar ────────────────────────────────────────── */}
      <header className="h-[80px] border-b border-[#DADADA] bg-[#F5F5F3] px-6 md:px-12 flex items-center justify-between sticky top-0 z-30">
        <Link
          href={`/${storeSlug}`}
          className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#666666] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>KEMBALI KE KATALOG</span>
        </Link>

        <Link href={`/${storeSlug}`} className="flex items-center gap-2.5">
          <div className="w-7 h-7 border border-[#111111] flex items-center justify-center font-bebas text-lg leading-none">
            {storeDisplayName.charAt(0)}
          </div>
          <span className="text-[12px] font-bold tracking-[0.22em] uppercase hidden sm:inline">
            {storeDisplayName}
          </span>
        </Link>

        <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#666666]">
          BAG ({totalItems})
        </div>
      </header>

      {/* ── Main Cart Content ───────────────────────────────── */}
      <main className="max-w-6xl mx-auto w-full px-6 md:px-10 py-12 flex-1">
        <div className="pb-8 border-b border-[#DADADA] flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.24em] text-[#666666] uppercase block mb-1">
              CURATED SELECTION
            </span>
            <h1 className="font-bebas text-5xl md:text-6xl tracking-wide uppercase text-[#111111]">
              SHOPPING BAG
            </h1>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] uppercase tracking-[0.16em] text-[#666666] hover:text-rose-600 transition-colors"
            >
              Kosongkan Keranjang
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Bag State */
          <div className="py-24 text-center space-y-6 max-w-md mx-auto">
            <div className="w-16 h-16 border border-[#DADADA] flex items-center justify-center mx-auto text-[#666666]">
              <ShoppingBag className="w-7 h-7 stroke-[1.4]" />
            </div>
            <div className="space-y-2">
              <h2 className="font-bebas text-3xl uppercase tracking-wide text-[#111111]">
                KERANJANG ANDA MASIH KOSONG
              </h2>
              <p className="text-xs text-[#666666] leading-relaxed">
                Jelajahi koleksi curated kami dan temukan potongan pakaian minimalis yang dirancang untuk kenyamanan sehari-hari.
              </p>
            </div>
            <Link
              href={`/${storeSlug}`}
              className="inline-flex items-center gap-3 bg-[#111111] text-[#F5F5F3] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all"
            >
              <span>JELAJAHI KOLEKSI</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Cart Grid: Items on Left, Order Summary on Right */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-10">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-8 space-y-6">
              <div className="divide-y divide-[#DADADA] border-y border-[#DADADA]">
                {items.map((item, idx) => (
                  <div
                    key={`${item.productId}-${item.variantId || idx}`}
                    className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                  >
                    {/* Image & Title */}
                    <div className="flex gap-5 items-start">
                      <div className="w-20 sm:w-24 aspect-[3/4] bg-stone-200 overflow-hidden shrink-0 border border-[#DADADA]">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover filter contrast-[1.03]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#666666]">
                            No IMG
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <Link
                          href={`/${storeSlug}`}
                          className="font-bebas text-2xl tracking-wide uppercase text-[#111111] hover:opacity-75 transition-opacity block truncate"
                        >
                          {item.title}
                        </Link>
                        {item.variantTitle && (
                          <div className="text-[11px] uppercase tracking-[0.14em] text-[#666666]">
                            {item.variantTitle}
                          </div>
                        )}
                        <div className="text-xs font-semibold text-[#111111] pt-1">
                          Rp {item.price.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-2 sm:pt-0">
                      {/* Stepper */}
                      <div className="flex items-center border border-[#DADADA] bg-white">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-[#111111] hover:bg-stone-100 transition-colors"
                          aria-label="Kurangi kuantitas"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center font-bold text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-[#111111] hover:bg-stone-100 transition-colors"
                          aria-label="Tambah kuantitas"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total for item */}
                      <div className="text-sm font-bold text-[#111111] sm:w-28 text-right">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-[#666666] hover:text-rose-600 transition-colors p-1"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  href={`/${storeSlug}`}
                  className="editorial-link text-[11px]"
                >
                  ← LANJUTKAN MEMILIH PRODUK LAIN
                </Link>
              </div>
            </div>

            {/* Right: Order Summary Card */}
            <div className="lg:col-span-4">
              <div className="border border-[#DADADA] p-6 sm:p-8 bg-white space-y-6 sticky top-28">
                <h3 className="font-bebas text-3xl tracking-wide uppercase text-[#111111] pb-4 border-b border-[#DADADA]">
                  RINGKASAN PESANAN
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#666666] uppercase tracking-[0.14em]">
                      Total ({totalItems} Barang)
                    </span>
                    <span className="font-semibold text-[#111111]">
                      Rp {subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#666666] uppercase tracking-[0.14em]">
                      Estimasi Ongkir
                    </span>
                    <span className="text-[#666666] italic">
                      Dihitung saat checkout
                    </span>
                  </div>

                  <div className="pt-4 border-t border-[#DADADA] flex justify-between items-baseline">
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#111111]">
                      ESTIMASI SUBTITLED
                    </span>
                    <span className="text-xl font-bold text-[#111111]">
                      Rp {subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <Link
                  href={`/${storeSlug}/checkout`}
                  className="w-full bg-[#111111] text-[#F5F5F3] py-4 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  <span>LANJUT KE CHECKOUT</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Security badges */}
                <div className="space-y-2 pt-4 border-t border-[#DADADA] text-[10px] text-[#666666] uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Jaminan Escrow Xendit Aman</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Multi-Kurir Terintegrasi Biteship</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-[#DADADA] bg-[#F5F5F3] py-8 px-6 text-center text-[11px] uppercase tracking-[0.14em] text-[#666666]">
        <div>© 2026 {storeDisplayName} • Didukung oleh Infrastruktur ALURELAB</div>
      </footer>
    </div>
  );
}
