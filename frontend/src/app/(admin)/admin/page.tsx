'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Store, Users, ShoppingBag, TrendingUp, ArrowUpRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatRupiah } from '@/lib/utils';

// ─── Mock stats (until backend admin API is ready) ────────────────────────────
const MOCK_STATS = {
  total_sellers:  12,
  total_buyers:   284,
  total_orders:   1_840,
  gmv:            427_600_000,
  new_sellers_today: 2,
  new_buyers_today:  17,
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, href, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; href?: string; color: string;
}) {
  const content = (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200/80 hover:shadow-md transition-shadow group`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {href && (
          <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-emerald-600 font-medium mt-1">{sub}</p>}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  // Fetch real stats — fallback ke mock jika API belum siap
  const { data: stats = MOCK_STATS, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/stats');
        return res.data.data;
      } catch {
        return MOCK_STATS; // graceful fallback
      }
    },
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Platform Overview</h2>
        <p className="text-xs text-slate-500 mt-0.5">Real-time snapshot semua aktivitas AlureLab</p>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Sellers"
            value={stats.total_sellers}
            sub={`+${stats.new_sellers_today} hari ini`}
            icon={Store}
            href="/admin/sellers"
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Total Buyers"
            value={stats.total_buyers}
            sub={`+${stats.new_buyers_today} hari ini`}
            icon={Users}
            href="/admin/buyers"
            color="bg-violet-50 text-violet-600"
          />
          <StatCard
            label="Total Orders"
            value={stats.total_orders.toLocaleString('id')}
            icon={ShoppingBag}
            color="bg-orange-50 text-orange-600"
          />
          <StatCard
            label="Total GMV"
            value={formatRupiah(stats.gmv)}
            icon={TrendingUp}
            color="bg-emerald-50 text-emerald-600"
          />
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'Lihat semua Sellers', href: '/admin/sellers' },
              { label: 'Lihat semua Buyers', href: '/admin/buyers' },
              { label: 'Semua Orders', href: '/admin/orders' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 group transition-colors"
              >
                <span className="text-xs text-slate-700">{item.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-charcoal-900 rounded-2xl p-5 text-white">
          <h3 className="text-sm font-semibold mb-1">AlureLab Admin</h3>
          <p className="text-xs text-slate-400 mb-4">
            Kelola semua merchant dan pembeli di satu tempat. Role-based access coming soon.
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs bg-lime-accent text-charcoal-900 font-bold px-3 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 bg-charcoal-900 rounded-full animate-pulse" />
            System Aktif
          </div>
        </div>
      </div>
    </div>
  );
}
