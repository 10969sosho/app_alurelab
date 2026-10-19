'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  // Nonaktifkan Lenis di area dashboard dan admin agar native nested scrolling, mouse wheel, dan trackpad tidak terinterupsi
  const isDashboardOrAdmin = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin');

  useEffect(() => {
    if (isDashboardOrAdmin) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [isDashboardOrAdmin]);

  return <>{children}</>;
}
