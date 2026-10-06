'use client';

import Link from 'next/link';
import { Heart, Plus, ShoppingBag } from 'lucide-react';
import { Product } from '@/components/templates/types';
import { useCartStore } from '@/store/cart-store';
import { UniversalImage } from '@/components/templates/ImagePlaceholder';
import { toast } from 'sonner';

interface BuyerProductCardProps {
  product: Product;
  storeSlug: string;
}

export default function BuyerProductCard({
  product,
  storeSlug,
}: BuyerProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const totalStock = hasVariants
    ? product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
    : null;
  const isOutOfStock = totalStock !== null && totalStock <= 0;

  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(
          ((product.compare_at_price - product.price) /
            product.compare_at_price) *
            100
        )
      : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    const variant = product.variants?.[0];
    addItem({
      productId: product.id,
      variantId: variant ? variant.id : 'default',
      title: product.title,
      variantTitle: variant ? variant.title : 'Standard',
      price: variant ? variant.price : product.price,
      quantity: 1,
      imageUrl: product.images?.[0] || '',
    });

    toast.success(`${product.title} ditambahkan ke keranjang`, {
      duration: 2000,
    });
  };

  const firstImage = product.images?.[0] || null;

  return (
    <article className="group bg-white rounded-2xl border border-stone-200/70 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative">
      <Link
        href={`/${storeSlug}/products/${product.slug}`}
        className="block relative aspect-square sm:aspect-[4/5] bg-stone-100 overflow-hidden"
      >
        <UniversalImage
          src={firstImage}
          alt={product.title}
          fallbackText={product.title || 'Foto Produk'}
          aspectRatio="square"
          className="group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {discountPercent !== null && discountPercent > 0 ? (
            <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
              -{discountPercent}%
            </span>
          ) : (
            <span className="bg-white/90 backdrop-blur-xs text-neutral-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              Pilihan
            </span>
          )}
        </div>

        {/* Floating Heart / Wishlist icon button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toast.success('Disimpan ke daftar keinginan', { duration: 1500 });
          }}
          aria-label="Wishlist"
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white text-neutral-600 hover:text-rose-500 backdrop-blur-xs flex items-center justify-center shadow-xs transition-transform active:scale-90"
        >
          <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
        </button>
      </Link>

      {/* Product Info */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {product.category && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 truncate mb-1">
              {product.category}
            </p>
          )}

          <Link
            href={`/${storeSlug}/products/${product.slug}`}
            className="block text-xs sm:text-sm font-bold text-neutral-900 leading-snug line-clamp-2 hover:text-neutral-600 transition-colors"
          >
            {product.title}
          </Link>
        </div>

        {/* Price & Quick Add */}
        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-end justify-between gap-1.5">
          <div className="min-w-0">
            <div className="text-xs sm:text-base font-extrabold text-neutral-950 truncate">
              Rp {product.price.toLocaleString('id-ID')}
            </div>
            {product.compare_at_price &&
              product.compare_at_price > product.price && (
                <div className="text-[10px] sm:text-xs text-neutral-400 line-through truncate">
                  Rp {product.compare_at_price.toLocaleString('id-ID')}
                </div>
              )}
          </div>

          {isOutOfStock ? (
            <span
              aria-label="Stok habis"
              className="shrink-0 rounded-full bg-neutral-100 text-neutral-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 select-none"
            >
              Habis
            </span>
          ) : (
            <button
              type="button"
              onClick={handleQuickAdd}
              aria-label={`Tambah ${product.title} ke keranjang`}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-900 hover:bg-black text-white flex items-center justify-center shrink-0 shadow-xs active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
