import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ALURELAB - Autonomous E-Commerce SaaS & Vibe Commerce',
  description: 'Bangun toko online sub-detik bertenaga AI dengan integrasi Escrow Xendit & Biteship Logistics se-Indonesia.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

