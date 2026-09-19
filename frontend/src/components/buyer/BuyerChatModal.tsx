'use client';

import { useState } from 'react';
import { MessageCircle, Phone, X, Check, ExternalLink, ShieldCheck } from 'lucide-react';

interface BuyerChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  phoneNumber?: string;
  productTitle?: string;
}

export default function BuyerChatModal({
  isOpen,
  onClose,
  storeName,
  phoneNumber,
  productTitle,
}: BuyerChatModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Format phone number to WhatsApp international format (0812 -> 62812)
  const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
  const waPhone = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.substring(1)
    : cleanPhone.startsWith('62')
    ? cleanPhone
    : cleanPhone
    ? '62' + cleanPhone
    : '';

  const greeting = productTitle
    ? `Halo ${storeName}, saya tertarik dan ingin bertanya tentang produk: ${productTitle}`
    : `Halo ${storeName}, saya ingin bertanya tentang produk dan pesanan di toko Anda.`;

  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(greeting)}`
    : null;

  const handleCopy = () => {
    if (phoneNumber) {
      navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Hubungi Seller
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                {storeName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              Respon cepat langsung terhubung dengan admin resmi <strong>{storeName}</strong> melalui WhatsApp.
            </div>
          </div>

          {productTitle && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                Topik Pertanyaan:
              </span>
              <p className="font-semibold text-stone-800 truncate">{productTitle}</p>
            </div>
          )}

          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Buka WhatsApp Langsung</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
            </a>
          ) : (
            <div className="text-center py-3 text-xs text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
              Penjual belum mendaftarkan nomor WhatsApp publik.
            </div>
          )}

          {phoneNumber && (
            <button
              onClick={handleCopy}
              className="w-full bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Nomor WA Tersalin ({phoneNumber})</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>Salin Nomor: {phoneNumber}</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="text-center pt-2 border-t border-stone-100">
          <p className="text-[11px] text-slate-400">
            Layanan Pelanggan ALURELAB • Terenkripsi & Aman
          </p>
        </div>
      </div>
    </div>
  );
}
