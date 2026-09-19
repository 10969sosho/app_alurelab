'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, ClipboardList, User } from 'lucide-react';

interface BuyerBottomNavProps {
  storeSlug: string;
}

export default function BuyerBottomNav({ storeSlug }: BuyerBottomNavProps) {
  const pathname = usePathname();

  const isHome =
    pathname === `/${storeSlug}` || pathname === `/${storeSlug}/`;
  const isShop =
    pathname.startsWith(`/${storeSlug}/shop`) ||
    (pathname.startsWith(`/${storeSlug}/products`) && !pathname.includes('/products/'));
  const isOrders =
    pathname.startsWith(`/${storeSlug}/orders`);
  const isAccount =
    pathname.startsWith(`/${storeSlug}/account`);

  const navItems = [
    {
      id: 'home',
      label: 'HOME',
      href: `/${storeSlug}`,
      icon: Home,
      isActive: isHome,
    },
    {
      id: 'products',
      label: 'PRODUK',
      href: `/${storeSlug}/shop`,
      icon: Grid,
      isActive: isShop,
    },
    {
      id: 'orders',
      label: 'TRANSAKSI',
      href: `/${storeSlug}/orders`,
      icon: ClipboardList,
      isActive: isOrders,
    },
    {
      id: 'account',
      label: 'AKUN',
      href: `/${storeSlug}/account`,
      icon: User,
      isActive: isAccount,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-lg">
      <div className="mx-auto max-w-lg grid grid-cols-4 h-14 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                active
                  ? 'text-slate-950 font-extrabold'
                  : 'text-stone-400 hover:text-stone-600 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-950" />
                )}
              </div>
              <span className="text-[10px] tracking-wider mt-1 uppercase">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* iOS Safe Area Spacer */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
