# 📋 01: PREREQUISITES, LEGALITAS & AKUN PIHAK KETIGA
### *Daftar Kebutuhan Fondasi Sebelum Mulai Ngoding*

Dokumen ini memuat seluruh perizinan hukum, akun vendor eksternal, dan konfigurasi kredensial (*environment variables*) yang wajib disiapkan sebelum peluncuran produksi.

---

## 1. Kebutuhan Legalitas & Kepatuhan Regulasi Indonesia

Berdasarkan UU P2SK dan Peraturan Bank Indonesia (PBI No. 23/6/PBI/2021 tentang Penyelenggara Jasa Pembayaran), ALURELAB tidak diperbolehkan menampung dana transaksi masyarakat secara mandiri tanpa lisensi perbankan/PJP. Oleh karena itu, kita bertindak sebagai **Penyelenggara Sistem Elektronik (PSE)** yang bermitra dengan PJP Berlisensi (Xendit).

### Dokumen Legalitas Badan Usaha yang Wajib Ada:
1. **Bentuk Badan Usaha**: Minimal **PT Perorangan** (untuk fase validasi awal) atau **PT Standar / CV** (untuk kontrak enterprise Xendit XenPlatform).
2. **Nomor Induk Berusaha (NIB) berbasis OSS RBA**:
   - Wajib mencantumkan KBLI utama: **KBLI 63122** (*Aktivitas Portal Web dan/atau Platform Digital dengan Tujuan Komersial*).
   - KBLI pendukung: **KBLI 62019** (*Aktivitas Pemrograman Komputer Lainnya*).
3. **Tanda Daftar PSE Kominfo / Komdigi**:
   - Pendaftaran PSE Lingkup Privat melalui portal `layanan.komdigi.go.id` sebelum platform dibuka untuk publik. Wajib untuk mencegah pemblokiran akses DNS oleh Kominfo.
4. **Rekening Bank Giro Badan Usaha**:
   - Rekening bank atas nama PT/CV (BCA, Mandiri, atau BRI) yang digunakan sebagai rekening penampung pendapatan platform fee dan master account Xendit.

---

## 2. Pendaftaran Akun Vendor & Third-Party Services

| Layanan | Fungsi Utama | Jenis Akun yang Didaftarkan | Waktu Persetujuan |
| :--- | :--- | :--- | :---: |
| **Xendit** | Payment Gateway, Escrow, dan Split Fee | **XenPlatform (Master Account)**. Hubungi sales Xendit untuk aktivasi fitur XenPlatform (multi-tenant sub-account). | 3–5 hari kerja |
| **Biteship** | Multi-kurir logistik, cek ongkir, resi otomatis | Akun Developer Biteship (`dashboard.biteship.com`). Isi saldo deposit awal Rp 500.000 untuk pengujian order. | Instan |
| **Cloudflare** | DNS, SSL Wildcard, Proteksi DDoS, Custom Domain | Akun Cloudflare Pro/Free + Add-on **Cloudflare for SaaS** (100 custom hostnames gratis pertama, lalu $0.10/hostname/bln). | Instan |
| **Cloudflare R2** | Penyimpanan gambar produk ($0 egress fee) | Cloudflare Dashboard -> R2 Object Storage. Buat bucket `alurelab-media-production`. | Instan |
| **OpenAI** | AI Copywriting & Product Description | OpenAI API Platform (`platform.openai.com`). Model: `gpt-4o-mini`. | Instan |
| **Replicate** | AI Background Removal & Studio Render | Akun Replicate (`replicate.com`). Model: `briaai/rmbg-2.0` atau Stable Diffusion Inpainting. | Instan |
| **Fonnte / Wablas** | WhatsApp OTP & Notification Gateway | Akun Fonnte (`fonnte.com`). Siapkan 1 nomor WhatsApp khusus operasional ALURELAB. | Instan |

---

## 3. Spesifikasi Server & Infrastruktur Minimum

### Staging / Beta Environment:
- **Server**: 1x VPS (Ubuntu 24.04 LTS), 2 vCPU, 4 GB RAM, 50 GB NVMe (Contoh: Hetzner CPX21 / Alurelab Cloud).
- **Service**: Docker Compose (Laravel Octane, Next.js, PostgreSQL 16, Redis 7).

### Production Environment (Skala 1.000 Toko Aktif):
- **App Node (Backend)**: 2x VPS 4 vCPU, 8 GB RAM (Laravel 11 + Octane/Swoole + Horizon).
- **Frontend Node**: Vercel Pro atau VPS Next.js Standalone Node.js di balik Cloudflare Load Balancer.
- **Database Node**: Managed PostgreSQL 16 (4 vCPU, 16 GB RAM, NVMe Storage) dengan automated snapshot backup tiap 6 jam.
- **Cache & Queue Node**: Managed Redis 7 (In-Memory 4 GB RAM) dengan persistence AOF aktif.

---

## 4. Checklist Master Environment Variables

### Backend Laravel (`.env.production`):
```ini
APP_NAME=AlurelabCore
APP_ENV=production
APP_KEY=base64:GENERATE_VIA_PHP_ARTISAN_KEY
APP_DEBUG=false
APP_URL=https://api.alurelab.shop
ROOT_DOMAIN=alurelab.shop

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=alurelab_prod
DB_USERNAME=alurelab_app
DB_PASSWORD=SUPER_STRONG_PASSWORD_HERE

# Redis & Cache
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=REDIS_STRONG_PASSWORD_HERE
REDIS_PORT=6379
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# Xendit XenPlatform Credentials
XENDIT_SECRET_KEY=xnd_production_xxxxxxxxxxxx
XENDIT_PUBLIC_KEY=xnd_public_production_xxxxxxxxxxxx
XENDIT_WEBHOOK_TOKEN=wh_secret_token_from_xendit_dashboard

# Biteship Logistics Credentials
BITESHIP_API_URL=https://api.biteship.com/v1
BITESHIP_API_KEY=biteship_live.xxxxxxxxxxxxxxxxxxxxxxxxxxxx
BITESHIP_WEBHOOK_SECRET=biteship_wh_secret_here

# Cloudflare for SaaS & R2 Storage
CLOUDFLARE_ZONE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_FALLBACK_ORIGIN=cname.alurelab.shop
AWS_ACCESS_KEY_ID=r2_access_key_here
AWS_SECRET_ACCESS_KEY=r2_secret_key_here
AWS_DEFAULT_REGION=auto
AWS_BUCKET=alurelab-media-production
AWS_URL=https://cdn.alurelab.shop
AWS_ENDPOINT=https://CLOUDFLARE_ACCOUNT_ID.r2.cloudflarestorage.com

# AI Pipeline
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# WhatsApp Notification Gateway
FONNTE_API_TOKEN=xxxxxxxxxxxxxxxxxxxx
```

### Frontend Next.js (`.env.production`):
```ini
NEXT_PUBLIC_APP_NAME=ALURELAB
NEXT_PUBLIC_ROOT_DOMAIN=alurelab.shop
NEXT_PUBLIC_API_BASE_URL=https://api.alurelab.shop/v1
NEXT_PUBLIC_CDN_BASE_URL=https://cdn.alurelab.shop

# Server-Side Only Secrets
INTERNAL_API_SECRET=jwt_shared_secret_between_next_and_laravel
NEXTAUTH_SECRET=generate_strong_secret_32_chars
NEXTAUTH_URL=https://dashboard.alurelab.shop
```
