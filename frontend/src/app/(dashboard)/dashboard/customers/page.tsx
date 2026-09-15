'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  MessageCircle,
  Mail,
  Crown,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Phone,
} from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['merchant-customers', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await api.get(`/merchant/customers?${params.toString()}`);
      return res.data;
    },
  });

  const customers = data?.data || [];
  const total = data?.total || 0;

  // Compute metrics
  const totalSpendAll = customers.reduce((acc: number, c: any) => acc + (c.total_spent || 0), 0);
  const totalOrdersAll = customers.reduce((acc: number, c: any) => acc + (c.total_orders || 0), 0);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'VIP Platinum':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Gold Member':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Silver Member':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-2.5 select-none font-sans pb-10">
      {/* ─── 1. Header Bar ─── */}
      <div className="pt-1">
        <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
          Pelanggan & Member
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Kelola basis data pembeli, riwayat belanja, dan loyalitas member toko
        </p>
      </div>

      {/* ─── 2. Metric Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-2xs">
          <p className="text-[11px] text-slate-500 font-medium">Total Pelanggan</p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{total}</p>
          <span className="text-[10px] text-slate-400">Pembeli storefront toko</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-2xs">
          <p className="text-[11px] text-slate-500 font-medium">Total Akumulasi Belanja (LTV)</p>
          <p className="text-lg font-bold text-[#EE4D2D] mt-0.5">{formatRupiah(totalSpendAll)}</p>
          <span className="text-[10px] text-slate-400">Rata-rata pesanan: {totalOrdersAll} transaksi</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-2xs">
          <p className="text-[11px] text-slate-500 font-medium">Program Loyalitas</p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">Member Aktif</p>
          <span className="text-[10px] text-emerald-600 font-medium">● Tiering otomatis berdasar omset</span>
        </div>
      </div>

      {/* ─── 3. Search Filter Bar ─── */}
      <div className="bg-white border border-slate-200 rounded-xs p-3 flex items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pelanggan, nomor WhatsApp, atau email..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xs text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#EE4D2D] transition-colors"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Menampilkan {customers.length} data
        </div>
      </div>

      {/* ─── 4. Customers Table ─── */}
      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#EE4D2D] mr-2" />
            <span className="text-xs">Memuat data pelanggan...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-800 text-xs">Belum ada pelanggan terdaftar</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Data pelanggan akan otomatis terhimpun saat transaksi pertama terjadi di etalase tokomu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAFAFA] border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 min-w-[200px]">Pelanggan</th>
                  <th className="px-3 py-2.5 min-w-[150px]">Kontak WhatsApp</th>
                  <th className="px-3 py-2.5 min-w-[100px]">Total Pesanan</th>
                  <th className="px-3 py-2.5 min-w-[130px]">Total Belanja</th>
                  <th className="px-3 py-2.5 min-w-[120px]">Tier Loyalitas</th>
                  <th className="px-3 py-2.5 min-w-[140px]">Pesanan Terakhir</th>
                  <th className="px-3 py-2.5 w-[100px] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((item: any) => {
                  const rawPhone = item.phone?.replace(/\D/g, '') || '';
                  const waNumber = rawPhone.startsWith('0')
                    ? '62' + rawPhone.slice(1)
                    : rawPhone;

                  return (
                    <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xs bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                            {item.name?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{item.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <span className="font-mono text-slate-700 text-[11px]">{item.phone}</span>
                      </td>

                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-slate-800">{item.total_orders}</span> pesanan
                      </td>

                      <td className="px-3 py-2.5">
                        <p className="font-bold text-slate-900">{formatRupiah(Number(item.total_spent))}</p>
                      </td>

                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[10px] font-semibold ${getTierColor(item.tier)}`}>
                          <Crown className="w-3 h-3" />
                          {item.tier}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-[11px] text-slate-500 font-mono">
                        {formatDateTime(item.last_order_at)}
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        {waNumber ? (
                          <a
                            href={`https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(item.name)},%20terima%20kasih%20telah%20berbelanja%20di%20toko%20kami.`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xs font-semibold text-[11px] transition-colors shadow-2xs"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>Chat WA</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
