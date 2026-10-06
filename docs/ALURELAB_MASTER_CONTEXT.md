# ⚡ ALURELAB - Complete Project Knowledge Base & Current Progress

> **Dokumen Resmi Master Context ALURELAB**  
> Gunakan dokumen ini sebagai single source of truth saat meneruskan konteks ke AI lain (ChatGPT, Claude, Cursor, OpenCode, dll).

---

## 1. Executive Summary: Apa Itu ALURELAB?

**ALURELAB** adalah platform **Autonomous E-Commerce SaaS & Vibe Commerce Infrastructure** yang dirancang khusus untuk brand lokal, merchant D2C (Direct-to-Consumer), dan UMKM di Indonesia. 

Misi utama ALURELAB adalah menjadi alternatif Shopify & TikTok Shop lokal yang **super cepat (sub-detik TTFB < 300ms)**, **bebas biaya potongan platform yang mencekik (anti marketplace fee)**, serta dilengkapi otomasi native dari pembuatan toko instan hingga konversi penjualan.

### Core Value Proposition & Fitur Utama:
1. **60-Second Onboarding**: Merchant bisa daftar, pilih niche, dan langsung memiliki storefront aktif dengan katalog demo otomatis dalam hitungan detik.
2. **1-Page Fast Checkout**: Alur checkout 1 halaman tanpa reload, auto-detect ongkir & kurir, auto-fill profil pembeli.
3. **One-Click WhatsApp / Phone Buyer Auth**: Pembeli tidak perlu password ribet; cukup masukkan nomor WhatsApp/HP, langsung login, riwayat pesanan & alamat tersimpan via session browser (`localStorage`).
4. **Buyer-Seller Live Chat**: Fitur chat langsung di storefront (guest & logged-in buyer) yang terhubung realtime ke inbox Dashboard Seller.
5. **Anti-RTS (Return to Sender) & Escrow**: Proteksi pesanan COD/Non-COD, kalkulasi risiko pembeli fiktif, integrasi payment gateway (Xendit) & multi-kurir (Biteship).
6. **Multi-Tenant Architecture**: Satu instalasi core menangani puluhan ribu merchant dengan sub-path/subdomain (misal: `app.alurelab.com/{slug}`).
7. **Social Media & Content Automation Engine**: Pipeline otomatisasi riset pasar, batch konten (carousel edukasi & sales), serta generator visual untuk akuisisi merchant.

---

## 2. Arsitektur Teknologi (Tech Stack)

### **Frontend**
- **Framework**: Next.js 14+ (App Router, React 18/19, TypeScript).
- **Styling & UI**: Tailwind CSS, Lucide React, Framer Motion, Lenis Smooth Scroll.
- **State & Storage**: Client-side localStorage persistence untuk Buyer Session, React Context, TanStack Query / SWR.
- **Port Local**: `http://localhost:3000` (atau port 3001 jika collision).

### **Backend**
- **Framework**: Laravel 11 (PHP 8.2+ / 8.3).
- **Authentication**: Laravel Sanctum (dual scope: Merchant/Admin session & stateless Buyer token).
- **Database**: MySQL / MariaDB (Multi-tenant data partitioning via `tenant_id` / `store_id`).
- **Integrations**:
  - Payment: Xendit (QRIS, VA, E-Wallet, Kartu Kredit).
  - Shipping: Biteship API (JNE, J&T, SiCepat, Anteraja, GoSend, Grab).
  - Messaging: WhatsApp Notification API & Pusher/WebSocket chat.
- **Routing**: Restful API (`/api/v1/...`) dengan dual routing web server.

### **Infrastruktur & Server Deployment**
- **Production URL**: `https://app.alurelab.com`
- **Server**: Cloud VPS / Dedicated Server (cPanel/DirectAdmin/Custom Nginx-Apache Reverse Proxy).
- **Dual-Routing**:
  - Route `/api/*` dialirkan langsung ke backend Laravel.
  - Route Frontend `/` dan `/{merchant_slug}/*` dilayani oleh Next.js Node process / static SSR output.

---

## 3. Progress Saat Ini (Current Status & Achievements)

### A. Development Milestone (Live & Stable)
1. **Landing Page SaaS (`app.alurelab.com/`)**:
   - Modern dark/vibe design dengan micro-interactions & Lenis smooth scroll.
   - Interactive ROI calculator, showcase fitur, perbandingan fee vs marketplace.
2. **Instant Onboarding (`app.alurelab.com/onboarding`)**:
   - Wizard pendaftaran toko kilat, setup nama toko, domain slug, dan kategori usaha.
3. **Seller Dashboard (`app.alurelab.com/dashboard`)**:
   - Manajemen katalog produk (variant, stock, gallery image).
   - Order management (status pesanan, resi, sinkronisasi kurir).
   - Realtime Dashboard Inbox (live chat dengan pembeli di storefront).
   - Financial report, payout request, dan analytics overview.
