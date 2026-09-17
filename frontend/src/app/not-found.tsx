import Link from 'next/link';
import { ArrowLeft, Store, Sparkles, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter">
              A
            </div>
            <span className="font-bold text-xl tracking-tight text-white">ALURELAB</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Merchant Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero 404 */}
      <section className="py-24 px-6 max-w-2xl mx-auto text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono mb-8">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          404 NOT FOUND • TOKO TIDAK TERDAFTAR
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
          Toko Tidak Ditemukan
        </h1>

        <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed max-w-lg">
          Alamat toko yang Anda tuju tidak terdaftar di sistem platform ALURELAB atau tautan yang Anda buka mungkin keliru.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-5 py-3 rounded-xl font-medium text-sm transition-all"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>

          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            <Store className="w-4 h-4" />
            Buka Toko Sendiri (60 Detik)
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 font-mono">
        ALURELAB Autonomous E-Commerce Platform • Error 404
      </footer>
    </main>
  );
}
