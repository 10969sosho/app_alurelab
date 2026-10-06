'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';

interface BuyerBottomNavProps {
  storeSlug: string;
}

export default function BuyerBottomNav({ storeSlug }: BuyerBottomNavProps) {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.getTotalItems());

  const isHome =
    pathname === `/${storeSlug}` || pathname === `/${storeSlug}/`;
  const isShop =
    pathname.startsWith(`/${storeSlug}/shop`) ||
    (pathname.startsWith(`/${storeSlug}/products`) && !pathname.includes('/products/'));
  const isCart = pathname.startsWith(`/${storeSlug}/cart`);
  const isAccount =
    pathname.startsWith(`/${storeSlug}/account`) ||
    pathname.startsWith(`/${storeSlug}/orders`);

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      href: `/${storeSlug}`,
      icon: Home,
      isActive: isHome,
    },
    {
      id: 'products',
      label: 'Katalog',
      href: `/${storeSlug}/shop`,
      icon: Compass,
      isActive: isShop,
    },
    {
      id: 'cart',
      label: 'Keranjang',
      href: `/${storeSlug}/cart`,
      icon: ShoppingBag,
      isActive: isCart,
      badge: totalItems > 0 ? totalItems : undefined,
    },
    {
      id: 'account',
      label: 'Akun',
      href: `/${storeSlug}/account`,
      icon: User,
      isActive: isAccount,
    },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none md:hidden">
      <nav className="pointer-events-auto bg-neutral-900/95 text-white backdrop-blur-lg border border-white/10 shadow-2xl rounded-full px-5 py-2.5 flex items-center gap-7">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative flex flex-col items-center justify-center transition-all ${
                active ? 'text-white scale-105' : 'text-neutral-400 hover:text-white'
              }`}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-neutral-900">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] mt-0.5 tracking-tight font-medium ${active ? 'text-white font-bold' : 'text-neutral-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
