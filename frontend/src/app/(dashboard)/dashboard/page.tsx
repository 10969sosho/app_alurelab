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
      <div className="flex items-center justify-center h-48 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-[#EE4D2D] mr-2" />
        <span className="text-xs">Memuat data dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 select-none font-sans pb-8">
      {/* Page Title */}
      <div className="pt-0.5">
        <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
          Ikhtisar Toko
        </h1>
        <p className="text-slate-400 text-xs mt-0.5">{storeName} — ringkasan performa hari ini</p>
      </div>

      {/* Hal yang Perlu Dilakukan (To-Do List Widget) */}
      <div className="bg-white border border-slate-200 rounded-xs p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold text-slate-800">Hal yang Perlu Dilakukan</h2>
          <span className="text-[11px] text-slate-400">Tindakan mendesak untuk toko Anda</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <PriorityCard
            label="Menunggu Konfirmasi"
            count={stats.orders_pending}
            href="/dashboard/orders?status=paid_escrow"
            ctaLabel="Proses Pesanan"
            highlight={stats.orders_pending > 0}
          />
          <PriorityCard
            label="Sedang Diproses"
            count={stats.orders_processing}
            href="/dashboard/orders?status=processing"
            ctaLabel="Cetak Label & Kirim"
            highlight={stats.orders_processing > 0}
          />
          <PriorityCard
            label="Stok Hampir Habis"
            count={stats.products_low_stock}
            href="/dashboard/products?low_stock=true"
            ctaLabel="Perbarui Stok"
            highlight={stats.products_low_stock > 0}
          />
        </div>
      </div>

      {/* Metric Cards (Space Saving) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <MetricCard
          label="Penjualan Hari Ini"
          value={formatRupiah(stats.revenue_today, { compact: true })}
          icon={TrendingUp}
          iconBg="bg-orange-50"
          iconColor="text-[#EE4D2D]"
        />
        <MetricCard
          label="Pesanan Baru"
          value={stats.orders_today.toString()}
          icon={ShoppingBag}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <MetricCard
          label="Produk Aktif"
          value={stats.products_active.toString()}
          icon={Package}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <MetricCard
          label="Pelanggan Baru"
          value="—"
          icon={Users}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
      </div>

      {/* Recent Orders Compact Table */}
      <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-2xs">
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800">Pesanan Terbaru</h2>
          <Link
            href="/dashboard/orders"
            className="text-xs text-[#EE4D2D] hover:underline font-medium flex items-center gap-1"
          >
            Lihat Semua <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {loadingOrders ? (
          <div className="flex items-center justify-center h-28 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-[#EE4D2D] mr-2" />
            <span className="text-xs">Memuat pesanan...</span>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <ShoppingBag className="w-8 h-8 mb-1.5 opacity-30" />
            <p className="text-xs font-medium">Belum ada pesanan terbaru</p>
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
                  className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-orange-50/30 transition-colors text-xs"
                >
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[11px] font-medium shrink-0 ${statusCfg.color}`}>
                    <Icon className="w-3 h-3" />
                    {statusCfg.label}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{order.customer.full_name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{order.order_number}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-slate-900">{formatRupiah(order.total_amount)}</p>
                    <p className="text-[10px] text-slate-400">{formatDateTime(order.created_at)}</p>
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
    <div className="bg-white border border-slate-200 rounded-xs p-3 shadow-2xs flex items-center justify-between">
      <div>
        <p className="text-[11px] text-slate-500 font-medium">{label}</p>
        <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">{value}</p>
      </div>
      <div className={`w-8 h-8 ${iconBg} rounded-xs flex items-center justify-center shrink-0`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
    </div>
  );
}

function PriorityCard({
  label, count, href, ctaLabel, highlight,
}: {
  label: string; count: number; href: string; ctaLabel: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-xs border p-3 flex flex-col justify-between transition-colors ${
      highlight ? 'border-orange-200 bg-orange-50/40' : 'border-slate-200 bg-slate-50/50'
    }`}>
      <div>
        <p className={`text-xl font-bold leading-tight ${highlight ? 'text-[#EE4D2D]' : 'text-slate-800'}`}>
          {count}
        </p>
        <p className="text-xs text-slate-600 mt-0.5">{label}</p>
      </div>
      <div className="mt-2.5">
        <Link
          href={href}
          className={`text-[11px] font-semibold transition-colors ${
            highlight ? 'text-[#EE4D2D] hover:underline' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {ctaLabel} &gt;
        </Link>
      </div>
    </div>
  );
}
