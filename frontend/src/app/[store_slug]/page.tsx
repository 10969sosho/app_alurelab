'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Star,
  ShieldCheck,
  Check,
  Search,
  Truck,
  User,
  PackageCheck,
  Clock,
  X,
  Plus,
  Minus,
  Trash2,
  ExternalLink,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import SlideOver from '@/components/SlideOver';

interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price: number;
  stock: number;
}

interface Product {
  id: string;
  title: string;
  category: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number;
  images: string[];
  variants: ProductVariant[];
}

const DEMO_STORES: Record<
  string,
  { storeName: string; tagline: string; categories: string[]; products: Product[] }
> = {
  'hijab-mevvah': {
    storeName: 'Hijab Mevvah Official',
    tagline: 'Koleksi Busana Muslimah Modern Indonesia - Sutra Premium Halus & Sejuk',
    categories: ['Semua', 'Hijab Silk', 'Pashmina', 'Voal'],
    products: [
      {
        id: 'hm-prod-1',
        title: 'Hijab Silk Premium Emerald Glow',
        category: 'Hijab Silk',
        slug: 'hijab-silk-premium-emerald-glow',
        description: 'Hijab sutra premium dengan kilau mewah elegan, tegak di dahi tanpa kusut.',
        price: 149000,
        compare_at_price: 199000,
        images: ['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600'],
        variants: [
          { id: 'v1', sku: 'HM-EMR-OS', title: 'Emerald Green', price: 149000, stock: 45 },
          { id: 'v2', sku: 'HM-ROSE-OS', title: 'Dusty Rose', price: 149000, stock: 30 },
        ],
      },
      {
        id: 'hm-prod-2',
        title: 'Pashmina Plisket Ceruty Babydoll',
        category: 'Pashmina',
        slug: 'pashmina-plisket-ceruty-babydoll',
        description: 'Plisket lidi rapi, bahan jatuh, adem, dan tidak perlu disetrika.',
        price: 89000,
        compare_at_price: 129000,
        images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600'],
        variants: [
          { id: 'v3', sku: 'HM-PLIS-BLK', title: 'Onyx Black', price: 89000, stock: 100 },
          { id: 'v4', sku: 'HM-PLIS-MOCHA', title: 'Warm Mocha', price: 89000, stock: 80 },
        ],
      },
      {
        id: 'hm-prod-3',
        title: 'Voal Miracle Plain Lasercut Signature',
        category: 'Voal',
        slug: 'voal-miracle-plain-lasercut',
        description: 'Tepi lasercut rapi, bahan voal premium mudah dibentuk dan tidak menerawang.',
        price: 65000,
        compare_at_price: 85000,
        images: ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600'],
        variants: [
          { id: 'v5', sku: 'HM-VOAL-NUDE', title: 'Nude Beige', price: 65000, stock: 60 },
          { id: 'v6', sku: 'HM-VOAL-SAGE', title: 'Sage Green', price: 65000, stock: 50 },
        ],
      },
    ],
  },
  'vibe-sneakers': {
    storeName: 'Vibe Sneakers Surabaya',
    tagline: 'Curated Streetwear & 100% Authentic Kicks',
    categories: ['Semua', 'Sneakers', 'Running', 'Streetwear'],
    products: [
      {
        id: 'vs-prod-1',
        title: 'Retro Runner Glide 90s Edition',
        category: 'Running',
        slug: 'retro-runner-glide-90s-edition',
        description: 'Sneakers vintage dengan bantalan cloud-foam ultra empuk untuk aktivitas harian.',
        price: 589000,
        compare_at_price: 749000,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
        variants: [
          { id: 'vs-1', sku: 'VS-41-RED', title: 'Size 41 / Red Core', price: 589000, stock: 15 },
          { id: 'vs-2', sku: 'VS-42-RED', title: 'Size 42 / Red Core', price: 589000, stock: 20 },
        ],
      },
    ],
  },
};

