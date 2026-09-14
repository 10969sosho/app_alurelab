# ⚡ ALURELAB: Autonomous E-Commerce SaaS & Vibe Commerce Infrastructure

Platform SaaS E-Commerce multi-tenant bertenaga AI yang mengotomatisasi pembuatan storefront berkecepatan sub-detik (<300ms TTFB), manajemen checkout instan, integrasi escrow pembayaran (Xendit XenPlatform), logistik multi-kurir (Biteship), dan proteksi anti-RTS untuk pedagang di Indonesia.

---

## 🌐 Tautan Live Production

- **Landing & Platform Overview**: [https://alurelab.com](https://alurelab.com)
- **Merchant Onboarding (60s)**: [https://app.alurelab.com/onboarding](https://app.alurelab.com/onboarding)
- **Merchant Dashboard**: [https://app.alurelab.com/dashboard](https://app.alurelab.com/dashboard)
- **Demo Storefront 1 (Hijab Mevvah)**: [https://app.alurelab.com/hijab-mevvah](https://app.alurelab.com/hijab-mevvah)
- **Demo Storefront 2 (Vibe Sneakers)**: [https://app.alurelab.com/vibe-sneakers](https://app.alurelab.com/vibe-sneakers)
- **1-Page Fast Checkout**: [https://app.alurelab.com/hijab-mevvah/checkout](https://app.alurelab.com/hijab-mevvah/checkout)

---

## 🏗️ Struktur Monorepo Proyek

```
ALURELAB/
├── docs/                  # Blueprint Arsitektur & Spesifikasi Lengkap (00 - 06)
│   ├── 00_OVERVIEW_AND_ROADMAP.md
│   ├── 01_PREREQUISITES_AND_ACCOUNTS.md
│   ├── 02_SYSTEM_ARCHITECTURE_AND_FLOW.md
│   ├── 03_PAYMENT_AND_SHIPPING_INTEGRATION.md
│   ├── 04_SECURITY_PROGRAM_AND_COMPLIANCE.md
│   ├── 05_DATABASE_SCHEMA.md
│   ├── 06_HOSTING_AND_DEPLOYMENT_SOP.md     <-- Panduan Hosting & Deploy
│   └── README.md
├── backend/               # Laravel 11 Core Engine (Modular Monolith)
│   ├── app/
│   │   ├── Enums/         # Order, Payment, Shipment, Wallet Enums
│   │   ├── Http/          # Controllers (Storefront, Logistics, Webhooks, Merchant) & Middleware
│   │   ├── Models/        # Multi-tenant Eloquent models dengan UUID & RLS
│   │   └── Services/      # Inventory (Redis Atomic Lock), Anti-RTS, Xendit, Biteship
│   ├── database/
│   │   ├── migrations/    # PostgreSQL 16 Migrations + Raw SQL RLS Policies
│   │   └── seeders/       # Seeders demo tenant
│   └── routes/            # API & Web routes
├── frontend/              # Next.js 15 Storefront & Dashboard (React 19, Tailwind CSS)
│   ├── src/
│   │   ├── app/
│   │   │   ├── [store_slug]/ # Sub-300ms Dynamic Storefront & 1-Page Checkout
│   │   │   ├── onboarding/   # 60-Second Merchant Onboarding Wizard
│   │   │   └── dashboard/    # Enterprise Merchant Dashboard (Light Theme + Slide-overs)
│   │   ├── components/       # SlideOver Drawer & UI components
│   │   ├── lib/              # API Client
│   │   └── store/            # Zustand Cart & State Management
├── docker-compose.yml     # PostgreSQL 16 + Redis 7 Dev Infrastructure
└── README.md              # File ini
```

---

## 📑 Rujukan Dokumentasi Resmi
Buka folder [`docs/`](./docs/README.md) untuk mempelajari seluruh spesifikasi detail:
- [`00_OVERVIEW_AND_ROADMAP.md`](./docs/00_OVERVIEW_AND_ROADMAP.md) - Rencana Sprint & Milestone
- [`01_PREREQUISITES_AND_ACCOUNTS.md`](./docs/01_PREREQUISITES_AND_ACCOUNTS.md) - Konfigurasi Legalitas & Vendor API
- [`02_SYSTEM_ARCHITECTURE_AND_FLOW.md`](./docs/02_SYSTEM_ARCHITECTURE_AND_FLOW.md) - Alur Transaksi & Multi-Tenancy
- [`03_PAYMENT_AND_SHIPPING_INTEGRATION.md`](./docs/03_PAYMENT_AND_SHIPPING_INTEGRATION.md) - Xendit & Biteship API
- [`04_SECURITY_PROGRAM_AND_COMPLIANCE.md`](./docs/04_SECURITY_PROGRAM_AND_COMPLIANCE.md) - Security, RLS & Ledger
- [`05_DATABASE_SCHEMA.md`](./docs/05_DATABASE_SCHEMA.md) - Skema DDL Lengkap PostgreSQL 16
- [`06_HOSTING_AND_DEPLOYMENT_SOP.md`](./docs/06_HOSTING_AND_DEPLOYMENT_SOP.md) - Panduan Hosting, Subdomain, Reverse Proxy & PM2 SOP
