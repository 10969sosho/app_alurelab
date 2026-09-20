'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Users, ExternalLink, Loader2, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_BUYERS = [
  { id: '1', full_name: 'Dewi Anggraini', email: 'dewi@example.com', phone_number: '081234567890', total_orders: 8, total_spent: 2_450_000, last_active: '2024-05-10T12:00:00Z', created_at: '2023-12-01T09:00:00Z' },
  { id: '2', full_name: 'Reza Pratama', email: 'reza@example.com', phone_number: '082345678901', total_orders: 3, total_spent: 780_000, last_active: '2024-05-08T15:30:00Z', created_at: '2024-01-20T10:00:00Z' },
  { id: '3', full_name: 'Mega Lestari', email: 'mega@example.com', phone_number: '083456789012', total_orders: 21, total_spent: 8_900_000, last_active: '2024-05-11T08:00:00Z', created_at: '2023-10-05T07:30:00Z' },
  { id: '4', full_name: 'Doni Kusuma', email: 'doni@example.com', phone_number: '084567890123', total_orders: 1, total_spent: 150_000, last_active: '2024-04-22T17:00:00Z', created_at: '2024-04-20T11:00:00Z' },
  { id: '5', full_name: 'Fitri Handayani', email: 'fitri@example.com', phone_number: '085678901234', total_orders: 15, total_spent: 5_200_000, last_active: '2024-05-09T09:45:00Z', created_at: '2023-09-15T08:00:00Z' },
];

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminBuyersPage() {
  const [search, setSearch] = useState('');

  const { data: buyers = MOCK_BUYERS, isLoading } = useQuery({
    queryKey: ['admin', 'buyers'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/buyers');
        return res.data.data;
      } catch {
        return MOCK_BUYERS;
      }
    },
  });

  const filtered = buyers.filter((b: any) =>
    b.full_name.toLowerCase().includes(search.toLowerCase()) ||
    b.email.toLowerCase().includes(search.toLowerCase()) ||
    b.phone_number.includes(search)
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Semua Buyers</h2>
          <p className="text-xs text-slate-500 mt-0.5">{buyers.length} pembeli terdaftar</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama, email, atau nomor HP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-lime-accent/40 focus:border-lime-accent transition"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Users className="w-8 h-8 mb-2" />
            <p className="text-sm">Tidak ada buyer ditemukan</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Buyer</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden md:table-cell">Telepon</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Total Orders</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden lg:table-cell">Total Belanja</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden lg:table-cell">Terakhir Aktif</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((buyer: any) => (
                <tr key={buyer.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {buyer.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{buyer.full_name}</p>
                        <p className="text-[10px] text-slate-400">{buyer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600">{buyer.phone_number}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800">{buyer.total_orders}</span>
                    <span className="text-slate-400 ml-1">pesanan</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell font-medium text-slate-700">
                    {formatRp(buyer.total_spent)}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-400">
                    {formatDateTime(buyer.last_active)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/buyers/${buyer.id}`}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
