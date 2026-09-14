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
| **SSH Alias** | `ssh alurelab` | Sudah terkonfigurasi di `~/.ssh/config` |
| **Node.js Runtime** | `v20.20.2` (via NVM) | `/home/alurelab/.nvm/versions/node/v20.20.2/bin/node` |
| **PHP Runtime** | `PHP 8.4.25` (alt-php84) | Mendukung Laravel 11 & Composer 2.10 |
| **Process Manager** | **PM2 v5.x** | Daemon manager aplikasi Node.js/Next.js |
| **Web Server** | **LiteSpeed Enterprise** | Menggunakan konfigurasi `.htaccess` |
| **Git Repository** | `https://github.com/10969sosho/app_alurelab.git` | Branch utama: `main` |

---

## 2. Pemetaan Domain & Subdomain (Domain Mapping)

Sistem ALURELAB menggunakan arsitektur pemisahan domain & reverse proxy internal:

```
[ INTERNET / USER BROWSER ]
           │
           ├───► https://alurelab.com ────────────┐
           │     (Platform Landing & Showcase)     │
           │                                       ▼
           ├───► https://app.alurelab.com ──► [ LITESPEED PROXY ] ──► [ PM2 Next.js (Port 3040) ]
           │     (Merchant Dashboard &             (.htaccess [P,L])         ├── /
           │      Storefront /[store_slug])                                  ├── /dashboard
           │                                                                 ├── /onboarding
           └───► https://alurelab.com/finance/                               ├── /[store_slug]
                 (Legacy App - Dikecualikan) ────────────────────────► [ Local PHP Handler ]
```

### Rincian Direktori Domain di Server:
1. **`alurelab.com`** ➔ Path: `/home/alurelab/public_html`
   - Berfungsi sebagai portal utama platform ALURELAB.
   - Dikonfigurasi reverse proxy ke port internal `3040` (Next.js).
   - **Penting**: Folder `/finance/` dan `/.well-known/` dikecualikan agar aplikasi internal tetap berjalan normal tanpa gangguan.
2. **`app.alurelab.com`** ➔ Path: `/home/alurelab/app.alurelab.com`
   - Berfungsi sebagai **Merchant Portal**, form pendaftaran **60s Onboarding**, dan **Dynamic Storefront** pembeli (`/[store_slug]`).
   - Dikonfigurasi reverse proxy ke port internal `3040` (Next.js).
3. **`api.alurelab.com`** (Tahap Lanjutan) ➔ Path: `/home/alurelab/api.alurelab.com`
   - Ditargetkan untuk melayani REST API Laravel 11 dan Webhook Xendit/Biteship.

---

## 3. Konfigurasi Reverse Proxy (.htaccess)

LiteSpeed Enterprise membaca instruksi proxy melalui flag `[P,L]` pada file `.htaccess`.

### 3.1 Konfigurasi `app.alurelab.com` (`/home/alurelab/app.alurelab.com/.htaccess`):
```apache
RewriteEngine On

# 1. Kecualikan sertifikat SSL Let's Encrypt / cPanel AutoSSL
RewriteCond %{REQUEST_URI} !^/\.well-known/

# 2. Reverse Proxy seluruh request ke port daemon Next.js PM2
# PERINGATAN: Variabel $1 wajib ada agar path CSS, JS chunks, dan dynamic routing diteruskan!
RewriteRule ^(.*)$ http://127.0.0.1:3040/$1 [P,L]
```

### 3.2 Konfigurasi `alurelab.com` (`/home/alurelab/public_html/.htaccess`):
```apache
RewriteEngine On

# 1. Kecualikan folder legacy finance dan sertifikat SSL
RewriteCond %{REQUEST_URI} ^/finance [OR]
RewriteCond %{REQUEST_URI} ^/\.well-known
RewriteRule ^ - [L]

# 2. Reverse Proxy ke Next.js ALURELAB
RewriteRule ^(.*)$ http://127.0.0.1:3040/$1 [P,L]

# BEGIN cPanel-generated php ini directives
<IfModule php8_module>
   php_value error_log "/home/alurelab/logs/php.error.log"
   php_flag log_errors On
</IfModule>
<IfModule lsapi_module>
   php_value error_log "/home/alurelab/logs/php.error.log"
   php_flag log_errors On
</IfModule>
# END cPanel-generated php ini directives
```

> [!CAUTION]
> **Peringatan Bash Heredoc**: Saat membuat atau mengedit `.htaccess` melalui skrip bash / SSH, pastikan menggunakan delimiter kutip tunggal (`cat << 'EOF'`) atau escape `\$1`. Jika tidak, bash akan mengevaluasi `$1` sebagai variabel kosong, yang menyebabkan seluruh aset CSS/JS dialihkan kembali ke HTML beranda (CSS tidak termuat).

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

### Langkah 3: Salin File yang Berubah ke Direktori Domain
Salin folder/file terbaru dari repositori ke direktori kerja domain tujuan:
```bash
# Salin source frontend
cp -r ~/repositories/app_alurelab/frontend/src /home/alurelab/app.alurelab.com/frontend/

# (Jika ada perubahan backend)
cp -r ~/repositories/app_alurelab/backend/app /home/alurelab/app.alurelab.com/backend/
```

### Langkah 4: Jalankan Build di Direktori Domain
Masuk ke folder frontend domain dan kompilasi Next.js:
```bash
cd /home/alurelab/app.alurelab.com/frontend
npm run build
```
*Pastikan output build menampilkan tanda centang hijau `✓ Compiled successfully`.*

### Langkah 5: Restart Service PM2 & Simpan State
Muat ulang proses Node.js tanpa downtime dan simpan konfigurasi PM2:
```bash
pm2 restart alurelab-frontend
pm2 save
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
