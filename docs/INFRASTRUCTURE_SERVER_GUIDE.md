# INFRASTRUKTUR & DEPLOYMENT SOP: ALURELAB VS SHARED HOSTING EMERALD

> **PENTING / CRITICAL NOTE**:
> - Seluruh ekosistem **`alurelab.com`** dan semua subdomainnya (`api.alurelab.com`, `app.alurelab.com`, `*.alurelab.com`) **SUDAH TIDAK MENGGUNAKAN** shared hosting `alurelab` (Emerald).
> - **`alurelab.com` dkk. SUDAH PINDAH KE VPS DEDICATED KHUSUS**: `103.121.122.135` (`alurelab-vps`).
> - Shared hosting Emerald (`ssh alurelab`) **HANYA DIGUNAKAN** untuk domain-domain klien/proyek lain (`solusisurabaya.com`, `alureflow.com`, `3putraperkasa.com`, dll).

---

## 1. VPS KHUSUS: ALURELAB ECOSYSTEM (`alurelab-vps`)

Digunakan eksklusif untuk **Core Platform Alurelab**:

### Spesifikasi & Akses
- **Host Alias SSH**: `alurelab-vps`
- **IP**: `103.121.122.135`
- **Port**: `22`
- **User**: `root`
- **Identity**: `~/.ssh/id_ed25519`
- **OS**: Ubuntu 24.04 LTS (KVM 2 vCPU, 4 GB RAM, 40 GB SSD)
- **Web Server**: Nginx (Reverse Proxy & Static Serve)

### Struktur Direktori & Service di VPS
Path Root: `/var/www/alurelab/`
1. **Landing Page**:
   - Path: `/var/www/alurelab/landing`
   - Domain: `alurelab.com`, `www.alurelab.com`
   - Serve: Nginx static file
2. **Backend (Laravel API)**:
   - Path: `/var/www/alurelab/backend`
   - Domain: `api.alurelab.com`
   - Runtime: PHP 8.4-FPM + PostgreSQL 16 + Redis 7
   - Worker: Supervisor (`supervisorctl status alurelab-worker:*`)
3. **Frontend (Seller Dashboard, Storefront, CMS)**:
   - Path: `/var/www/alurelab/frontend`
   - Domain: `app.alurelab.com`, `*.alurelab.com`
   - Runtime: Next.js via PM2 (`alurelab-frontend` port 3000)

### Cara Deploy ke VPS Alurelab
Gunakan script otomatis `./deploy.sh` dari root project di local Mac:
```bash
# Deploy Frontend Next.js (Dashboard Seller, Storefront, CMS)
./deploy.sh frontend

# Deploy Backend Laravel API & Worker
./deploy.sh backend

# Deploy Landing Page HTML
./deploy.sh landing

# Deploy Semua Sekaligus
./deploy.sh all
```

**Mekanisme `./deploy.sh`**:
- Menggunakan `rsync` langsung ke `/var/www/alurelab/` (aman dari overhead git pull server).
- Mengabaikan `.env`, `node_modules`, `vendor`, `.git`, `.next`.
- Otomatis trigger `npm run build` & `pm2 reload alurelab-frontend` di VPS.

---

## 2. SHARED HOSTING: EMERALD (`alurelab`)

Digunakan untuk **Client Domains, Proyek Eksternal, dan Repositori Bersih**:

### Spesifikasi & Akses
- **Host Alias SSH**: `alurelab`
- **Hostname**: `emerald.hidden-server.net`
- **Port**: `31988`
- **User**: `alurelab`
- **Home**: `/home/alurelab/`

### SOP Deployment Domain Klien di Emerald
1. **Pull Git Bersih**:
   ```bash
   cd ~/repositories/<namaproject>
   git pull origin main
   ```
2. **Copy ke Web Root Domain**:
   ```bash
   rsync -avz --exclude='.git' ~/repositories/<namaproject>/ /home/alurelab/<namadomain>/
   ```
3. **Aturan Mutlak**:
   - **DILARANG KERAS** menjalankan migrate/build/npm/composer di dalam folder `~/repositories/`.
   - Segala operasi build, .env, migration **HANYA** boleh dilakukan di direktori domain target `/home/alurelab/<namadomain>/`.

### Daftar Domain Klien di Emerald
- `alureflow.com` (games, gym, photobox, app)
- `solusisurabaya.com` (digital, fashion, furniture, kawasaki, membership, qwe, salestech, yms)
- `3putraperkasa.com` (absplt, formula, payroll)
- `indirakp.com` & `dashboard.indirakp.com`
- Client mandiri: `gitarsakti.com`, `hakusaedu.com`, `hartinkadjar.com`, `jayapetir.com`, `jayapetir.online`, `jomotocenter.com`, `ptabadimp.com`, `ymiits.com`, `public_html`

---

## Ringkasan Matriks Keputusan Cepat

| Domain / Kebutuhan | Server Target | SSH Command | Metode Deploy |
|---|---|---|---|
| `alurelab.com`, `*.alurelab.com`, `app.alurelab.com`, `api.alurelab.com` | **Dedicated VPS (103.121.122.135)** | `ssh alurelab-vps` | `./deploy.sh {frontend\|backend\|landing}` |
| Domain Klien Lain (`solusisurabaya.com`, `alureflow.com`, dll) | **Shared Hosting Emerald** | `ssh alurelab` | Git pull `~/repositories/` lalu rsync ke domain target |
