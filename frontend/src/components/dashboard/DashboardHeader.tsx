'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bell, ExternalLink } from 'lucide-react';

const pageTitles: [string, string][] = [
  ['/products/new', 'Tambah Produk Baru'],
  ['/products', 'Produk Saya'],
  ['/categories', 'Master Kategori'],
  ['/cms', 'Tampilan Toko'],
  ['/orders', 'Pesanan Saya'],
  ['/promotions', 'Pusat Promosi'],
  ['/customers', 'Pelanggan & Member'],
  ['/inbox', 'Pesan Pembeli'],
  ['/finance', 'Saldo Escrow & Kas'],
  ['/analytics', 'Analisis Bisnis'],
  ['/settings', 'Pengaturan Toko'],
  ['/subscription', 'Paket Langganan'],
  ['/shipping', 'Pengiriman'],
];

export function DashboardHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const store = (session as any)?.store;
  const title = pageTitles.find(([path]) => pathname.startsWith(`/dashboard${path}`))?.[1] ?? 'Ringkasan Beranda';
  const displayName = session?.user?.name || store?.name || 'Seller';

  return (
    <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/60 bg-white px-5 sm:px-6">
      <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
      <div className="flex items-center gap-2 sm:gap-3">
        {store?.slug && (
          <Link
            href={`/${store.slug}`}
            target="_blank"
            className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:flex"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Lihat Toko
          </Link>
        )}
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full border border-slate-900 bg-[#C8FF3D]" />
        </button>
        <div
          title={displayName}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] text-xs font-bold text-[#C8FF3D]"
        >
          {displayName.trim().charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
