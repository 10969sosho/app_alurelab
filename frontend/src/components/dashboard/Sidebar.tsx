'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Wallet,
  Settings,
  BarChart3,
  Tag,
  Truck,
  LogOut,
  Store,
  ExternalLink,
  ChevronDown,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard',             icon: LayoutDashboard, label: 'Dashboard',    exact: true  },
  { href: '/dashboard/products',    icon: Package,         label: 'Produk'                     },
  { href: '/dashboard/orders',      icon: ShoppingBag,     label: 'Pesanan'                    },
  { href: '/dashboard/customers',   icon: Users,           label: 'Pelanggan'                  },
  { href: '/dashboard/promotions',  icon: Tag,             label: 'Promo'                      },
  { href: '/dashboard/shipping',    icon: Truck,           label: 'Pengiriman'                 },
  { href: '/dashboard/finance',     icon: Wallet,          label: 'Keuangan'                   },
  { href: '/dashboard/analytics',   icon: BarChart3,       label: 'Analitik'                   },
  { href: '/dashboard/settings',    icon: Settings,        label: 'Pengaturan'                 },
];

export function Sidebar() {
  const pathname   = usePathname();
  const { data: session } = useSession();

  const store = (session as any)?.store;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex flex-col h-full w-64 bg-slate-900 text-white">
      {/* Header / Logo */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-tight truncate">
              {store?.name ?? 'ALURELAB'}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {store?.slug ? `${store.slug}.alurelab.shop` : 'Dashboard Merchant'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <item.icon className={cn('w-4.5 h-4.5 flex-shrink-0', active ? 'text-emerald-400' : '')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-700/50 space-y-1">
        {/* Plan badge */}
        {store && (
          <div className="px-3 py-2 mb-2">
            <div className="flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-slate-400 capitalize">
                Paket {store.plan_tier ?? 'Starter'}
              </span>
              <Link href="/dashboard/subscription" className="ml-auto text-xs text-emerald-400 hover:text-emerald-300">
                Upgrade
              </Link>
            </div>
          </div>
        )}

        {/* Lihat Toko */}
        {store?.slug && (
          <Link
            href={`/${store.slug}`}
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Lihat Toko
          </Link>
        )}

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
