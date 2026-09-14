# 🗺️ 00: OVERVIEW & ROADMAP PENGERJAAN
### *Dari Nol (Ground Zero) Sampai Live Production Skala Penuh*

---

## 1. Executive Summary & Sasaran Proyek

ALURELAB dirancang sebagai platform **SaaS E-Commerce AI-Native Multi-Tenant** yang mengotomatisasi pembuatan toko online profesional dalam 60 detik bagi pedagang online di Indonesia.

### Kriteria Keberhasilan Produksi (Production Acceptance Criteria):
1. **Kecepatan Storefront**: Time to First Byte (TTFB) < 300ms, Google Lighthouse Performance Score > 90 di perangkat seluler.
2. **Setup Toko**: Calon merchant dapat mengonversi tautan katalog media sosial (Instagram/TikTok) menjadi toko aktif siap menerima pembayaran dalam < 60 detik.
3. **Pembayaran & Logistik**: Integrasi native QRIS dinamis, Virtual Account 4 bank besar (BCA, Mandiri, BRI, BNI), opsi COD terverifikasi, dan auto-generate resi multi-kurir (Biteship).
4. **Isolasi Data Mutlak**: Zero-leakage antar tenant menggunakan PostgreSQL Row Level Security (RLS).
5. **Stabilitas Stok**: Zero-overselling (tidak ada penjualan melebihi stok fisik) saat flash sale berkat Redis Atomic Locks.

---

## 2. Arsitektur Komponen & Pembagian Layer

```
[ BROWSER / BUYER ]          [ MERCHANT DASHBOARD ]
        │                             │
        ▼                             ▼
┌────────────────────────────────────────────────────────┐
│ CLOUDFLARE EDGE (DNS, DDoS Protection, SSL for SaaS)   │
└────────────────────────┬───────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
┌────────────────────────┐      ┌────────────────────────┐
│ NEXT.JS 15 STOREFRONT  │      │ NEXT.JS 15 DASHBOARD   │
│ (Edge SSR / ISR)       │      │ (App Router + Auth)    │
└───────────┬────────────┘      └───────────┬────────────┘
            │                               │
            └───────────────┬───────────────┘
                            │ REST API / Sanctum Tokens
                            ▼
┌────────────────────────────────────────────────────────┐
│ LARAVEL 11 CORE ENGINE (Modular Monolith)              │
│ ├── Tenant Identification Middleware                   │
│ ├── Order & Checkout State Machine                     │
│ ├── Inventory Concurrency Manager                      │
│ └── Webhook Event Dispatcher                           │
└───────────┬───────────────────────────────┬────────────┘
            │                               │
    ┌───────┴────────┐             ┌────────┴────────┐
    ▼                ▼             ▼                 ▼
┌──────────────┐ ┌─────────┐ ┌───────────────┐ ┌────────────────┐
│ POSTGRESQL 16│ │ REDIS 7 │ │ THIRD-PARTY   │ │ AI PIPELINE    │
│ (RLS Multi-  │ │ (Queue  │ │ • Xendit PJP  │ │ • OpenAI       │
│  Tenant DB)  │ │  & Lock)│ │ • Biteship    │ │ • Replicate    │
└──────────────┘ └─────────┘ └───────────────┘ └────────────────┘
```

---

## 3. Tahapan & Roadmap Pengerjaan (8 Sprint / 16 Pekan)

Roadmap disusun dalam siklus sprint 2 mingguan:

### SPRINT 1: Fondasi Arsitektur, Multi-Tenancy & Database (SELESAI & LIVE)
- [x] Inisialisasi Repository Monorepo (Frontend: Next.js 15, Backend: Laravel 11).
- [x] Setup PostgreSQL dengan ekstensi UUID dan integrasi Row-Level Security (RLS).
- [x] Implementasi Middleware Tenant Resolution di Laravel (`IdentifyTenant`) berbasis domain, subdomain, dan header `X-Store-Slug`.
- [x] Sistem Autentikasi Multi-Role: Merchant (NextAuth v5 + Sanctum) dan Pembeli (Sanctum One-Click Phone Auth).
- [x] Isolasi tenant PostgreSQL RLS context aktif pada semua transaksi database.

