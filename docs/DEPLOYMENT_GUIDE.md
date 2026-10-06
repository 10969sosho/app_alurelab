# ARSITEKTUR & PANDUAN DEPLOYMENT ALURELAB (MODERN CLOUD)

Dokumen ini adalah referensi operasional tunggal mengenai arsitektur, cara deploy, alur update kode, dan monitoring ekosistem Alurelab (Frontend Next.js + Backend Laravel + Database + Cloudflare Tunnel).

---

## 1. Peta Arsitektur Sistem

Alurelab menggunakan arsitektur **Decoupled Cloud Architecture** (bebas dari batasan shared hosting/cPanel):

```
[ User Browser / Pengunjung ]
          │
          ├───► https://app.digitalblitar.com (Frontend / Landing Page / Dashboard)
          │         │
          │         ▼
          │   [ VERCEL EDGE CDN ]
          │   - Next.js 15 (React 19)
          │   - Global Edge Caching & SSR
          │   - Auto-deploy via GitHub (branch `main`, root `/frontend`)
          │
          └───► https://poco.digitalblitar.com/api/v1 (Backend REST API)
                    │
                    ▼
              [ CLOUDFLARE ZERO TRUST / TUNNEL ]
              - Hostname: poco.digitalblitar.com -> localhost:8000
              - SSL/TLS HTTPS otomatis, DDoS protection, Zero Egress Fee
                    │
                    ▼
              [ LINUX SERVER (Simulasi: hppoco / Produksi: VPS 4 vCPU 4-8GB) ]
              - PHP 8.4-FPM + Laravel Core
              - Redis Server (In-Memory Cache & Session)
              - MariaDB 11.8 (Database: `alurelab_db`)
              - Storage: S3 / Cloudflare R2 (Object Storage)
```

---

## 2. Rincian Komponen & Domain

| Komponen | Domain / URL | Lingkungan Host | Fungsi |
| :--- | :--- | :--- | :--- |
| **Frontend** | `https://app.digitalblitar.com` | **Vercel** | Landing page, onboarding toko, auth, seller dashboard, storefront |
| **Backend API** | `https://poco.digitalblitar.com` | **hppoco (Debian via Cloudflare Tunnel)** | API endpoints (`/api/v1/*`), auth API, checkout, webhooks |
| **Database** | Port `3306` (Internal) | **MariaDB Server** di host yang sama | Database `alurelab_db`, 14 tabel migrasi |
| **Cache/Queue**| Port `6379` (Internal) | **Redis Server** di host yang sama | Sesi login, caching query cepat |

---

## 3. Environment Variables Kunci

### A. Frontend (`frontend/.env.local` & Vercel Project Settings)
```env
NEXT_PUBLIC_APP_NAME=ALURELAB
NEXT_PUBLIC_ROOT_DOMAIN=digitalblitar.com
NEXT_PUBLIC_API_URL=https://poco.digitalblitar.com/api/v1
API_URL=https://poco.digitalblitar.com/api/v1
NEXTAUTH_SECRET=alurelab-secret-key-change-in-production-min-32-chars
NEXTAUTH_URL=https://app.digitalblitar.com
```

### B. Backend (`/home/alurelab/app/backend/.env`)
```env
APP_NAME=Alurelab
APP_ENV=production
APP_DEBUG=false
APP_URL=https://poco.digitalblitar.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=alurelab_db
DB_USERNAME=alurelab
DB_PASSWORD=alurelab123

CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database

# Object Storage (Cloudflare R2)
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=<R2_KEY>
AWS_SECRET_ACCESS_KEY=<R2_SECRET>
AWS_DEFAULT_REGION=auto
AWS_BUCKET=alurelab-media
AWS_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

---

## 4. SOP Update & Deployment (Alur Harian)

### A. Update Kode Frontend (Next.js)
Frontend terhubung langsung dengan **CI/CD Vercel**:
1. Lakukan perubahan kode pada folder `frontend/`.
2. Commit dan push ke branch `main`:
   ```bash
   git add frontend/
   git commit -m "feat(ui): update tampilan ..."
   git push origin main
   ```
3. Vercel akan otomatis mendeteksi commit baru, mem-build, dan mempublikasikan versi baru dalam ~60 detik tanpa downtime.

### B. Update Kode Backend (Laravel di Server)
1. Commit dan push perubahan backend dari lokal ke GitHub:
   ```bash
   git add backend/
   git commit -m "fix(api): update logic ..."
   git push origin main
   ```
2. Tarik update di server (hppoco / VPS):
   ```bash
   ssh hppoco "proot-distro login debian -- bash -c 'cd /home/alurelab/app/backend && git pull origin main && php artisan migrate --force && php artisan config:cache && php artisan route:cache'"
   ```

---

## 5. SOP Menjalankan Server Backend (`hppoco`)

Di server HP Poco, sudah disiapkan runner otomatis persistent di Termux:

### Cara Menjalankan Ulang Jika HP Restart:
1. Pastikan aplikasi Termux dibuka dan ketik perintah:
   ```bash
   ~/run-full-server.sh
   ```
2. Atau jalankan dari Mac via SSH:
   ```bash
   ssh hppoco "nohup ~/run-full-server.sh > ~/full-server.log 2>&1 &"
   ```

Script ini otomatis menjalankan:
* `termux-wake-lock` (menjaga CPU HP tidak sleep).
* MariaDB Server (`mariadbd`).
* Redis Server (`redis-server`).
* PHP-FPM 8.4 & Laravel API di port `8000`.
* Cloudflare Tunnel mengarah ke domain `poco.digitalblitar.com`.

---

## 6. Monitoring & Troubleshooting

### A. Monitoring Frontend (Vercel)
* **Dashboard:** [vercel.com](https://vercel.com) -> project `app-alurelab`.
* Buka tab **Deployments** untuk melihat status build.
* Buka tab **Logs** untuk memantau request dan error runtime.

### B. Monitoring Backend & Database (Server)
* **Cek Log Error Laravel:**
  ```bash
  ssh hppoco "proot-distro login debian -- tail -f /home/alurelab/app/backend/storage/logs/laravel.log"
  ```
* **Cek Status Service Berjalan:**
  ```bash
  ssh hppoco "ps aux | grep -E 'mariadbd|redis|php|cloudflared'"
  ```
* **Akses Database Visual (GUI):**
  Gunakan **TablePlus / DBeaver** di Mac:
  * Host: `100.101.194.87` (Tailscale) | Port: `3306`
  * User: `alurelab` | Pass: `alurelab123` | DB: `alurelab_db`

---

## 7. Cetak Biru Migrasi ke VPS Cloud Asli (Tahap 200 User Produksi)

Jika nanti ingin pindah dari `hppoco` ke VPS Cloud (Hetzner / DigitalOcean):
1. Sewa VPS Ubuntu/Debian spek **4 vCPU / 4–8 GB RAM**.
2. Install paket: `apt install mariadb-server redis-server nginx php8.4-fpm php8.4-mysql php8.4-redis`.
3. Export DB dari Poco: `mysqldump -u alurelab -p alurelab_db > backup.sql`, lalu import ke VPS.
4. Clone repo `app_alurelab` ke VPS dan setup Nginx ke domain `api.alurelab.com`.
5. Ubah `NEXT_PUBLIC_API_URL` di Vercel ke `https://api.alurelab.com/api/v1`.
6. **Selesai dalam 30 menit** tanpa merombak arsitektur sama sekali.
