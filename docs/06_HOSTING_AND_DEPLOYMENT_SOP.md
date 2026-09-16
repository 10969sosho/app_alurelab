# 🌐 06: INFRASTRUKTUR HOSTING & DEPLOYMENT SOP
### *Panduan Resmi Struktur Server, Domain Mapping, Reverse Proxy & Deployment ALURELAB*

Dokumen ini memuat arsitektur infrastruktur server hosting, pemetaan domain/subdomain, konfigurasi reverse proxy LiteSpeed/Apache, dan Standar Operasional Prosedur (SOP) deployment berkelanjutan untuk proyek **ALURELAB**.

---

## 1. Spesifikasi Server & Identitas Hosting

| Parameter | Nilai Konfigurasi | Keterangan |
| :--- | :--- | :--- |
| **Server Host** | `emerald.hidden-server.net` | Host server cPanel / LiteSpeed |
| **Port SSH** | `31988` | Port SSH kustom non-standar |
| **User SSH** | `alurelab` | Akun pengguna sistem Linux |
| **Home Directory** | `/home/alurelab` | Root path direktori user |
| **SSH Alias** | `ssh alurelab` | Sudah terkonfigurasi di `~/.ssh/config` (`ssh -p 31988 alurelab@emerald.hidden-server.net`) |
| **Node.js Runtime** | `v20.20.2` (via NVM) | `/home/alurelab/.nvm/versions/node/v20.20.2/bin/node` |
| **PHP Runtime** | `PHP 8.4.25` (alt-php84) | Mendukung Laravel 11 & Composer 2.10 |
| **Database Engine** | **PostgreSQL 13.23** | DB: `alurelab_app`, User: `alurelab_appuser`, RLS Active |
| **Process Manager** | **PM2 v5.x** | Daemon `alurelab-frontend` (Port 3040) |
| **Web Server** | **LiteSpeed Enterprise** | Dual-Routing `.htaccess` (Laravel API + Next.js Proxy) |
| **Git Repository** | `https://github.com/10969sosho/app_alurelab.git` | Branch utama: `main` |

---

## 2. Pemetaan Domain & Arsitektur Dual-Routing Web Server

Sistem ALURELAB mengadopsi arsitektur **Dual-Routing Terisolasi** pada host domain tunggal (`app.alurelab.com`):

```
[ INTERNET / USER BROWSER ]
           │
           ▼
[ LITESPEED ENTERPRISE (.htaccess) ] ───► https://app.alurelab.com
           │
     ┌─────┴──────────────────────────────────────┐
     │ (Berdasarkan Prefix URL)                   │
     ▼                                            ▼
[ ^/api/v1/ , ^/sanctum/ , ^/storage/ ]    [ ALL OTHER ROUTES & /api/auth/* ]
     │                                            │
     ▼                                            ▼
[ LARAVEL 11 (PHP-FPM) ]                   [ PM2 NEXT.JS 15 (Port 3040) ]
- backend/public/index.php                 - Dynamic Storefront /[store_slug]
- PostgreSQL 13.23 (RLS Context)           - Fast Checkout /[store_slug]/checkout
- Buyer & Merchant REST API                - NextAuth v5 Route Handlers
- Order & Checkout Engine                  - Merchant Dashboard (/dashboard)
                                           - 60s Onboarding (/onboarding)
```

### Rincian Direktori Domain di Server:
1. **`app.alurelab.com`** ➔ Path: `/home/alurelab/app.alurelab.com`
   - Berfungsi sebagai portal aplikasi menyeluruh (Storefront Pembeli, Fast Checkout, Onboarding Merchant, Dashboard, dan REST API Backend).
2. **`alurelab.com`** ➔ Path: `/home/alurelab/public_html`
   - Berfungsi sebagai portal landing page platform ALURELAB.
   - Folder legacy `/finance/` dikecualikan dari reverse proxy agar aplikasi internal tetap aktif.

---

## 3. Konfigurasi Reverse Proxy (.htaccess) Dual-Routing

Konfigurasi `.htaccess` pada `/home/alurelab/app.alurelab.com/.htaccess` wajib memisahkan secara eksplisit antara rute backend Laravel dan rute Next.js.

> [!IMPORTANT]
> **Pemisahan NextAuth v5**: Rute `/api/auth/*` milik Auth.js / NextAuth v5 harus diproses oleh Next.js pada port 3040. Jika rule rewrite menangkap seluruh prefix `^/api/` tanpa batasan versi `^/api/v1/`, request NextAuth akan dialihkan ke Laravel dan menyebabkan fatal error `The route api/auth/error could not be found`.

