'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  Globe,
  QrCode,
  Landmark,
  Zap,
  Search,
} from 'lucide-react';
import api from '@/lib/api';
import { WilayahAddressFields, type WilayahAddressValue } from '@/components/address/WilayahAddressFields';

type SettingsTab = 'profile' | 'address' | 'couriers' | 'payment' | 'domain';

export default function SettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Form states
  const [storeName, setStoreName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tagline, setTagline] = useState('');

  // Address states
  const [contactName, setContactName] = useState('');
  const [warehousePhone, setWarehousePhone] = useState('');
  const [address, setAddress] = useState('');
  const [wilayah, setWilayah] = useState<WilayahAddressValue>({});
  const [postalCode, setPostalCode] = useState('');

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

  // Domain states (Openprovider Sandbox)
  const [domainName, setDomainName] = useState('');
  const [domainTld, setDomainTld] = useState('com');
  const [domainCheck, setDomainCheck] = useState<{
    domain: string;
    available: boolean | null;
    price?: number | null;
    currency?: string | null;
  } | null>(null);
  const [domainOverride, setDomainOverride] = useState<{ domain: string | null; status: string } | null>(null);

  // Fetch settings
  const { data, isLoading } = useQuery({
    queryKey: ['merchant-settings'],
    queryFn: async () => {
      const res = await api.get('/merchant/settings');
      return res.data?.store;
    },
  });

  // Deep-link tab aktif dari URL (?tab=payment, ?tab=domain, dst)
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab') as SettingsTab | null;
    if (tab && ['profile', 'address', 'couriers', 'payment', 'domain'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Status & aktivasi pembayaran DOKU
  const { data: dokuStatus, isLoading: loadingDoku } = useQuery({
    queryKey: ['merchant-payment-status'],
    queryFn: async () => (await api.get('/merchant/payment/status')).data,
    enabled: activeTab === 'payment',
  });

  const dokuSetupMutation = useMutation({
    mutationFn: async () => (await api.post('/merchant/payment/setup')).data,
    onSuccess: (res) => {
      if (res?.success) {
        toast.success('Pembayaran DOKU berhasil diaktifkan! QRIS & Virtual Account siap dipakai.');
      } else {
        toast.error(res?.error || 'Aktivasi DOKU belum berhasil. Coba lagi nanti.');
      }
      queryClient.invalidateQueries({ queryKey: ['merchant-payment-status'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Gagal mengaktifkan pembayaran DOKU');
    },
  });

  const dokuActive = Boolean(dokuStatus?.doku_sub_account_id);

  // Cek ketersediaan domain via Openprovider Sandbox
  const domainCheckMutation = useMutation({
    mutationFn: async () =>
      (await api.post('/merchant/domain/check', { name: domainName, tld: domainTld })).data,
    onSuccess: (res) => {
      if (res?.success) {
        setDomainCheck(res);
      } else {
        setDomainCheck(null);
        toast.error(res?.error || 'Gagal mengecek ketersediaan domain.');
      }
    },
    onError: (err: any) => {
      setDomainCheck(null);
      toast.error(err?.response?.data?.error || 'Gagal mengecek ketersediaan domain');
    },
  });

  // Daftarkan domain & aktifkan custom domain toko (sandbox)
  const domainRegisterMutation = useMutation({
    mutationFn: async () =>
      (await api.post('/merchant/domain/register', { name: domainName, tld: domainTld })).data,
    onSuccess: (res) => {
      if (res?.success) {
        toast.success(`Domain ${res.domain} berhasil didaftarkan & diaktifkan!`);
        setDomainOverride({ domain: res.domain, status: res.store?.custom_domain_status ?? 'active' });
        setDomainCheck(null);
        queryClient.invalidateQueries({ queryKey: ['merchant-settings'] });
      } else {
        toast.error(res?.error || 'Pendaftaran domain belum berhasil. Coba lagi nanti.');
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Gagal mendaftarkan domain');
    },
  });

  const customDomain = domainOverride?.domain ?? (session as any)?.store?.custom_domain ?? null;
  const customDomainStatus = domainOverride?.status ?? (session as any)?.store?.custom_domain_status ?? 'pending';

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
        setWilayah({
          provinceCode: s.origin_address.province_code || '',
          provinceName: s.origin_address.province || '',
          regencyCode: s.origin_address.regency_code || '',
          regencyName: s.origin_address.city || '',
          districtCode: s.origin_address.district_code || '',
          districtName: s.origin_address.district || '',
          villageCode: s.origin_address.village_code || '',
          villageName: s.origin_address.village || '',
          areaId: s.origin_address.area_id || '',
          areaName: s.origin_address.area_name || '',
          postalCode: s.origin_address.postal_code || '',
        });
        setPostalCode(s.origin_address.postal_code || '');
      } else {
        setPostalCode('');
      }

      if (s.couriers) {
        setCouriers(s.couriers);
      }

      if (s.allow_cod !== undefined) {
        setAllowCod(Boolean(s.allow_cod));
      }

      if (s.bank_account) {
        setBankName(s.bank_account.bank_name || s.bank_account.bank_code || '');
        setAccountNumber(s.bank_account.account_number || '');
        setAccountHolder(s.bank_account.account_holder || s.bank_account.account_holder_name || data.name || '');
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
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal memperbarui pengaturan toko');
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const missingAddress = !wilayah.provinceCode
      || !wilayah.regencyCode
      || !wilayah.districtCode
      || !wilayah.villageCode;
    if (missingAddress) {
      toast.error('Provinsi, kabupaten/kota, kecamatan, dan kelurahan wajib diisi.');
      return;
    }

    const bankFields = [bankName.trim(), accountNumber.trim(), accountHolder.trim()];
    const hasBankDetails = bankFields.some(Boolean);
    if (hasBankDetails && bankFields.some((value) => !value)) {
      toast.error('Lengkapi bank, nomor rekening, dan nama pemilik rekening.');
      return;
    }

    const settings: Record<string, unknown> = {
      tagline,
      origin_address: {
        contact_name: contactName,
        phone: warehousePhone,
        address,
        city: wilayah.regencyName || '',
        province: wilayah.provinceName || '',
        district: wilayah.districtName || '',
        village: wilayah.villageName || '',
        province_code: wilayah.provinceCode || '',
        regency_code: wilayah.regencyCode || '',
        district_code: wilayah.districtCode || '',
        village_code: wilayah.villageCode || '',
        area_id: wilayah.areaId || '',
        area_name: wilayah.areaName || '',
        postal_code: postalCode || wilayah.postalCode || '',
      },
      couriers,
      allow_cod: allowCod,
    };
    if (hasBankDetails) {
      settings.bank_account = {
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_holder: accountHolder.trim(),
      };
    }

    updateMutation.mutate({
      name: storeName,
      phone_number: phoneNumber,
      settings,
    });
  };

  return (
    <div className="space-y-3 font-sans pb-10">
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
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#C8FF3D] hover:bg-[#b8f02e] text-[#111111] text-xs font-bold rounded-full transition-colors shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{updateMutation.isPending ? 'Menyimpan...' : 'Simpan Semua'}</span>
        </button>
      </div>

      {/* Navigation Tabs (Pill Switcher) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex items-center gap-1 text-xs overflow-x-auto shadow-sm">
        {(
          [
            { key: 'profile', label: 'Profil Toko', Icon: Store },
            { key: 'address', label: 'Alamat & Gudang', Icon: MapPin },
            { key: 'couriers', label: 'Jasa Kirim (Logistik)', Icon: Truck },
            { key: 'payment', label: 'Pembayaran & Rekening', Icon: CreditCard },
            { key: 'domain', label: 'Domain', Icon: Globe },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-[#111111] text-[#FAFAF8] font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <tab.Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Settings Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#111111] mr-2" />
            <span className="text-xs">Memuat konfigurasi toko...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
            {/* 1. Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nama Toko Resmi</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-[#C8FF3D]/30 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nomor WhatsApp Toko</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-[#C8FF3D]/30 transition-all font-mono"
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
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-[#C8FF3D]/30 transition-all"
                  />
                </div>
              </div>
            )}

            {/* 2. Address & Warehouse Tab */}
            {activeTab === 'address' && (
              <div className="space-y-3">
                <div className="bg-[#C8FF3D]/10 border border-[#C8FF3D]/30 text-slate-800 rounded-2xl p-3.5">
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
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-[#C8FF3D]/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">No. Telepon Gudang</label>
                    <input
                      type="text"
                      value={warehousePhone}
                      onChange={(e) => setWarehousePhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-[#C8FF3D]/30 transition-all font-mono"
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
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-[#C8FF3D]/30 transition-all"
                  />
                </div>

                <WilayahAddressFields value={wilayah} onChange={setWilayah} required />

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Contoh: 60271"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-[#C8FF3D]/30 transition-all font-mono"
                  />
                </div>
              </div>
            )}

            {/* 3. Couriers Tab */}
            {activeTab === 'couriers' && (
              <div className="space-y-3">
                <p className="text-slate-600 font-medium">Pilih ekspedisi yang Anda sediakan untuk pembeli:</p>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {[
                    { id: 'jne', label: 'JNE Express (Reguler & YES)' },
                    { id: 'sicepat', label: 'SiCepat Ekspres (SIUNT & BEST)' },
                    { id: 'jnt', label: 'J&T Express (EZ)' },
                    { id: 'anteraja', label: 'AnterAja' },
                    { id: 'gosend', label: 'GoSend Instant (Surabaya & Sekitarnya)' },
                  ].map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center justify-between p-3.5 hover:bg-[#FAFAF8] cursor-pointer transition-colors"
                    >
                      <span className="font-semibold text-slate-800">{c.label}</span>
                      <span className="relative inline-flex items-center shrink-0">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={Boolean(couriers[c.id])}
                          onChange={(e) => {
                            setCouriers((prev) => ({ ...prev, [c.id]: e.target.checked }));
                          }}
                        />
                        <span className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-[#111111] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:bg-white after:rounded-full after:shadow-sm after:transition-all peer-checked:after:translate-x-4" />
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Payment & Bank Tab */}
            {activeTab === 'payment' && (
              <div className="space-y-3">
                {/* Kartu DOKU Merchant Gateway */}
                <div
                  className={`border rounded-2xl p-4 ${
                    dokuActive ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Landmark className="w-4 h-4 text-lime-700 shrink-0" />
                        <p className="font-bold text-slate-800">DOKU Merchant Gateway</p>
                        {loadingDoku ? (
                          <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              dokuActive
                                ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                                : 'text-amber-600 bg-amber-50 border-amber-200'
                            }`}
                          >
                            {dokuActive ? 'AKTIF' : 'BELUM AKTIF'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Terima pembayaran pembeli melalui QRIS dan Virtual Account dengan skema escrow ALURELAB.
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                          <QrCode className="w-3 h-3" /> QRIS
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                          <Zap className="w-3 h-3" /> Virtual Account
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full">
                          <Truck className="w-3 h-3" /> COD
                        </span>
                      </div>

                      {dokuStatus?.doku_sub_account_id && (
                        <p className="text-[10px] text-slate-400 font-mono mt-2">
                          Sub-Account: {dokuStatus.doku_sub_account_id}
                        </p>
                      )}
                    </div>

                    {!dokuActive && (
                      <button
                        type="button"
                        onClick={() => dokuSetupMutation.mutate()}
                        disabled={dokuSetupMutation.isPending}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#C8FF3D] hover:bg-[#b8f02e] text-[#111111] text-xs font-bold rounded-full transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {dokuSetupMutation.isPending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Mengaktifkan...
                          </>
                        ) : (
                          'Aktivasi DOKU Payment'
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">Bayar di Tempat (COD)</p>
                    <p className="text-[11px] text-slate-500">Izinkan pembeli membayar tunai saat paket tiba melalui kurir SiCepat/J&T.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={allowCod}
                      onChange={(e) => setAllowCod(e.target.checked)}
                    />
                    <span className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-[#111111] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:bg-white after:rounded-full after:shadow-sm after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2.5">
                  <p className="font-bold text-slate-800">Rekening Bank untuk Penarikan Saldo</p>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Nama Bank</label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-[#C8FF3D]/30 transition-all"
                      >
                        <option value="" disabled>Pilih bank</option>
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
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-[#C8FF3D]/30 transition-all font-mono"
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
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-[#C8FF3D]/30 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. Domain Tab */}
            {activeTab === 'domain' && (
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-[11px] text-slate-700 font-medium">Alamat Publik Toko Anda</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Setiap toko ALURELAB otomatis mendapat subdomain gratis. Domain khusus (custom domain)
                    bisa langsung dicari &amp; didaftarkan lewat Openprovider (Sandbox).
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Subdomain Aktif</label>
                  <div className="flex items-stretch">
                    <input
                      type="text"
                      readOnly
                      value={(session as any)?.store?.slug || ''}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 rounded-xl outline-none font-mono cursor-not-allowed"
                    />
                    <span className="inline-flex items-center bg-slate-50 border border-slate-200 text-[11px] text-slate-500 px-3 py-2 rounded-xl select-none font-mono whitespace-nowrap">
                      .alurelab.com
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Custom Domain Aktif</label>
                  <input
                    type="text"
                    readOnly
                    value={customDomain || ''}
                    placeholder="Belum terpasang — cari & daftarkan di bawah"
                    className="w-full px-3 py-1.5 border border-slate-200 bg-slate-50 text-slate-600 rounded-xl outline-none font-mono cursor-not-allowed"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        customDomainStatus === 'active'
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                          : 'text-amber-600 bg-amber-50 border-amber-200'
                      }`}
                    >
                      {customDomainStatus === 'active' ? 'TERVERIFIKASI' : 'MENUNGGU VERIFIKASI'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Domain aktif langsung dipakai bila status sudah TERVERIFIKASI.
                    </span>
                  </div>
                </div>

                {/* Pencarian & pendaftaran domain (Openprovider Sandbox) */}
                <div className="border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <p className="text-[11px] font-semibold text-slate-700">Cari &amp; Daftarkan Domain</p>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={domainName}
                      onChange={(e) => {
                        setDomainName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''));
                        setDomainCheck(null);
                      }}
                      placeholder="namatoko"
                      className="flex-1 min-w-0 px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-[#C8FF3D]/30 transition-all font-mono text-sm"
                    />
                    <select
                      value={domainTld}
                      onChange={(e) => {
                        setDomainTld(e.target.value);
                        setDomainCheck(null);
                      }}
                      className="px-2 py-1.5 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-[#C8FF3D]/30 transition-all font-mono text-sm bg-white"
                    >
                      {['com', 'id', 'net', 'shop', 'online', 'store', 'co.id', 'my.id'].map((tld) => (
                        <option key={tld} value={tld}>
                          .{tld}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => domainCheckMutation.mutate()}
                      disabled={domainCheckMutation.isPending || domainName.trim() === ''}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-white text-[12px] font-semibold rounded-full transition-colors disabled:opacity-50"
                    >
                      {domainCheckMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      Cek Ketersediaan
                    </button>

                    {domainCheck?.available && (
                      <button
                        type="button"
                        onClick={() => domainRegisterMutation.mutate()}
                        disabled={domainRegisterMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C8FF3D] hover:bg-[#b8f02e] text-[#111111] text-[12px] font-bold rounded-full transition-colors disabled:opacity-50"
                      >
                        {domainRegisterMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                        Gunakan / Daftarkan Domain (Sandbox)
                      </button>
                    )}
                  </div>

                  {domainCheck && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          domainCheck.available
                            ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                            : 'text-rose-600 bg-rose-50 border-rose-200'
                        }`}
                      >
                        {domainCheck.available ? 'TERSEDIA' : 'TIDAK TERSEDIA'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{domainCheck.domain}</span>
                      {domainCheck.available && domainCheck.price != null && (
                        <span className="text-[10px] text-slate-400">
                          {domainCheck.currency || 'EUR'} {domainCheck.price}/tahun
                        </span>
                      )}
                      {!domainCheck.available && (
                        <span className="text-[10px] text-slate-400">Coba nama atau ekstensi lain.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab !== 'domain' && (
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C8FF3D] hover:bg-[#b8f02e] text-[#111111] font-bold rounded-full transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{updateMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
