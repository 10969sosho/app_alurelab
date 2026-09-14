'use client';

import { useSession } from 'next-auth/react';
import { Bell, Menu, Search } from 'lucide-react';

export function DashboardHeader() {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari produk, pesanan..."
            className="bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400 w-48"
          />
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          {/* Badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-emerald-700 text-sm font-semibold">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? 'M'}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-800 leading-tight">
              {session?.user?.name ?? 'Merchant'}
            </p>
            <p className="text-xs text-slate-400">
              {(session?.user as any)?.role ?? 'Owner'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
