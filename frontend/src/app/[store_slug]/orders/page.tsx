'use client';

import { use, useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  CreditCard,
  Search,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useBuyerStore } from '@/store/buyer-store';
import { fetchApi } from '@/lib/api-client';
import BuyerTopBar from '@/components/buyer/BuyerTopBar';
import BuyerBottomNav from '@/components/buyer/BuyerBottomNav';
import BuyerLoginModal from '@/components/buyer/BuyerLoginModal';

function OrdersPageContent({ storeSlug }: { storeSlug: string }) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  const { buyer } = useBuyerStore();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  const storeDisplayName = storeSlug.replace(/-/g, ' ');

  // Fetch orders
  const loadOrders = async () => {
    if (!buyer?.phoneNumber) return;
    setLoading(true);
    try {
      const res = await fetchApi('/buyer/orders', {
        headers: { 'x-store-slug': storeSlug },
      });
      setOrders(res.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [buyer, storeSlug]);

  // Tab definitions
  const tabs = [
    { id: 'all', label: 'Semua' },
    { id: 'unpaid', label: 'Belum Bayar' },
    { id: 'processing', label: 'Diproses' },
    { id: 'shipped', label: 'Dikirim' },
    { id: 'completed', label: 'Sudah Tiba' },
  ];

  // Filter orders by active tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'unpaid') {
      return orders.filter((o) => o.status === 'PENDING' || o.status === 'UNPAID');
    }
    if (activeTab === 'processing') {
      return orders.filter((o) => o.status === 'PAID' || o.status === 'PROCESSING');
    }
    if (activeTab === 'shipped') {
      return orders.filter((o) => o.status === 'SHIPPED');
    }
    if (activeTab === 'completed') {
      return orders.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED');
    }
    return orders;
  }, [orders, activeTab]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'UNPAID':
        return {
          label: 'Belum Bayar',
          className: 'bg-amber-100 text-amber-900 border-amber-200',
        };
      case 'PAID':
      case 'PROCESSING':
        return {
          label: 'Diproses Penjual',
          className: 'bg-blue-100 text-blue-900 border-blue-200',
        };
      case 'SHIPPED':
        return {
          label: 'Dalam Pengiriman',
          className: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        };
      case 'DELIVERED':
      case 'COMPLETED':
        return {
          label: 'Selesai / Tiba',
          className: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        };
      case 'CANCELLED':
        return {
          label: 'Dibatalkan',
          className: 'bg-stone-100 text-stone-600 border-stone-200',
        };
      default:
        return {
          label: status,
          className: 'bg-stone-100 text-stone-800 border-stone-200',
        };
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 flex flex-col font-sans antialiased pb-24">
      {/* ── 1. Top Bar: Search Bar + Chat + Keranjang ── */}
      <BuyerTopBar
        storeSlug={storeSlug}
        storeName={storeDisplayName}
        placeholder="Cari transaksi pesanan..."
      />

      {/* ── 2. Status Filter Tabs (Horizontal Scrollable) ── */}
      <section className="bg-white border-b border-stone-200 sticky top-14 z-30">
        <div className="max-w-2xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar px-3 py-2">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-4 pt-3 space-y-3">
        {!buyer ? (
          /* Unauthenticated State */
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-7 h-7 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">
                Lihat Pesanan Anda
              </h2>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Masuk menggunakan nomor WhatsApp untuk memeriksa status pembayaran, resi, dan riwayat pesanan.
              </p>
            </div>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-xs"
            >
              Masuk dengan WhatsApp
            </button>
          </div>
        ) : loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-500 font-medium">Memuat daftar pesanan...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty Order State */
          <div className="bg-white rounded-2xl border border-dashed border-stone-300 py-16 px-4 text-center space-y-3">
            <Package className="w-10 h-10 text-stone-400 mx-auto stroke-[1.5]" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                Belum Ada Pesanan
              </h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Tidak ada riwayat transaksi dengan status ini. Mulai jelajahi katalog produk toko.
              </p>
            </div>
            <Link
              href={`/${storeSlug}/shop`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black px-5 py-2.5 rounded-xl transition-colors shadow-xs"
            >
              <span>Belanja Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          /* Order Cards List */
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status);
              return (
                <article
                  key={order.id || order.order_number}
                  className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs space-y-3"
                >
                  {/* Card Header: Order No & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-950 block">
                        {order.order_number}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {order.created_at || 'Baru saja'}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Order Items Preview */}
                  <div className="space-y-2">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden border border-stone-200 shrink-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-stone-500">
                            {item.variant_title} • {item.quantity} barang
                          </p>
                        </div>
                        <div className="font-extrabold text-slate-900 shrink-0">
                          Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer: Total & Actions */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-stone-500 block">Total Pesanan</span>
                      <span className="text-sm font-black text-slate-950">
                        Rp {Number(order.total_amount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${storeSlug}/orders/${order.order_number}`}
                        className="text-xs font-bold text-slate-700 hover:text-black bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <span>Rincian</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      {(order.status === 'SHIPPED' || order.status === 'PROCESSING') && (
                        <Link
                          href={`/${storeSlug}/orders/${order.order_number}`}
                          className="text-xs font-bold text-white bg-slate-900 hover:bg-black px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Lacak Resi</span>
                        </Link>
                      )}

                      {(order.status === 'PENDING' || order.status === 'UNPAID') && order.invoice_url && (
                        <a
                          href={order.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Bayar</span>
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ── 3. Sticky Bottom Navigation (Tab TRANSAKSI Aktif) ── */}
      <BuyerBottomNav storeSlug={storeSlug} />

      {/* Login Modal */}
      <BuyerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        storeSlug={storeSlug}
        storeName={storeDisplayName}
      />
    </div>
  );
}

export default function OrdersPage({
  params,
}: {
  params: Promise<{ store_slug: string }>;
}) {
  const { store_slug: storeSlug } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center text-xs text-stone-500">
          Memuat halaman transaksi...
        </div>
      }
    >
      <OrdersPageContent storeSlug={storeSlug} />
    </Suspense>
  );
}
