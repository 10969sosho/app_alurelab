'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  BarChart3,
  Crown,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  Package,
  Palette,
  RotateCcw,
  Search,
  Settings,
  ShoppingBag,
  Tags,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    title: 'Sales channels',
    items: [
      { href: '/dashboard', label: 'Ringkasan Beranda', icon: LayoutDashboard, exact: true },
      { href: '/dashboard/orders', label: 'Pesanan Saya', icon: ShoppingBag },
      { href: '/dashboard/products', label: 'Produk Saya', icon: Package },
      { href: '/dashboard/categories', label: 'Master Kategori', icon: Tags },
      { href: '/dashboard/cms', label: 'Tampilan Toko (CMS)', icon: Palette, exact: true },
      { href: '/dashboard/promotions', label: 'Pusat Promosi', icon: Megaphone, exact: true },
      { href: '/dashboard/customers', label: 'Pelanggan & Member', icon: Users },
      { href: '/dashboard/inbox', label: 'Pesan Pembeli', icon: MessageSquare },
      { href: '/dashboard/finance', label: 'Saldo Escrow & Kas', icon: Wallet },
      { href: '/dashboard/analytics', label: 'Analisis Bisnis', icon: BarChart3 },
    ],
  },
  {
    title: 'Apps',
    items: [
      { href: '/dashboard/settings', label: 'Pengaturan Toko', icon: Settings },
      { href: '/dashboard/subscription', label: 'Paket Langganan', icon: Crown },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const store = (session as any)?.store;
  const groups = useMemo(() => navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase())),
  })).filter((group) => group.items.length), [search]);

  const isActive = (href: string, exact?: boolean) => {
    const clean = href.split('?')[0];
    return exact ? pathname === clean : pathname.startsWith(clean);
  };

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-[#1c1c1c] text-xs text-white select-none">
      <div className="px-4 pt-5 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
            {store?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{store?.name ?? 'ALURELAB Store'}</p>
            <p className="mt-0.5 truncate text-[10px] text-white/45">Seller Center</p>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-white/50 focus-within:ring-2 focus-within:ring-white/15">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari menu..."
            className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/45"
          />
        </label>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {groups.map((group, index) => (
          <section key={group.title}>
            <h2 className={cn('mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30', index > 0 && 'mt-4')}>
              {group.title}
            </h2>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-all',
                      active ? 'bg-white/15 font-semibold text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8FF3D]" />}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/10 bg-[#111111] px-3 py-3">
        {store && (
          <div className="flex items-center justify-between rounded-full bg-white/10 px-3 py-1.5 text-[10px] text-white/60">
            <span className="flex items-center gap-1.5"><Crown className="h-3 w-3" /> Paket {store.plan_tier && store.plan_tier !== 'free' ? store.plan_tier : 'Free'}</span>
            <span>Aktif</span>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut className="h-3.5 w-3.5" /> Keluar Akun
        </button>
      </div>
    </aside>
  );
}
