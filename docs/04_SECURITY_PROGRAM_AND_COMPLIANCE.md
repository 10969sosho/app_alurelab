# 🛡️ 04: SECURITY PROGRAM, COMPLIANCE & DISASTER RECOVERY
### *Standar Keamanan Tingkat Finansial (Financial-Grade Security Program)*

Dokumen ini mendefinisikan arsitektur keamanan, mitigasi risiko data bocor antar-tenant, proteksi transaksi, serta prosedur pemulihan bencana (*disaster recovery*) untuk ALURELAB.

---

## 1. Matriks Vektor Serangan & Mitigasi Risiko

| Vektor Ancaman | Dampak Potensial | Protokol Mitigasi ALURELAB |
| :--- | :--- | :--- |
| **Cross-Tenant Data Leak (IDOR)** | Toko A bisa mengintip pesanan, data pembeli, atau omzet Toko B | **PostgreSQL Row Level Security (RLS)** dipaksakan di level kernel database. Kueri SQL otomatis terisolasi oleh session variable `app.current_tenant_id`. |
| **Fake Payment Webhook Spoofing** | Hacker menembak webhook palsu untuk menandai pesanan lunas tanpa transfer uang | Verifikasi header `x-callback-token` kriptografis resmi Xendit + validasi silang via API lookup langsung ke Xendit sebelum mengubah status pesanan. |
| **Flash Sale Race Condition (Overselling)** | Stok barang minus karena puluhan orang checkout di milidetik yang sama | **Redis In-Memory Atomic Lock (`DECRBY`)**; menolak request berlebih secara deterministik dalam waktu < 2ms. |
| **Pembobolan Akun Merchant (Payout Fraud)** | Peretas menarik saldo dompet toko ke rekening asing | **MFA / OTP WhatsApp wajib** saat mengubah nomor rekening bank pencairan dana + *cooldown period* 24 jam setelah perubahan rekening. |
| **DDoS & Scraping Katalog** | Server down akibat serangan bot kompetitor atau scraping harga | Proteksi Cloudflare WAF, proteksi bot managed rules, dan HTTP Rate Limiting ketat (100 request/menit per IP). |
| **Replay Attack Webhook** | Webhook yang sama dieksekusi berulang untuk mencairkan saldo ganda | **Tabel Idempotency Key**: setiap `event_id` webhook disimpan di database; jika duplikat terdeteksi, langsung diabaikan. |

---

## 2. Isolasi Data Multi-Tenant: PostgreSQL Row Level Security (RLS)

Keamanan pemisahan data tidak boleh hanya bertumpu pada kode aplikasi (PHP/Laravel), melainkan wajib dijaga oleh lapisan terdalam: **Database Engine**.

### Cara Kerja RLS di ALURELAB:
1. Setiap tabel transaksional (`orders`, `products`, `customers`, `wallets`, `shipments`) memiliki kolom `tenant_id UUID NOT NULL`.
2. PostgreSQL mengaktifkan RLS:
   ```sql
   ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
   ALTER TABLE orders FORCE ROW LEVEL SECURITY;
   ```
3. Dibuat Policy Isolasi:
   ```sql
   CREATE POLICY tenant_isolation_policy ON orders
       FOR ALL
       USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
   ```
4. Saat koneksi database dibuka oleh Laravel Middleware:
   ```php
   DB::statement("SET LOCAL app.current_tenant_id = '{$currentStore->id}'");
   ```
5. **Jaminan Keamanan**: Jika seorang developer pemula lupa menambahkan `where('tenant_id', ...)` di query controller, database PostgreSQL akan **SECARA OTOMATIS MENYARING DATA** sehingga hanya data milik tenant aktif yang bisa dibaca atau dimodifikasi. Data toko lain tidak akan pernah bocor!

---

## 3. Autentikasi & Otorisasi Berjenjang

### 3.1 Token Keamanan (Laravel Sanctum)
- **Token Scope Terbatas**: Token API dashboard merchant memiliki izin terpisah (`orders:read`, `products:write`, `finance:withdraw`).
- **Short-Lived Expiration**: Token sesi dashboard kadaluarsa dalam 7 hari tanpa aktivitas.
- **Hashing Password**: Menggunakan algoritma **Argon2id** (standar industri paling tahan terhadap serangan GPU cracking), bukan Bcrypt biasa.

