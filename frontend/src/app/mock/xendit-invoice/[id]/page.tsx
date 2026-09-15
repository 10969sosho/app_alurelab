'use client';

import { use, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  QrCode,
  CreditCard,
  Building2,
  Clock,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';

function MockXenditInvoiceContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: invoiceId } = use(params);
  const searchParams = useSearchParams();

  const storeSlug = searchParams.get('store') || 'hijab-mevvah';
  const orderNumber = searchParams.get('order') || invoiceId;
  const amount = Number(searchParams.get('amount') || 164000);

  const [activeTab, setActiveTab] = useState<'qris' | 'va'>('qris');
  const [selectedBank, setSelectedBank] = useState('BCA');
  const [timeLeft, setTimeLeft] = useState(895); // ~15 menit
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const vaNumber = `88012${Math.floor(10000000 + Math.random() * 90000000)}`;

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      toast.success('Pembayaran Simulasi Berhasil Diterima!');
    }, 1200);
  };

  const handleCopyVa = () => {
    navigator.clipboard.writeText(vaNumber);
    setCopied(true);
    toast.info('Nomor Virtual Account disalin');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xl space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <span className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider bg-emerald-50 px-3 py-1 rounded-full">
              Transaksi Lunas (Escrow Aman)
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-3">Pembayaran Berhasil!</h1>
            <p className="text-xs text-slate-500 mt-1">
              Dana Anda telah diamankan di sistem XenPlatform Escrow dan diteruskan ke penjual.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">ID Referensi:</span>
              <span className="font-mono font-bold text-slate-800">{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Terbayar:</span>
              <span className="font-bold text-emerald-600 text-sm">{formatRupiah(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Metode:</span>
              <span className="font-bold text-slate-800 uppercase">{activeTab === 'qris' ? 'QRIS Instant' : `${selectedBank} Virtual Account`}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Link
              href={`/${storeSlug}/orders/${orderNumber}`}
              className="block w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-sm transition-colors"
            >
              Lacak Pesanan Sekarang →
            </Link>
            <Link
              href={`/${storeSlug}`}
              className="block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Kembali ke Toko
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              X
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 leading-none">Xendit Payment Gateway</p>
              <span className="text-[10px] text-slate-400">PJP Berlisensi Bank Indonesia (Simulasi Demo)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 py-8 space-y-6">
        {/* Merchant & Amount Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Tagihan Pembayaran</span>
            <h2 className="text-lg font-extrabold text-slate-900 mt-0.5 uppercase tracking-tight">
              {storeSlug.replace(/-/g, ' ')}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Ref: {orderNumber}</p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Total Tagihan</span>
            <p className="text-2xl font-black text-blue-600">{formatRupiah(amount)}</p>
          </div>
        </div>

        {/* Payment Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('qris')}
              className={`py-3.5 flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'qris'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4" /> QRIS (Gopay / OVO / BCA)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('va')}
              className={`py-3.5 flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'va'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" /> Virtual Account
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'qris' ? (
              <div className="flex flex-col items-center text-center space-y-4">
                <p className="text-xs text-slate-500 max-w-xs">
                  Scan QRIS menggunakan BCA Mobile, GoPay, OVO, DANA, LinkAja, atau aplikasi m-Banking Anda.
                </p>

                {/* Simulated QR Box */}
                <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-md inline-block">
                  <div className="w-48 h-48 bg-slate-900 rounded-lg p-2 flex flex-col justify-between items-center text-white">
                    <div className="w-full flex justify-between">
                      <div className="w-10 h-10 bg-white border-2 border-slate-900 rounded-xs" />
                      <div className="w-10 h-10 bg-white border-2 border-slate-900 rounded-xs" />
                    </div>
                    <div className="py-2 text-center">
                      <QrCode className="w-16 h-16 mx-auto text-emerald-400" />
                      <span className="text-[10px] font-mono tracking-widest text-slate-300">QRIS STANDAR BI</span>
                    </div>
                    <div className="w-full flex justify-between">
                      <div className="w-10 h-10 bg-white border-2 border-slate-900 rounded-xs" />
                      <div className="w-10 h-10 bg-white/20 rounded-xs" />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Verifikasi otomatis dalam 1-3 detik setelah dibayar
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Pilih Bank</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['BCA', 'Mandiri', 'BRI'].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                          selectedBank === bank
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-400 font-medium">Nomor Virtual Account ({selectedBank})</span>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-base font-black text-slate-900 tracking-wider">
                      {vaNumber}
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyVa}
                      className="p-1.5 text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Instant Demo Simulation Button */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSimulatePayment}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memverifikasi Pembayaran...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    ⚡ Simulasi Bayar Berhasil (Instant Pay)
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Mode Uji Coba: Klik tombol di atas untuk menyimulasikan notifikasi sukses pembayaran Xendit.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MockXenditInvoicePage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <MockXenditInvoiceContent {...props} />
    </Suspense>
  );
}

