'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldCheck,
  CreditCard,
  Package,
  Truck,
  CheckCircle2,
  ChevronRight,
  Ticket,
  MapPin,
  Lock,
  Bell,
  Eye,
  LogOut,
  Save,
  Loader2,
  ExternalLink,
  ArrowLeft,
  Copy,
  Clock,
  Settings,
} from 'lucide-react';
import { useBuyerStore } from '@/store/buyer-store';
import { fetchApi } from '@/lib/api-client';
import BuyerLoginModal from '@/components/buyer/BuyerLoginModal';
import BuyerTopBar from '@/components/buyer/BuyerTopBar';
import BuyerBottomNav from '@/components/buyer/BuyerBottomNav';
import { WilayahAddressFields, type WilayahAddressValue } from '@/components/address/WilayahAddressFields';
import { toast } from 'sonner';

export default function AccountPage({
  params,
}: {
  params: Promise<{ store_slug: string }>;
}) {
  const router = useRouter();
  const { store_slug: storeSlug } = use(params);
  const { buyer, logout, updateAddress, setBuyer } = useBuyerStore();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'editProfile' | 'addresses' | 'security' | 'notifications' | 'privacy' | 'vouchers' | null
  >(null);

  // Profile Edit State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Address Form State
  const [addressDetail, setAddressDetail] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [wilayah, setWilayah] = useState<WilayahAddressValue>({});
  const [savingAddress, setSavingAddress] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (buyer) {
      setEditName(buyer.fullName || '');
      setEditEmail(buyer.email || '');
      if (buyer.defaultAddress) {
        setAddressDetail(buyer.defaultAddress.detail || '');
        setPostalCode(buyer.defaultAddress.postalCode || '');
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
    }
  }, [buyer]);

  // Load orders when buyer logged in
  useEffect(() => {
    if (!buyer?.phoneNumber) return;
    let isMounted = true;
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

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyer) return;
    setSavingAddress(true);

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
      toast.success('Alamat pengiriman berhasil disimpan!');
      setActiveModal(null);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan alamat.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyer) return;
    try {
      await fetchApi('/buyer/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: editName,
          email: editEmail,
        }),
        headers: { 'x-store-slug': storeSlug },
      });
      setBuyer({
        ...buyer,
        fullName: editName,
        email: editEmail,
      });
      toast.success('Profil berhasil diperbarui!');
      setActiveModal(null);
    } catch {
      toast.error('Gagal memperbarui profil.');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Berhasil keluar dari akun.');
  };

  const storeDisplayName = storeSlug.replace(/-/g, ' ');

  // Count orders per status
  const unpaidCount = orders.filter((o) => o.status === 'PENDING' || o.status === 'UNPAID').length;
  const processingCount = orders.filter((o) => o.status === 'PAID' || o.status === 'PROCESSING').length;
  const shippedCount = orders.filter((o) => o.status === 'SHIPPED').length;
  const completedCount = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 flex flex-col font-sans antialiased pb-24">
      {/* ── 1. Top Bar ── */}
      <BuyerTopBar
        storeSlug={storeSlug}
        storeName={storeDisplayName}
        placeholder="Cari pesanan atau produk..."
      />

      <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-4 pt-3 space-y-3">
        {!buyer ? (
          /* Unauthenticated State */
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-slate-400">
              <User className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">
                Masuk ke Akun Pembeli
              </h2>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Lacak status pesanan, simpan alamat pengiriman, dan gunakan voucher toko dengan mudah.
              </p>
            </div>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-xs"
            >
              Masuk / Daftar via WhatsApp
            </button>
          </div>
        ) : (
          /* Authenticated Account Page */
          <>
            {/* ── 2. Foto Profil & Nama ── */}
            <section className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-linear-to-tr from-slate-900 to-slate-700 text-white font-black text-xl flex items-center justify-center shadow-md shadow-slate-200 shrink-0">
                  {buyer.fullName ? buyer.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-bold text-slate-900 truncate">
                      {buyer.fullName || 'Pelanggan ALURELAB'}
                    </h2>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">
                    {buyer.phoneNumber}
                  </p>
                  {buyer.email && (
                    <p className="text-[11px] text-stone-400 truncate">
                      {buyer.email}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal('editProfile')}
                  className="text-xs font-bold text-slate-700 hover:text-black bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-colors shrink-0"
                >
                  Edit
                </button>
              </div>
            </section>

            {/* ── 3. Voucher & Promo Saya ── */}
            <section className="bg-white rounded-2xl border border-stone-200/80 p-3.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveModal('vouchers')}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Voucher & Kupon Toko</span>
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                        2 Tersedia
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Gunakan potongan belanja saat checkout
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-colors" />
              </button>
            </section>

            {/* ── 4. Transaksi: Belum Bayar, Diproses, Dikirim, Sudah Tiba ── */}
            <section className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Transaksi Saya
                </h3>
                <Link
                  href={`/${storeSlug}/orders`}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-0.5"
                >
                  <span>Lihat Riwayat</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center">
                {/* 1. Belum Bayar */}
                <Link
                  href={`/${storeSlug}/orders?tab=unpaid`}
                  className="p-2 rounded-xl hover:bg-stone-50 transition-colors flex flex-col items-center relative"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1 relative">
                    <CreditCard className="w-5 h-5" />
                    {unpaidCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {unpaidCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">Belum Bayar</span>
                </Link>

                {/* 2. Diproses */}
                <Link
                  href={`/${storeSlug}/orders?tab=processing`}
                  className="p-2 rounded-xl hover:bg-stone-50 transition-colors flex flex-col items-center relative"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1 relative">
                    <Package className="w-5 h-5" />
                    {processingCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {processingCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">Diproses</span>
                </Link>

                {/* 3. Dikirim */}
                <Link
                  href={`/${storeSlug}/orders?tab=shipped`}
                  className="p-2 rounded-xl hover:bg-stone-50 transition-colors flex flex-col items-center relative"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1 relative">
                    <Truck className="w-5 h-5" />
                    {shippedCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {shippedCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">Dikirim</span>
                </Link>

                {/* 4. Sudah Tiba */}
                <Link
                  href={`/${storeSlug}/orders?tab=completed`}
                  className="p-2 rounded-xl hover:bg-stone-50 transition-colors flex flex-col items-center relative"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 relative">
                    <CheckCircle2 className="w-5 h-5" />
                    {completedCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {completedCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">Sudah Tiba</span>
                </Link>
              </div>
            </section>

            {/* ── 5. Menu Setting / Pengaturan ── */}
            <section className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-2xs divide-y divide-stone-100">
              <div className="px-4 py-2.5 bg-stone-50/50 text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                Pengaturan Akun & Keamanan
              </div>

              {/* Ubah Profil */}
              <button
                type="button"
                onClick={() => setActiveModal('editProfile')}
                className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-800">Ubah Profil</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* Daftar Alamat */}
              <button
                type="button"
                onClick={() => setActiveModal('addresses')}
                className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-600" />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-800 block">Daftar Alamat</span>
                    <span className="text-[10px] text-stone-400 truncate max-w-[200px] block">
                      {buyer.defaultAddress?.detail || 'Belum ada alamat tersimpan'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* Keamanan Akun */}
              <button
                type="button"
                onClick={() => setActiveModal('security')}
                className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-800">Keamanan Akun</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* Notifikasi */}
              <button
                type="button"
                onClick={() => setActiveModal('notifications')}
                className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-800">Notifikasi Pesanan</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* Privasi Akun */}
              <button
                type="button"
                onClick={() => setActiveModal('privacy')}
                className="w-full p-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-800">Privasi Akun & Data</span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>

              {/* Keluar Akun */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full p-3.5 flex items-center justify-between hover:bg-rose-50 transition-colors text-rose-600"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4" />
                  <span className="text-xs font-bold">Keluar dari Akun</span>
                </div>
              </button>
            </section>
          </>
        )}
      </main>

      {/* ── MODALS / DRAWERS UNTUK SETTING ── */}

      {/* 1. Modal Ubah Profil */}
      {activeModal === 'editProfile' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl z-10 space-y-4 animate-in slide-in-from-bottom">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-stone-100">
              Ubah Profil Pembeli
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email (Opsional)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="contoh@gmail.com"
                  className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp (Terkunci)</label>
                <input
                  type="text"
                  disabled
                  value={buyer?.phoneNumber || ''}
                  className="w-full p-3 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 font-mono"
                />
              </div>
              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-3 bg-stone-100 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Daftar Alamat */}
      {activeModal === 'addresses' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-stone-100">
              Pengaturan Alamat Pengiriman
            </h3>
            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Wilayah Indonesia</label>
                <WilayahAddressFields value={wilayah} onChange={setWilayah} />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Detail Alamat (Jalan, RT/RW, No)</label>
                <textarea
                  rows={3}
                  required
                  value={addressDetail}
                  onChange={(e) => setAddressDetail(e.target.value)}
                  placeholder="Contoh: Jl. Diponegoro No. 12, RT 01 RW 04"
                  className="w-full p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kode Pos</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Contoh: 60241"
                  className="w-full sm:w-36 p-3 rounded-xl border border-stone-200 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-3 bg-stone-100 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  {savingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Alamat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Keamanan Akun */}
      {activeModal === 'security' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl z-10 space-y-4 animate-in slide-in-from-bottom">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Keamanan Akun Pembeli</span>
            </h3>
            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <p>
                Akun Anda diamankan menggunakan autentikasi <strong>One-Click WhatsApp OTP</strong> tanpa kata sandi yang mudah bocor.
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                <div className="font-bold">Nomor Terhubung:</div>
                <div className="font-mono text-sm">{buyer?.phoneNumber}</div>
              </div>
              <p className="text-[11px] text-stone-400">
                Sesi login aktif disimpan di perangkat ini dan dilindungi oleh enkripsi SSL 256-bit ALURELAB.
              </p>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* 4. Modal Notifikasi */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl z-10 space-y-4 animate-in slide-in-from-bottom">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>Notifikasi Pesanan</span>
            </h3>
            <div className="space-y-3 text-xs text-stone-600">
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <div className="font-bold text-slate-900">Pembaruan WhatsApp</div>
                  <div className="text-[11px] text-stone-500">Kirim resi & status kirim ke WA</div>
                </div>
                <span className="text-emerald-700 font-bold text-[11px] bg-emerald-100 px-2 py-0.5 rounded-full">
                  Aktif
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <div className="font-bold text-slate-900">Info Promo Toko</div>
                  <div className="text-[11px] text-stone-500">Notifikasi diskon dan voucher baru</div>
                </div>
                <span className="text-emerald-700 font-bold text-[11px] bg-emerald-100 px-2 py-0.5 rounded-full">
                  Aktif
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-xs"
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      {/* 5. Modal Privasi Akun */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl z-10 space-y-4 animate-in slide-in-from-bottom">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-700" />
              <span>Privasi Akun & Data</span>
            </h3>
            <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
              <p>
                Data pribadi dan riwayat pesanan Anda dilindungi dan hanya digunakan untuk keperluan pemrosesan pembayaran (Xendit) serta pengiriman ekspedisi (Biteship).
              </p>
              <p>
                ALURELAB tidak membagikan atau menjual data pelanggan kepada pihak ketiga.
              </p>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-xs"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* 6. Modal Voucher & Kupon */}
      {activeModal === 'vouchers' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setActiveModal(null)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl z-10 space-y-4 animate-in slide-in-from-bottom">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-stone-100 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-500" />
              <span>Voucher Toko Tersedia</span>
            </h3>
            <div className="space-y-3">
              <div className="p-3.5 bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-900">Voucher Diskon Rp 25.000</span>
                  <span className="text-[10px] font-mono bg-white text-amber-900 font-bold px-2 py-0.5 rounded-sm border border-amber-300">
                    HEMAT25
                  </span>
                </div>
                <p className="text-[11px] text-amber-700">Min. transaksi Rp 100.000 untuk semua produk</p>
              </div>

              <div className="p-3.5 bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-900">Gratis Ongkir Xtra Rp 15.000</span>
                  <span className="text-[10px] font-mono bg-white text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    ONGKIRFREE
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700">Otomatis terpotong saat memilih kurir reguler</p>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-xs"
            >
              Gunakan Saat Belanja
            </button>
          </div>
        </div>
      )}

      {/* ── 6. Sticky Bottom Navigation (Tab AKUN Aktif) ── */}
      <BuyerBottomNav storeSlug={storeSlug} />

      {/* Login Popup Modal */}
      <BuyerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        storeSlug={storeSlug}
        storeName={storeDisplayName}
      />
    </div>
  );
}
