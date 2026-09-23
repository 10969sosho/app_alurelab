import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, ShieldCheck, Truck, CreditCard, Sparkles, Store, Cpu } from 'lucide-react';
import HeroVisual3D from '@/components/hero/HeroVisual3D';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-offwhite text-charcoal-900 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-grid-lines opacity-[0.65]" />
      <div className="absolute inset-0 z-0 pointer-events-none subtle-radial-gradient" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[350px] bg-gradient-to-b from-cloud/40 via-lime-accent/[0.04] to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-lime-accent to-transparent opacity-40"></div>

      {/* Header */}
      <header className="relative z-50 pt-8 pb-4 px-6 md:px-12 w-full max-w-[1400px] mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center">
          {/* Logo representation - 3x prominent scale */}
          <div className="relative h-16 sm:h-20 md:h-24 w-44 sm:w-56 md:w-64">
            <Image 
              src="/logo.png" 
              alt="AlureLab" 
              fill 
              priority
              className="object-contain object-left mix-blend-multiply"
            />
          </div>
        </Link>
        
        <div className="flex items-center gap-6">
          <a
            href="#features"
            className="text-[13px] font-medium text-darkgray hover:text-charcoal-900 transition-colors hidden sm:block tracking-wide"
          >
            FITUR
          </a>
          <a
            href="#security"
            className="text-[13px] font-medium text-darkgray hover:text-charcoal-900 transition-colors hidden sm:block tracking-wide"
          >
            SECURITY
          </a>
          <Link
            href="/dashboard"
            className="text-[13px] font-medium text-darkgray hover:text-charcoal-900 transition-colors hidden sm:block tracking-wide"
          >
            MERCHANT PORTAL
          </Link>
          <Link
            href="/onboarding"
            className="btn-primary text-[13px] tracking-wide px-5 py-2.5"
          >
            Buka Toko 60 Detik
            <ArrowRight className="w-4 h-4 ml-1.5 opacity-70" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-36 px-6 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Interactive 3D Three.js Visual Background */}
        <HeroVisual3D />

        {/* Precision Vector Curves & Technical Arc Accents */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[480px] bg-gradient-to-b from-lime-accent/[0.08] via-cloud/20 to-transparent blur-3xl rounded-full pointer-events-none" />

          {/* SVG Precision Curves & Tech Arcs */}
          <svg
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-full min-h-[620px] opacity-75"
            viewBox="0 0 1400 680"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="heroCurve1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C7CDD3" stopOpacity="0.1" />
                <stop offset="45%" stopColor="#9FA4A8" stopOpacity="0.4" />
                <stop offset="80%" stopColor="#C8FF3D" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#C7CDD3" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="heroCurve2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C7CDD3" stopOpacity="0" />
                <stop offset="35%" stopColor="#D4D4D0" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#C7CDD3" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Signature Sweeping Curves (Wave Arcs) */}
            <path
              d="M -80 340 C 320 140, 720 520, 1480 260"
              stroke="url(#heroCurve1)"
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M -40 370 C 360 170, 760 550, 1520 290"
              stroke="url(#heroCurve2)"
              strokeWidth="0.85"
              strokeDasharray="4 6"
              fill="none"
              opacity="0.6"
            />

            {/* Concentric Precision Orbital Arcs */}
            <circle cx="700" cy="340" r="320" stroke="#E2E2DE" strokeWidth="0.75" strokeDasharray="3 9" />
            <circle cx="700" cy="340" r="480" stroke="#E8E8E8" strokeWidth="1" opacity="0.65" />
            <circle cx="700" cy="340" r="620" stroke="#EDEDEA" strokeWidth="0.75" strokeDasharray="6 12" />

            {/* Asymmetric Technical Diagonal Arcs */}
            <path
              d="M 120 620 A 540 540 0 0 1 1180 120"
              stroke="#DCDCD8"
              strokeWidth="0.9"
              fill="none"
            />
            <path
              d="M 210 650 A 540 540 0 0 1 1270 150"
              stroke="#E8E8E8"
              strokeWidth="0.65"
              strokeDasharray="2 8"
              fill="none"
            />

            {/* Precision Crosshair (+) Markers */}
            <g stroke="#9FA4A8" strokeWidth="1" opacity="0.55">
              <path d="M 240 220 L 252 220 M 246 214 L 246 226" />
              <path d="M 1160 220 L 1172 220 M 1166 214 L 1166 226" />
              <path d="M 700 80 L 700 92 M 694 86 L 706 86" />
              <path d="M 700 600 L 700 612 M 694 606 L 706 606" />
              <path d="M 380 480 L 392 480 M 386 474 L 386 486" />
              <path d="M 1020 480 L 1032 480 M 1026 474 L 1026 486" />
            </g>

            {/* Micro Technical Coordinate Labels */}
            <text x="260" y="224" fill="#9FA4A8" fontSize="9" fontFamily="monospace" letterSpacing="0.18em" opacity="0.7">SEC_01 // 300MS</text>
            <text x="1040" y="484" fill="#9FA4A8" fontSize="9" fontFamily="monospace" letterSpacing="0.18em" opacity="0.7">RLS_KERNEL // ISOLATED</text>

            {/* Glowing Lime Indicator Nodes */}
            <circle cx="246" cy="220" r="2.5" fill="#C8FF3D" filter="drop-shadow(0 0 4px #C8FF3D)" />
            <circle cx="1166" cy="220" r="2.5" fill="#C8FF3D" filter="drop-shadow(0 0 4px #C8FF3D)" />
            <circle cx="700" cy="86" r="2" fill="#111111" />
          </svg>

          {/* Framing Hairline Grid Lines */}
          <div className="w-full h-full max-w-[1240px] mx-auto border-x border-cloud/40 flex justify-between pointer-events-none">
            <div className="w-px h-full bg-cloud/25 hidden md:block" style={{ marginLeft: '25%' }} />
            <div className="w-px h-full bg-cloud/25 hidden md:block" style={{ marginRight: '25%' }} />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cloud bg-white/80 backdrop-blur-sm text-darkgray text-xs font-mono mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-accent shadow-lime-glow animate-pulse"></span>
            <Sparkles className="w-3.5 h-3.5 text-charcoal-900" />
            Autonomous E-Commerce SaaS & Vibe Commerce Engine
          </div>

          <h1 className="display-text text-charcoal-900 mb-6 text-balance">
            Toko Online Sub-Detik.<br />
            <span className="text-darkgray font-medium">
              Escrow Xendit & Biteship Native.
            </span>
          </h1>

          <p className="body-text max-w-3xl mx-auto mb-12 text-balance">
            Infrastruktur e-commerce multi-tenant dengan isolasi kernel PostgreSQL RLS, proteksi overselling Redis Atomic Lock, dan konversi katalog instan dalam 60 detik.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="btn-primary px-8 py-3.5"
            >
              <Store className="w-4 h-4 mr-2 opacity-80" />
              Mulai Onboarding Toko
              <ArrowRight className="w-4 h-4 ml-2 opacity-70" />
            </Link>
            <Link
              href="/hijab-mevvah"
              className="btn-secondary px-8 py-3.5"
            >
              Lihat Demo Storefront (Hijab Mevvah)
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-cloud scroll-mt-20">
        <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-4">
          <div>
            <h2 className="h2-text text-charcoal-900 mb-2">Core Capabilities</h2>
            <p className="body-text text-sm max-w-md">Arsitektur teruji untuk kecepatan, keamanan perbankan, dan reliabilitas skala enterprise.</p>
          </div>
          <span className="micro-label border border-cloud px-3 py-1.5 rounded-full bg-white">Production Specs</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-cloud">
          {/* 1 */}
          <div className="bg-offwhite p-10 hover:bg-white transition-colors duration-500 relative group">
            <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-lime-accent opacity-0 group-hover:opacity-100 transition-opacity shadow-lime-glow"></div>
            <div className="w-12 h-12 rounded-full border border-cloud flex items-center justify-center mb-6 text-charcoal-900 bg-white shadow-soft">
              <Zap className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">Sub-300ms Storefront</h3>
            <p className="body-text text-sm">
              Next.js 15 Edge SSR dengan Instant 1-Page Checkout, memangkas cart abandonment hingga 40%.
            </p>
          </div>

          {/* 2 */}
          <div className="bg-offwhite p-10 hover:bg-white transition-colors duration-500 relative group">
            <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-lime-accent opacity-0 group-hover:opacity-100 transition-opacity shadow-lime-glow"></div>
            <div className="w-12 h-12 rounded-full border border-cloud flex items-center justify-center mb-6 text-charcoal-900 bg-white shadow-soft">
              <CreditCard className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">Escrow Xendit XenPlatform</h3>
            <p className="body-text text-sm">
              PJP Bank Indonesia Kategori 1 berlisensi dengan split fee 1.5% otomatis dan rekening penampung aman.
            </p>
          </div>

          {/* 3 */}
          <div className="bg-offwhite p-10 hover:bg-white transition-colors duration-500 relative group">
            <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-lime-accent opacity-0 group-hover:opacity-100 transition-opacity shadow-lime-glow"></div>
            <div className="w-12 h-12 rounded-full border border-cloud flex items-center justify-center mb-6 text-charcoal-900 bg-white shadow-soft">
              <Truck className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">Biteship Multi-Kurir & Anti-RTS</h3>
            <p className="body-text text-sm">
              Auto-AWB resi, cetak thermal label PDF (100x150mm), serta proteksi COD 3-lapis dengan verifikasi OTP.
            </p>
          </div>

          {/* 4 */}
          <div id="security" className="bg-offwhite p-10 hover:bg-white transition-colors duration-500 relative group scroll-mt-24">
            <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-lime-accent opacity-0 group-hover:opacity-100 transition-opacity shadow-lime-glow"></div>
            <div className="w-12 h-12 rounded-full border border-cloud flex items-center justify-center mb-6 text-charcoal-900 bg-white shadow-soft">
              <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">PostgreSQL 16 Kernel RLS</h3>
            <p className="body-text text-sm">
              Isolasi data antar tenant terjamin di tingkat basis data, mencegah celah IDOR atau kebocoran data.
            </p>
          </div>

          {/* 5 */}
          <div className="bg-offwhite p-10 hover:bg-white transition-colors duration-500 relative group">
            <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-lime-accent opacity-0 group-hover:opacity-100 transition-opacity shadow-lime-glow"></div>
            <div className="w-12 h-12 rounded-full border border-cloud flex items-center justify-center mb-6 text-charcoal-900 bg-white shadow-soft">
              <Cpu className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">Redis Atomic Concurrency</h3>
            <p className="body-text text-sm">
              Zero-overselling pada flash sale berkekuatan tinggi menggunakan operasi in-memory atomic lock.
            </p>
          </div>

          {/* 6 */}
          <div className="bg-offwhite p-10 hover:bg-white transition-colors duration-500 relative group">
            <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-lime-accent opacity-0 group-hover:opacity-100 transition-opacity shadow-lime-glow"></div>
            <div className="w-12 h-12 rounded-full border border-cloud flex items-center justify-center mb-6 text-charcoal-900 bg-white shadow-soft">
              <Sparkles className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal-900 mb-2">AI Studio & Vibe Commerce</h3>
            <p className="body-text text-sm">
              Auto-generate copywriting persuasif & background removal produk kualitas studio foto profesional.
            </p>
          </div>
        </div>
      </section>

      {/* Blueprint Index */}
      <section className="relative z-10 py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="micro-label text-darkgray mb-2 block">DOKUMENTASI ARSITEKTUR</span>
          <h2 className="h2-text text-charcoal-900">Engineering Blueprint Dokumen</h2>
        </div>
        <div className="space-y-3">
          {[
            { id: '00', title: 'Overview & Roadmap Pengerjaan', desc: '8 Sprint execution plan & Definition of Done' },
            { id: '01', title: 'Prerequisites & Legalitas Indonesia', desc: 'Regulasi PJP BI, NIB KBLI 63122, PSE Kominfo, vendor API' },
            { id: '02', title: 'System Architecture & Data Flow', desc: 'Multi-tenancy RLS, Custom Domain SSL, Order State Machine' },
            { id: '03', title: 'Payment & Shipping Integration', desc: 'Xendit XenPlatform, Biteship Auto-AWB, Anti-RTS COD Engine' },
            { id: '04', title: 'Security Program & Compliance', desc: 'Financial-grade security, append-only ledger, disaster recovery' },
            { id: '05', title: 'Database Schema & DDL Specification', desc: 'Full DDL PostgreSQL 16 + Row Level Security policies' },
          ].map((doc) => (
            <div key={doc.id} className="p-5 rounded-lg bg-white border border-cloud flex items-center justify-between hover:border-darkgray transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-charcoal-900 bg-offwhite border border-cloud px-2.5 py-1 rounded">DOC-{doc.id}</span>
                <div>
                  <h4 className="text-sm font-semibold text-charcoal-900">{doc.title}</h4>
                  <p className="text-xs text-darkgray">{doc.desc}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-mediumgray hidden sm:inline">ALURELAB/docs/</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 pt-24 pb-16 px-6 max-w-7xl mx-auto border-t border-cloud flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center">
          <div className="relative h-10 w-28">
            <Image 
              src="/logo.png" 
              alt="AlureLab" 
              fill 
              className="object-contain object-left mix-blend-multiply opacity-80"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-xs text-darkgray">
          <span className="micro-label">© 2026 ALURELAB</span>
          <span className="w-1 h-1 rounded-full bg-cloud"></span>
          <a href="#features" className="micro-label hover:text-charcoal-900 transition-colors">Fitur</a>
          <a href="#security" className="micro-label hover:text-charcoal-900 transition-colors">Security</a>
          <Link href="/login" className="micro-label hover:text-charcoal-900 transition-colors">Portal</Link>
          <Link href="/register" className="micro-label hover:text-charcoal-900 transition-colors">Daftar</Link>
          <Link href="/onboarding" className="micro-label hover:text-charcoal-900 transition-colors">Onboarding</Link>
        </div>
      </footer>
    </main>
  );
}