### SPRINT 2: Katalog Produk, Varian & Dynamic Store Seeding (SELESAI & LIVE)
- [x] Manajemen Produk (CRUD produk, kategori, varian multi-level: warna, ukuran, SKU, harga, stok).
- [x] Instant store generator pada wizard onboarding 60 detik (`/onboarding`).
- [x] Dynamic product fetching real-time dari PostgreSQL pada storefront publik.
- [ ] Pipeline integrasi AI Photo Studio (RMBG-2.0 via Replicate): background removal dan mockup studio otomatis.

### SPRINT 3: Storefront Frontend Sub-Detik, Buyer Auth & Fast Checkout (SELESAI & LIVE)
- [x] Next.js 15 Storefront ultra-cepat: dynamic routing `/[store_slug]`, SSR & client interactivity.
- [x] Tema visual toko mobile-first responsif dengan sticky navigation dan drawer slide-over.
- [x] Halaman 1-Page Fast Checkout (`/[store_slug]/checkout`) dengan progress indicator 4-langkah.
- [x] Otentikasi Pembeli One-Click WhatsApp/No. HP tanpa password via drawer "Akun Saya".
- [x] Penyimpanan riwayat pesanan toko real & auto-fill otomatis formulir checkout dari profil pembeli aktif.
- [x] Keranjang belanja lokal via Zustand `useCartStore` sinkronisasi varian.

### SPRINT 4: Integrasi Pembayaran & Escrow Xendit (TAHAP IMPLEMENTASI AKTIF)
- [x] Desain skema relasi pembayaran (`payments`, `wallet_txs`) dan state machine order escrow.
- [x] UI pilihan metode pembayaran: QRIS, Virtual Account bank besar, dan COD dengan proteksi Anti-RTS.
- [x] Mock invoice viewer terintegrasi (`/mock/xendit-invoice/[id]`) untuk simulasi checkout end-to-end tanpa kredensial live.
- [ ] Integrasi Xendit XenPlatform Live API & webhook signature validation.
- [ ] Dompet Saldo Merchant & auto-withdrawal ke rekening bank merchant.

### SPRINT 5: Integrasi Logistik Biteship & COD Protection (TAHAP IMPLEMENTASI AKTIF)
- [x] Standardisasi Biteship Area ID pada formulir alamat pengiriman storefront & checkout.
- [x] UI kalkulasi dan pemilihan layanan kurir (SiCepat, J&T, JNE).
- [x] Anti-RTS Risk Scoring formula & field pada profil pembeli (`customers.risk_score`).
- [ ] Live Biteship API rate checking, auto-booking resi (AWB), dan cetak PDF thermal label (100x150mm).

### SPRINT 6: WhatsApp Automation & Abandoned Cart Recovery (BACKLOG)
- [ ] Integrasi WhatsApp Gateway (Fonnte / Wablas API) untuk notifikasi nomor resi & link tracking ke pembeli.
- [ ] Autonomous Cart Recovery: follow-up otomatis ke pembeli yang meninggalkan keranjang.
- [ ] Tracking Pixel: integrasi Meta Pixel dan TikTok Events API.

### SPRINT 7: Custom Domain & Merchant Billing (BACKLOG)
- [ ] Cloudflare for SaaS API: CNAME dan SSL otomatis untuk domain custom merchant.
- [ ] Subscription Billing Engine (Starter, Pro, Business).
- [ ] Program Afiliasi Berulang (Recurring Affiliate 20%).

### SPRINT 8: Production Deployment & Dual-Routing Optimization (SELESAI & LIVE)
- [x] Deployment live ke server production `emerald.hidden-server.net:31988` (`app.alurelab.com`).
- [x] Arsitektur Dual-Routing LiteSpeed `.htaccess`: isolasi `/api/v1/*` ke PHP-FPM dan semua route lainnya ke Next.js port 3040.
- [x] Daemon PM2 `alurelab-frontend` running stable.
- [x] NextAuth v5 Trusted Host fix (`AUTH_TRUST_HOST=true`).
- [x] Seed demo toko aktif: Kalmora Official (`kalmora`), Hijab Mevvah (`hijab-mevvah`), Vibe Sneakers (`vibe-sneakers`).
- [ ] Konfigurasi Monitoring & Alerting: Sentry (error tracking), Prometheus + Grafana, dan UptimeRobot.
- [ ] Soft Launching dengan 20 Beta Merchant pilihan.
