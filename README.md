# ⚡ ALURELAB: Autonomous E-Commerce SaaS & Vibe Commerce Infrastructure

Platform SaaS E-Commerce multi-tenant bertenaga AI yang mengotomatisasi pembuatan storefront berkecepatan sub-detik (<300ms TTFB), manajemen checkout instan, integrasi escrow pembayaran (Xendit XenPlatform), logistik multi-kurir (Biteship), dan proteksi anti-RTS untuk pedagang di Indonesia.

---

## 🏗️ Struktur Monorepo Proyek

```
ALURELAB/
├── docs/                  # Blueprint Arsitektur & Spesifikasi Lengkap (00 - 05)
│   ├── 00_OVERVIEW_AND_ROADMAP.md
│   ├── 01_PREREQUISITES_AND_ACCOUNTS.md
│   ├── 02_SYSTEM_ARCHITECTURE_AND_FLOW.md
│   ├── 03_PAYMENT_AND_SHIPPING_INTEGRATION.md
│   ├── 04_SECURITY_PROGRAM_AND_COMPLIANCE.md
│   ├── 05_DATABASE_SCHEMA.md
│   └── README.md
├── backend/               # Laravel 11 Core Engine (Modular Monolith)
│   ├── app/
│   │   ├── Enums/         # Order, Payment, Shipment, Wallet Enums
│   │   ├── Http/
│   │   │   ├── Controllers/Api/ (Storefront, Webhooks, Tenant, Auth)
│   │   │   └── Middleware/ (IdentifyTenant with PostgreSQL RLS Session)
│   │   ├── Models/        # Multi-tenant Eloquent models
│   │   └── Services/      # Inventory (Redis Atomic Lock), Anti-RTS, Xendit, Biteship
│   ├── database/
│   │   └── migrations/    # PostgreSQL 16 Migrations + Raw SQL RLS Policies
│   └── routes/            # API & Web routes
├── frontend/              # Next.js 15 Storefront & Dashboard (React 19, Tailwind CSS)
│   ├── src/
│   │   ├── app/
│   │   │   ├── [store_slug]/ # Dynamic sub-second Storefront & 1-Page Checkout
│   │   │   ├── onboarding/   # 60-Second Merchant Onboarding Wizard
│   │   │   └── dashboard/    # Merchant Dashboard Shell & Operations
│   │   ├── components/       # UI Components
│   │   ├── lib/              # API Client & Utilities
│   │   └── store/            # Zustand Cart & Checkout State
├── docker-compose.yml     # PostgreSQL 16 + Redis 7 Dev Infrastructure
└── README.md              # File ini
```

---

## 🚀 Quick Start (Development Lokal)

### 1. Jalankan Database & Cache (Docker)
```bash
docker compose up -d
```
Service yang berjalan:
- **PostgreSQL 16**: Port `5432` (`alurelab_dev` / `postgres` / `postgres`)
- **Redis 7**: Port `6379`

### 2. Setup Backend (Laravel 11)
```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve --port=8000
```

### 3. Setup Frontend (Next.js 15)
```bash
cd ../frontend
cp .env.example .env.local
npm install
npm run dev -- -p 3000
```

Buka di browser:
- Landing page: `http://localhost:3000`
- Onboarding merchant (60s): `http://localhost:3000/onboarding`
- Storefront contoh: `http://localhost:3000/demo-store`
- Storefront checkout: `http://localhost:3000/demo-store/checkout`
- Merchant dashboard: `http://localhost:3000/dashboard`

---

## 📑 Rujukan Dokumentasi Resmi
Buka folder [`docs/`](./docs/README.md) untuk mempelajari seluruh spesifikasi detail:
- [`00_OVERVIEW_AND_ROADMAP.md`](./docs/00_OVERVIEW_AND_ROADMAP.md) - Rencana Sprint & Milestone
- [`01_PREREQUISITES_AND_ACCOUNTS.md`](./docs/01_PREREQUISITES_AND_ACCOUNTS.md) - Konfigurasi Legalitas & Vendor API
- [`02_SYSTEM_ARCHITECTURE_AND_FLOW.md`](./docs/02_SYSTEM_ARCHITECTURE_AND_FLOW.md) - Alur Transaksi & Multi-Tenancy
- [`03_PAYMENT_AND_SHIPPING_INTEGRATION.md`](./docs/03_PAYMENT_AND_SHIPPING_INTEGRATION.md) - Xendit & Biteship API
- [`04_SECURITY_PROGRAM_AND_COMPLIANCE.md`](./docs/04_SECURITY_PROGRAM_AND_COMPLIANCE.md) - Security, RLS & Ledger
- [`05_DATABASE_SCHEMA.md`](./docs/05_DATABASE_SCHEMA.md) - Skema DDL Lengkap PostgreSQL 16
