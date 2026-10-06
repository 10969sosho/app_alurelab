'use client';

import { useState, useMemo, useEffect } from 'react';
import MobileStorefrontHome from '@/components/buyer/MobileStorefrontHome';
import BuyerLoginModal from '@/components/buyer/BuyerLoginModal';
import { StoreData } from '@/components/templates/types';

export default function StorefrontClient({
  storeSlug,
  initialStore,
}: {
  storeSlug: string;
  initialStore: StoreData;
  queryTemplate?: string;
}) {
  const [store, setStore] = useState<StoreData>(initialStore);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    setStore(initialStore);
  }, [initialStore]);

  const effectiveSettings = useMemo(() => store.settings || {}, [store.settings]);

  const effectiveStore: StoreData = useMemo(() => {
    return {
      ...store,
      storeName: effectiveSettings.branding?.storeName || store.storeName,
      tagline: effectiveSettings.branding?.tagline || store.tagline,
      settings: effectiveSettings,
    };
  }, [store, effectiveSettings]);

  return (
    <>
      {/* 1 Universal Modern Storefront Template */}
      <MobileStorefrontHome storeSlug={storeSlug} store={effectiveStore} />

      {/* Buyer Authentication / Profile Modal */}
      <BuyerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        storeSlug={storeSlug}
        storeName={effectiveStore.storeName}
      />
    </>
  );
}
