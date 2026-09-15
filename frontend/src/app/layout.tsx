import type { Metadata } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

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
      <body className={`${inter.className} ${bebasNeue.variable} ${inter.variable} min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

