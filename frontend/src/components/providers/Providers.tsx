'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import LenisProvider from './LenisProvider';
import { STORE_SLUG_KEY } from '@/lib/api';

// Sinkron X-Store-Slug dari session (Google OAuth tidak melewati login page)
function StoreSlugSync() {
  const { data: session } = useSession();

  useEffect(() => {
    const slug = (session as any)?.store?.slug;
    if (slug) localStorage.setItem(STORE_SLUG_KEY, slug);
  }, [(session as any)?.store?.slug]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:            60 * 1000, // 1 menit
            retry:                1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <StoreSlugSync />
      <QueryClientProvider client={queryClient}>
        <LenisProvider>
          {children}
        </LenisProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
