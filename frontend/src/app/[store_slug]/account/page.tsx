'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Package,
  Clock,
  Settings,
  ArrowLeft,
  Truck,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  ExternalLink,
  MapPin,
  Save,
  Loader2,
} from 'lucide-react';
import { useBuyerStore } from '@/store/buyer-store';
import { fetchApi } from '@/lib/api-client';
import BuyerLoginModal from '@/components/buyer/BuyerLoginModal';
import { WilayahAddressFields, type WilayahAddressValue } from '@/components/address/WilayahAddressFields';
import { useBuyerCms } from '@/components/buyer/useBuyerCms';
import { BuyerNavbar, BuyerThemeFrame } from '@/components/buyer/BuyerTheme';

export default function AccountPage({
  params,
}: {
  params: Promise<{ store_slug: string }>;
}) {
  const { store_slug: storeSlug } = use(params);
  const { buyer, logout, updateAddress } = useBuyerStore();
  const copy = useBuyerCms(storeSlug);

  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'settings'>('active');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Settings form state
  const [addressDetail, setAddressDetail] = useState(buyer?.defaultAddress?.detail || '');
  const [postalCode, setPostalCode] = useState(buyer?.defaultAddress?.postalCode || '');
  const [wilayah, setWilayah] = useState<WilayahAddressValue>({});
  const [savingAddress, setSavingAddress] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    if (buyer?.defaultAddress) {
      setWilayah({
        provinceCode: buyer.defaultAddress.provinceCode,
        provinceName: buyer.defaultAddress.provinceName,
        regencyCode: buyer.defaultAddress.regencyCode,
        regencyName: buyer.defaultAddress.regencyName,
        districtCode: buyer.defaultAddress.districtCode,
        districtName: buyer.defaultAddress.districtName,
        villageCode: buyer.defaultAddress.villageCode,
        villageName: buyer.defaultAddress.villageName,
        areaId: buyer.defaultAddress.areaId,
        areaName: buyer.defaultAddress.areaName,
        postalCode: buyer.defaultAddress.postalCode,
      });
    }
  }, [buyer]);

  const storeDisplayName = storeSlug.replace(/-/g, ' ').toUpperCase();

  // Load orders when buyer is logged in
  useEffect(() => {
    if (!buyer?.phoneNumber) return;
    let isMounted = true;
    const phone = buyer.phoneNumber;
    async function loadOrders() {
      setLoadingOrders(true);
      try {
        const res = await fetchApi('/buyer/orders', {
          headers: { 'x-store-slug': storeSlug },
        });
        if (isMounted) setOrders(res.data || []);
      } catch {
        if (isMounted) setOrders([]);
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    }
    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [buyer, storeSlug]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyer) return;
    setSavingAddress(true);
    setSaveSuccessMsg('');

    try {
      const updated = {
        detail: addressDetail,
        postalCode: postalCode,
        ...wilayah,
      };
      await fetchApi('/buyer/profile', {
        method: 'PUT',
        body: JSON.stringify({
          default_address: updated,
        }),
        headers: { 'x-store-slug': storeSlug },
      });
      updateAddress(updated);
      setSaveSuccessMsg('Alamat pengiriman berhasil diperbarui.');
    } catch (err: any) {
      setSaveSuccessMsg(err?.message || 'Alamat gagal diperbarui.');
    } finally {
      setSavingAddress(false);
    }
  };

  const activeOrders = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const pastOrders = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'CANCELLED');

  return (
     <BuyerThemeFrame storeSlug={storeSlug} className="text-[#111111] font-sans antialiased flex flex-col">
       <BuyerNavbar storeSlug={storeSlug} storeName={storeDisplayName} />

      {/* ── Main Content ────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto w-full px-6 md:px-10 py-12 flex-1">
        {!buyer ? (
          /* Unauthenticated State */
          <div className="py-20 text-center space-y-6 max-w-md mx-auto">
            <div className="w-16 h-16 border border-[#DADADA] flex items-center justify-center mx-auto text-[#666666]">
              <User className="w-7 h-7 stroke-[1.4]" />
             </div>
            <div className="space-y-2">
              <h1 className="font-bebas text-4xl uppercase tracking-wide text-[#111111]">
                  {copy.accountTitle}
              </h1>
              <p className="text-xs text-[#666666] leading-relaxed">
                  {copy.accountSignIn}
               </p>
             </div>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-[#111111] text-[#F5F5F3] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all"
            >
               SIGN IN
            </button>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="space-y-10">
            {/* Buyer Profile Header Banner */}
            <div className="border border-[#DADADA] bg-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#111111] text-[#F5F5F3] font-bebas text-3xl flex items-center justify-center">
                  {buyer.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#666666]">
                     ACCOUNT
                  </div>
                  <h2 className="font-bebas text-3xl tracking-wide uppercase text-[#111111]">
                    {buyer.fullName}
                  </h2>
                  <div className="text-xs text-[#666666] font-mono">
                    {buyer.phoneNumber} {buyer.email && `• ${buyer.email}`}
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#DADADA]">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-200">
                   <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#666666]">
                  Toko: {storeDisplayName}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-8 border-b border-[#DADADA] overflow-x-auto">
              <button
                onClick={() => setActiveTab('active')}
                className={`pb-3 text-xs uppercase tracking-[0.18em] transition-all whitespace-nowrap ${
                  activeTab === 'active'
                    ? 'font-bold text-[#111111] border-b-2 border-[#111111]'
                    : 'text-[#666666] hover:text-[#111111]'
                }`}
              >
                  {copy.accountActiveOrders} ({activeOrders.length})
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`pb-3 text-xs uppercase tracking-[0.18em] transition-all whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'font-bold text-[#111111] border-b-2 border-[#111111]'
                    : 'text-[#666666] hover:text-[#111111]'
                }`}
              >
                  {copy.accountOrderHistory} ({pastOrders.length})
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`pb-3 text-xs uppercase tracking-[0.18em] transition-all whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'font-bold text-[#111111] border-b-2 border-[#111111]'
                    : 'text-[#666666] hover:text-[#111111]'
                }`}
              >
                  {copy.accountSettings}
              </button>
            </div>

            {/* TAB 1: PESANAN SAYA (ACTIVE ORDERS) */}
            {activeTab === 'active' && (
              <div className="space-y-6">
                {activeOrders.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-[#DADADA] p-8 space-y-3">
                    <Package className="w-8 h-8 mx-auto text-[#666666] stroke-[1.4]" />
                    <p className="text-sm font-semibold text-[#111111]">
                      Tidak ada pesanan yang sedang berlangsung.
                    </p>
                    <p className="text-xs text-[#666666]">
                       Pesanan baru akan tampil di sini.
                    </p>
                    <Link
                      href={`/${storeSlug}`}
                      className="inline-block pt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#111111] underline"
                    >
                       SHOP NOW →
                    </Link>
                  </div>
                ) : (
                  activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-[#DADADA] bg-white p-6 space-y-6"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DADADA] text-xs">
                        <div>
                          <div className="font-mono font-bold text-[#111111] text-sm">
                            {order.order_number}
                          </div>
                          <div className="text-[11px] text-[#666666] mt-0.5">
                            {order.created_at}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-100 text-amber-900">
                            {order.status_label || order.status}
                          </span>
                          <span className="font-bold text-[#111111]">
                            Rp {order.total_amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-4">
                        {order.items?.map((item: any, i: number) => (
                          <div key={i} className="flex gap-4 items-center text-xs">
                            <div className="w-14 aspect-[3/4] bg-stone-100 border border-[#DADADA] overflow-hidden shrink-0">
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-[#111111] uppercase tracking-wide truncate">
                                {item.title}
                              </h4>
                              <div className="text-[#666666] text-[11px] mt-0.5">
                                {item.variant_title} • Qty: {item.quantity}
                              </div>
                            </div>
                            <div className="font-semibold text-[#111111]">
                              Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Courier & AWB Track Info */}
                      <div className="pt-4 border-t border-[#DADADA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-stone-50 p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-[#111111]">
                            <Truck className="w-4 h-4 text-emerald-600" />
                            <span>{order.courier}</span>
                          </div>
                          <div className="font-mono text-[11px] text-[#666666]">
                            No. Resi AWB: {order.awb}
                          </div>
                        </div>

                        <Link
                          href={`/${storeSlug}/orders/${order.order_number}`}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#111111] hover:underline"
                        >
                          <span>Lacak Perjalanan Paket</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: RIWAYAT PESANAN (ORDER HISTORY) */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                {pastOrders.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-[#DADADA] p-8 space-y-2">
                    <Clock className="w-8 h-8 mx-auto text-[#666666] stroke-[1.4]" />
                    <p className="text-sm font-semibold text-[#111111]">
                      Belum ada riwayat pesanan selesai.
                    </p>
                    <p className="text-xs text-[#666666]">
                       Pesanan selesai akan tampil di sini.
                    </p>
                  </div>
                ) : (
                  pastOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-[#DADADA] bg-white p-6 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DADADA] text-xs">
                        <div>
                          <div className="font-mono font-bold text-[#111111]">
                            {order.order_number}
                          </div>
                          <div className="text-[11px] text-[#666666] mt-0.5">
                            {order.created_at}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800">
                            {order.status_label || order.status}
                          </span>
                          <span className="font-bold text-[#111111]">
                            Rp {order.total_amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {order.items?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="text-[#111111]">
                              {item.title} ({item.variant_title}) × {item.quantity}
                            </span>
                            <span className="font-semibold text-[#111111]">
                              Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-[#DADADA] flex justify-end">
                        <Link
                          href={`/${storeSlug}/orders/${order.order_number}`}
                          className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#111111] hover:underline"
                        >
                          Lihat Rincian & Invoice →
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: PENGATURAN (SETTINGS) */}
            {activeTab === 'settings' && (
              <div className="border border-[#DADADA] bg-white p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="font-bebas text-2xl tracking-wide uppercase text-[#111111]">
                     SETTINGS
                  </h3>
                  <p className="text-xs text-[#666666]">
                     Alamat ini digunakan saat checkout.
                  </p>
                </div>

                {saveSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-[0.14em] text-[#111111] mb-1.5">
                      Wilayah Pengiriman
                    </label>
                    <WilayahAddressFields value={wilayah} onChange={setWilayah} />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-[0.14em] text-[#111111] mb-1.5">
                      Nama Lengkap Pembeli
                    </label>
                    <input
                      type="text"
                      disabled
                      value={buyer.fullName}
                       className="w-full bg-stone-100 p-3 border border-[#DADADA] text-[#666666] cursor-not-allowed"
                     />
                   </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-[0.14em] text-[#111111] mb-1.5">
                      Nomor WhatsApp / HP Aktif
                    </label>
                    <input
                      type="text"
                      disabled
                      value={buyer.phoneNumber}
                      className="w-full bg-stone-100 p-3 border border-[#DADADA] text-[#666666] cursor-not-allowed font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-[0.14em] text-[#111111] mb-1.5">
                      Alamat Lengkap Pengiriman (Jalan, No Rumah, RT/RW, Kelurahan, Kecamatan)
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={addressDetail}
                      onChange={(e) => setAddressDetail(e.target.value)}
                      placeholder="Contoh: Jl. Pemuda No. 45 RT 02 RW 03, Kel. Embong Kaliasin, Kec. Genteng, Kota Surabaya"
                      className="w-full p-3 border border-[#DADADA] text-[#111111] focus:outline-none focus:border-[#111111] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-[0.14em] text-[#111111] mb-1.5">
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Contoh: 60271"
                      className="w-full sm:w-48 p-3 border border-[#DADADA] text-[#111111] focus:outline-none focus:border-[#111111] bg-white font-mono"
                    />
                  </div>

                  <div className="pt-4 border-t border-[#DADADA]">
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="bg-[#111111] text-[#F5F5F3] px-8 py-3.5 font-semibold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingAddress ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                           <span>SAVE</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-[#DADADA] bg-[#F5F5F3] py-8 px-6 text-center text-[11px] uppercase tracking-[0.14em] text-[#666666]">
         <div>© 2026 {storeDisplayName}</div>
      </footer>

      {/* Login Popup Modal */}
      <BuyerLoginModal
        isOpen={isLoginModalOpen}
       onClose={() => setIsLoginModalOpen(false)}
        storeSlug={storeSlug}
        storeName={storeDisplayName}
      />
     </BuyerThemeFrame>
  );
}
