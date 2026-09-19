'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, Menu, X, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { useBuyerStore } from '@/store/buyer-store';
import { CmsSettings, NavMenuItem } from '@/components/templates/types';
import BuyerLoginModal from './BuyerLoginModal';

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  return hydrated;
}

const DEFAULT_NAV: NavMenuItem[] = [
  { id: 'home', label: 'Home', url: '/', enabled: true },
  { id: 'shop', label: 'Shop', url: '/shop', enabled: true },
];

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
  return (
    <div data-buyer-template={template} className={`buyer-theme buyer-page min-h-screen flex flex-col ${className}`} style={{ backgroundColor: branding.backgroundColor, color: branding.textColor }}>
      {children}
    </div>
  );
}

export function BuyerNavbar({ storeSlug, storeName, onLogin }: { storeSlug: string; storeName?: string; onLogin?: () => void }) {
  const settings = useBuyerTheme(storeSlug);
  const { buyer } = useBuyerStore();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const hydrated = useHydrated();
  
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const branding = settings.branding || {};
  const cmsItems = settings.navigation?.menuItems || [];
  const navItems = cmsItems.length > 0 ? cmsItems.filter(i => i.enabled) : DEFAULT_NAV;
  const desktopStyle = settings.navigation?.desktopStyle || 'inline';
  const name = branding.storeName || storeName || storeSlug.replace(/-/g, ' ');
  const primaryColor = branding.primaryColor || '#111111';

  const link = (path: string) => {
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `/${storeSlug}${path === '/' ? '' : path}`;
    return `/${storeSlug}/${path}`;
  };

  return (
    <>
      {/* Announcement Bar */}
      {settings.sections?.showAnnouncementBar && settings.highlights?.announcementText && (
        <div 
          className="w-full text-center py-2 px-4 text-xs font-semibold tracking-wide flex items-center justify-center animate-in slide-in-from-top-4"
          style={{ backgroundColor: primaryColor, color: '#fff' }}
        >
          <span>{settings.highlights.announcementText}</span>
        </div>
      )}

      {/* Main Navbar */}
      <header className="buyer-navbar sticky top-0 z-40 border-b border-black/10 backdrop-blur-xl bg-white/80 transition-all duration-300">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-10">
          
          {/* Mobile Menu Button & Logo */}
          <div className="flex items-center gap-3 md:w-1/3">
            <button 
              className={`p-1.5 -ml-1.5 text-black hover:opacity-70 transition-opacity ${desktopStyle === 'inline' ? 'md:hidden' : ''}`}
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href={`/${storeSlug}`} className="text-sm sm:text-base font-black uppercase tracking-tight text-black truncate max-w-[150px] sm:max-w-[200px]">
              {name}
            </Link>
          </div>

          {/* Desktop Navigation */}
          {desktopStyle === 'inline' && (
            <nav className="hidden md:flex flex-1 items-center justify-center gap-6 lg:gap-8">
              {navItems.map((item) => (
                <Link 
                  key={item.id} 
                  href={link(item.url)} 
                  className="text-[11px] font-bold uppercase tracking-[0.15em] text-black/70 hover:text-black transition-colors"
                  target={item.url.startsWith('http') ? '_blank' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right Icons */}
          <div className="flex shrink-0 items-center justify-end gap-3 sm:gap-4 md:w-1/3 text-black">
            {hydrated && buyer ? (
              <Link href={`/${storeSlug}/account`} aria-label="Account" className="hover:opacity-70 transition-opacity p-1">
                <User className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </Link>
            ) : (
              <button type="button" aria-label="Login" onClick={() => onLogin ? onLogin() : setLoginOpen(true)} className="hover:opacity-70 transition-opacity p-1">
                <User className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </button>
            )}
            <Link href={`/${storeSlug}/cart`} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity p-1">
              <ShoppingBag className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              <span className="text-[10px] sm:text-xs font-bold bg-black text-white w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
                {hydrated ? totalItems : 0}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="relative w-[85vw] max-w-[320px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-5 border-b border-black/10">
              <span className="font-black uppercase tracking-tight text-black text-sm">{name}</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-black/60 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="flex flex-col">
                {navItems.map((item) => (
                  <Link 
                    key={item.id} 
                    href={link(item.url)} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-6 py-4 text-sm font-bold uppercase tracking-[0.1em] text-black border-b border-black/5 hover:bg-black/5"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="p-6 border-t border-black/10 bg-slate-50">
              {hydrated && buyer ? (
                <Link 
                  href={`/${storeSlug}/account`} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full bg-black text-white py-3.5 text-xs font-bold uppercase tracking-[0.15em] rounded-xs"
                >
                  My Account
                </Link>
              ) : (
                <button 
                  onClick={() => { setMobileMenuOpen(false); if (onLogin) onLogin(); else setLoginOpen(true); }}
                  className="flex items-center justify-center w-full bg-black text-white py-3.5 text-xs font-bold uppercase tracking-[0.15em] rounded-xs"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <BuyerLoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} storeSlug={storeSlug} storeName={name} />
    </>
  );
}

export function BuyerFooter({ storeSlug, storeName }: { storeSlug: string; storeName?: string }) {
  const settings = useBuyerTheme(storeSlug);
  const branding = settings.branding || {};
  const social = settings.navigation?.socialLinks || {};
  const primaryColor = branding.primaryColor || '#111111';
  const name = branding.storeName || storeName || storeSlug;
  const year = new Date().getFullYear();

  return (
    <footer className="buyer-footer mt-auto border-t border-black/10 bg-white pt-12 pb-8 px-5 sm:px-10 text-center sm:text-left">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
        
        {/* Brand & Note */}
        <div className="max-w-xs space-y-4">
          <div className="text-xl font-black uppercase tracking-tight text-black">{name}</div>
          <p className="text-xs text-black/60 leading-relaxed">
            {settings.buyerCopy?.footerNote || 'Belanja aman dengan pembayaran dan pengiriman terpercaya.'}
          </p>
        </div>
        
        {/* Social Links */}
        {(social.instagram || social.tiktok || social.whatsapp) && (
          <div className="space-y-3 text-center md:text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black">Follow Us</div>
            <div className="flex items-center justify-center md:justify-end gap-4">
              {social.instagram && <a href={social.instagram} target="_blank" rel="noreferrer" className="text-black/60 hover:text-black text-xs font-bold uppercase tracking-wider">Instagram</a>}
              {social.tiktok && <a href={social.tiktok} target="_blank" rel="noreferrer" className="text-black/60 hover:text-black text-xs font-bold uppercase tracking-wider">TikTok</a>}
              {social.whatsapp && <a href={social.whatsapp} target="_blank" rel="noreferrer" className="text-black/60 hover:text-black text-xs font-bold uppercase tracking-wider">WhatsApp</a>}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.1em] text-black/40">
        <p>© {year} {name}. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-black">Terms</a>
          <a href="#" className="hover:text-black">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
