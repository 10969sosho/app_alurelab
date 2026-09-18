'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

export function DashboardHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const store = (session as any)?.store;

  const getBreadcrumbTitle = () => {
    if (pathname.includes('/products/new')) return 'Tambah Produk Baru';
    if (pathname.includes('/products')) return 'Produk Saya';
    if (pathname.includes('/cms')) return 'Tampilan Toko (CMS)';
    if (pathname.includes('/categories')) return 'Master Kategori';
    if (pathname.includes('/orders')) return 'Pesanan Saya';
    if (pathname.includes('/promotions')) return 'Pusat Promosi';
    if (pathname.includes('/customers')) return 'Pelanggan & Member';
    if (pathname.includes('/finance')) return 'Saldo Escrow & Kas';
    if (pathname.includes('/analytics')) return 'Analisis Bisnis';
    if (pathname.includes('/settings')) return 'Pengaturan Toko';
    return 'Dashboard';
  };

  const currentTitle = getBreadcrumbTitle();
  const displayName = session?.user?.name || store?.name || 'Seller';

  return (
    <header className="h-12 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-20">
      {/* Left: Store Icon + Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded-xs bg-[#EE4D2D] text-white flex items-center justify-center shadow-xs group-hover:opacity-95 transition-opacity">
            <ShoppingBag className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
        </Link>

        {/* Breadcrumb text */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-normal select-none">
          <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
            Beranda
          </Link>
          <span className="text-slate-300">&gt;</span>
          <span className="text-slate-800 font-medium">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Right: Quick Tools, Notification & Profile */}
      <div className="flex items-center gap-4">
        {/* Link to live storefront */}
        {store?.slug && (
          <Link
            href={`/${store.slug}`}
            target="_blank"
            className="hidden md:flex items-center gap-1 text-xs text-slate-600 hover:text-[#EE4D2D] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Lihat Toko</span>
          </Link>
        )}

        {/* User profile pill */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-6 h-6 rounded-full bg-orange-100 text-[#EE4D2D] flex items-center justify-center font-bold text-xs border border-orange-200/80">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-slate-700 max-w-[120px] truncate hidden sm:inline">
            {displayName.toLowerCase().replace(/\s+/g, '')}
          </span>
        </div>
      </div>
    </header>
  );
}
