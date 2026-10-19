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

// Auto-recover dari Next.js ChunkLoadError setelah deployment baru
function ChunkErrorRecovery() {
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const errorMsg = 'message' in event ? event.message : (event as any)?.reason?.message || '';
      const errorName = (event as any)?.error?.name || (event as any)?.reason?.name || '';
      const isChunk =
        errorName === 'ChunkLoadError' ||
        errorMsg.includes('Loading chunk') ||
        errorMsg.includes('ChunkLoadError');

      if (isChunk) {
        const lastReload = sessionStorage.getItem('chunk_reload_ts');
        const now = Date.now();
        // Cegah loop reload jika ada masalah permanen: maksimal 1x per 10 detik
        if (!lastReload || now - Number(lastReload) > 10000) {
          sessionStorage.setItem('chunk_reload_ts', String(now));
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

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
      <ChunkErrorRecovery />
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
