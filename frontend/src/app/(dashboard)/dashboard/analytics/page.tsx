'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  ArrowUpRight,
  Package,
  Calendar,
  Loader2,
  BarChart3,
} from 'lucide-react';
import api from '@/lib/api';
import { formatRupiah } from '@/lib/utils';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7days' | '30days'>('7days');

  const { data, isLoading } = useQuery({
    queryKey: ['merchant-analytics', period],
    queryFn: async () => {
      const res = await api.get('/merchant/analytics');
      return res.data;
    },
  });

  const metrics = data?.metrics || {
    total_gmv: 0,
    total_orders: 0,
    completed_orders: 0,
    average_order_value: 0,
    visitors: 0,
    conversion_rate: 0,
  };

  const chart = data?.chart || [];
  const topProducts = data?.top_products || [];

  const maxRevenue = Math.max(...chart.map((c: any) => c.revenue || 0), 100000);

  return (
    <div className="space-y-3 select-none font-sans pb-10">
      {/* ─── 1. Header Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
            Analisis Bisnis Saya
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Pantau metrik penjualan, tren omset harian, dan produk paling laris di toko Anda
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-0.5 rounded-xs self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setPeriod('7days')}
            className={`px-3 py-1 rounded-xs font-medium transition-colors ${
              period === '7days'
                ? 'bg-[#EE4D2D] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => setPeriod('30days')}
            className={`px-3 py-1 rounded-xs font-medium transition-colors ${
              period === '30days'
                ? 'bg-[#EE4D2D] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 Hari Terakhir
          </button>
        </div>
      </div>

      {/* ─── 2. Metric Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Total Penjualan (GMV)</span>
            <div className="w-6 h-6 rounded-xs bg-orange-50 text-[#EE4D2D] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            {formatRupiah(Number(metrics.total_gmv), { compact: true })}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">↑ +14.2% dibanding pekan lalu</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Total Pesanan Masuk</span>
            <div className="w-6 h-6 rounded-xs bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            {metrics.total_orders} Pesanan
          </p>
          <span className="text-[10px] text-slate-400">
            {metrics.completed_orders} pesanan selesai
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Rata-rata Nilai Pesanan</span>
            <div className="w-6 h-6 rounded-xs bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            {formatRupiah(Number(metrics.average_order_value), { compact: true })}
          </p>
          <span className="text-[10px] text-slate-400">Basket size per checkout</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Konversi Pembeli</span>
            <div className="w-6 h-6 rounded-xs bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            {metrics.conversion_rate}%
          </p>
          <span className="text-[10px] text-slate-400">{metrics.visitors} pengunjung unik</span>
        </div>
      </div>

      {/* ─── 3. Sales Trend Bar Chart (Native CSS Ponytail) ─── */}
      <div className="bg-white border border-slate-200 rounded-xs p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#EE4D2D]" />
            <h2 className="text-xs font-bold text-slate-800">Tren Penjualan Harian</h2>
          </div>
          <span className="text-[11px] text-slate-400">Grafik omset harian toko</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#EE4D2D] mr-2" />
            <span className="text-xs">Menghitung analisis bisnis...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-44 flex items-end justify-between gap-2 pt-6 border-b border-slate-100">
              {chart.map((c: any) => {
                const heightPct = Math.max(12, Math.round((c.revenue / maxRevenue) * 100));
                return (
                  <div key={c.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono">
                      {formatRupiah(c.revenue, { compact: true })}
                    </span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[42px] bg-gradient-to-t from-[#EE4D2D] to-orange-400 rounded-t-xs transition-all group-hover:brightness-110"
                    />
                    <span className="text-[10px] text-slate-500 font-mono mt-1">
                      {c.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>Sumbu X: Tanggal</span>
              <span>Sumbu Y: Total Omset Harian</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. Top Selling Products ─── */}
      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs">
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800">5 Produk Terlaris</h2>
          <span className="text-[11px] text-slate-400">Peringkat performa omset</span>
        </div>

        <div className="divide-y divide-slate-100">
          {topProducts.map((prod: any, idx: number) => {
            const coverImage = prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
            return (
              <div key={prod.id} className="px-3.5 py-2.5 flex items-center gap-3 hover:bg-orange-50/20 transition-colors">
                <span className={`w-5 h-5 rounded-xs flex items-center justify-center font-bold text-xs shrink-0 ${
                  idx === 0 ? 'bg-[#EE4D2D] text-white' : idx === 1 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {idx + 1}
                </span>

                <img
                  src={coverImage}
                  alt={prod.title}
                  className="w-10 h-10 rounded-xs object-cover border border-slate-200 bg-slate-50 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-xs truncate">{prod.title}</p>
                  <p className="text-[11px] text-slate-500">{formatRupiah(Number(prod.price))}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900 text-xs">{prod.sales_count} terjual</p>
                  <p className="text-[11px] text-[#EE4D2D] font-semibold">{formatRupiah(Number(prod.revenue))}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
