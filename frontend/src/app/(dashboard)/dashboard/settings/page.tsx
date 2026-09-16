'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Store,
  MapPin,
  Truck,
  CreditCard,
  Save,
  Check,
  Building2,
  Loader2,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import api from '@/lib/api';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'address' | 'couriers' | 'payment'>('profile');

  // Form states
  const [storeName, setStoreName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tagline, setTagline] = useState('');

  // Address states
  const [contactName, setContactName] = useState('');
  const [warehousePhone, setWarehousePhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Surabaya');
  const [province, setProvince] = useState('Jawa Timur');
  const [postalCode, setPostalCode] = useState('60271');

  // Couriers states
  const [couriers, setCouriers] = useState<Record<string, boolean>>({
    jne: true,
    sicepat: true,
    jnt: true,
    gosend: false,
    anteraja: true,
  });

  // Payment & Bank states
  const [allowCod, setAllowCod] = useState(true);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Fetch settings
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-settings'],
    queryFn: async () => {
      const res = await api.get('/merchant/settings');
      return res.data?.store;
    },
  });

  useEffect(() => {
    if (data) {
      setStoreName(data.name || '');
      setPhoneNumber(data.phone_number || '');
      const s = data.settings || {};
      setTagline(s.tagline || '');

      if (s.origin_address) {
        setContactName(s.origin_address.contact_name || '');
        setWarehousePhone(s.origin_address.phone || '');
        setAddress(s.origin_address.address || '');
        setCity(s.origin_address.city || '');
        setProvince(s.origin_address.province || '');
        setPostalCode(s.origin_address.postal_code || '');
      }

      if (s.couriers) {
        setCouriers(s.couriers);
      }

      if (s.allow_cod !== undefined) {
        setAllowCod(Boolean(s.allow_cod));
      }

      if (s.bank_account) {
        setBankName(s.bank_account.bank_name || '');
        setAccountNumber(s.bank_account.account_number || '');
        setAccountHolder(s.bank_account.account_holder || data.name || '');
      }
    }
  }, [data]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.put('/merchant/settings', payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Pengaturan berhasil diperbarui!');
      queryClient.invalidateQueries({ queryKey: ['merchant-settings'] });
    },
    onError: () => {
      toast.error('Gagal memperbarui pengaturan toko');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    updateMutation.mutate({
      name: storeName,
      phone_number: phoneNumber,
      settings: {
        tagline,
        origin_address: {
          contact_name: contactName,
          phone: warehousePhone,
          address,
          city,
          province,
          postal_code: postalCode,
        },
        couriers,
        allow_cod: allowCod,
        bank_account: {
          bank_name: bankCodeValid(bankName),
          account_number: accountNumber,
          account_holder: accountHolder,
        },
      },
    });
  };

  const bankCodeValid = (b: string) => b || 'BCA';

  return (
    <div className="space-y-3 select-none font-sans pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            Pengaturan Toko
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Konfigurasi profil toko, alamat gudang ekspedisi, kurir aktif, dan rekening pencairan
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EE4D2D] hover:bg-[#d73f20] text-white text-xs font-semibold rounded-xs transition-colors shadow-2xs disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{updateMutation.isPending ? 'Menyimpan...' : 'Simpan Semua'}</span>
        </button>
      </div>

      {/* Main Settings Panel */}
      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 px-3 flex items-center gap-6 text-xs bg-[#FAFAFA] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'profile'
                ? 'border-[#EE4D2D] text-[#EE4D2D] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Profil Toko</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={`py-2.5 font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'address'
                ? 'border-[#EE4D2D] text-[#EE4D2D] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Alamat & Gudang</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('couriers')}
            className={`py-2.5 font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'couriers'
                ? 'border-[#EE4D2D] text-[#EE4D2D] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Jasa Kirim (Logistik)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`py-2.5 font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'payment'
                ? 'border-[#EE4D2D] text-[#EE4D2D] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pembayaran & Rekening</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#EE4D2D] mr-2" />
            <span className="text-xs">Memuat konfigurasi toko...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-4 space-y-4 max-w-2xl text-xs">
            {/* 1. Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nama Toko Resmi</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nomor WhatsApp Toko</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D] font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Digunakan oleh pembeli untuk bertanya ketersediaan produk.</span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tagline / Slogan Toko</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Official Store Berkualitas Terbaik"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                  />
                </div>
              </div>
            )}

            {/* 2. Address & Warehouse Tab */}
            {activeTab === 'address' && (
              <div className="space-y-3">
                <div className="bg-orange-50/70 border border-orange-200 rounded-xs p-2.5">
                  <p className="text-[11px] text-slate-700 font-medium">Alamat Asal Pengiriman (Origin Address)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Alamat ini digunakan oleh kurir Biteship untuk menghitung ongkos kirim real-time dan titik pickup paket.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nama Kontak Gudang</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Admin Gudang Alurelab"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">No. Telepon Gudang</label>
                    <input
                      type="text"
                      value={warehousePhone}
                      onChange={(e) => setWarehousePhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Alamat Lengkap</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nama jalan, nomor gedung, kelurahan, kecamatan"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Kota / Kab</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Provinsi</label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Kode Pos</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Couriers Tab */}
            {activeTab === 'couriers' && (
              <div className="space-y-3">
                <p className="text-slate-600 font-medium">Pilih ekspedisi yang Anda sediakan untuk pembeli:</p>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xs">
                  {[
                    { id: 'jne', label: 'JNE Express (Reguler & YES)' },
                    { id: 'sicepat', label: 'SiCepat Ekspres (SIUNT & BEST)' },
                    { id: 'jnt', label: 'J&T Express (EZ)' },
                    { id: 'anteraja', label: 'AnterAja' },
                    { id: 'gosend', label: 'GoSend Instant (Surabaya & Sekitarnya)' },
                  ].map((c) => (
                    <label key={c.id} className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer">
                      <span className="font-semibold text-slate-800">{c.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(couriers[c.id])}
                        onChange={(e) => {
                          setCouriers((prev) => ({ ...prev, [c.id]: e.target.checked }));
                        }}
                        className="rounded-xs border-slate-300 text-[#EE4D2D] focus:ring-0 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Payment & Bank Tab */}
            {activeTab === 'payment' && (
              <div className="space-y-3">
                <div className="border border-slate-200 rounded-xs p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">Bayar di Tempat (COD)</p>
                    <p className="text-[11px] text-slate-500">Izinkan pembeli membayar tunai saat paket tiba melalui kurir SiCepat/J&T.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowCod}
                    onChange={(e) => setAllowCod(e.target.checked)}
                    className="rounded-xs border-slate-300 text-[#EE4D2D] focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2.5">
                  <p className="font-bold text-slate-800">Rekening Bank untuk Penarikan Saldo</p>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Nama Bank</label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                      >
                        <option value="BCA">BCA</option>
                        <option value="MANDIRI">Bank Mandiri</option>
                        <option value="BRI">BRI</option>
                        <option value="BNI">BNI</option>
                        <option value="BSI">BSI</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Nomor Rekening</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D] font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xs outline-none focus:border-[#EE4D2D]"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EE4D2D] hover:bg-[#d73f20] text-white font-semibold rounded-xs transition-colors disabled:opacity-50 shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
