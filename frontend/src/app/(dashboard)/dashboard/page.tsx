'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatRupiah, formatDateTime } from '@/lib/utils';
import {
  ShoppingBag,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  Truck,
  CheckCircle2,
  ArrowUpRight,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  revenue_today:        number;
  revenue_month:        number;
  orders_today:         number;
  orders_pending:       number;
  orders_processing:    number;
  orders_shipped:       number;
  products_active:      number;
  products_low_stock:   number;
}

interface RecentOrder {
  id:           string;
  order_number: string;
  customer:     { full_name: string; phone_number: string };
  total_amount: number;
  status:       string;
  created_at:   string;
}

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending_payment: { label: 'Menunggu Bayar', color: 'text-yellow-600 bg-yellow-50 border-yellow-200',  icon: Clock         },
  paid_escrow:     { label: 'Dibayar',        color: 'text-blue-600 bg-blue-50 border-blue-200',        icon: CheckCircle2  },
  processing:      { label: 'Diproses',       color: 'text-purple-600 bg-purple-50 border-purple-200',  icon: Package       },
  shipped:         { label: 'Dikirim',        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',  icon: Truck         },
  delivered:       { label: 'Terkirim',       color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  completed:       { label: 'Selesai',        color: 'text-green-600 bg-green-50 border-green-200',     icon: CheckCircle2  },
  cancelled:       { label: 'Dibatalkan',     color: 'text-red-600 bg-red-50 border-red-200',           icon: AlertTriangle },
  rts_returned:    { label: 'RTS',            color: 'text-orange-600 bg-orange-50 border-orange-200',  icon: RotateCcw     },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn:  () => api.get('/merchant/dashboard').then((r) => r.data),
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders-recent'],
    queryFn:  () => api.get('/merchant/orders?per_page=8&sort=latest').then((r) => r.data),
  });

  const stats: DashboardStats = dashboardData?.stats ?? {
    revenue_today: 0, revenue_month: 0,
    orders_today: 0, orders_pending: 0, orders_processing: 0, orders_shipped: 0,
    products_active: 0, products_low_stock: 0,
  };

  const recentOrders: RecentOrder[] = ordersData?.data ?? [];

  const storeName = (session as any)?.store?.name ?? 'Toko Anda';

  if (loadingDashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Selamat datang! 👋</h1>
        <p className="text-slate-500 text-sm mt-0.5">{storeName} — ringkasan hari ini</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Penjualan Hari Ini"
          value={formatRupiah(stats.revenue_today, { compact: true })}
          icon={TrendingUp}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <MetricCard
          label="Pesanan Baru"
          value={stats.orders_today.toString()}
          icon={ShoppingBag}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <MetricCard
          label="Produk Aktif"
          value={stats.products_active.toString()}
          icon={Package}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <MetricCard
          label="Pelanggan"
          value="—"
          icon={Users}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Priority Queue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PriorityCard
          label="Menunggu Konfirmasi"
          count={stats.orders_pending}
          color="border-blue-400 bg-blue-50"
          textColor="text-blue-700"
          href="/dashboard/orders?status=paid_escrow"
          ctaLabel="Proses Semua"
        />
        <PriorityCard
          label="Sedang Diproses"
          count={stats.orders_processing}
          color="border-purple-400 bg-purple-50"
          textColor="text-purple-700"
          href="/dashboard/orders?status=processing"
          ctaLabel="Cetak Label"
        />
        <PriorityCard
          label="Stok Hampir Habis"
          count={stats.products_low_stock}
          color="border-orange-400 bg-orange-50"
          textColor="text-orange-700"
          href="/dashboard/products?low_stock=true"
          ctaLabel="Update Stok"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Pesanan Terbaru</h2>
          <Link
            href="/dashboard/orders"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingOrders ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <ShoppingBag className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">Belum ada pesanan</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => {
              const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending_payment;
              const Icon      = statusCfg.icon;
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusCfg.color}`}>
                    <Icon className="w-3 h-3" />
                    {statusCfg.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{order.customer.full_name}</p>
                    <p className="text-xs text-slate-400">{order.order_number}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-800">{formatRupiah(order.total_amount)}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(order.created_at)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub Components ───────────────────────────────────────────────────────────
function MetricCard({
  label, value, icon: Icon, iconBg, iconColor,
}: {
  label: string; value: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function PriorityCard({
  label, count, color, textColor, href, ctaLabel,
}: {
  label: string; count: number; color: string; textColor: string; href: string; ctaLabel: string;
}) {
  return (
    <div className={`rounded-2xl border-2 p-5 ${color}`}>
      <p className={`text-3xl font-bold ${textColor}`}>{count}</p>
      <p className="text-sm text-slate-600 mt-0.5 mb-4">{label}</p>
      {count > 0 && (
        <Link href={href} className={`text-xs font-semibold ${textColor} underline`}>
          {ctaLabel} →
        </Link>
      )}
    </div>
  );
}
