'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { Product, StoreData } from '@/components/templates/types';
import { BuyerFooter, BuyerNavbar, BuyerThemeFrame } from './BuyerTheme';

export default function ShopPageClient({ storeSlug, store }: { storeSlug: string; store: StoreData }) {
  const [category, setCategory] = useState('Semua');
  const [query, setQuery] = useState('');
  const addItem = useCartStore((state) => state.addItem);
  const products = useMemo(() => store.products.filter((product) =>
    (category === 'Semua' || product.category === category) && product.title.toLowerCase().includes(query.toLowerCase())
  ), [category, query, store.products]);

  const addToCart = (product: Product) => {
    const variant = product.variants[0];
    if (!variant) return;
    addItem({ productId: product.id, variantId: variant.id, title: product.title, variantTitle: variant.title, price: variant.price, quantity: 1, imageUrl: product.images[0] });
  };

  return <BuyerThemeFrame storeSlug={storeSlug} className="font-sans">
    <BuyerNavbar storeSlug={storeSlug} storeName={store.storeName} />
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10 md:py-14">
      <div className="mb-8 flex flex-col gap-5 border-b border-[var(--theme-line)] pb-6 md:flex-row md:items-end md:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[.22em] opacity-60">{store.settings?.hero?.badgeText || 'Shop all'}</p><h1 className="mt-2 text-5xl font-black tracking-[-.06em] md:text-7xl">{store.settings?.hero?.headline || 'Shop'}</h1><p className="mt-3 max-w-xl text-sm opacity-65">{store.settings?.hero?.description || store.tagline}</p></div>
        <label className="relative block w-full md:w-64"><Search className="absolute left-3 top-3 h-4 w-4 opacity-50" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari produk" className="w-full rounded-full border border-[var(--theme-line)] bg-[var(--theme-surface)] py-2.5 pl-9 pr-4 text-xs outline-none" /></label>
      </div>
      <div className="mb-8 flex gap-2 overflow-x-auto">{store.categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border border-[var(--theme-line)] px-4 py-2 text-xs font-bold ${category === item ? 'bg-[var(--theme-ink)] text-[var(--theme-surface)]' : ''}`}>{item}</button>)}</div>
      {products.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{products.map((product) => <article key={product.id} className="group"><Link href={`/${storeSlug}/products/${product.slug}`} className="block aspect-[4/5] overflow-hidden bg-black/5"><img src={product.images[0]} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></Link><div className="space-y-1 py-3"><p className="text-[10px] font-bold uppercase tracking-wider opacity-55">{product.category}</p><Link href={`/${storeSlug}/products/${product.slug}`} className="block text-sm font-bold leading-tight">{product.title}</Link><div className="flex items-center justify-between gap-2 text-sm"><span>Rp {product.price.toLocaleString('id-ID')}</span><button type="button" onClick={() => addToCart(product)} className="flex items-center gap-1 text-[10px] font-bold uppercase"><ShoppingBag className="h-3.5 w-3.5" />Tambah</button></div></div></article>)}</div> : <div className="border border-dashed border-[var(--theme-line)] py-20 text-center text-sm opacity-65">Produk tidak ditemukan.</div>}
    </main>
    <BuyerFooter storeSlug={storeSlug} storeName={store.storeName} />
  </BuyerThemeFrame>;
}
