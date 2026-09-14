# 🚀 ALURELAB: Engineering & Production Blueprint
### *Autonomous E-Commerce SaaS & Vibe Commerce Infrastructure*

Dokumentasi ini adalah panduan teknis dan operasional resmi untuk membangun **ALURELAB** dari nol (*ground zero*) hingga tahap *production* skala tinggi.

---

## 📑 Daftar Dokumen Arsitektur & Panduan

| No | Dokumen | Fokus Pembahasan |
| :---: | :--- | :--- |
| **00** | [**00_OVERVIEW_AND_ROADMAP.md**](./00_OVERVIEW_AND_ROADMAP.md) | Blueprint umum, Tech Stack resmi, fase pengerjaan (Sprint 1 - 8), dan kriteria Definition of Done (DoD). |
| **01** | [**01_PREREQUISITES_AND_ACCOUNTS.md**](./01_PREREQUISITES_AND_ACCOUNTS.md) | Kebutuhan legalitas, pendaftaran akun pihak ketiga (Xendit, Biteship, Cloudflare, OpenAI), dan setup environment variables. |
| **02** | [**02_SYSTEM_ARCHITECTURE_AND_FLOW.md**](./02_SYSTEM_ARCHITECTURE_AND_FLOW.md) | Arsitektur Next.js 15 + Laravel 11, multi-tenancy, custom domain routing, lifecycle order, dan integrasi AI Studio. |
| **03** | [**03_PAYMENT_AND_SHIPPING_INTEGRATION.md**](./03_PAYMENT_AND_SHIPPING_INTEGRATION.md) | Alur teknis Xendit XenPlatform (Escrow & Split Fee), dompet merchant, Biteship API (Auto-AWB & Pickup), dan proteksi COD Anti-RTS. |
| **04** | [**04_SECURITY_PROGRAM_AND_COMPLIANCE.md**](./04_SECURITY_PROGRAM_AND_COMPLIANCE.md) | Program keamanan menyeluruh: PostgreSQL Row Level Security (RLS), validasi webhook kriptografis, pencegahan race condition stok, dan backup disaster recovery. |
| **05** | [**05_DATABASE_SCHEMA.md**](./05_DATABASE_SCHEMA.md) | DDL schema database PostgreSQL multi-tenant lengkap dengan relasi, indeks performa, dan SQL RLS policies. |

---

## 🛠️ Ringkasan Stack Teknologi Produksi

- **Backend & Core Engine**: Laravel 11 (PHP 8.3+) Modular Monolith, Laravel Sanctum, Laravel Horizon.
- **Frontend Storefront & Merchant Dashboard**: Next.js 15 (React 19, App Router, TypeScript, Tailwind CSS, shadcn/ui).
- **Database & Cache Layer**: PostgreSQL 16 (dengan Row-Level Security) + Redis 7 Cluster (Atomic Locks & Queues).
- **Edge, DNS & Assets**: Cloudflare for SaaS (SSL for Custom Domains), Cloudflare R2 (Object Storage tanpa biaya egress).
- **Payment & Escrow Provider**: Xendit XenPlatform (PJP Kategori 1 Bank Indonesia).
- **Logistics Aggregator**: Biteship API (Multi-courier: J&T, SiCepat, JNE, GoSend, dll).
- **AI Processing Pipeline**: OpenAI GPT-4o-mini (Copywriting) + Replicate/RMBG-2.0 (Studio Photo Rendering).
