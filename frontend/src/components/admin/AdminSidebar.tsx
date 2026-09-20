'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Store,
  Users,
  ShoppingBag,
  BarChart3,
  Settings,
  Shield,
} from 'lucide-react';

const navItems = [
  { href: '/admin',          label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { href: '/admin/sellers',  label: 'Sellers',    icon: Store },
  { href: '/admin/buyers',   label: 'Buyers',     icon: Users },
  { href: '/admin/orders',   label: 'Orders',     icon: ShoppingBag },
  { href: '/admin/analytics',label: 'Analytics',  icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings',   icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="flex flex-col w-56 bg-charcoal-900 text-slate-300 shrink-0">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-7 h-7 bg-lime-accent rounded flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-charcoal-900" />
        </div>
        <div>
          <p className="text-white font-bold text-xs tracking-wider uppercase">AlureLab</p>
          <p className="text-slate-500 text-[10px]">Super Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                active
                  ? 'bg-lime-accent text-charcoal-900'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </aside>
  );
}
