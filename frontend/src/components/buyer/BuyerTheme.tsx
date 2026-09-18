'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, User } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useBuyerStore } from '@/store/buyer-store';
import { CmsSettings } from '@/components/templates/types';
import BuyerLoginModal from './BuyerLoginModal';

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  return hydrated;
}

const DEFAULT_NAV = [
  ['home', 'Home', ''],
  ['shop', 'Shop', '/shop'],
  ['cart', 'Cart', '/cart'],
  ['checkout', 'Checkout', '/checkout'],
  ['account', 'Account', '/account'],
] as const;

const BuyerThemeContext = createContext<CmsSettings>({});

export function BuyerThemeProvider({ settings, children }: { settings: CmsSettings; children: React.ReactNode }) {
  return <BuyerThemeContext.Provider value={settings}>{children}</BuyerThemeContext.Provider>;
}

export function useBuyerTheme(_storeSlug: string) {
  return useContext(BuyerThemeContext);
}

export function BuyerThemeFrame({ storeSlug, children, className = '' }: {
  storeSlug: string;
  children: React.ReactNode;
  className?: string;
}) {
  const settings = useBuyerTheme(storeSlug);
  const template = settings.template || 'modern';
  const branding = settings.branding || {};
  return <div data-buyer-template={template} className={`buyer-theme buyer-page min-h-screen ${className}`} style={{ backgroundColor: branding.backgroundColor, color: branding.textColor }}>
    {children}
  </div>;
}

export function BuyerNavbar({ storeSlug, storeName, onLogin }: { storeSlug: string; storeName?: string; onLogin?: () => void }) {
  const settings = useBuyerTheme(storeSlug);
  const { buyer } = useBuyerStore();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const hydrated = useHydrated();
  const [loginOpen, setLoginOpen] = useState(false);
  const branding = settings.branding || {};
  const cmsItems = settings.navigation?.menuItems || [];
  const labels = new Map(cmsItems.map((item) => [item.id, item.label]));
  const name = branding.storeName || storeName || storeSlug.replace(/-/g, ' ');
  const link = (path: string) => path.startsWith('#') ? `/${storeSlug}${path}` : path ? `/${storeSlug}${path}` : `/${storeSlug}`;

  return <>
    <header className="buyer-navbar sticky top-0 z-40 border-b px-4 py-3 backdrop-blur-xl sm:px-6 md:px-10">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <Link href={`/${storeSlug}`} className="shrink-0 text-base font-black uppercase tracking-tight">{name}</Link>
        <nav className="buyer-navbar-links flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto sm:gap-2">
          {DEFAULT_NAV.map(([id, label, path]) => <Link key={id} href={link(path)} className="whitespace-nowrap rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] opacity-70 hover:opacity-100 sm:px-4">{labels.get(id) || label}</Link>)}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {hydrated && buyer ? <Link href={`/${storeSlug}/account`} aria-label="Account"><User className="h-4 w-4" /></Link> : <button type="button" aria-label="Login" onClick={() => onLogin ? onLogin() : setLoginOpen(true)}><User className="h-4 w-4" /></button>}
          <Link href={`/${storeSlug}/cart`} className="flex items-center gap-1 rounded-full px-2 py-2 text-xs font-bold"><ShoppingBag className="h-4 w-4" />{hydrated ? totalItems : 0}</Link>
        </div>
      </div>
    </header>
    <BuyerLoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} storeSlug={storeSlug} storeName={name} />
  </>;
}

export function BuyerFooter({ storeSlug, storeName }: { storeSlug: string; storeName?: string }) {
  const settings = useBuyerTheme(storeSlug);
  const year = new Date().getFullYear();
  return <footer className="buyer-footer border-t px-4 py-8 text-center text-xs opacity-70 sm:px-6"><p>{settings.buyerCopy?.footerNote || 'Belanja aman dengan pembayaran dan pengiriman terpercaya.'}</p><p className="mt-2">© {year} {settings.branding?.storeName || storeName || storeSlug}</p></footer>;
}
