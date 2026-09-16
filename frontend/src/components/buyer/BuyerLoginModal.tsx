'use client';

import { useState } from 'react';
import { X, ShieldCheck, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useBuyerStore } from '@/store/buyer-store';
import { fetchApi } from '@/lib/api-client';

interface BuyerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  storeName?: string;
  onSuccess?: () => void;
}

export default function BuyerLoginModal({
  isOpen,
  onClose,
  storeSlug,
  storeName = 'ALURELAB Store',
  onSuccess,
}: BuyerLoginModalProps) {
  const { setBuyer } = useBuyerStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setErrorMsg('Nomor WhatsApp / Handphone wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetchApi('/buyer/login', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: phoneNumber,
          full_name: fullName.trim() || undefined,
        }),
        headers: { 'x-store-slug': storeSlug },
      });

      if (res?.success && res?.customer) {
        setBuyer(
          {
            id: res.customer.id,
            phoneNumber: res.customer.phone_number,
            fullName: res.customer.full_name || fullName || 'Pelanggan',
            email: res.customer.email,
            defaultAddress: res.customer.default_address,
            riskScore: res.customer.risk_score,
          },
          res.token
        );
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res?.message || 'Login pembeli gagal.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F5F5F3] text-[#111111] border border-[#DADADA] w-full max-w-md p-6 sm:p-8 relative shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-[#666666] hover:text-[#111111] transition-colors"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-6 space-y-1">
          <div className="text-[10px] font-semibold tracking-[0.24em] uppercase text-[#666666]">
            AKUN PEMBELI • {storeName}
          </div>
          <h3 className="font-bebas text-3xl tracking-wide uppercase text-[#111111]">
            MASUK / DAFTAR CEPAT
          </h3>
          <p className="text-xs text-[#666666] leading-relaxed">
            Masuk dengan nomor WhatsApp/HP aktif untuk melihat status pesanan dan checkout 1-klik tanpa repot mengingat kata sandi.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#111111] mb-1.5">
              Nomor WhatsApp / HP <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full bg-white text-xs pl-10 pr-4 py-3 border border-[#DADADA] text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#111111] mb-1.5">
              Nama Lengkap (Opsional)
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Untuk nama penerima paket"
              className="w-full bg-white text-xs px-4 py-3 border border-[#DADADA] text-[#111111] focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111111] text-[#F5F5F3] font-semibold text-xs py-3.5 uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Escrow note */}
        <div className="mt-6 pt-4 border-t border-[#DADADA] flex items-center justify-center gap-2 text-[10px] text-[#666666] uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Keamanan Data Terenkripsi • Terlindungi Escrow</span>
        </div>
      </div>
    </div>
  );
}