4. **Buyer Storefront (Multi-tenant sub-path)**:
   - Live toko demo: `/kalmora` (Fashion Wanita), `/hijab-mevvah` (Muslim Wear), `/vibe-sneakers` (Streetwear).
   - Mobile-first responsif, drawer cart, sticky buy bar di PDP (Product Detail Page).
   - One-click Buyer Auth & Account Drawer.
   - Guest Buyer Chat: Pembeli anonim maupun terdaftar dapat langsung chatting dengan merchant tanpa redirect 401.
5. **Super Fast 1-Page Checkout (`app.alurelab.com/{slug}/checkout`)**:
   - Integrasi perhitungan ongkir instan.
   - Validasi nomor HP/WA & alamat pengiriman.
   - Gateway mockup & sandbox payment ready.
6. **Admin Control Panel (`app.alurelab.com/admin`)**:
   - Master panel internal untuk monitoring platform, merchant database, dan platform health.

### B. Marketing & Content Automation Engine (`content-batch/`)
- **Market Research Dossier**: Dokumen riset mendalam persona merchant target (fashion, beauty, F&B, gadget) di Indonesia (`marketing-research-alurelab.md`).
- **Batch Content Production**: Dibuat 19+ paket postingan Instagram/LinkedIn lengkap dengan visual slide dan copy persuasif untuk campaign akuisisi merchant.

---

## 4. Tautan & Kredensial Pengujian (Testing Credentials)

### Live Production Endpoints:
- **Landing Page**: [https://app.alurelab.com/](https://app.alurelab.com/)
- **Seller Login**: [https://app.alurelab.com/login](https://app.alurelab.com/login)
- **Onboarding Toko**: [https://app.alurelab.com/onboarding](https://app.alurelab.com/onboarding)
- **Super Admin**: [https://app.alurelab.com/admin](https://app.alurelab.com/admin)
- **Demo Storefronts**:
  - Kalmora Official: [https://app.alurelab.com/kalmora](https://app.alurelab.com/kalmora)
  - Hijab Mevvah: [https://app.alurelab.com/hijab-mevvah](https://app.alurelab.com/hijab-mevvah)
  - Vibe Sneakers: [https://app.alurelab.com/vibe-sneakers](https://app.alurelab.com/vibe-sneakers)

### Akun Uji Coba Seller (Dashboard):
| Toko | Email Akun | Password | Storefront Slug |
| :--- | :--- | :--- | :--- |
| **Kalmora Official** | `hello@kalmora.id` | `password123` | `kalmora` |
| **Hijab Mevvah** | `amanda@hijabmevvah.com` | `password123` | `hijab-mevvah` |
| **Vibe Sneakers** | `budi@vibesneakers.id` | `password123` | `vibe-sneakers` |

### Akun Uji Coba Buyer (Storefront):
- Tanpa password, login via nomor HP di drawer akun storefront:
  - **No. WhatsApp**: `081298765432`
  - **Nama Penerima**: `Siti Nurhaliza`

---

## 5. Struktur Direktori Proyek

```text
ALURELAB/
├── frontend/             # Next.js 14 App Router (Storefront, Landing, Onboarding, Seller Dashboard, Admin)
│   ├── src/
│   │   ├── app/          # (landing, login, onboarding, dashboard, admin, [storeSlug])
│   │   ├── components/   # Shared UI, layout, chat drawer, checkout modal
│   │   └── lib/          # API client, auth session helpers, utils
├── backend/              # Laravel 11 REST API
│   ├── app/
│   │   ├── Http/Controllers/  # Auth, Store, Product, Order, Chat, Admin controllers
│   │   └── Models/            # Tenant, Store, User, Product, Order, Message
│   ├── routes/api.php         # Endpoint API public & protected sanctum
│   └── database/migrations/   # Multi-tenant schema tables
├── content-batch/        # Automated social content marketing engine (post-01 s/d post-19)
├── docs/                 # Dokumentasi teknis komprehensif (00 s/d 11)
└── marketing-research-alurelab.md # Riset pasar kompetitor & pain points merchant
```

---

## 6. Next Steps & Prioritas Selanjutnya (Roadmap)
1. **Payment Gateway Live Activation**: Transisi dari mode simulasi/sandbox Xendit ke live production merchant API keys.
2. **Biteship Multi-Courier Webhook**: Sinkronisasi status pengiriman otomatis (pickup, in-transit, delivered, RTS).
3. **Custom Domain / Subdomain System**: Fitur bagi merchant untuk menghubungkan domain pribadi mereka (misal: `toko.com` via CNAME pointing).
4. **Merchant Growth AI Copilot**: Asisten AI di dashboard yang otomatis menganalisis funnel checkout dan merekomendasikan bundling produk.

---
*Dokumen ini digenerate secara otomatis untuk standarisasi konteks AI lintas platform.*
