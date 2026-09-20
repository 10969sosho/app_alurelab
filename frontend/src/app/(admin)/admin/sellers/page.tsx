'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Store, ExternalLink, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_SELLERS = [
  { id: '1', store_name: 'Batik Nusantara', owner_name: 'Ahmad Fauzi', email: 'ahmad@example.com', slug: 'batik-nusantara', status: 'active', plan: 'Pro', orders_count: 142, created_at: '2024-01-15T08:00:00Z' },
  { id: '2', store_name: 'Kedai Kopi Aroma', owner_name: 'Siti Rahayu', email: 'siti@example.com', slug: 'kedai-kopi-aroma', status: 'active', plan: 'Starter', orders_count: 89, created_at: '2024-02-20T10:30:00Z' },
  { id: '3', store_name: 'Toko Elektronik Maju', owner_name: 'Budi Santoso', email: 'budi@example.com', slug: 'toko-elektronik-maju', status: 'suspended', plan: 'Starter', orders_count: 12, created_at: '2024-03-05T14:00:00Z' },
  { id: '4', store_name: 'Hijab Elegan', owner_name: 'Rina Wulandari', email: 'rina@example.com', slug: 'hijab-elegan', status: 'active', plan: 'Business', orders_count: 310, created_at: '2023-11-10T09:00:00Z' },
  { id: '5', store_name: 'Warung Sembako Pak Haji', owner_name: 'Haji Mansur', email: 'mansur@example.com', slug: 'sembako-pak-haji', status: 'active', plan: 'Free', orders_count: 45, created_at: '2024-04-01T07:00:00Z' },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    active:    { label: 'Aktif',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',  icon: CheckCircle },
    suspended: { label: 'Suspended', cls: 'bg-red-50 text-red-700 border-red-200',              icon: XCircle     },
    pending:   { label: 'Pending',   cls: 'bg-yellow-50 text-yellow-700 border-yellow-200',     icon: RefreshCw   },
  };
  const { label, cls, icon: Icon } = cfg[status] ?? cfg.pending;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', cls)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const cfg: Record<string, string> = {
    Free:     'bg-slate-100 text-slate-600',
    Starter:  'bg-blue-50 text-blue-700',
    Pro:      'bg-violet-50 text-violet-700',
    Business: 'bg-amber-50 text-amber-700',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold', cfg[plan] ?? cfg.Free)}>
      {plan}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminSellersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: sellers = MOCK_SELLERS, isLoading } = useQuery({
    queryKey: ['admin', 'sellers'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/sellers');
        return res.data.data;
      } catch {
        return MOCK_SELLERS;
      }
    },
  });

  const filtered = sellers.filter((s: any) => {
    const matchSearch =
      s.store_name.toLowerCase().includes(search.toLowerCase()) ||
      s.owner_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Semua Sellers</h2>
          <p className="text-xs text-slate-500 mt-0.5">{sellers.length} merchant terdaftar</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama toko, owner, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-lime-accent/40 focus:border-lime-accent transition"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'suspended', 'pending'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'bg-charcoal-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {s === 'all' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Store className="w-8 h-8 mb-2" />
            <p className="text-sm">Tidak ada seller ditemukan</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Toko</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Owner</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden md:table-cell">Plan</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden lg:table-cell">Orders</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-semibold hidden lg:table-cell">Bergabung</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((seller: any) => (
                <tr key={seller.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-lime-accent to-green-400 rounded-lg flex items-center justify-center shrink-0 text-charcoal-900 font-bold text-xs">
                        {seller.store_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{seller.store_name}</p>
                        <p className="text-[10px] text-slate-400">/{seller.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{seller.owner_name}</p>
                    <p className="text-[10px] text-slate-400">{seller.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <PlanBadge plan={seller.plan} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-600 font-medium">
                    {seller.orders_count.toLocaleString('id')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={seller.status} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-400">
                    {formatDateTime(seller.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/sellers/${seller.id}`}
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
