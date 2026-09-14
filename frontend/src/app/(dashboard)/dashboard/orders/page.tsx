'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  AlertTriangle,
  RotateCcw,
  Eye,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';

const STATUS_TABS = [
  { key: '',                label: 'Semua' },
  { key: 'pending_payment', label: 'Menunggu Bayar' },
  { key: 'paid_escrow',     label: 'Perlu Diproses' },
  { key: 'processing',      label: 'Sedang Dikemas' },
  { key: 'shipped',         label: 'Dikirim' },
  { key: 'delivered',       label: 'Terkirim' },
  { key: 'completed',       label: 'Selesai' },
  { key: 'cancelled',       label: 'Dibatalkan' },
  { key: 'rts_returned',    label: 'Retur (RTS)' },
];

const STATUS_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: 'Menunggu Bayar', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  paid_escrow:     { label: 'Dibayar (Escrow)', color: 'bg-blue-50 text-blue-700 border-blue-200',     icon: CheckCircle2 },
  cod_verified:    { label: 'COD Terverifikasi', color: 'bg-teal-50 text-teal-700 border-teal-200',    icon: CheckCircle2 },
  processing:      { label: 'Diproses',       color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Package },
  shipped:         { label: 'Dikirim',        color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Truck },
  delivered:       { label: 'Terkirim',       color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  completed:       { label: 'Selesai',        color: 'bg-green-50 text-green-700 border-green-200',    icon: CheckCircle2 },
  cancelled:       { label: 'Dibatalkan',     color: 'bg-red-50 text-red-700 border-red-200',          icon: AlertTriangle },
  rts_returned:    { label: 'Retur (RTS)',    color: 'bg-orange-50 text-orange-700 border-orange-200', icon: RotateCcw },
};

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['merchant-orders', activeTab, search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab) params.append('status', activeTab);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('per_page', '10');

      const res = await api.get(`/merchant/orders?${params.toString()}`);
      return res.data;
    },
  });

  const orders = data?.data || [];
  const total = data?.total || 0;
  const lastPage = data?.last_page || 1;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Pesanan</h1>
        <p className="text-sm text-slate-500">
          Pantau status pesanan, pembayaran escrow, dan pengiriman kurir
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nomor pesanan, nama pembeli, atau telepon..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Order List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
              <ShoppingBag className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-800">Tidak ada pesanan</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              Pesanan yang masuk dari storefront buyer akan ditampilkan secara otomatis di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Pesanan</th>
                  <th className="px-6 py-3.5">Pembeli</th>
                  <th className="px-6 py-3.5">Total & Net</th>
                  <th className="px-6 py-3.5">Kurir & Resi</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((item: any) => {
                  const statusRaw = typeof item.status === 'object' ? item.status?.value : item.status;
                  const cfg = STATUS_BADGES[statusRaw] || STATUS_BADGES.pending_payment;
                  const StatusIcon = cfg.icon;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 block">
                          {item.order_number}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDateTime(item.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">
                          {item.customer?.full_name || item.shipping_recipient_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.customer?.phone_number || item.shipping_recipient_phone}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {formatRupiah(Number(item.total_amount))}
                        </p>
                        <p className="text-xs text-emerald-600 font-medium">
                          Net: {formatRupiah(Number(item.merchant_net_amount))}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-medium text-slate-700 uppercase">
                            {item.shipment?.courier_code || 'Belum Ditentukan'}
                          </span>
                          <p className="text-xs text-slate-500 font-mono">
                            {item.shipment?.waybill_id || 'Resi belum terbit'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${cfg.color}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/orders/${item.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 10 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
            <span>
              Halaman {page} dari {lastPage}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
