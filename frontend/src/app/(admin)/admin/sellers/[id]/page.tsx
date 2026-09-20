'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Store, Package, TrendingUp, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ─── Mock ─────────────────────────────────────────────────────────────────────
const MOCK_SELLER: Record<string, any> = {
  '1': {
    id: '1', store_name: 'Batik Nusantara', owner_name: 'Ahmad Fauzi', email: 'ahmad@example.com',
    slug: 'batik-nusantara', status: 'active', plan: 'Pro', phone: '081234567890',
    created_at: '2024-01-15T08:00:00Z', products_count: 45, orders_count: 142,
    revenue: 54_800_000, description: 'Toko batik premium dari Jogjakarta',
  },
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-medium text-slate-800">{value}</span>
    </div>
  );
}

export default function AdminSellerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: seller, isLoading } = useQuery({
    queryKey: ['admin', 'sellers', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/admin/sellers/${id}`);
        return res.data.data;
      } catch {
        return MOCK_SELLER[id] ?? null;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Store className="w-10 h-10 mx-auto mb-3" />
        <p>Seller tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back */}
      <Link href="/admin/sellers" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Sellers
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-lime-accent to-green-400 rounded-2xl flex items-center justify-center text-charcoal-900 font-bold text-xl">
          {seller.store_name.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{seller.store_name}</h2>
          <p className="text-xs text-slate-500">/{seller.slug} · {seller.plan} Plan</p>
        </div>
        <div className="ml-auto">
          <span className={cn(
            'px-3 py-1.5 rounded-full text-xs font-semibold border',
            seller.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          )}>
            {seller.status === 'active' ? 'Aktif' : 'Suspended'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Orders', value: seller.orders_count?.toLocaleString('id') ?? '-', icon: Package, color: 'text-orange-600 bg-orange-50' },
          { label: 'Total Produk', value: seller.products_count?.toLocaleString('id') ?? '-', icon: Store, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Revenue', value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(seller.revenue ?? 0), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-slate-200/80">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', color)}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-slate-900">{value}</p>
            <p className="text-[11px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Informasi Seller</h3>
        <InfoRow label="Owner" value={seller.owner_name} />
        <InfoRow label="Email" value={seller.email} />
        <InfoRow label="Telepon" value={seller.phone ?? '-'} />
        <InfoRow label="Bergabung" value={formatDateTime(seller.created_at)} />
        <InfoRow label="Deskripsi" value={seller.description ?? '-'} />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-xs font-medium transition-colors">
          <XCircle className="w-4 h-4" />
          Suspend Seller
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-medium transition-colors">
          <CheckCircle className="w-4 h-4" />
          Aktifkan Seller
        </button>
      </div>
    </div>
  );
}
