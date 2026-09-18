'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, ShoppingBag, User } from 'lucide-react';
import { Product, TemplateProps } from './types';

function useCatalog(store: TemplateProps['store']) {
  const [category, setCategory] = useState('Semua');
  const [query, setQuery] = useState('');
  const products = useMemo(() => store.products.filter((product) =>
    (category === 'Semua' || product.category === category) &&
    product.title.toLowerCase().includes(query.toLowerCase())
  ), [category, query, store.products]);
  return { category, setCategory, query, setQuery, products };
}

function ProductTile({ product, storeSlug, onAddToCart, className = '' }: {
  product: Product;
  storeSlug: string;
  onAddToCart: TemplateProps['onAddToCart'];
  className?: string;
}) {
  return (
    <article className={`group ${className}`}>
      <Link href={`/${storeSlug}/products/${product.slug}`} className="block overflow-hidden bg-slate-100 aspect-[4/5]">
        <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </Link>
      <div className="space-y-1 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] opacity-55">{product.category}</p>
        <Link href={`/${storeSlug}/products/${product.slug}`} className="block text-sm font-bold leading-tight hover:opacity-60">{product.title}</Link>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span>Rp {product.price.toLocaleString('id-ID')}</span>
          <button type="button" onClick={() => product.variants[0] && onAddToCart(product, product.variants[0])} className="text-[10px] font-bold uppercase tracking-wider underline underline-offset-4">Tambah</button>
        </div>
      </div>
    </article>
  );
}

function Header({ props, dark = false }: { props: TemplateProps; dark?: boolean }) {
  const cms = props.store.settings || {};
  const items = cms.navigation?.menuItems?.filter((item) => item.enabled) || [];
  return (
    <header className={`template-internal-navbar flex items-center justify-between gap-4 px-5 py-5 md:px-10 ${dark ? 'text-white' : ''}`}>
      <Link href={`/${props.storeSlug}`} className="text-lg font-black tracking-tight">{props.store.storeName}</Link>
      <nav className="hidden items-center gap-6 text-[11px] font-bold uppercase tracking-[.16em] md:flex">
        {(items.length ? items : [{ id: 'shop', label: 'Shop', url: `/${props.storeSlug}/shop`, enabled: true }]).map((item) => <a key={item.id} href={item.url.startsWith(`/${props.storeSlug}`) ? item.url : item.url.startsWith('/') ? `/${props.storeSlug}${item.url}` : item.url}>{item.label}</a>)}
      </nav>
      <div className="flex items-center gap-3">
        {props.buyer ? <Link href={`/${props.storeSlug}/account`} aria-label="Account"><User className="h-4 w-4" /></Link> : <button onClick={props.onOpenProfile} aria-label="Login"><User className="h-4 w-4" /></button>}
        <Link href={`/${props.storeSlug}/cart`} className="flex items-center gap-1 text-xs"><ShoppingBag className="h-4 w-4" />{props.getTotalItems()}</Link>
      </div>
    </header>
  );
}

export function MarketplaceTemplate(props: TemplateProps) {
  const { store, storeSlug } = props;
  const cms = store.settings || {};
  const { category, setCategory, query, setQuery, products } = useCatalog(store);
  return <div className="min-h-screen bg-[#f6f7f9] text-slate-950 font-sans">
    <div className="bg-slate-950 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[.2em] text-white">{cms.highlights?.announcementText || store.storeName}</div>
    <Header props={props} />
    {cms.sections?.showHero !== false && <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:grid-cols-[1.1fr_.9fr] md:px-10 md:py-14">
      <div className="flex flex-col justify-center"><p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-indigo-600">{cms.hero?.badgeText || 'New arrivals'}</p><h1 className="max-w-xl text-5xl font-black tracking-[-.06em] md:text-8xl">{cms.hero?.headline || store.storeName}</h1><p className="mt-5 max-w-lg text-sm text-slate-600">{cms.hero?.description || store.tagline}</p><Link href={`/${storeSlug}/shop`} className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-xs font-bold text-white">{cms.hero?.ctaText || 'Shop now'} <ArrowRight className="h-4 w-4" /></Link></div>
      <div className="min-h-[360px] overflow-hidden rounded-[2rem] bg-slate-200"><img src={cms.hero?.bannerImage || store.products[0]?.images[0]} alt="" className="h-full w-full object-cover" /></div>
    </section>}
    <main id="shop" className="mx-auto max-w-7xl px-5 pb-16 md:px-10"><div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between"><div className="flex gap-2 overflow-x-auto">{store.categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${category === item ? 'bg-slate-950 text-white' : 'bg-white'}`}>{item}</button>)}</div><label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari produk" className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs outline-none md:w-56" /></label></div><div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4 md:gap-7">{products.map((product) => <ProductTile key={product.id} product={product} storeSlug={storeSlug} onAddToCart={props.onAddToCart} />)}</div></main>
  </div>;
}

