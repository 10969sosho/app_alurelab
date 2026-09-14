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

### SPRINT 1: Fondasi Arsitektur, Multi-Tenancy & Database (Pekan 1–2)
- [ ] Inisialisasi Repository Monorepo atau Polyrepo (Frontend: Next.js 15, Backend: Laravel 11).
- [ ] Setup PostgreSQL 16 dengan ekstensi UUID dan integrasi Row-Level Security (RLS).
- [ ] Implementasi Middleware Tenant Resolution di Laravel (berbasis subdomain `*.alurelab.shop` dan custom domain).
- [ ] Sistem Autentikasi Master Admin & Merchant (Laravel Sanctum + NextAuth/Iron Session).
- [ ] Unit Test isolasi tenant: memastikan Merchant A tidak bisa mengakses query data Merchant B.

### SPRINT 2: Katalog Produk, Varian & AI Generator Dasar (Pekan 3–4)
- [ ] Manajemen Produk (CRUD produk, kategori, varian multi-level: warna, ukuran).
- [ ] Penyimpanan aset media ke Cloudflare R2 (presigned URL upload langsung dari browser).
- [ ] Integrasi AI Copywriting (OpenAI GPT-4o-mini): generate judul, deskripsi persuasif, dan SEO tag otomatis.
- [ ] Pipeline integrasi AI Photo Studio (RMBG-2.0 via Replicate): background removal dan mockup studio.

### SPRINT 3: Storefront Frontend Sub-Detik & Customizer (Pekan 5–6)
- [ ] Next.js 15 Storefront ultra-cepat: dynamic routing `/[store_slug]`, static regeneration (ISR).
- [ ] Tema visual toko yang responsif, bersih, dan berorientasi konversi (mobile-first).
- [ ] Halaman Checkout 1-Halaman (1-Page Fast Checkout) teroptimasi tanpa login bagi pembeli.
- [ ] Keranjang belanja lokal (LocalStorage / Zustand) sinkronisasi stok riil.

### SPRINT 4: Integrasi Pembayaran & Escrow Xendit (Pekan 7–8)
- [ ] Integrasi Xendit XenPlatform: pembuatan Sub-Account otomatis saat merchant onboard.
- [ ] Pembuatan tagihan pembayaran: QRIS Dinamis, Virtual Account, dan e-Wallet.
- [ ] Webhook Receiver Xendit dengan verifikasi kriptografis signature token.
- [ ] Sistem Escrow Virtual & Dompet Saldo Merchant (Ledger internal).
- [ ] Mekanisme Withdrawal (Tarik Dana) berkala ke rekening bank pribadi merchant via XenDisburse.

### SPRINT 5: Integrasi Logistik Biteship & COD Protection (Pekan 9–10)
- [ ] Integrasi Biteship API: kalkulasi ongkos kirim real-time per kelurahan/kecamatan se-Indonesia.
- [ ] Pembuatan pesanan kirim & auto-generate nomor resi (AWB) + download thermal label PDF (100x150mm).
- [ ] Penjadwalan auto-pickup kurir dan opsi drop-off gerai.
- [ ] Sistem COD terproteksi: verifikasi nomor WhatsApp OTP dan Smart Anti-RTS Risk Scoring.
- [ ] Webhook tracking status pengiriman real-time (normalisasi status kurir).

### SPRINT 6: WhatsApp Automation & Abandoned Cart Recovery (Pekan 11–12)
- [ ] Integrasi WhatsApp Gateway (Fonnte / Wablas API) untuk notifikasi instan:
  - Notifikasi pesanan baru ke merchant.
  - Notifikasi nomor resi & link tracking ke pembeli.
- [ ] Autonomous Cart Recovery: follow-up otomatis ke pembeli yang meninggalkan keranjang setelah 15 menit dan 24 jam dengan voucher diskon dinamis.
- [ ] Tracking Pixel: integrasi Meta Pixel (Browser + Conversions API / CAPI) dan TikTok Events API.

### SPRINT 7: Custom Domain (Cloudflare for SaaS) & Merchant Billing (Pekan 13–14)
- [ ] Integrasi Cloudflare for SaaS API: merchant bisa memasang domain sendiri (misal: `tokosaya.com`) dengan CNAME dan SSL otomatis diterbitkan dalam 3 menit.
- [ ] Subscription Billing Engine: sistem langganan bulanan paket Starter (Rp 99K), Pro (Rp 249K), dan Business (Rp 599K).
- [ ] Sistem Afiliasi Berulang (Recurring Affiliate 20%): pelacakan referral link untuk media buyer dan agensi periklanan.

### SPRINT 8: Security Hardening, Load Testing & Go-Live Production (Pekan 15–16)
- [ ] Audit Keamanan & Penetration Testing: validasi SQL injection, XSS, CSRF, IDOR, dan RLS bypass.
- [ ] Stress & Load Testing: simulasi 10.000 concurrent user checkout bersamaan via k6 / Locust.
- [ ] Setup Server Production di VPS Ubuntu 24.04 (Hetzner / DigitalOcean) dengan Docker Swarm / Kubernetes k3s.
- [ ] Konfigurasi Monitoring & Alerting: Sentry (error tracking), Prometheus + Grafana, dan UptimeRobot.
- [ ] Soft Launching dengan 20 Beta Merchant pilihan.
