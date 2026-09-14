# 🔍 06: TECH STACK AUDIT & RECOMMENDATION
### *Kondisi Saat Ini vs. Rekomendasi Production-Ready*

> Generated: 2026-09-14

---

## TL;DR Verdict

| Layer | Stack Saat Ini | Verdict | Rekomendasi |
|---|---|---|---|
| Backend Framework | Laravel 11 | ✅ PERTAHANKAN | Tidak perlu upgrade ke Laravel 12/13 |
| PHP Version | ^8.2–8.5 | ✅ SOLID | PHP 8.3 untuk production |
| Frontend Framework | Next.js 15 + React 19 | ✅ MODERN | Pertahankan, pilihan terbaik |
| TypeScript | ^5.7 | ✅ WAJIB | Pertahankan strict mode |
| Styling | Tailwind CSS 3.4 | ⚠️ OUTDATED | Upgrade ke Tailwind v4 |
| State Management | Zustand 5 | ✅ TEPAT | Pertahankan |
| Auth (Backend) | Laravel Sanctum 4 | ✅ TEPAT | Pertahankan |
| Auth (Frontend) | **Belum ada** | ❌ MISSING | Tambah NextAuth v5 |
| HTTP Client | **Belum ada** | ❌ MISSING | Tambah Axios + TanStack Query |
| Form Handling | **Belum ada** | ❌ MISSING | Tambah React Hook Form + Zod |
| UI Component Library | **Belum ada** | ❌ MISSING | Tambah shadcn/ui |
| Database | PostgreSQL (rencana) | ✅ TEPAT | PostgreSQL 16 |
| Cache / Queue | Redis (rencana) | ✅ WAJIB | Redis 7 |
| File Storage | Cloudflare R2 (rencana) | ✅ TERBAIK | Pertahankan |
| Payment | Xendit (rencana) | ✅ TEPAT | Pertahankan |
| Shipping | Biteship (rencana) | ✅ TEPAT | Pertahankan |

---

## Kenapa TIDAK perlu ganti ke Laravel 12/13?

Laravel 11 adalah versi stable, fully supported hingga 2026. Semua fitur (Queues, Events, Sanctum, HTTP Client, Policy, Rate Limiting) sudah lengkap. **Upgrade bukan prioritas** — fokus ke building fitur.

## Kenapa TIDAK perlu ganti React SPA (Vite)?

Next.js 15 + React 19 = pilihan sempurna karena:
- **SSR/ISR** → Storefront buyer dirender server-side = SEO optimal + TTFB < 300ms
- **App Router** → Clean route grouping untuk dashboard, storefront, auth
- **React Server Components** → Reduce client JS bundle di storefront
- Kalau ganti ke Vite SPA, storefront tidak SSR = buruk untuk SEO toko online.

---

## Dependencies yang WAJIB Ditambahkan

### Frontend (npm)

```bash
# UI & Forms
npx shadcn@latest init
npm install react-hook-form @hookform/resolvers zod

# API & Data Fetching
npm install axios @tanstack/react-query

# Auth
npm install next-auth@beta

# Utils
npm install date-fns sonner

# Dashboard (charts, tables)
npm install recharts @tanstack/react-table

# Drag & Drop (reorder produk/foto)
npm install @dnd-kit/core @dnd-kit/sortable

# Upgrade Tailwind v4
npm install tailwindcss@next @tailwindcss/postcss@next
```

### Backend (composer)

```bash
composer require spatie/laravel-permission       # RBAC
composer require spatie/laravel-query-builder    # API filter
composer require sentry/sentry-laravel           # Error monitoring
composer require barryvdh/laravel-dompdf         # PDF thermal label
composer require maatwebsite/excel               # Excel export
composer require predis/predis                   # Redis client
composer require xendit/xendit-php               # Xendit payment SDK
```

---

## Struktur App Router yang Direkomendasikan

```
frontend/src/app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (buyer)/
│   └── [store_slug]/
│       ├── page.tsx               ← Storefront homepage
│       ├── products/[slug]/page.tsx
│       ├── cart/page.tsx
│       ├── checkout/page.tsx
│       ├── orders/[id]/page.tsx   ← Order tracking buyer
│       └── account/               ← Buyer account (opsional)
├── (dashboard)/
│   └── dashboard/
│       ├── page.tsx               ← Overview / Analytics
│       ├── products/
│       ├── orders/
│       ├── customers/
│       ├── shipping/
│       ├── promotions/
│       ├── finance/
│       ├── settings/
│       └── subscription/
├── onboarding/page.tsx
└── layout.tsx
```

---

## Production Infrastructure

```
VPS: Hetzner CX31 (4 vCPU, 8GB RAM) ~€12/bulan
OS: Ubuntu 24.04 LTS
Proxy: Nginx + SSL (Certbot)
Container: Docker Compose
Process: Supervisor (Queue Worker)

Stack:
├── Nginx
├── PHP-FPM 8.3
├── Node.js 22 (Next.js)
├── PostgreSQL 16
├── Redis 7
└── Cloudflare (DNS + R2)
```

## Verdict Final

**Stack saat ini sudah BENAR dan PRODUCTION-GRADE.**

Yang perlu dilakukan bukan mengganti stack, tapi:
1. Menambahkan missing dependencies
2. Membangun fitur yang belum ada
3. Setup infrastructure yang benar