### 3.1 Konfigurasi Live `app.alurelab.com` (`/home/alurelab/app.alurelab.com/.htaccess`):
```apache
<IfModule mod_rewrite.c>
    Options -MultiViews -Indexes
    RewriteEngine On

    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    RewriteCond %{HTTP:x-xsrf-token} .
    RewriteRule .* - [E=HTTP_X_XSRF_TOKEN:%{HTTP:X-XSRF-Token}]

    # 1. Kecualikan sertifikat SSL Let's Encrypt / cPanel AutoSSL
    RewriteCond %{REQUEST_URI} ^/\.well-known/
    RewriteRule ^ - [L]

    # 2. Backend API v1, sanctum, and storage routes -> route to Laravel backend/public/index.php
    RewriteCond %{REQUEST_URI} ^/api/v1/ [OR]
    RewriteCond %{REQUEST_URI} ^/sanctum/ [OR]
    RewriteCond %{REQUEST_URI} ^/storage/
    RewriteRule ^ backend/public/index.php [L]

    # 3. Reverse Proxy all web routes & Next.js API (/api/auth) to Next.js (Port 3040)
    RewriteRule ^(.*)$ http://127.0.0.1:3040/$1 [P,L]
</IfModule>
```

### 3.2 Konfigurasi NextAuth v5 Trusted Host:
Karena Next.js berjalan di balik reverse proxy LiteSpeed, NextAuth v5 memerlukan deklarasi host tepercaya untuk mencegah error `UntrustedHost`:
- **`next.config.mjs`**:
  ```js
  env: {
    AUTH_TRUST_HOST: 'true',
  }
  ```
- **`frontend/src/lib/auth.ts`**:
  ```ts
  export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    trustHost: true,
  });
  ```
- **`ecosystem.config.js`**:
  ```js
  module.exports = {
    apps: [{
      name: 'alurelab-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3040',
      cwd: '/home/alurelab/app.alurelab.com/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3040,
        AUTH_TRUST_HOST: 'true',
      },
    }],
  };
  ```

---

## 4. Struktur Direktori Proyek di Server

Sesuai aturan keamanan & integritas hosting Alurelab, terdapat pemisahan mutlak antara **Repository Bersih** dan **Direktori Operasional Domain**:

```
/home/alurelab/
├── repositories/
│   └── app_alurelab/          # [REPO BERSIH] HANYA untuk 'git pull origin main'.
│                              # DILARANG KERAS: npm install, build, artisan di sini!
│
├── app.alurelab.com/          # [DIREKTORI DOMAIN AKTIF]
│   ├── .htaccess              # Proxy rewrite rule ke port 3040
│   ├── backend/               # Core engine Laravel 11
│   ├── docs/                  # Dokumentasi arsitektur
│   └── frontend/              # Next.js 15 Source, node_modules, build & .env.local
│
└── public_html/               # [ROOT ALURELAB.COM]
    ├── .htaccess              # Proxy rewrite rule ke port 3040 (bypass /finance)
    └── finance/               # Legacy finance application (terlindungi)
```

---

## 5. Standar Operasional Prosedur (SOP) Deployment

Setiap pembaruan fitur, perbaikan kode, atau revisi desain wajib mengikuti siklus deployment 5 langkah berikut:

### Langkah 1: Push Perubahan dari Komputer Lokal
Lakukan commit dan pastikan seluruh perubahan sudah terdorong ke GitHub:
```bash
cd "/Users/10969sosho/PROJECTS/finance/PROJECT/PROJECT ANTIGRAVITY/ALURELAB"
git status
git add .
git commit -m "feat: deskripsi perubahan"
git push origin main
```

### Langkah 2: Masuk ke Server & Tarik Kode Terbaru
Login ke server via SSH dan perbarui repository lokal server:
```bash
ssh alurelab
cd ~/repositories/app_alurelab
git pull origin main
```

### Langkah 3: Salin File yang Berubah ke Direktori Domain (SOP Bebas Rsync)
Karena utilitas `rsync` tidak terpasang secara default pada environment cPanel, gunakan pipeline stream `tar` (atau `cp -r`) agar file ter-sync secara presisi tanpa menimpa konfigurasi `.env`, `storage`, atau build `.next`:
```bash
# Salin backend (kecualikan .env, storage, vendor, dan cache)
cd ~/repositories/app_alurelab/backend
tar --exclude="./.env" --exclude="./storage" --exclude="./vendor" --exclude="./bootstrap/cache/*.php" -cf - . | (cd ~/app.alurelab.com/backend && tar -xvf -)

# Salin frontend (kecualikan .env*, .next, dan node_modules)
cd ~/repositories/app_alurelab/frontend
tar --exclude="./.env*" --exclude="./.next" --exclude="./node_modules" -cf - . | (cd ~/app.alurelab.com/frontend && tar -xvf -)
```

