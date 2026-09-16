'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useBuyerStore } from '@/store/buyer-store';
import SlideOver from '@/components/SlideOver';
import ModernTemplate from '@/components/templates/ModernTemplate';
import EditorialTemplate from '@/components/templates/EditorialTemplate';
import BuyerLoginModal from '@/components/buyer/BuyerLoginModal';
import { Product, ProductVariant, StoreData } from '@/components/templates/types';

export default function StorefrontClient({
  storeSlug,
  initialStore,
  queryTemplate,
}: {
  storeSlug: string;
  initialStore: StoreData;
  queryTemplate?: string;
}) {
  const [store, setStore] = useState<StoreData>(initialStore);

  // Sync state if initialStore changes
  useEffect(() => {
    setStore(initialStore);
  }, [initialStore]);

  const effectiveSettings = useMemo(() => store.settings || {}, [store.settings]);

  const effectiveStore: StoreData = useMemo(() => {
    return {
      ...store,
      storeName: effectiveSettings.branding?.storeName || store.storeName,
      tagline: effectiveSettings.branding?.tagline || store.tagline,
      settings: effectiveSettings,
    };
  }, [store, effectiveSettings]);

  // Active template:
  // 1. URL query param ?template=editorial / modern
  // 2. CMS setting
  // 3. Fallback: editorial for kalmora, modern for others
  const activeTemplate =
    queryTemplate ||
    effectiveSettings.template ||
    'modern';

  const { items, addItem, removeItem, updateQuantity, getTotalItems, getSubtotal } = useCartStore();
  const { buyer } = useBuyerStore();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [trackNumber, setTrackNumber] = useState('');
  const [trackError, setTrackError] = useState('');

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
    setTrackError('Login diperlukan untuk membuka tracking order yang aman.');
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

          <p className="text-xs text-slate-500">{trackError || 'Masuk ke akun pembeli untuk melihat status pesanan yang Anda miliki.'}</p>
        </div>
      </SlideOver>

      {/* BUYER LOGIN POPUP MODAL */}
      <BuyerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        storeSlug={storeSlug}
        storeName={effectiveStore.storeName}
      />
    </>
  );
}
