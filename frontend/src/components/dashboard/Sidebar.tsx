'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  ChevronDown,
  LogOut,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    title: 'Pesanan',
    items: [
      { href: '/dashboard/orders', label: 'Pesanan Saya', exact: true },
      { href: '/dashboard/orders?tab=return', label: 'Pengembalian/Pembatalan' },
    ],
  },
  {
    title: 'Produk',
    items: [
      { href: '/dashboard/products', label: 'Produk Saya', exact: true },
      { href: '/dashboard/categories', label: 'Master Kategori' },
      { href: '/dashboard/cms', label: 'Tampilan Toko (CMS)', exact: true },
    ],
  },
  {
    title: 'Pusat Promosi',
    items: [
      { href: '/dashboard/promotions', label: 'Pusat Promosi', exact: true },
      { href: '/dashboard/customers', label: 'Pelanggan & Member' },
      { href: '/dashboard/inbox', label: 'Pesan Pembeli 💬' },
    ],
  },
  {
    title: 'Keuangan',
    items: [
      { href: '/dashboard/finance', label: 'Saldo Escrow & Kas' },
      { href: '/dashboard/analytics', label: 'Analisis Bisnis' },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      { href: '/dashboard/settings', label: 'Pengaturan Toko' },
      { href: '/dashboard/subscription', label: 'Paket Langganan' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const store = (session as any)?.store;

  const isActive = (href: string, exact?: boolean) => {
    const clean = href.split('?')[0];
    if (exact) return pathname === clean;
    return pathname.startsWith(clean);
  };

  return (
    <aside className="flex flex-col h-full w-56 bg-white text-slate-700 border-r border-slate-200/90 select-none text-xs">
      {/* Store Monogram Header */}
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 bg-[#111111] text-[#C8FF3D] rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            {store?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-xs leading-tight truncate">
              {store?.name ?? 'ALURELAB Store'}
            </p>
            <p className="text-[10px] text-slate-400 leading-tight truncate">Seller Center</p>
          </div>
        </div>
      </div>

      {/* Navigation Grouped Lists */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {/* Dashboard Overview shortcut */}
        <div>
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all',
              pathname === '/dashboard'
                ? 'text-[#FAFAF8] font-semibold bg-[#111111] shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            Ringkasan Beranda
          </Link>
        </div>

        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {/* Category Header */}
            <div className="flex items-center justify-between px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>{group.title}</span>
              <ChevronDown className="w-3 h-3 text-slate-300" />
            </div>

            {/* Category Links */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-xl text-[11px] sm:text-xs font-medium transition-all',
                      active
                        ? 'text-[#FAFAF8] bg-[#111111] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-[#FAFAF8] hover:shadow-sm'
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF3D]" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Tools & Logout */}
      <div className="p-3 border-t border-slate-100 space-y-1.5 bg-[#FAFAF8]/60">
        {/* Plan badge */}
        {store && (
          <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <Crown className="w-3 h-3 text-amber-500" />
              Paket {store.plan_tier && store.plan_tier !== 'starter' ? store.plan_tier : 'Free'}
            </span>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Aktif
            </span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => {
            signOut({ callbackUrl: '/login' });
            setTimeout(() => { window.location.href = '/login'; }, 1500); // fallback in case NextAuth hangs/blocked
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}
