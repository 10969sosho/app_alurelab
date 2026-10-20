# ALURELAB VPS Production Deployment & Architecture Documentation

Dokumentasi resmi infrastruktur, konfigurasi, dan prosedur deployment untuk platform **Alurelab** (`alurelab.com` dan seluruh subdomainnya).

> [!IMPORTANT]
> **ATURAN INFRASTRUKTUR UTAMA**:
> - **Domain `alurelab.com` & semua subdomain (`app.alurelab.com`, `api.alurelab.com`, `*.alurelab.com`)**: **100% DI VPS DEDICATED** (`103.121.122.135`).
> - Jangan pernah mendeploy atau menghubungkan domain Alurelab ke hosting cPanel/LiteSpeed lagi.

---

## 1. Spesifikasi Server VPS

- **Host Alias SSH**: `alurelab-vps` (`ssh alurelab-vps`)
- **IP Address**: `103.121.122.135` (Port 22, User: `root`)
- **OS**: Ubuntu 24.04 LTS x86_64
- **Web Server**: NGINX 1.24.0 (Reverse proxy & SSL Let's Encrypt)
- **Database**: PostgreSQL 16 (`alurelab_production`) di port `5432`
- **Cache / Queue**: Redis 7 di port `6379` (localhost)
- **Process Manager**: 
  - Next.js: PM2 (`alurelab-frontend` running di port `3000`)
  - Laravel Worker: Supervisor (`alurelab-worker:alurelab-worker_00`, `_01`)
- **PHP**: PHP 8.4-FPM (`/run/php/php8.4-fpm.sock`)
- **Node.js**: Node 20 LTS

---

## 2. Struktur Direktori VPS (`/var/www/alurelab`)

| Path Direktori | Komponen | Deskripsi & Runtime |
| :--- | :--- | :--- |
| `/var/www/alurelab/landing` | **Landing Page** | Static HTML/CSS/JS (`alurelab.com`, `www.alurelab.com`) |
| `/var/www/alurelab/frontend` | **Merchant Portal & Storefront** | Next.js 15 App Router (`app.alurelab.com`, `*.alurelab.com`) via PM2 port 3000 |
| `/var/www/alurelab/backend` | **REST API Core** | Laravel 13 (`api.alurelab.com` & reverse proxy `app.alurelab.com/api/`) |

---

## 3. Mapping Domain & Routing NGINX

Konfigurasi aktif berada di `/etc/nginx/sites-available/alurelab.conf`:

```
Internet Request
  │
  ├── alurelab.com / www ──────> /var/www/alurelab/landing (Static HTML)
  │
  ├── api.alurelab.com ────────> /var/www/alurelab/backend/public (PHP 8.4-FPM)
  │
  └── app.alurelab.com / * ────┬──> /_next/static/ ──> Direct Nginx cache
                                ├──> /api/ ──────────> Proxy ke api.alurelab.com (Laravel)
                                └──> / (routes lain) ─> Proxy ke PM2 port 3000 (Next.js)
```

> `location ^~ /api/auth/` dan `location ^~ /api/wilayah/` harus diarahkan ke port 3000 sebelum aturan umum `/api/` ke Laravel. Auth.js dan dropdown alamat wilayah menggunakan route Next.js tersebut.

```nginx
location ^~ /api/auth/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host app.alurelab.com;
    proxy_set_header X-Forwarded-Proto https;
}

location ^~ /api/wilayah/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host app.alurelab.com;
    proxy_set_header X-Forwarded-Proto https;
}
```

---

## 4. Cara Deploy Cepat (SOP)

Semua proses deployment sudah diotomasi menggunakan script `./deploy.sh`:

### A. Deploy Backend Saja (Laravel API & Migrasi)
```bash
./deploy.sh backend
```
*Otomatis sync kode, composer install, migrate database, optimize route/config cache, set permission storage, dan restart supervisor worker.*

### B. Deploy Frontend Saja (Next.js Merchant & Storefront)
```bash
./deploy.sh frontend
```
*Otomatis sync kode, install npm dependencies, build Next.js di VPS, dan zero-downtime PM2 reload.*

### C. Deploy Landing Page Saja
```bash
./deploy.sh landing
```

### D. Deploy Keseluruhan (All-in-One)
```bash
./deploy.sh all
```

---

## 5. Monitoring & Perintah Berguna di VPS

```bash
# Cek status Next.js frontend
ssh alurelab-vps "pm2 status"
ssh alurelab-vps "pm2 logs alurelab-frontend --lines 50"

# Cek background worker Laravel
ssh alurelab-vps "supervisorctl status"

# Cek error log backend Laravel
ssh alurelab-vps "tail -n 50 /var/www/alurelab/backend/storage/logs/laravel.log"

# Cek error log Nginx
ssh alurelab-vps "tail -n 50 /var/log/nginx/error.log"

# Masuk ke Tinker Database
ssh alurelab-vps "cd /var/www/alurelab/backend && php artisan tinker"
```
