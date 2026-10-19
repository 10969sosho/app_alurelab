'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { formatDateTime, formatRupiah } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  Palette,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';

interface DashboardStats {
  revenue_today: number;
  revenue_month: number;
  orders_today: number;
  orders_pending: number;
  orders_processing: number;
  orders_shipped: number;
  products_active: number;
  products_low_stock: number;
  new_customers?: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer: { full_name: string; phone_number: string };
  total_amount: number;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending_payment: { label: 'Menunggu Bayar', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', icon: Clock },
  paid_escrow: { label: 'Dibayar', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: CheckCircle2 },
  processing: { label: 'Diproses', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: Package },
  shipped: { label: 'Dikirim', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', icon: Truck },
  delivered: { label: 'Terkirim', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  completed: { label: 'Selesai', color: 'text-green-700 bg-green-50 border-green-200', icon: CheckCircle2 },
  cancelled: { label: 'Dibatalkan', color: 'text-red-700 bg-red-50 border-red-200', icon: AlertTriangle },
  rts_returned: { label: 'RTS', color: 'text-orange-700 bg-orange-50 border-orange-200', icon: RotateCcw },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => api.get('/merchant/dashboard').then((response) => response.data),
  });
  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['orders-recent'],
    queryFn: () => api.get('/merchant/orders?per_page=8&sort=latest').then((response) => response.data),
  });

  const stats: DashboardStats = dashboardData?.stats ?? {
    revenue_today: 0,
    revenue_month: 0,
    orders_today: 0,
    orders_pending: 0,
    orders_processing: 0,
    orders_shipped: 0,
    products_active: 0,
    products_low_stock: 0,
  };
  const recentOrders: RecentOrder[] = ordersData?.data ?? [];
  const storeName = (session as any)?.store?.name ?? 'Toko Anda';

  if (loadingDashboard) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-[#EE4D2D]" />
        <span className="text-sm">Memuat data dashboard...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <section>
        <h2 className="text-xl font-bold tracking-tight text-slate-800">Selamat datang, {storeName}!</h2>
        <p className="mt-1 text-sm text-slate-500">Berikut ringkasan aktivitas dan langkah berikutnya untuk toko Anda.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2" aria-label="Langkah awal">
        <QuickActionCard
          icon={Package}
          title="Tambah Produk Pertama"
          description="Tambahkan produk agar pelanggan mulai menemukan dan membeli dari toko Anda."
          cta="Tambah Produk"
          href="/dashboard/products/new"
        />
        <QuickActionCard
          icon={Palette}
          title="Sesuaikan Tampilan Toko"
          description="Atur tema, warna, dan tampilan storefront agar sesuai dengan brand Anda."
          cta="Atur Tema"
          href="/dashboard/cms/editor"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan performa">
        <MetricCard label="Penjualan Hari Ini" value={formatRupiah(stats.revenue_today, { compact: true })} icon={TrendingUp} iconBg="bg-orange-50" iconColor="text-[#EE4D2D]" />
        <MetricCard label="Pesanan Baru" value={String(stats.orders_today)} icon={ShoppingBag} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <MetricCard label="Produk Aktif" value={String(stats.products_active)} icon={Package} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <MetricCard label="Pelanggan Baru" value={stats.new_customers != null ? String(stats.new_customers) : '—'} icon={Users} iconBg="bg-violet-50" iconColor="text-violet-600" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Hal yang Perlu Dilakukan</h2>
            <p className="mt-0.5 text-xs text-slate-500">Tindakan untuk menjaga pesanan dan stok tetap tertangani.</p>
          </div>
          <BarChart3 className="h-4 w-4 text-slate-400" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <PriorityCard label="Menunggu Konfirmasi" count={stats.orders_pending} href="/dashboard/orders?status=paid_escrow" ctaLabel="Proses Pesanan" />
          <PriorityCard label="Sedang Diproses" count={stats.orders_processing} href="/dashboard/orders?status=processing" ctaLabel="Cetak Label & Kirim" />
          <PriorityCard label="Stok Hampir Habis" count={stats.products_low_stock} href="/dashboard/products?low_stock=true" ctaLabel="Perbarui Stok" />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">Pesanan Terbaru</h2>
          <Link href="/dashboard/orders" className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900">
            Lihat Semua <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingOrders ? (
          <div className="flex h-28 items-center justify-center text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#EE4D2D]" />
            <span className="text-sm">Memuat pesanan...</span>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <ShoppingBag className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm font-medium">Belum ada pesanan terbaru</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => {
              const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending_payment;
              const StatusIcon = status.icon;
              return (
                <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50 sm:gap-4">
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.color}`}>
                    <StatusIcon className="h-3 w-3" /> {status.label}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">{order.customer.full_name}</span>
                    <span className="block truncate font-mono text-[11px] text-slate-400">{order.order_number}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold text-slate-900">{formatRupiah(order.total_amount)}</span>
                    <span className="block text-[10px] text-slate-400">{formatDateTime(order.created_at)}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, description, cta, href }: {
  icon: React.ElementType; title: string; description: string; cta: string; href: string;
}) {
  return (
    <article className="flex min-h-56 flex-col items-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Icon className="mb-4 h-12 w-12 text-slate-300" strokeWidth={1.5} />
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-500">{description}</p>
      <Link href={href} className="mt-5 inline-flex items-center rounded-xl bg-[#111111] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-black">
        {cta}
      </Link>
    </article>
  );
}

function MetricCard({ label, value, icon: Icon, iconBg, iconColor }: {
  label: string; value: string; icon: React.ElementType; iconBg: string; iconColor: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </article>
  );
}

function PriorityCard({ label, count, href, ctaLabel }: {
  label: string; count: number; href: string; ctaLabel: string;
}) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-3xl font-bold leading-tight text-slate-900">{count}</p>
        <p className="mt-1 text-xs font-medium text-slate-600">{label}</p>
      </div>
      <Link href={href} className="mt-4 text-xs font-semibold text-slate-700 hover:text-[#EE4D2D]">
        {ctaLabel} <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
