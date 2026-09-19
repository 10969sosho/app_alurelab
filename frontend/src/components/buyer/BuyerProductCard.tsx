'use client';

import Link from 'next/link';
import { Plus, ShoppingBag } from 'lucide-react';
import { Product } from '@/components/templates/types';
import { useCartStore } from '@/store/cart-store';
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

  const imageSrc =
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60';

  return (
    <article className="group bg-white rounded-xl border border-stone-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
      <Link
        href={`/${storeSlug}/products/${product.slug}`}
        className="block relative aspect-square sm:aspect-[4/5] bg-stone-100 overflow-hidden"
      >
        <img
          src={imageSrc}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Discount Badge */}
        {discountPercent !== null && discountPercent > 0 && (
          <div className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-sm shadow-xs uppercase tracking-wide">
            -{discountPercent}%
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
        <div>
          {product.category && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-600 truncate mb-1">
              {product.category}
            </p>
          )}

          <Link
            href={`/${storeSlug}/products/${product.slug}`}
            className="block text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-stone-600 transition-colors"
          >
            {product.title}
          </Link>
        </div>

        {/* Price & Quick Add */}
        <div className="mt-2 pt-2 border-t border-stone-100 flex items-end justify-between gap-1.5">
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-extrabold text-slate-950 truncate">
              Rp {product.price.toLocaleString('id-ID')}
            </div>
            {product.compare_at_price &&
              product.compare_at_price > product.price && (
                <div className="text-[10px] text-stone-600 line-through truncate">
                  Rp {product.compare_at_price.toLocaleString('id-ID')}
                </div>
              )}
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={`Tambah ${product.title} ke keranjang`}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 hover:bg-black text-white flex items-center justify-center shrink-0 shadow-xs active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