export default function StorefrontPage({ params }: { params: Promise<{ store_slug: string }> }) {
  const resolvedParams = use(params);
  const storeSlug = resolvedParams.store_slug;

  const store = DEMO_STORES[storeSlug] || {
    storeName: storeSlug.replace('-', ' ').toUpperCase(),
    tagline: 'Toko Resmi ALURELAB E-Commerce Storefront',
    categories: ['Semua', 'Koleksi Utama'],
    products: DEMO_STORES['hijab-mevvah'].products,
  };

  const { items, addItem, removeItem, updateQuantity, getTotalItems, getSubtotal } = useCartStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [trackNumber, setTrackNumber] = useState('ORD-20260914-00192');
  const [trackResult, setTrackResult] = useState<any>(null);

  // Filter Produk
  const filteredProducts = useMemo(() => {
    return store.products.filter((prod) => {
      const matchSearch = prod.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'Semua' || prod.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [store.products, searchQuery, selectedCategory]);

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
    setIsCartOpen(true);
  };

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackResult({
      orderNumber: trackNumber,
      courier: 'SiCepat Ekspres (REG)',
      awb: '004289127819',
      status: 'IN_TRANSIT',
      statusText: 'Paket sedang dalam perjalanan ke alamat tujuan.',
      timeline: [
        { time: '14 Sep 2026, 14:15', desc: 'Pesanan terbayar via QRIS (Dana aman di Escrow Xendit)' },
        { time: '14 Sep 2026, 15:30', desc: 'Resi AWB diterbitkan oleh Biteship' },
        { time: '14 Sep 2026, 17:00', desc: 'Kurir SiCepat telah pick-up paket dari toko penjual' },
        { time: '14 Sep 2026, 20:45', desc: 'Paket tiba di Hub Sortir Surabaya Timur' },
      ],
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Banner Garansi */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 text-center font-medium">
        ⚡ Garansi Pengiriman Cepat Multi-Kurir Biteship • Pembayaran Aman Berlisensi Xendit (PJP BI)
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href={`/${storeSlug}`} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
              {store.storeName.charAt(0)}
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-slate-900 tracking-tight leading-none">
                {store.storeName}
              </h1>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> Toko Resmi Terverifikasi
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari produk di toko ini..."
                className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTrackOrderOpen(true)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all"
            >
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Lacak Pesanan</span>
            </button>

            <button
              onClick={() => setIsProfileOpen(true)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl hover:bg-slate-100 transition-all"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Akun Saya</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Keranjang</span>
              {getTotalItems() > 0 && (
                <span className="bg-emerald-500 text-slate-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-white to-slate-100/60 border-b border-slate-200/80 py-10 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-2">
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full font-bold inline-block">
            ✨ Sub-300ms Storefront Performance
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {store.tagline}
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Nikmati belanja produk original dengan jaminan uang kembali, resi kurir real-time, dan pembayaran fleksibel QRIS atau Bayar di Tempat (COD).
          </p>
        </div>
      </section>

      {/* Category Pills & Catalog */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Category Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {store.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-slate-900">{filteredProducts.length}</span> produk
          </div>
        </div>

        {/* Product Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              {/* Image Thumbnail */}
              <Link href={`/${storeSlug}/products/${product.slug}`} className="aspect-square bg-slate-100 relative overflow-hidden group block">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.compare_at_price && (
                  <span className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    Diskon {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                  </span>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> 4.9
                </div>
              </Link>

              {/* Detail */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                    {product.category}
                  </span>
                  <Link href={`/${storeSlug}/products/${product.slug}`}>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1 hover:text-emerald-600 transition-colors">
                      {product.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>


                <div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-black text-slate-900">
                      Rp {product.price.toLocaleString('id-ID')}
                    </span>
                    {product.compare_at_price && (
                      <span className="text-xs text-slate-400 line-through">
                        Rp {product.compare_at_price.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  {/* Varian & Beli */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-600 block">Pilihan Varian:</span>
                    <div className="space-y-1">
                      {product.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleAddToCart(product, v)}
                          className="w-full flex items-center justify-between text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all font-medium text-slate-700"
                        >
                          <span>{v.title}</span>
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            + Masuk Keranjang
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

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
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
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
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                      className="w-5 h-5 flex items-center justify-center rounded bg-white text-slate-700 font-bold hover:bg-slate-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold px-1.5">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                      className="w-5 h-5 flex items-center justify-center rounded bg-white text-slate-700 font-bold hover:bg-slate-200"
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

      {/* DRAWER 2: SLIDE-OVER LACAK PESANAN (TRACK ORDER) */}
      <SlideOver
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
        title="Lacak Pengiriman Pesanan"
        subtitle="Cek nomor resi AWB kurir ekspedisi real-time."
      >
        <form onSubmit={handleTrackOrder} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nomor Pesanan atau No. WhatsApp</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={trackNumber}
                onChange={(e) => setTrackNumber(e.target.value)}
                placeholder="ORD-20260914-XXXX"
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl"
              >
                Cek Resi
              </button>
            </div>
          </div>

          {trackResult && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/80 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{trackResult.courier}</span>
                  <span className="font-mono font-bold text-emerald-700">{trackResult.awb}</span>
                </div>
                <p className="text-[11px] text-slate-600">{trackResult.statusText}</p>
              </div>

              {/* Timeline */}
              <div className="space-y-3 pt-2">
                <span className="font-bold text-slate-700 block">Riwayat Perjalanan Paket:</span>
                <div className="border-l-2 border-emerald-500 pl-4 space-y-4 text-xs">
                  {trackResult.timeline.map((tl: any, i: number) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                      <div className="font-bold text-slate-900">{tl.desc}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{tl.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={`/${storeSlug}/orders/${trackNumber}`}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                Lihat Halaman Pelacakan Lengkap →
              </Link>
            </div>
          )}
        </form>
      </SlideOver>


      {/* DRAWER 3: SLIDE-OVER AKUN SAYA (BUYER PROFILE) */}
      <SlideOver
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title="Akun & Riwayat Pembeli"
        subtitle="Profil transaksi dan alamat pengiriman tersimpan Anda."
      >
        <div className="space-y-5 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base">
              RW
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">Rina Wulandari</h4>
              <p className="text-slate-500 font-mono">081234567890</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Pelanggan Terverifikasi (Skor Anti-RTS: Aman)</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-slate-700 block">Alamat Pengiriman Utama:</span>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
              Jl. Kertajaya Indah No. 12, Sukolilo, Surabaya, Jawa Timur (60111)
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="font-bold text-slate-700 block">Riwayat Pesanan Terakhir:</span>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <div className="font-mono font-bold text-slate-900">ORD-20260914-00192</div>
                <div className="text-slate-500 text-[11px]">Hijab Silk Premium Emerald (1x) • Rp 166.000</div>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Sedang Dikirim
              </span>
            </div>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
