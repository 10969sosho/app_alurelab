'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Users, ShoppingBag, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ─── Mock ─────────────────────────────────────────────────────────────────────
const MOCK_BUYER: Record<string, any> = {
  '1': {
    id: '1', full_name: 'Dewi Anggraini', email: 'dewi@example.com',
    phone_number: '081234567890', total_orders: 8, total_spent: 2_450_000,
    last_active: '2024-05-10T12:00:00Z', created_at: '2023-12-01T09:00:00Z',
    orders: [
      { id: 'ORD-001', store: 'Batik Nusantara', amount: 450_000, status: 'completed', date: '2024-05-01T10:00:00Z' },
      { id: 'ORD-002', store: 'Hijab Elegan', amount: 280_000, status: 'delivered', date: '2024-04-15T14:00:00Z' },
    ],
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

const STATUS_COLOR: Record<string, string> = {
  completed: 'bg-green-50 text-green-700',
  delivered:  'bg-emerald-50 text-emerald-700',
  pending:    'bg-yellow-50 text-yellow-700',
  cancelled:  'bg-red-50 text-red-700',
};

export default function AdminBuyerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: buyer, isLoading } = useQuery({
    queryKey: ['admin', 'buyers', id],
    queryFn: async () => {
      try {
        const res = await api.get(`/admin/buyers/${id}`);
        return res.data.data;
      } catch {
        return MOCK_BUYER[id] ?? null;
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

  if (!buyer) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Users className="w-10 h-10 mx-auto mb-3" />
        <p>Buyer tidak ditemukan</p>
      </div>
    );
  }

  const formatRp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back */}
      <Link href="/admin/buyers" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Buyers
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
          {buyer.full_name.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{buyer.full_name}</h2>
          <p className="text-xs text-slate-500">{buyer.email} · {buyer.phone_number}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Orders', value: buyer.total_orders, icon: ShoppingBag, color: 'text-orange-600 bg-orange-50' },
          { label: 'Total Belanja', value: formatRp(buyer.total_spent), icon: CreditCard, color: 'text-violet-600 bg-violet-50' },
          { label: 'Terakhir Aktif', value: formatDateTime(buyer.last_active), icon: Users, color: 'text-blue-600 bg-blue-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-slate-200/80">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', color)}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-sm font-bold text-slate-900">{value}</p>
            <p className="text-[11px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Informasi Buyer</h3>
        <InfoRow label="Nama Lengkap" value={buyer.full_name} />
        <InfoRow label="Email" value={buyer.email} />
        <InfoRow label="Telepon" value={buyer.phone_number} />
        <InfoRow label="Bergabung" value={formatDateTime(buyer.created_at)} />
      </div>

      {/* Order History */}
      {buyer.orders?.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Riwayat Order</h3>
          <div className="space-y-2">
            {buyer.orders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-slate-800">{order.id}</p>
                  <p className="text-[11px] text-slate-500">{order.store} · {formatDateTime(order.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', STATUS_COLOR[order.status] ?? 'bg-slate-100 text-slate-600')}>
                    {order.status}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{formatRp(order.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