### 3.2 Role-Based Access Control (RBAC)
- **Superadmin (Tim Internal ALURELAB)**: Manajemen sistem, monitoring gateway, audit penipuan (tidak bisa melihat saldo rekening pribadi merchant).
- **Store Owner**: Akses penuh ke toko, pengaturan pembayaran, penarikan dana, dan integrasi API.
- **Store Staff (Admin CS / Packing)**: Hanya bisa memproses pesanan, cetak resi thermal, dan balas chat; **DILARANG MELIHAT SALDO DOMPET ATAU MELAKUKAN PENARIKAN DANA**.

---

## 4. Keamanan Finansial & Pencegahan Fraud

### 4.1 Kebijakan Anti-Money Laundering (AML) & Velocity Check
Sistem otomatis membekukan penarikan dana (*payout freeze*) jika terdeteksi anomali:
- Terjadi lonjakan transaksi > 500% dalam waktu 24 jam pada toko baru yang belum berumur 14 hari.
- Terjadi penarikan dana berkali-kali ke 3 rekening bank berbeda dalam waktu kurang dari 6 jam.
- Tiket dispute pembeli melebihi 5% dari total pesanan mingguan.

### 4.2 Audit Logging Finansial yang Tidak Dapat Dihapus (Append-Only)
Setiap mutasi dana di tabel `wallet_transactions` dicatat menggunakan arsitektur **Append-Only Ledger**:
- Baris data mutasi saldo tidak pernah di-UPDATE atau di-DELETE.
- Jika terjadi koreksi dana, sistem menambahkan baris baru bertipe `ADJUSTMENT` atau `REFUND`.
- Kolom `hash` dihitung secara berantai (merkle-like chain): `sha256(previous_hash + transaction_id + amount + timestamp)` untuk mendeteksi jika ada pihak yang memanipulasi database secara langsung.

---

## 5. Keamanan Infrastruktur Server & Jaringan

```
[ INTERNET ]
     │
     ▼
[ CLOUDFLARE WAF ] (DDoS Mitigation, Bot Fight Mode, TLS 1.3 Only)
     │
     ▼ (Hanya menerima traffic dari IP Range Cloudflare)
[ UFW FIREWALL LINUX ]
├── Port 80, 443 (HTTP/HTTPS Cloudflare Only)
├── Port 22 (SSH Key Ed25519 Only, Port Non-Standar 31988, Password Auth DISABLED)
└── Port 5432, 6379 (CLOSED TO PUBLIC - Localhost / Docker Network Only)
     │
     ▼
[ NGINX REVERSE PROXY ] -> [ DOCKER APP CONTAINERS ]
```

### Konfigurasi HTTP Security Headers Wajib:
```nginx
# /etc/nginx/conf.d/security_headers.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

---

## 6. Rencana Pemulihan Bencana (Disaster Recovery & Backup)

Sesuai aturan operasional wajib: **Setiap perubahan kode dan data harus memiliki cadangan yang bisa di-rollback seketika.**

### 6.1 Jadwal Backup Otomatis (Automated Backup Policy)
1. **Database PostgreSQL**:
   - **Continuous WAL Archiving**: Point-in-Time Recovery (PITR) aktif untuk pemulihan data hingga menit terakhir.
   - **Snapshot Harian**: `pg_dump` otomatis setiap pukul 02:00 WIB terenkripsi AES-256 dan diunggah ke Cloudflare R2 terpisah lintas region.
   - **Retensi Cadangan**: 30 hari snapshot harian, 12 bulan snapshot bulanan.
2. **Media Produk (Foto Katalog)**:
   - Tersimpan di Cloudflare R2 dengan fitur *Object Versioning* aktif (mencegah foto terhapus tidak sengaja).
3. **Repository Kode**:
   - Git repository terpusat dengan branch protection pada `main` dan `production`.
   - Wajib lolos Automated CI Test sebelum merge.

### 6.2 Service Level Agreement Pemulihan (RTO & RPO):
- **Recovery Point Objective (RPO)**: **< 15 Menit** (Maksimal data transaksi yang boleh hilang saat server induk hancur adalah 15 menit terakhir).
- **Recovery Time Objective (RTO)**: **< 1 Jam** (Sistem harus sudah bisa kembali online dan melayani transaksi dalam kurun waktu 60 menit setelah server pengganti disiapkan).

### 6.3 Prosedur Rollback Cepat (Emergency Rollback Protocol)
Jika terjadi insiden rilis kode yang menyebabkan error fatal:
```bash
# Script Rollback 1-Perintah di Server
cd /var/www/alurelab-core
docker compose exec app php artisan down --secret="emergency-bypass-key"
git checkout HEAD~1
docker compose exec app composer install --no-dev --optimize-autoloader
docker compose exec app php artisan migrate:rollback --step=1
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan up
```
