# ⚡ ALURELAB: Autonomous E-Commerce SaaS & Vibe Commerce Infrastructure

Platform SaaS E-Commerce multi-tenant bertenaga AI yang mengotomatisasi pembuatan storefront berkecepatan sub-detik (<300ms TTFB), manajemen 1-page fast checkout instan, otentikasi pembeli 1-klik WhatsApp/nomor HP, integrasi escrow pembayaran (Xendit), logistik multi-kurir (Biteship), dan proteksi anti-RTS untuk pedagang di Indonesia.

---

## 🌐 Tautan Live Production

| Layanan / Halaman | URL Akses | Keterangan |
| :--- | :--- | :--- |
| **Landing & Platform Overview** | [https://app.alurelab.com/](https://app.alurelab.com/) | Portal utama platform SaaS |
| **Merchant Login** | [https://app.alurelab.com/login](https://app.alurelab.com/login) | Portal masuk seller/penjual |
| **Merchant Onboarding (60s)** | [https://app.alurelab.com/onboarding](https://app.alurelab.com/onboarding) | Pendaftaran instan toko baru & generate katalog |
| **Merchant Dashboard** | [https://app.alurelab.com/dashboard](https://app.alurelab.com/dashboard) | Kelola produk, pesanan, analitik & keuangan |
| **Storefront Kalmora Official** | [https://app.alurelab.com/kalmora](https://app.alurelab.com/kalmora) | Toko live pakaian wanita & hijab |
| **1-Page Fast Checkout Kalmora** | [https://app.alurelab.com/kalmora/checkout](https://app.alurelab.com/kalmora/checkout) | Checkout cepat dengan auto-fill identitas pembeli |
| **Storefront Demo Hijab Mevvah** | [https://app.alurelab.com/hijab-mevvah](https://app.alurelab.com/hijab-mevvah) | Storefront fashion muslim |
| **Storefront Demo Vibe Sneakers** | [https://app.alurelab.com/vibe-sneakers](https://app.alurelab.com/vibe-sneakers) | Storefront street sneakers |

---

## 🔑 Kredensial Akun Pengujian Production

### 1. Akun Merchant / Seller (Dashboard)
| Toko | Email | Password | Slug Storefront |
| :--- | :--- | :--- | :--- |
| **Kalmora Official** | `hello@kalmora.id` | `password123` | `kalmora` |
| **Hijab Mevvah Official** | `amanda@hijabmevvah.com` | `password123` | `hijab-mevvah` |
| **Vibe Sneakers Surabaya** | `budi@vibesneakers.id` | `password123` | `vibe-sneakers` |

### 2. Akun Pembeli (Storefront Buyer Auth)
Pembeli dapat langsung masuk menggunakan **One-Click WhatsApp / Phone Login** pada drawer **"Akun Saya"** di header storefront tanpa memerlukan kata sandi:
- **Nomor HP / WA Contoh**: `081298765432`
- **Nama Penerima**: `Siti Nurhaliza`
- **Fitur Terhubung**: Sesi login otomatis tersimpan di browser (`localStorage: alurelab_buyer_session`), data alamat tersimpan, riwayat pesanan real dari toko aktif, dan auto-fill formulir saat checkout.

---

## 🏗️ Arsitektur Sistem & Spesifikasi Server

Sistem ALURELAB berjalan live di server hosting dengan pemisahan traffic cerdas (*Dual-Routing Web Server*):

```
[ BROWSER / BUYER / MERCHANT ]
               │
               ▼
   [ LITESPEED WEB SERVER (app.alurelab.com) ]
               │
       ┌───────┴────────────────────────┐
       │ (Path Rewrite via .htaccess)   │
       ▼                                ▼
[ ^/api/v1/ , ^/sanctum/ , ^/storage/ ]  [ ALL OTHER ROUTES & /api/auth/* ]
               │                                │
               ▼                                ▼
 [ LARAVEL 11 (PHP 8.4.25) ]           [ PM2 NEXT.JS 15 (Port 3040) ]
   - Modular Monolith API                - App Router (React 19)
   - PostgreSQL 13.23 + RLS              - Storefront SSR & ISR (<300ms)
   - Sanctum Token Auth (Buyer & Seller) - Merchant Dashboard & Onboarding
   - Concurrency & Multi-Tenant Engine   - Zustand Store (Cart & Buyer Session)
```

### Spesifikasi Infrastruktur:
- **Server Host**: `emerald.hidden-server.net:31988` (user: `alurelab`)
- **Web Root Production**: `/home/alurelab/app.alurelab.com`
- **Git Repo Server**: `/home/alurelab/repositories/app_alurelab` (`main`)
- **Node.js**: `v20.20.2` (via NVM)
- **PHP**: `8.4.25` (alt-php84)
- **Database**: PostgreSQL 13.23 (`alurelab_app`) dengan Row-Level Security (RLS)
- **Process Manager**: PM2 (`alurelab-frontend`, port `3040`)
- **Routing Engine**: LiteSpeed Enterprise via `.htaccess`

---

## 📁 Struktur Direktori Monorepo

```
ALURELAB/
├── docs/                       # Dokumentasi Arsitektur & Spesifikasi Resmi (00 - 09)
│   ├── 00_OVERVIEW_AND_ROADMAP.md
│   ├── 01_PREREQUISITES_AND_ACCOUNTS.md
│   ├── 02_SYSTEM_ARCHITECTURE_AND_FLOW.md
│   ├── 03_PAYMENT_AND_SHIPPING_INTEGRATION.md
│   ├── 04_SECURITY_PROGRAM_AND_COMPLIANCE.md
│   ├── 05_DATABASE_SCHEMA.md
│   ├── 06_HOSTING_AND_DEPLOYMENT_SOP.md     <-- SOP Hosting & Reverse Proxy
│   ├── 06_TECH_STACK_AUDIT.md
│   ├── 07_PRODUCT_DOCS_BUYER_FRONTEND.md     <-- Dokumentasi Fitur Pembeli
│   ├── 08_PRODUCT_DOCS_SELLER_DASHBOARD.md  <-- Dokumentasi Dashboard Penjual
│   ├── 09_IMPLEMENTATION_PRIORITY.md
│   └── README.md
├── backend/                    # Laravel 11 Core Engine (Modular Monolith)
│   ├── app/
│   │   ├── Enums/              # Order, Payment, Shipment, Wallet Enums
│   │   ├── Http/Controllers/   # Storefront, Logistics, Merchant, CustomerAuthController
│   │   ├── Http/Middleware/    # IdentifyTenant (PostgreSQL RLS context injection)
│   │   ├── Models/             # Customer (Sanctum), Store, User, Order, Product
│   │   └── Services/           # Inventory (Atomic Lock), Anti-RTS, Xendit, Biteship
│   ├── database/migrations/    # Migrations + Raw SQL RLS Policies
│   └── routes/                 # API & Web routes (v1 prefix)
├── frontend/                   # Next.js 15 Storefront & Dashboard (React 19, TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── [store_slug]/   # Dynamic Storefront & 1-Page Fast Checkout
│   │   │   ├── dashboard/      # Merchant Admin Dashboard
│   │   │   ├── onboarding/     # 60s Instant Store Creator
│   │   │   └── api/auth/       # NextAuth v5 Route Handlers
│   │   ├── components/         # UI Components & SlideOver Drawers
│   │   ├── lib/                # API Client & Auth.js configurations
│   │   └── store/              # Zustand: cart-store.ts & buyer-store.ts
├── docker-compose.yml          # Dev Container Setup (PostgreSQL + Redis)
└── README.md                   # File ini
```

---

## 📑 Rujukan Dokumentasi Lengkap

Pelajari detail implementasi teknis di folder [`docs/`](./docs/README.md):
- [`00_OVERVIEW_AND_ROADMAP.md`](./docs/00_OVERVIEW_AND_ROADMAP.md) - Rencana Sprint, Milestone & Status Proyek
- [`02_SYSTEM_ARCHITECTURE_AND_FLOW.md`](./docs/02_SYSTEM_ARCHITECTURE_AND_FLOW.md) - Multi-Tenancy RLS, Dual-Routing & Buyer Auth
- [`03_PAYMENT_AND_SHIPPING_INTEGRATION.md`](./docs/03_PAYMENT_AND_SHIPPING_INTEGRATION.md) - Xendit XenPlatform & Biteship Logistics
- [`05_DATABASE_SCHEMA.md`](./docs/05_DATABASE_SCHEMA.md) - Skema DDL PostgreSQL Multi-Tenant Lengkap
- [`06_HOSTING_AND_DEPLOYMENT_SOP.md`](./docs/06_HOSTING_AND_DEPLOYMENT_SOP.md) - Panduan Deploy Server Emerald, PM2 & LiteSpeed Proxy
- [`07_PRODUCT_DOCS_BUYER_FRONTEND.md`](./docs/07_PRODUCT_DOCS_BUYER_FRONTEND.md) - Spesifikasi Storefront, Akun Pembeli & Checkout
- [`08_PRODUCT_DOCS_SELLER_DASHBOARD.md`](./docs/08_PRODUCT_DOCS_SELLER_DASHBOARD.md) - Spesifikasi Portal Merchant & Order Processing
