'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Package,
  Truck,
  DollarSign,
  User,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  ExternalLink,
  Loader2,
  Send,
} from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDateTime, formatPhone } from '@/lib/utils';

const STATUS_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: 'Menunggu Pembayaran', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  paid_escrow:     { label: 'Dibayar (Escrow)',    color: 'bg-blue-50 text-blue-700 border-blue-200',     icon: CheckCircle2 },
  cod_verified:    { label: 'COD Terverifikasi',   color: 'bg-teal-50 text-teal-700 border-teal-200',    icon: CheckCircle2 },
  processing:      { label: 'Sedang Diproses',     color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Package },
  shipped:         { label: 'Dalam Pengiriman',    color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Truck },
  delivered:       { label: 'Telah Diterima',      color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  completed:       { label: 'Selesai',             color: 'bg-green-50 text-green-700 border-green-200',    icon: CheckCircle2 },
  cancelled:       { label: 'Dibatalkan',          color: 'bg-red-50 text-red-700 border-red-200',          icon: AlertTriangle },
  rts_returned:    { label: 'Retur (RTS)',         color: 'bg-orange-50 text-orange-700 border-orange-200', icon: RotateCcw },
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [courierCode, setCourierCode] = useState('sicepat');
  const [courierService, setCourierService] = useState('reg');

  // Fetch order detail
  const { data: order, isLoading } = useQuery({
    queryKey: ['merchant-order-detail', id],
    queryFn: async () => {
      const res = await api.get(`/merchant/orders/${id}`);
      return res.data;
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await api.patch(`/merchant/orders/${id}/status`, { status: newStatus });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Status pesanan berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['merchant-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal mengubah status');
    },
  });

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/merchant/orders/${id}/shipment`, {
        courier_code: courierCode,
        courier_service: courierService,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Pengiriman berhasil dibuat di Biteship!');
      queryClient.invalidateQueries({ queryKey: ['merchant-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Gagal membuat pengiriman');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Pesanan tidak ditemukan.</p>
        <Link href="/dashboard/orders" className="text-sm text-emerald-600 font-semibold mt-2 inline-block">
          ← Kembali ke Pesanan
        </Link>
      </div>
    );
  }

  const statusRaw = typeof order.status === 'object' ? order.status?.value : order.status;
  const cfg = STATUS_BADGES[statusRaw] || STATUS_BADGES.pending_payment;
  const StatusIcon = cfg.icon;

  const phoneFormatted = order.shipping_recipient_phone || order.customer?.phone_number || '';
  const waUrl = phoneFormatted ? `https://wa.me/${phoneFormatted.replace(/\D/g, '')}` : '#';

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{order.order_number}</h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Dibuat pada {formatDateTime(order.created_at)}
            </p>
          </div>
        </div>

        {/* Action Buttons based on State Machine */}
        <div className="flex items-center gap-2">
          {statusRaw === 'paid_escrow' && (
            <button
              type="button"
              disabled={updateStatusMutation.isPending}
              onClick={() => updateStatusMutation.mutate('processing')}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center gap-2"
            >
              {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              Proses Pesanan
            </button>
          )}

          {statusRaw === 'processing' && (
            <div className="flex items-center gap-2">
              <select
                value={courierCode}
                onChange={(e) => setCourierCode(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 text-xs rounded-xl font-medium"
              >
                <option value="sicepat">SiCepat</option>
                <option value="jnt">J&T Express</option>
                <option value="jne">JNE</option>
              </select>
              <button
                type="button"
                disabled={createShipmentMutation.isPending}
                onClick={() => createShipmentMutation.mutate()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center gap-2"
              >
                {createShipmentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Buat Resi Pengiriman
              </button>
            </div>
          )}

          {statusRaw === 'shipped' && (
            <button
              type="button"
              disabled={updateStatusMutation.isPending}
              onClick={() => updateStatusMutation.mutate('delivered')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center gap-2"
            >
              {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Tandai Telah Diterima
            </button>
          )}

          {statusRaw === 'delivered' && (
            <button
              type="button"
              disabled={updateStatusMutation.isPending}
              onClick={() => updateStatusMutation.mutate('completed')}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center gap-2"
            >
              {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Selesaikan Pesanan & Cairkan Dana
            </button>
          )}

          {['pending_payment', 'paid_escrow'].includes(statusRaw) && (
            <button
              type="button"
              disabled={updateStatusMutation.isPending}
              onClick={() => {
                if (confirm('Batalkan pesanan ini?')) {
                  updateStatusMutation.mutate('cancelled');
                }
              }}
              className="px-4 py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-semibold rounded-xl text-sm transition-colors"
            >
              Batalkan
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Items & Delivery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Package className="w-5 h-5 text-emerald-500" />
              Item Pesanan ({order.items?.length || 0})
            </h2>

            <div className="divide-y divide-slate-100">
              {order.items?.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{item.product_title}</p>
                    {item.variant_title && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                        {item.variant_title}
                      </span>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {item.quantity} x {formatRupiah(Number(item.price))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800 text-sm">
                      {formatRupiah(Number(item.subtotal))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pengiriman & Kurir */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-5 h-5 text-emerald-500" />
              Informasi Logistik & Resi
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <span className="text-xs text-slate-400 font-medium">Kurir Ekspedisi</span>
                <p className="font-semibold text-slate-800 uppercase">
                  {order.shipment?.courier_code || 'Belum Ditugaskan'}
                </p>
                <p className="text-xs text-slate-500">
                  Layanan: {order.shipment?.courier_service || 'Reguler'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <span className="text-xs text-slate-400 font-medium">Nomor Resi (AWB)</span>
                <p className="font-mono font-bold text-slate-800">
                  {order.shipment?.waybill_id || 'Resi belum terbit'}
                </p>
                {order.shipment?.shipping_label_url && (
                  <a
                    href={order.shipment.shipping_label_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium hover:underline pt-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Label Pengiriman (Thermal PDF)
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Customer Info & Financial Breakdown */}
        <div className="space-y-6">
          {/* Data Pembeli */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-emerald-500" />
              Data Penerima
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400">Nama Penerima</span>
                <p className="font-semibold text-slate-800">{order.shipping_recipient_name}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400">Nomor WhatsApp</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-medium text-slate-800">{phoneFormatted}</span>
                  {phoneFormatted && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Send className="w-3 h-3" /> Chat WA
                    </a>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400">Alamat Lengkap</span>
                <p className="text-slate-700 text-xs mt-0.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {order.shipping_address_detail}
                </p>
              </div>
            </div>
          </div>

          {/* Rincian Finansial & Net Payout */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Rincian Pembayaran
            </h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Produk</span>
                <span>{formatRupiah(Number(order.items_subtotal))}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ongkos Kirim</span>
                <span>{formatRupiah(Number(order.shipping_cost))}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon Promo</span>
                  <span>-{formatRupiah(Number(order.discount_amount))}</span>
                </div>
              )}
              <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-800">
                <span>Total Pembayaran Pembeli</span>
                <span>{formatRupiah(Number(order.total_amount))}</span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-emerald-800">
                  <span>Biaya Platform (1.5%)</span>
                  <span>-{formatRupiah(Number(order.platform_fee_amount))}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-900 text-sm border-t border-emerald-200 pt-1.5">
                  <span>Pencairan Bersih (Net)</span>
                  <span>{formatRupiah(Number(order.merchant_net_amount))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
