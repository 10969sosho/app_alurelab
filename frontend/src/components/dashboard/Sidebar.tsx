'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  ChevronDown,
  LogOut,
  ExternalLink,
  Store,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    title: 'Pesanan',
    items: [
      { href: '/dashboard/orders', label: 'Pesanan Saya', exact: true },
      { href: '/dashboard/shipping', label: 'Pengiriman Massal' },
      { href: '/dashboard/orders?tab=return', label: 'Pengembalian/Pembatalan' },
    ],
  },
  {
    title: 'Produk',
    items: [
      { href: '/dashboard/products', label: 'Produk Saya', exact: true },
      { href: '/dashboard/products/new', label: 'Tambah Produk Baru' },
      { href: '/dashboard/cms', label: 'Tampilan Toko (CMS)' },
    ],
  },
  {
    title: 'Pusat Promosi',
    items: [
      { href: '/dashboard/promotions', label: 'Pusat Promosi' },
      { href: '/dashboard/customers', label: 'Pelanggan & Member' },
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
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const store = (session as any)?.store;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex flex-col h-full w-52 bg-white text-slate-700 border-r border-slate-200/90 select-none text-xs">
      {/* Store Monogram Header */}
      <div className="px-3.5 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 bg-[#EE4D2D] text-white rounded-sm flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {store?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-xs leading-tight truncate">
              {store?.name ?? 'ALURELAB Store'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {store?.slug ? `${store.slug}.shop` : 'Official Seller'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Grouped Lists (Shopee Seller Centre Style) */}
      <nav className="flex-1 px-2 py-2.5 space-y-3 overflow-y-auto">
        {/* Dashboard Overview shortcut */}
        <div>
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center px-2.5 py-1.5 rounded-sm text-xs transition-colors',
              pathname === '/dashboard'
                ? 'text-[#EE4D2D] font-bold bg-orange-50/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            )}
          >
            Ringkasan Beranda
          </Link>
        </div>

        {navGroups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            {/* Category Header */}
            <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-slate-400">
              <span>{group.title}</span>
              <ChevronDown className="w-3 h-3 text-slate-300" />
            </div>

            {/* Category Links */}
            <div className="space-y-0.5 pl-1">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-xs text-[11px] sm:text-xs transition-colors',
                      active
                        ? 'text-[#EE4D2D] font-bold bg-orange-50/80 border-l-2 border-[#EE4D2D]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Tools & Logout */}
      <div className="p-2 border-t border-slate-100 space-y-1 bg-slate-50/50">
        {/* Plan badge */}
        {store && (
          <div className="px-2 py-1 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <Crown className="w-3 h-3 text-amber-500" />
              Paket {store.plan_tier ?? 'Starter'}
            </span>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
              Aktif
            </span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50/50 rounded-xs transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}

