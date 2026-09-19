'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MessageCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import BuyerChatModal from './BuyerChatModal';

interface BuyerTopBarProps {
  storeSlug: string;
  storeName?: string;
  phoneNumber?: string;
  initialQuery?: string;
  placeholder?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  productTitleForChat?: string;
}

export default function BuyerTopBar({
  storeSlug,
  storeName,
  phoneNumber,
  initialQuery = '',
  placeholder = 'Cari produk di toko ini...',
  showBackButton = false,
  onBack,
  productTitleForChat,
}: BuyerTopBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const totalItems = useCartStore((state) => state.getTotalItems());
  const displayName = storeName || storeSlug.replace(/-/g, ' ');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/${storeSlug}/shop?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(`/${storeSlug}/shop`);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-shadow duration-200 shadow-xs">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 h-14 flex items-center gap-2 sm:gap-3">
          {/* Optional Back Button */}
          {showBackButton && (
            <button
              onClick={handleBack}
              className="p-2 -ml-1 text-slate-700 hover:text-slate-900 rounded-full hover:bg-stone-100 transition-colors shrink-0"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 relative flex items-center min-w-0"
          >
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full h-10 pl-9 pr-3 rounded-full bg-stone-100/90 hover:bg-stone-100 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 border border-transparent focus:border-slate-400 focus:outline-none transition-all"
            />
          </form>

          {/* Chat Icon Button */}
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="relative p-2 text-slate-700 hover:text-emerald-600 rounded-full hover:bg-stone-100 transition-colors shrink-0"
            aria-label="Chat Seller"
            title="Chat Toko"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          {/* Cart Icon Button */}
          <Link
            href={`/${storeSlug}/cart`}
            className="relative p-2 text-slate-700 hover:text-slate-900 rounded-full hover:bg-stone-100 transition-colors shrink-0"
            aria-label="Keranjang Belanja"
            title="Keranjang"
          >
            <ShoppingBag className="w-5 h-5" />
            {hydrated && totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Seller Chat Modal */}
      <BuyerChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        storeName={displayName}
        phoneNumber={phoneNumber}
        productTitle={productTitleForChat}
      />
    </>
  );
}
