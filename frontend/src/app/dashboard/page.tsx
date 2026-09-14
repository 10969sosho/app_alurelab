'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ShoppingBag,
  TrendingUp,
  Printer,
  ExternalLink,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

export default function MerchantDashboard() {
  const [selectedTab, setSelectedTab] = useState<'orders' | 'finance' | 'settings'>('orders');

  const storeInfo = {
    name: 'Hijab Mevvah Official',
    slug: 'hijab-mevvah',
    domain: 'hijabmevvah.com',
    plan: 'Pro Tier',
  };

  const wallet = {
    available: 3500000,
    escrow: 1250000,
    totalGmv: 18750000,
  };

  const sampleOrders = [
    {
      id: 'ORD-20260914-00192',
      customer: 'Rina Wulandari',
      phone: '081234567890',
      items: 'Hijab Silk Premium Emerald Glow (1x)',
      total: 166000,
      courier: 'SICEPAT REG',
      awb: '004289127819',
      status: 'PAID_ESCROW',
      statusLabel: 'Menunggu Pengiriman',
    },
    {
      id: 'ORD-20260914-00188',
      customer: 'Siti Nurhaliza',
      phone: '081298765432',
      items: 'Pashmina Plisket Ceruty (2x)',
      total: 195000,
      courier: 'J&T EZ',
      awb: 'JT981249120',
      status: 'SHIPPED',
      statusLabel: 'Dalam Pengiriman (In Transit)',
    },
    {
      id: 'ORD-20260913-00174',
      customer: 'Dewi Lestari',
      phone: '087712348899',
      items: 'Hijab Silk Dusty Rose (1x)',
      total: 166000,
      courier: 'JNE REG',
      awb: 'JNE887162534',
      status: 'COMPLETED',
      statusLabel: 'Selesai (Dana Cair)',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950">
              A
            </div>
            <span className="font-bold text-lg text-white">ALURELAB</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-semibold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md">
            {storeInfo.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${storeInfo.slug}`}
            target="_blank"
            className="text-xs font-medium text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
          >
            Lihat Storefront Live <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl w-full mx-auto p-6 space-y-6 flex-1">
        {/* Metric Cards */}
        <div className="grid sm:grid-cols-3 gap-5">
          {/* Card 1: Saldo Siap Cair */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-medium text-slate-400">Saldo Siap Ditarik</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mb-1">
              Rp {wallet.available.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Pencairan ke rekening bank pribadi (Fee Rp 3.000)
            </p>
            <button className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-all">
              Tarik Dana (Withdraw)
            </button>
          </div>

          {/* Card 2: Saldo Escrow Tertahan */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-medium text-slate-400">Saldo Escrow (Dalam Pengiriman)</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mb-1">
              Rp {wallet.escrow.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-slate-500">
              Dana cair otomatis setelah barang diterima pembeli (2x24 jam)
            </p>
          </div>

          {/* Card 3: Total Omzet GMV */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-medium text-slate-400">Total Penjualan (GMV)</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mb-1">
              Rp {wallet.totalGmv.toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              +24% dibanding pekan lalu
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setSelectedTab('orders')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
              selectedTab === 'orders'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Manajemen Pesanan & Resi Biteship
          </button>
          <button
            onClick={() => setSelectedTab('finance')}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
              selectedTab === 'finance'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Buku Kas Mutasi Escrow (Ledger)
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" /> Daftar Pesanan Masuk
            </h3>
            <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">No. Pesanan</th>
                  <th className="p-3.5">Pelanggan</th>
                  <th className="p-3.5">Detail Barang</th>
                  <th className="p-3.5">Total Tagihan</th>
                  <th className="p-3.5">Kurir & Resi (AWB)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sampleOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-slate-200">{ord.id}</td>
                    <td className="p-3.5">
                      <div className="font-medium text-white">{ord.customer}</div>
                      <div className="text-[10px] text-slate-500">{ord.phone}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">{ord.items}</td>
                    <td className="p-3.5 font-bold text-emerald-400">
                      Rp {ord.total.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">{ord.courier}</div>
                      <div className="text-[10px] font-mono text-slate-400">{ord.awb}</div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ord.status === 'PAID_ESCROW'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : ord.status === 'SHIPPED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {ord.statusLabel}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        title="Cetak Label Thermal PDF (100x150 mm)"
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Cetak Label Thermal
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
