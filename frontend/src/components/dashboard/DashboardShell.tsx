'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

/**
 * Shell dashboard: sidebar + header + konten.
 * Halaman full-screen (Theme Customizer) dirender tanpa sidebar/header.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullscreen = pathname === '/dashboard/cms/editor';

  if (fullscreen) {
    return <div className="h-screen overflow-hidden bg-[#F8F9FA] text-[#333333]">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA] text-[#333333]">
      {/* Sidebar (desktop) */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <DashboardHeader />

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