### Langkah 4: Optimasi Backend Laravel & Database Migrations
Masuk ke direktori backend domain dan jalankan migrasi serta optimasi cache:
```bash
cd /home/alurelab/app.alurelab.com/backend
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache
```

### Langkah 5: Build Frontend & Restart Service PM2
Masuk ke direktori frontend domain, kompilasi Next.js, dan muat ulang process PM2:
```bash
cd /home/alurelab/app.alurelab.com/frontend
npm run build
pm2 reload alurelab-frontend || pm2 restart alurelab-frontend
pm2 save
```

### Langkah 6: Verifikasi Cron Scheduler Laravel
Pastikan crontab server menjalankan scheduler Laravel setiap menit untuk memproses release inventori kedaluwarsa (`app:release-expired-reservations`) dan antrean order:
```bash
* * * * * cd /home/alurelab/app.alurelab.com/backend && php artisan schedule:run >> /dev/null 2>&1
```

---

## 6. Perintah Manajemen Layanan PM2 (Quick Cheatsheet)

Aplikasi Next.js ALURELAB berjalan dengan nama service: **`alurelab-frontend`** (Port `3040`).

| Kebutuhan | Perintah Terminal (di SSH `alurelab`) |
| :--- | :--- |
| **Cek Status Service** | `pm2 list` atau `pm2 status` |
| **Cek Log Real-Time** | `pm2 logs alurelab-frontend` |
| **Cek 100 Baris Log Terakhir** | `pm2 logs alurelab-frontend --lines 100 --nostream` |
| **Restart Service** | `pm2 restart alurelab-frontend` |
| **Stop Service** | `pm2 stop alurelab-frontend` |
| **Simpan State Startup** | `pm2 save` |
| **Cek Respons Internal Port** | `curl -I http://127.0.0.1:3040` |

---

## 7. Prosedur Tanggap Darurat & Rollback (Disaster Recovery)

Sesuai aturan keamanan: **Setiap file konfigurasi atau domain memiliki cadangan `.bak`**.

Jika terjadi error fatal saat rilis baru:
1. **Rollback File Domain**:
   ```bash
   # Kembalikan backup folder sebelum rilis
   cp -r /home/alurelab/app.alurelab.com.bak_20260914/* /home/alurelab/app.alurelab.com/
   ```
2. **Rollback Git Commit di Server**:
   ```bash
   cd ~/repositories/app_alurelab
   git checkout HEAD~1
   cp -r ~/repositories/app_alurelab/frontend/src /home/alurelab/app.alurelab.com/frontend/
   cd /home/alurelab/app.alurelab.com/frontend
   npm run build
   pm2 restart alurelab-frontend
   ```
3. **Cek Log Error**:
   ```bash
   tail -n 50 /home/alurelab/logs/php.error.log
   pm2 logs alurelab-frontend --lines 50
   ```

---

## 8. Manajemen Database PostgreSQL 13.23 & Row-Level Security (RLS)

Database production berjalan pada PostgreSQL 13.23 lokal host:
- **Nama Database**: `alurelab_app`
- **Username**: `alurelab_appuser`
- **Tabel User**: Kolom kata sandi terdaftar sebagai `password_hash` (bukan `password`).
- **Aturan RLS Session Context**:
  Setiap operasi yang menyentuh tabel multi-tenant (seperti `products`, `orders`, `customers`) wajib menetapkan variabel session PostgreSQL sebelum mengeksekusi query:
  ```php
  DB::statement("SET app.current_tenant_id = '{$store->id}'");
  ```
  Jika session ini tidak di-set, PostgreSQL RLS policy akan memblokir mutasi data (0 rows affected atau RLS violation error).

---

## 9. Daftar Toko & Kredensial Pengujian Live di Production

| Toko / Merchant | Slug Toko | URL Storefront Publik | Akun Login Dashboard | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Kalmora Official** | `kalmora` | [https://app.alurelab.com/kalmora](https://app.alurelab.com/kalmora) | `hello@kalmora.id` | `password123` |
| **Hijab Mevvah Official** | `hijab-mevvah` | [https://app.alurelab.com/hijab-mevvah](https://app.alurelab.com/hijab-mevvah) | `amanda@hijabmevvah.com` | `password123` |
| **Vibe Sneakers Surabaya** | `vibe-sneakers` | [https://app.alurelab.com/vibe-sneakers](https://app.alurelab.com/vibe-sneakers) | `budi@vibesneakers.id` | `password123` |
