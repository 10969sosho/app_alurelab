'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Copy,
  Check,
  Phone,
  Store,
  MapPin,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import axios from 'axios';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import { useBuyerStore } from '@/store/buyer-store';
import { BuyerNavbar, BuyerThemeFrame } from '@/components/buyer/BuyerTheme';
import { fetchApi } from '@/lib/api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function BuyerOrderTrackingPage({
  params,
}: {
  params: Promise<{ store_slug: string; id: string }>;
}) {
  const { store_slug: storeSlug, id: orderId } = use(params);
  const [copied, setCopied] = useState(false);
  const { token } = useBuyerStore();
  const [kycStatus, setKycStatus] = useState('loading');
  const [refundType, setRefundType] = useState<'return' | 'refund'>('return');
  const [refundReason, setRefundReason] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundMessage, setRefundMessage] = useState('');
  const [refundSubmitted, setRefundSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;
    let isMounted = true;

    Promise.all([
      fetchApi('/buyer/kyc/status', { headers: { 'x-store-slug': storeSlug } }),
      fetchApi('/buyer/bank-account', { headers: { 'x-store-slug': storeSlug } }),
    ]).then(([kyc, bank]) => {
      if (!isMounted) return;
      setKycStatus(kyc.status || 'unverified');
      setBankName(bank.data?.bank_name || '');
      setAccountNumber(bank.data?.account_number || '');
      setAccountHolderName(bank.data?.account_holder_name || '');
    }).catch(() => {
      if (isMounted) setKycStatus('unverified');
    });

    return () => {
      isMounted = false;
    };
  }, [token, storeSlug]);

  // Fetch order data
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['buyer-order-tracking', storeSlug, orderId],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/buyer/orders/${orderId}`, {
        headers: {
          'X-Store-Slug': storeSlug,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return res.data.data;
    },
    enabled: Boolean(token),
  });

  const handleCopyResi = (resi: string) => {
    navigator.clipboard.writeText(resi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-bold">Pesanan tidak ditemukan</h1>
          <p className="mt-2 text-sm text-slate-600">Login sebagai pemilik pesanan untuk melihat detailnya.</p>
          <Link href={`/${storeSlug}/account`} className="inline-block mt-5 underline text-sm">Buka akun pembeli</Link>
        </div>
      </div>
    );
  }

  const waybill = order?.shipment?.waybill_id;
  const trackingStatus =
    typeof order?.shipment?.tracking_status === 'object'
      ? order?.shipment?.tracking_status?.value
      : order?.shipment?.tracking_status;
  const statusStr = typeof order?.status === 'object' ? order?.status?.value : order?.status || 'processing';
  const existingRefund = order?.refund_requests?.find((request: any) => ['pending', 'approved'].includes(request.status));

  const submitRefund = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRefundSubmitting(true);
    setRefundMessage('');

    try {
      const result = await fetchApi(`/buyer/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'x-store-slug': storeSlug },
        body: JSON.stringify({
          type: refundType,
          reason: refundReason,
          bank_name: bankName,
          account_number: accountNumber,
          account_holder_name: accountHolderName,
        }),
      });
      setRefundSubmitted(true);
      setRefundMessage(result.message || 'Pengajuan berhasil dikirim.');
    } catch (error: any) {
      setRefundMessage(error?.message || 'Pengajuan retur/refund gagal.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  const TRACKING_LABELS: Record<string, string> = {
    allocated: 'Resi Diterbitkan',
    picking_up: 'Kurir Menuju Pickup',
    picked: 'Paket Diambil Kurir',
    dropping_off: 'Sedang Diantar',
    in_transit: 'Dalam Perjalanan',
    delivered: 'Sudah Diterima',
    cancelled: 'Dibatalkan',
    return_to_shipper: 'Retur ke Pengirim',
    rejected: 'Ditolak',
  };

  return (
     <BuyerThemeFrame storeSlug={storeSlug} className="pb-16">
       <BuyerNavbar storeSlug={storeSlug} />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Status Card Banner */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-200 bg-white/10 px-3 py-1 rounded-full">
              Status Terkini
            </span>
            <span className="text-xs text-emerald-100">
              {formatDateTime(order.created_at)}
            </span>
             </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {statusStr === 'shipped' && '🚚 Paket Sedang Dikirim'}
            {statusStr === 'processing' && '📦 Pesanan Sedang Dikemas'}
            {statusStr === 'paid_escrow' && '✅ Pembayaran Dikonfirmasi'}
            {statusStr === 'delivered' && '🎉 Paket Telah Tiba'}
            {statusStr === 'completed' && '🌟 Pesanan Selesai'}
            {statusStr === 'pending_payment' && '⏳ Menunggu Pembayaran'}
          </h1>

          <p className="text-emerald-100 text-sm">
            Nomor Pesanan: <strong className="text-white font-mono">{order.order_number}</strong>
          </p>
        </div>

        {/* Resi & Kurir Card */}
        {waybill && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium">Kurir & No. Resi Pengiriman</span>
              <p className="font-extrabold text-slate-800 text-base uppercase">
                {order.shipment?.courier_code || 'Biteship Multi-Kurir'} ({order.shipment?.courier_service?.toUpperCase() || 'REG'})
              </p>
              <p className="font-mono text-sm text-emerald-700 font-bold tracking-wide">
                {waybill}
              </p>
              {trackingStatus && (
                <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-1">
                  Status Resi: {TRACKING_LABELS[trackingStatus] || trackingStatus}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleCopyResi(waybill)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin!' : 'Salin Resi'}
            </button>
          </div>
        )}

        {/* Timeline Progress */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
          <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
            Perjalanan Pesanan Anda
          </h2>

          <div className="space-y-6 relative pl-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            <div className="relative">
              <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
              <p className="text-xs font-bold text-slate-800">Pesanan Dibuat & Terverifikasi</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Data pesanan telah diterima oleh sistem toko ALURELAB.
              </p>
            </div>

            <div className="relative">
              <span className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full ring-4 ${
                ['processing', 'shipped', 'delivered', 'completed'].includes(statusStr)
                  ? 'bg-emerald-500 ring-emerald-100'
                  : 'bg-slate-300 ring-slate-100'
              }`}></span>
              <p className="text-xs font-bold text-slate-800">Sedang Dikemas Penjual</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Penjual sedang menyiapkan barang dan mencetak label resi Biteship.
              </p>
            </div>

            <div className="relative">
              <span className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full ring-4 ${
                ['shipped', 'delivered', 'completed'].includes(statusStr)
                  ? 'bg-emerald-500 ring-emerald-100'
                  : 'bg-slate-300 ring-slate-100'
              }`}></span>
              <p className="text-xs font-bold text-slate-800">Diserahkan ke Kurir Ekspedisi</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Paket dalam perjalanan menuju alamat penerima.
              </p>
            </div>

            <div className="relative">
              <span className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full ring-4 ${
                ['delivered', 'completed'].includes(statusStr)
                  ? 'bg-emerald-500 ring-emerald-100'
                  : 'bg-slate-300 ring-slate-100'
              }`}></span>
              <p className="text-xs font-bold text-slate-800">Paket Diterima</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pesanan telah sampai di tangan pembeli dengan selamat.
              </p>
            </div>
          </div>
        </div>

        {/* Item Rincian */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
            Rincian Produk
          </h2>

          <div className="divide-y divide-slate-100">
            {order.items?.map((it: any) => (
              <div key={it.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-slate-800">{it.product_title}</p>
                  {it.variant_title && (
                    <span className="text-xs text-slate-400">{it.variant_title}</span>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5">
                    {it.quantity} barang x {formatRupiah(Number(it.price))}
                  </p>
                </div>
                <span className="font-bold text-slate-800">
                  {formatRupiah(Number(it.subtotal))}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal Produk</span>
              <span>{formatRupiah(Number(order.items_subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span>Ongkos Kirim</span>
              <span>{formatRupiah(Number(order.shipping_cost))}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-100">
              <span>Total Pembayaran</span>
              <span className="text-emerald-600">{formatRupiah(Number(order.total_amount))}</span>
            </div>
          </div>
        </div>

        {/* Alamat Penerima */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2 shadow-xs text-sm">
          <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-500" /> Alamat Pengiriman
          </h2>
          <p className="font-semibold text-slate-800">{order.shipping_recipient_name} ({order.shipping_recipient_phone})</p>
          <p className="text-xs text-slate-600 leading-relaxed">{order.shipping_address_detail}</p>
        </div>

        {['delivered', 'completed'].includes(statusStr) && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Retur & Refund</h2>
              <p className="mt-1 text-xs text-slate-500">Pengajuan ditinjau oleh toko. Rekening bank disimpan untuk proses pengembalian dana.</p>
            </div>
            {existingRefund ? (
              <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Pengajuan {existingRefund.type} Anda berstatus <strong>{existingRefund.status}</strong>.</p>
            ) : refundSubmitted ? (
              <p role="status" className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">{refundMessage}</p>
            ) : kycStatus === 'loading' ? (
              <p className="text-xs text-slate-500">Memuat status verifikasi identitas…</p>
            ) : kycStatus !== 'approved' ? (
              <div className="rounded-xl bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
                <p>Verifikasi identitas KTP perlu disetujui sebelum pengajuan retur/refund.</p>
                <Link href={`/${storeSlug}/account`} className="inline-flex font-bold underline">Buka Verifikasi Identitas</Link>
              </div>
            ) : (
              <form onSubmit={submitRefund} className="grid gap-3 sm:grid-cols-2 text-xs">
                <label className="font-semibold text-slate-700">Jenis pengajuan
                  <select value={refundType} onChange={(event) => setRefundType(event.target.value as 'return' | 'refund')} className="mt-1 w-full rounded-xl border border-slate-200 p-3">
                    <option value="return">Retur barang</option>
                    <option value="refund">Refund</option>
                  </select>
                </label>
                <label className="font-semibold text-slate-700">Nama bank
                  <input required value={bankName} onChange={(event) => setBankName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
                </label>
                <label className="font-semibold text-slate-700">Nomor rekening
                  <input required inputMode="numeric" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ''))} className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
                </label>
                <label className="font-semibold text-slate-700">Nama pemilik rekening
                  <input required value={accountHolderName} onChange={(event) => setAccountHolderName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
                </label>
                <label className="sm:col-span-2 font-semibold text-slate-700">Alasan pengajuan
                  <textarea required rows={3} value={refundReason} onChange={(event) => setRefundReason(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
                </label>
                {refundMessage && <p role="alert" className="sm:col-span-2 text-rose-700">{refundMessage}</p>}
                <button disabled={refundSubmitting} className="sm:col-span-2 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white disabled:opacity-50">
                  {refundSubmitting ? 'Mengirim pengajuan…' : 'Ajukan Retur / Refund'}
                </button>
              </form>
            )}
          </section>
        )}

        {/* Footer Actions */}
        <div className="text-center pt-4">
          <Link
            href={`/${storeSlug}`}
            className="inline-flex items-center justify-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-sm transition-colors"
          >
            Belanja Lagi di Toko Ini
          </Link>
        </div>
       </main>
     </BuyerThemeFrame>
  );
}
