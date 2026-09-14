# 🚀 ALURELAB: Engineering & Production Blueprint
### *Autonomous E-Commerce SaaS & Vibe Commerce Infrastructure*

Dokumentasi ini adalah panduan teknis, arsitektur, dan operasional resmi untuk membangun serta mengelola **ALURELAB** dari nol (*ground zero*) hingga tahap *production* skala tinggi.

---

## 📑 Daftar Dokumen Arsitektur & Panduan

| No | Dokumen | Fokus Pembahasan |
| :---: | :--- | :--- |
| **00** | [**00_OVERVIEW_AND_ROADMAP.md**](./00_OVERVIEW_AND_ROADMAP.md) | Blueprint umum, Tech Stack resmi, fase pengerjaan (Sprint 1 - 8), dan kriteria Definition of Done (DoD). |
| **01** | [**01_PREREQUISITES_AND_ACCOUNTS.md**](./01_PREREQUISITES_AND_ACCOUNTS.md) | Kebutuhan legalitas, pendaftaran akun pihak ketiga (Xendit, Biteship, Cloudflare, OpenAI), dan setup environment variables. |
| **02** | [**02_SYSTEM_ARCHITECTURE_AND_FLOW.md**](./02_SYSTEM_ARCHITECTURE_AND_FLOW.md) | Arsitektur Dual-Routing, Multi-Tenancy PostgreSQL RLS, Otentikasi Pembeli 1-Klik WA, dan Lifecycle Order. |
| **03** | [**03_PAYMENT_AND_SHIPPING_INTEGRATION.md**](./03_PAYMENT_AND_SHIPPING_INTEGRATION.md) | Alur teknis Xendit XenPlatform (Escrow & Split Fee), dompet merchant, Biteship API (Auto-AWB & Pickup), dan proteksi COD Anti-RTS. |
| **04** | [**04_SECURITY_PROGRAM_AND_COMPLIANCE.md**](./04_SECURITY_PROGRAM_AND_COMPLIANCE.md) | Program keamanan menyeluruh: PostgreSQL Row Level Security (RLS), validasi webhook kriptografis, pencegahan race condition stok, dan backup disaster recovery. |
| **05** | [**05_DATABASE_SCHEMA.md**](./05_DATABASE_SCHEMA.md) | DDL schema database PostgreSQL multi-tenant lengkap dengan relasi, indeks performa, dan SQL RLS policies. |
| **06** | [**06_HOSTING_AND_DEPLOYMENT_SOP.md**](./06_HOSTING_AND_DEPLOYMENT_SOP.md) | Panduan infrastruktur hosting emerald, dual-routing `.htaccess` (Laravel API vs Next.js), dan SOP deployment PM2. |
| **07** | [**07_PRODUCT_DOCS_BUYER_FRONTEND.md**](./07_PRODUCT_DOCS_BUYER_FRONTEND.md) | Spesifikasi lengkap Storefront Pembeli, Akun WhatsApp One-Click, Riwayat Pesanan Toko, dan Fast Checkout Auto-Fill. |
| **08** | [**08_PRODUCT_DOCS_SELLER_DASHBOARD.md**](./08_PRODUCT_DOCS_SELLER_DASHBOARD.md) | Spesifikasi Portal Seller/Merchant, Manajemen Produk, Pemrosesan Pesanan, dan Analitik Keuangan. |
| **09** | [**09_IMPLEMENTATION_PRIORITY.md**](./09_IMPLEMENTATION_PRIORITY.md) | Prioritas eksekusi fitur dan matriks kapabilitas modul sistem. |

---

## 🛠️ Ringkasan Stack Teknologi Produksi (Live)

- **Backend & Core Engine**: Laravel 11 (PHP 8.4.25) Modular Monolith, Laravel Sanctum (Multi-Role: Buyer & Seller), PostgreSQL RLS Context.
- **Frontend Storefront & Merchant Dashboard**: Next.js 15.5.25 (React 19, App Router, TypeScript, Tailwind CSS, Lucide Icons, Zustand State Management).
- **Process Manager**: PM2 v5.x (`alurelab-frontend` port 3040).
- **Web Server & Reverse Proxy**: LiteSpeed Enterprise dengan Dual-Routing `.htaccess` (Isolasi `/api/v1/*` ke PHP-FPM dan semua route lainnya ke Next.js).
- **Database & Cache Layer**: PostgreSQL 13.23 (`alurelab_app` dengan Row-Level Security aktif) + Redis 7 (Atomic Locks & Session).
- **Payment & Escrow Provider**: Xendit XenPlatform (PJP Kategori 1 Bank Indonesia / Escrow & Split Fee).
- **Logistics Aggregator**: Biteship API (Multi-kurir: SiCepat, J&T, JNE, GoSend, dll).
- **Production Server**: `alurelab@emerald.hidden-server.net:31988` (Web Root: `/home/alurelab/app.alurelab.com`).