export function SplitTemplate(props: TemplateProps) {
  const { store, storeSlug } = props;
  const cms = store.settings || {};
  const { category, setCategory, products } = useCatalog(store);
  return <div className="min-h-screen bg-[#e9e4dc] text-[#24221f] font-sans"><div className="mx-auto max-w-[1500px] md:grid md:grid-cols-[38%_62%]"><aside className="md:sticky md:top-0 md:flex md:h-screen md:flex-col md:justify-between md:p-12"><Header props={props} /><div className="px-5 pb-12 md:px-0 md:pb-0"><p className="text-xs font-bold uppercase tracking-[.25em] opacity-60">{cms.hero?.badgeText || 'The edit'}</p><h1 className="mt-5 max-w-md text-6xl font-serif leading-[.9] md:text-8xl">{cms.hero?.headline || store.storeName}</h1><p className="mt-6 max-w-sm text-sm leading-6 opacity-70">{cms.hero?.description || store.tagline}</p><Link href={`/${storeSlug}/shop`} className="mt-8 inline-block border-b border-current pb-1 text-xs font-bold uppercase tracking-[.16em]">{cms.hero?.ctaText || 'Explore collection'} <ArrowRight className="ml-2 inline h-3 w-3" /></Link></div><p className="hidden text-xs opacity-50 md:block">{cms.highlights?.aboutStory || cms.highlights?.aboutHeading || store.storeName}</p></aside><section id="shop" className="bg-[#f6f3ee] p-5 md:min-h-screen md:p-12"><div className="mb-8 flex gap-5 overflow-x-auto border-b border-[#24221f]/20 pb-4">{store.categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap text-xs uppercase tracking-wider ${category === item ? 'font-bold underline underline-offset-8' : 'opacity-55'}`}>{item}</button>)}</div><div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-2 md:gap-8">{products.map((product) => <ProductTile key={product.id} product={product} storeSlug={storeSlug} onAddToCart={props.onAddToCart} />)}</div></section></div></div>;
}

export function BrutalistTemplate(props: TemplateProps) {
  const { store, storeSlug } = props;
  const cms = store.settings || {};
  const { category, setCategory, products } = useCatalog(store);
  return <div className="min-h-screen bg-[#f5f225] text-black font-mono"><Header props={props} /><section className="border-y-4 border-black px-5 py-10 md:px-12 md:py-20"><p className="text-xs font-bold uppercase">{cms.hero?.badgeText || 'Independent commerce'}</p><h1 className="mt-3 max-w-5xl text-6xl font-black uppercase leading-[.82] tracking-[-.09em] md:text-[10rem]">{cms.hero?.headline || store.storeName}</h1><p className="mt-8 max-w-xl text-sm font-bold">{cms.hero?.description || store.tagline}</p></section><main id="shop" className="bg-white px-5 py-8 md:px-12 md:py-14"><div className="mb-8 flex gap-2 overflow-x-auto">{store.categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`border-2 border-black px-4 py-2 text-xs font-bold uppercase ${category === item ? 'bg-black text-white' : ''}`}>{item}</button>)}</div><div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{products.map((product) => <ProductTile key={product.id} product={product} storeSlug={storeSlug} onAddToCart={props.onAddToCart} className="border-2 border-black p-2" />)}</div></main></div>;
}
