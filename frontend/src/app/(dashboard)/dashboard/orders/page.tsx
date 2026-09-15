'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  Loader2,
  ExternalLink,
  Printer,
  FileText,
} from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';

const STATUS_TABS = [
  { key: '',                label: 'Semua' },
  { key: 'paid_escrow',     label: 'Perlu Diproses' },
  { key: 'processing',      label: 'Sedang Dikemas' },
  { key: 'shipped',         label: 'Dikirim' },
  { key: 'completed',       label: 'Selesai' },
  { key: 'return_cancel',   label: 'Pengembalian / Batal' },
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

function OrdersContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (tabParam === 'return') {
      setActiveTab('return_cancel');
    }
  }, [tabParam]);

  const { data, isLoading } = useQuery({
    queryKey: ['merchant-orders', activeTab, search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab === 'return_cancel') {
        params.append('status', 'cancelled');
      } else if (activeTab) {
        params.append('status', activeTab);
      }
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('per_page', '12');

      const res = await api.get(`/merchant/orders?${params.toString()}`);
      return res.data;
    },
  });

  const orders = data?.data || [];
  const total = data?.total || 0;
  const lastPage = data?.last_page || 1;

  return (
    <div className="space-y-2.5 select-none font-sans pb-10">
      {/* ─── 1. Header Bar: Title + Shipping Shortcut ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            Pesanan Saya
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola pesanan masuk, alur escrow, dan pengiriman kurir
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/shipping"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xs transition-colors shadow-2xs"
          >
            <Truck className="w-3.5 h-3.5 text-[#EE4D2D]" />
            <span>Pengiriman Massal</span>
          </Link>
        </div>
      </div>

      {/* ─── 2. Top Tabs (Underline Tabs) ─── */}
      <div className="bg-white border-b border-slate-200 px-3 flex items-center gap-6 overflow-x-auto text-xs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setPage(1);
            }}
            className={`py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'border-[#EE4D2D] text-[#EE4D2D] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── 3. Filter Box ─── */}
      <div className="bg-white border border-slate-200 rounded-xs p-3 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nomor pesanan, nama pembeli, atau telepon..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xs text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#EE4D2D] transition-colors"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total {total} Pesanan
        </div>
      </div>

      {/* ─── 4. Compact Orders Table (Space-Saving Layout) ─── */}
      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#EE4D2D] mr-2" />
            <span className="text-xs">Memuat data pesanan...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
              <ShoppingBag className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-800 text-xs">Tidak ada pesanan</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pesanan baru yang masuk dari buyer storefront akan otomatis muncul di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAFAFA] border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 min-w-[180px]">Pesanan</th>
                  <th className="px-3 py-2.5 min-w-[160px]">Pembeli</th>
                  <th className="px-3 py-2.5 min-w-[130px]">Total & Pembayaran</th>
                  <th className="px-3 py-2.5 min-w-[140px]">Kurir & Resi</th>
                  <th className="px-3 py-2.5 min-w-[120px]">Status</th>
                  <th className="px-3 py-2.5 w-[110px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((item: any) => {
                  const statusRaw = typeof item.status === 'object' ? item.status?.value : item.status;
                  const cfg = STATUS_BADGES[statusRaw] || STATUS_BADGES.pending_payment;
                  const StatusIcon = cfg.icon;

                  return (
                    <tr key={item.id} className="hover:bg-orange-50/30 transition-colors">
                      {/* Pesanan */}
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/dashboard/orders/${item.id}`}
                          className="font-bold text-slate-900 hover:text-[#EE4D2D] transition-colors"
                        >
                          {item.order_number}
                        </Link>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {formatDateTime(item.created_at)}
                        </p>
                      </td>

                      {/* Pembeli */}
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-slate-800">
                          {item.customer?.full_name || 'Pembeli Tamu'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {item.customer?.phone_number || '-'}
                        </p>
                      </td>

                      {/* Total & Pembayaran */}
                      <td className="px-3 py-2.5">
                        <p className="font-bold text-slate-900">
                          {formatRupiah(Number(item.total_amount))}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {item.payment_method === 'cod' ? 'COD' : 'Escrow (Online)'}
                        </span>
                      </td>

                      {/* Kurir & Resi */}
                      <td className="px-3 py-2.5">
                        {item.shipment?.waybill_id ? (
                          <div>
                            <span className="font-semibold text-slate-800 uppercase text-[11px]">
                              {item.shipment.courier_code || 'J&T'}
                            </span>
                            <p className="text-[10px] font-mono text-slate-500">
                              {item.shipment.waybill_id}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Belum diproses kirim</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[11px] font-medium ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/orders/${item.id}`}
                            className="text-xs text-[#1890FF] hover:underline font-medium"
                          >
                            Rincian
                          </Link>
                          {item.shipment?.shipping_label_url && (
                            <a
                              href={item.shipment.shipping_label_url}
                              target="_blank"
                              rel="noreferrer"
                              title="Cetak Label Pengiriman"
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xs"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── 5. Pagination Footer ─── */}
        {total > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-200 bg-[#FAFAFA] flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan {orders.length} dari total {total} pesanan
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-xs border border-slate-300 disabled:opacity-30 hover:bg-white bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 py-0.5 font-medium text-slate-700">
                {page} / {lastPage}
              </span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                className="p-1 rounded-xs border border-slate-300 disabled:opacity-30 hover:bg-white bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-slate-400">Memuat pesanan...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
