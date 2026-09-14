import Link from 'next/link';
import { ArrowRight, Zap, ShieldCheck, Truck, CreditCard, Sparkles, Store, Cpu } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter">
              A
            </div>
            <span className="font-bold text-xl tracking-tight text-white">ALURELAB</span>
            <span className="text-xs font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
              v1.0 Production Blueprint
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Merchant Portal
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg transition-all"
            >
              Buka Toko 60 Detik
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Autonomous E-Commerce SaaS & Vibe Commerce Engine
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Toko Online Sub-Detik.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Escrow Xendit & Biteship Native.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          Infrastruktur e-commerce multi-tenant dengan isolasi kernel PostgreSQL RLS, proteksi overselling Redis Atomic Lock, dan konversi katalog instan dalam 60 detik.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Store className="w-5 h-5" />
            Mulai Onboarding Toko
          </Link>
          <Link
            href="/hijab-mevvah"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-6 py-3.5 rounded-xl font-medium transition-all"
          >
            Lihat Demo Storefront (Hijab Mevvah)
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Sub-300ms Storefront</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Next.js 15 Edge SSR dengan Instant 1-Page Checkout, memangkas cart abandonment hingga 40%.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Escrow Xendit XenPlatform</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              PJP Bank Indonesia Kategori 1 berlisensi dengan split fee 1.5% otomatis dan rekening penampung aman.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Biteship Multi-Kurir & Anti-RTS</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Auto-AWB resi, cetak thermal label PDF (100x150mm), serta proteksi COD 3-lapis dengan verifikasi OTP.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">PostgreSQL 16 Kernel RLS</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Isolasi data antar tenant terjamin di tingkat basis data, mencegah celah IDOR atau kebocoran data.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Redis Atomic Concurrency</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Zero-overselling pada flash sale berkekuatan tinggi menggunakan operasi in-memory atomic lock.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI Studio & Vibe Commerce</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Auto-generate copywriting persuasif & background removal produk kualitas studio foto profesional.
            </p>
          </div>
        </div>
      </section>

      {/* Blueprint Index */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Engineering Blueprint Dokumen</h2>
        <div className="space-y-3">
          {[
            { id: '00', title: 'Overview & Roadmap Pengerjaan', desc: '8 Sprint execution plan & Definition of Done' },
            { id: '01', title: 'Prerequisites & Legalitas Indonesia', desc: 'Regulasi PJP BI, NIB KBLI 63122, PSE Kominfo, vendor API' },
            { id: '02', title: 'System Architecture & Data Flow', desc: 'Multi-tenancy RLS, Custom Domain SSL, Order State Machine' },
            { id: '03', title: 'Payment & Shipping Integration', desc: 'Xendit XenPlatform, Biteship Auto-AWB, Anti-RTS COD Engine' },
            { id: '04', title: 'Security Program & Compliance', desc: 'Financial-grade security, append-only ledger, disaster recovery' },
            { id: '05', title: 'Database Schema & DDL Specification', desc: 'Full DDL PostgreSQL 16 + Row Level Security policies' },
          ].map((doc) => (
            <div key={doc.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">DOC-{doc.id}</span>
                <div>
                  <h4 className="text-sm font-semibold text-white">{doc.title}</h4>
                  <p className="text-xs text-slate-400">{doc.desc}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-500">Tersimpan di ALURELAB/docs/</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
