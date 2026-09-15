'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Truck,
  Search,
  CheckCircle2,
  Package,
  Printer,
  ChevronLeft,
  ChevronRight,
  Loader2,
  SlidersHorizontal,
  Send,
  AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';

export default function ShippingPage() {
  const queryClient = useQueryClient();
  const [courierFilter, setCourierFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // Fetch orders that need shipment (paid_escrow or processing)
  const { data, isLoading } = useQuery({
    queryKey: ['shipping-orders', courierFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('status', 'paid_escrow');
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('per_page', '15');

      const res = await api.get(`/merchant/orders?${params.toString()}`);
      return res.data;
    },
  });

  // Bulk shipment mutation
  const bulkShipMutation = useMutation({
    mutationFn: async ({ orderIds, courierCode }: { orderIds: string[]; courierCode?: string }) => {
      const res = await api.post('/merchant/shipping/bulk-ship', {
        order_ids: orderIds,
        courier_code: courierCode || 'jne',
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Pengiriman massal berhasil diproses!');
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['shipping-orders'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
    },
    onError: () => {
      toast.error('Gagal memproses pengiriman massal');
    },
  });

  const orders = data?.data || [];
  const total = data?.total || 0;
  const lastPage = data?.last_page || 1;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(orders.map((o: any) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const isAllSelected = orders.length > 0 && selectedIds.length === orders.length;

  return (
    <div className="space-y-2.5 select-none font-sans pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            Pengiriman Massal
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Proses resi AWB, atur jadwal pickup, dan cetak label thermal sekaligus
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              disabled={bulkShipMutation.isPending}
              onClick={() => {
                if (confirm(`Atur pengiriman untuk ${selectedIds.length} pesanan terpilih?`)) {
                  bulkShipMutation.mutate({ orderIds: selectedIds, courierCode: courierFilter || 'jne' });
                }
              }}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#EE4D2D] hover:bg-[#d73f20] text-white text-xs font-semibold rounded-xs transition-colors shadow-2xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim ({selectedIds.length}) Pesanan</span>
            </button>
          )}

          <Link
            href="/dashboard/orders"
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xs transition-colors shadow-2xs"
          >
            Lihat Semua Pesanan
          </Link>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-2xs">
          <p className="text-[11px] text-slate-500 font-medium">Perlu Pengiriman</p>
          <p className="text-lg font-bold text-[#EE4D2D] mt-0.5">{total}</p>
          <span className="text-[10px] text-slate-400">Pesanan telah dibayar pembeli</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-2xs">
          <p className="text-[11px] text-slate-500 font-medium">Terpilih untuk Pickup</p>
          <p className="text-lg font-bold text-blue-600 mt-0.5">{selectedIds.length}</p>
          <span className="text-[10px] text-slate-400">Siap cetak label dan kirim</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-2xs">
          <p className="text-[11px] text-slate-500 font-medium">Layanan Ekspedisi</p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">Biteship Multi-Kurir</p>
          <span className="text-[10px] text-emerald-600 font-medium">● Terhubung otomatis</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xs p-3 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor pesanan, penerima, atau nomor HP..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xs text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#EE4D2D] transition-colors"
          />
        </div>

        <select
          value={courierFilter}
          onChange={(e) => setCourierFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xs text-xs text-slate-700 outline-none focus:border-[#EE4D2D]"
        >
          <option value="">Semua Kurir</option>
          <option value="jne">JNE Express</option>
          <option value="sicepat">SiCepat</option>
          <option value="jnt">J&T Express</option>
          <option value="anteraja">AnterAja</option>
        </select>
      </div>

      {/* Compact Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#EE4D2D] mr-2" />
            <span className="text-xs">Memuat antrean pengiriman...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="font-semibold text-slate-800 text-xs">Semua pesanan telah diproses!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tidak ada pesanan baru yang menunggu pengiriman saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAFAFA] border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="w-10 px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded-xs border-slate-300 text-[#EE4D2D] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-2.5 min-w-[180px]">No. Pesanan</th>
                  <th className="px-3 py-2.5 min-w-[160px]">Penerima & Alamat</th>
                  <th className="px-3 py-2.5 min-w-[120px]">Jasa Kirim</th>
                  <th className="px-3 py-2.5 min-w-[110px]">Nilai Pesanan</th>
                  <th className="px-3 py-2.5 min-w-[100px]">Status</th>
                  <th className="px-3 py-2.5 w-[120px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((item: any) => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-orange-50/30 transition-colors ${
                        isChecked ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                          className="rounded-xs border-slate-300 text-[#EE4D2D] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                      </td>

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

                      <td className="px-3 py-2.5">
                        <p className="font-medium text-slate-800">{item.customer?.full_name || 'Pembeli'}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                          {item.shipping_address_line || item.customer?.phone_number || '-'}
                        </p>
                      </td>

                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-slate-800 uppercase">
                          {item.courier_code || 'JNE'}
                        </span>
                        <p className="text-[10px] text-slate-400">Reguler</p>
                      </td>

                      <td className="px-3 py-2.5">
                        <p className="font-bold text-slate-900">{formatRupiah(Number(item.total_amount))}</p>
                        <span className="text-[10px] text-emerald-600 font-medium">Dibayar</span>
                      </td>

                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          Siap Kirim
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            bulkShipMutation.mutate({ orderIds: [item.id], courierCode: item.courier_code || 'jne' });
                          }}
                          className="px-2.5 py-1 bg-[#EE4D2D] hover:bg-[#d73f20] text-white text-[11px] font-semibold rounded-xs transition-colors shadow-2xs"
                        >
                          Kirim Sekarang
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-200 bg-[#FAFAFA] flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan {orders.length} dari total {total} antrean pengiriman
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
