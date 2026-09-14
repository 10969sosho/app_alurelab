# 🏪 08: PRODUCT DOCS — SELLER DASHBOARD
### *Spesifikasi Lengkap Semua Fitur & Halaman untuk Merchant/Penjual*

> Status: Referensi design production-ready
> Benchmark: Shopee Seller Center, Tokopedia Seller, Shopify Admin — disesuaikan untuk ALURELAB

---

## STRUKTUR NAVIGASI DASHBOARD (URL Map)

```
/dashboard/                          → Overview & Analytics
/dashboard/products/                 → Daftar Produk
/dashboard/products/new/             → Tambah Produk Baru
/dashboard/products/[id]/edit/       → Edit Produk
/dashboard/products/[id]/variants/   → Kelola Varian
/dashboard/orders/                   → Semua Pesanan
/dashboard/orders/[id]/              → Detail Pesanan
/dashboard/customers/                → Data Pelanggan
/dashboard/promotions/               → Kelola Promo & Voucher
/dashboard/promotions/flash-sale/    → Flash Sale Management
/dashboard/shipping/                 → Pengaturan Pengiriman
/dashboard/finance/                  → Keuangan & Dompet
/dashboard/finance/withdraw/         → Tarik Dana
/dashboard/analytics/                → Laporan & Analitik
/dashboard/settings/                 → Pengaturan Toko
/dashboard/settings/store/           → Info & Identitas Toko
/dashboard/settings/payment/         → Pengaturan Pembayaran
/dashboard/settings/notifications/   → Notifikasi WhatsApp
/dashboard/settings/domain/          → Custom Domain
/dashboard/settings/team/            → Manajemen Tim/Staff
/dashboard/subscription/             → Paket Langganan
```

---

## LAYOUT DASHBOARD

### Sidebar (Desktop) / Bottom Navigation (Mobile)

**Menu Utama:**
```
📊 Dashboard        /dashboard/
📦 Produk           /dashboard/products/
🛒 Pesanan          /dashboard/orders/     [badge: jumlah pesanan baru]
👥 Pelanggan        /dashboard/customers/
🏷️ Promo            /dashboard/promotions/
🚚 Pengiriman       /dashboard/shipping/
💰 Keuangan         /dashboard/finance/    [badge: saldo tersedia]
📈 Analitik         /dashboard/analytics/
⚙️ Pengaturan       /dashboard/settings/
```

**Header Bar:**
- Logo ALURELAB
- Nama toko + slug aktif
- Notifikasi bell (badge unread count)
- User avatar + dropdown (Profile | Logout)
- Tombol "Lihat Toko" → buka storefront di tab baru

---

## HALAMAN 1: OVERVIEW / DASHBOARD (`/dashboard/`)

### Metric Cards (Top Row)
| Metrik | Icon | Perubahan vs kemarin |
|--------|------|---------------------|
| Total Penjualan Hari Ini | 💰 | +12% ↑ |
| Pesanan Baru | 🛒 | +5 ↑ |
| Produk Aktif | 📦 | — |
| Pengunjung Toko | 👁️ | +8% ↑ |

### Grafik Penjualan (Line/Bar Chart)
- Toggle: Hari ini | 7 Hari | 30 Hari | 3 Bulan
- Dual axis: Revenue (bar) + Order count (line)
- Powered by Recharts

### Pesanan Perlu Aksi (Priority Queue)
```
🔴 Menunggu Konfirmasi    [3 pesanan]  [Proses Semua]
🟡 Menunggu Pembayaran    [7 pesanan]  [Lihat]
🚚 Siap Kirim             [5 pesanan]  [Cetak Label]
```

### Produk Stok Hampir Habis
- Tabel: Nama produk | Varian | Stok sisa
- Badge merah jika stok < 5
- CTA "Update Stok" per row

### Pesanan Terbaru (Last 10)
- Mini tabel: No. Pesanan | Nama | Status | Total | Aksi

### Quick Stats (Bulan Ini)
- Omset bulan ini: Rp X.XXX.XXX
- Total pesanan: XXX
- Pesanan selesai: XX%
- RTS rate: X% (indikator kesehatan)
- Rating toko rata-rata: ⭐ X.X

---

## HALAMAN 2: MANAJEMEN PRODUK (`/dashboard/products/`)

### Filter & Search Bar
- Search: nama produk / SKU
- Filter: Semua | Aktif | Non-aktif | Stok Habis | Draft
- Filter Kategori
- Sort: Terbaru | Terlama | Harga | Stok | Terlaris

### Tabel Produk

| Gambar | Nama | Kategori | Harga | Stok | Status | Aksi |
|--------|------|----------|-------|------|--------|------|
| thumbnail | Hijab Voal Premium | Hijab | Rp 89.000 | 142 | ✅ Aktif | [Edit][Non-aktif][Hapus] |
| thumbnail | Pashmina Ceruti | Hijab | Rp 65.000 | 0 | ⚠️ Habis | [Edit][Aktifkan][Hapus] |

### Bulk Actions
- Centang multiple → "Aktifkan Semua" | "Non-aktifkan" | "Hapus" | "Update Stok"

### Tombol "Tambah Produk Baru" → `/dashboard/products/new/`

---

## HALAMAN 3: FORM TAMBAH / EDIT PRODUK (`/dashboard/products/new/`)

> Form paling kompleks, breakdown lengkap tiap field:

### Section 1: Informasi Dasar

| Field | Type | Keterangan |
|-------|------|------------|
| Nama Produk * | Text input | Max 255 karakter |
| Slug / URL Produk | Auto-generate dari nama, editable | Lowercase, hyphen |
| Kategori | Select dropdown + "Tambah baru" | Single select |
| Deskripsi Produk | Rich Text Editor (Tiptap/Quill) | Support bold, list, gambar |
| Tags | Tag input | Untuk SEO & filter |

**🤖 AI Assist Button** (per field):
- "Generate Deskripsi" → OpenAI GPT-4o-mini buat deskripsi persuasif
- "Generate Tags SEO" → AI hasilkan tag relevan
- Input: nama produk + kategori → output: teks siap pakai

### Section 2: Media / Foto Produk

- **Upload Zone**: Drag & drop atau klik browse
- Max 10 foto + 1 video
- Supported: JPG, PNG, WEBP, MP4
- Max per file: 10MB foto, 50MB video
- Preview grid dengan drag-to-reorder (@dnd-kit)
- **Set Foto Utama**: klik bintang ⭐ di foto
- **🤖 AI Photo Studio Button**:
  - "Remove Background" → Replicate API (RMBG-2.0)
  - "Buat Mockup" → AI generate foto produk on model/background
- Upload langsung ke Cloudflare R2 via presigned URL

### Section 3: Harga & Stok (Tanpa Varian)

| Field | Type | Keterangan |
|-------|------|------------|
| Harga Jual * | Currency input (Rp) | Harga yang ditampilkan |
| Harga Coret | Currency input (Rp) | Harga sebelum promo |
| Harga Modal | Currency input (Rp) | Untuk kalkulasi profit (tidak tampil ke buyer) |
| Stok * | Number input | — |
| SKU | Text input | Kode unik internal |
| Berat (gram) * | Number input | Untuk kalkulasi ongkir |
| Dimensi (cm) | L × W × H inputs | Opsional, untuk ongkir box |

### Section 4: Varian Produk (Toggle ON/OFF)

Jika produk punya varian (warna, ukuran, dll):

**Definisi Opsi Varian:**
```
Opsi 1: Warna        [Merah] [Hitam] [Putih] [+ Tambah]
Opsi 2: Ukuran       [S] [M] [L] [XL] [XXL] [+ Tambah]
Opsi 3: (opsional)   ...
```

**Tabel Varian (Auto-generated dari kombinasi):**
| Varian | SKU | Harga | Stok | Gambar Khusus | Aksi |
|--------|-----|-------|------|---------------|------|
| Merah / S | ... | Rp 89.000 | 25 | [Upload] | [Hapus] |
| Merah / M | ... | Rp 89.000 | 30 | — | [Hapus] |
| Hitam / XL | ... | Rp 95.000 | 5 | [Upload] | [Hapus] |

- Bulk edit: centang semua → "Isi harga yang sama" | "Isi stok yang sama"

### Section 5: Pengiriman

| Field | Type | Keterangan |
|-------|------|------------|
| Berat Produk (gram) * | Number | Digunakan Biteship |
| Dimensi Paket (cm) | L × W × H | Opsional |
| Gratis Ongkir | Toggle | Jika aktif, ongkir ditanggung toko |
| Kurir Tersedia | Multi-checkbox | SiCepat, J&T, JNE, AnterAja, COD |

### Section 6: SEO & Metadata (Collapsible Advanced)

| Field | Keterangan |
|-------|------------|
| Meta Title | Default: nama produk, max 60 char |
| Meta Description | Default: 160 char pertama deskripsi |
| Canonical URL | Auto, editable |

### CTA Buttons
- **"Simpan & Aktifkan"** → publish langsung
- **"Simpan sebagai Draft"** → simpan, tidak tampil di toko
- **"Preview Produk"** → buka tab baru ke storefront (preview mode)
- "Batalkan"

---

## HALAMAN 4: MANAJEMEN PESANAN (`/dashboard/orders/`)

### Filter Tabs (Sticky)
```
[Semua (150)] [Baru (3)] [Dikonfirmasi (12)] [Diproses (5)] [Dikirim (28)] [Selesai (97)] [Dibatalkan (5)]
```

### Filter Tambahan
- Range tanggal (date picker)
- Kurir: SiCepat | J&T | JNE | Semua
- Metode bayar: QRIS | VA | COD | Semua
- Search: nomor pesanan / nama pembeli / nomor resi

### Tabel Pesanan

| No. Pesanan | Pembeli | Produk | Total | Status | Kurir / Resi | Tanggal | Aksi |
|-------------|---------|--------|-------|--------|--------------|---------|------|
| ORD-240914-0012 | Dewi R. | Hijab Voal (2) | Rp 178.000 | 🟡 Diproses | SiCepat — | 14 Sep | [Detail][Proses] |
| ORD-240913-0089 | Ahmad S. | Pashmina (1) | Rp 65.000 | 🚚 Dikirim | JNE JT1234 | 13 Sep | [Detail][Tracking] |

### Bulk Actions
- Centang multiple pesanan "Dikirim" → "Cetak Label Semua (PDF)"
- Centang pesanan baru → "Konfirmasi & Proses"

---

## HALAMAN 5: DETAIL PESANAN (`/dashboard/orders/[id]/`)

### Header
- Nomor pesanan + tanggal + status badge
- Tombol aksi utama sesuai status (lihat State Machine)

### State Machine & Tombol Aksi:

| Status Saat Ini | Tombol Aksi Tersedia |
|-----------------|---------------------|
| Menunggu Pembayaran | "Batalkan Pesanan" |
| Pembayaran Diterima | **"Proses Pesanan"** (konfirmasi ke processing) |
| Diproses | **"Buat Pengiriman"** (pilih kurir, generate resi) |
| Dikirim | "Lihat Tracking" | "Cetak Label" |
| Selesai | "Lihat Invoice" |
| RTS / Dikembalikan | "Laporan RTS" |

### Panel Kiri: Info Pembeli & Pengiriman

**Data Pembeli:**
- Nama lengkap
- Nomor WhatsApp (tap → buka WA)
- Email

**Alamat Pengiriman:**
- Alamat lengkap
- Tombol "Copy Alamat"

**Info Pengiriman:**
- Kurir + layanan
- Nomor resi (jika sudah ada)
- Status tracking terkini
- Link "Cetak Label Thermal" (PDF 100×150mm)

### Panel Tengah: Item Pesanan

Tabel item:
| Gambar | Produk | Varian | Qty | Harga Satuan | Subtotal |
|--------|--------|--------|-----|--------------|---------|

### Panel Kanan: Ringkasan Finansial

```
Subtotal Produk:          Rp 178.000
Ongkir:                    Rp 15.000
Asuransi:                   Rp 2.000
Diskon Voucher:            -Rp 20.000
──────────────────────────────────────
Total Pembayaran:          Rp 175.000
Platform Fee (1.5%):        -Rp 2.625
──────────────────────────────────────
Net Anda:                  Rp 172.375
```

### Panel: History Log Pesanan
Timeline events:
```
✅ 14 Sep 15:30  Pembayaran QRIS dikonfirmasi (Xendit)
✅ 14 Sep 10:00  Pesanan dibuat
```

### Tombol Tambahan
- "Hubungi Pembeli via WA"
- "Print Invoice PDF"
- "Tandai Masalah" (eskalasi ke support)

---

## HALAMAN 6: MANAJEMEN PENGIRIMAN (`/dashboard/shipping/`)

### Tab: Pengaturan | Riwayat Pengiriman | Pickup Schedule

### Tab Pengaturan

**Origin Toko (Alamat Asal Pickup)**
- Nama penanggung jawab
- Nomor WA (untuk koordinasi kurir)
- Alamat lengkap (dengan area picker Biteship)

**Kurir yang Aktif**
| Kurir | Layanan | COD? | Status |
|-------|---------|------|--------|
| ☑ SiCepat | BEST, REG | ✅ | Aktif |
| ☑ J&T | EZ, JTR | ✅ | Aktif |
| ☑ JNE | REG, YES | ❌ | Aktif |
| ☑ AnterAja | REG | ✅ | Aktif |
| ☐ Pos Indonesia | Biasa | ❌ | — |

**Pengaturan COD**
- Toggle: Aktifkan COD
- Minimum order COD: Rp X.XXX
- Maksimum order COD: Rp X.XXX
- COD tidak tersedia untuk: (area blacklist)

**Pengaturan Ongkir**
- Toggle: Gratis ongkir untuk semua produk
- Atau: Gratis ongkir jika belanja ≥ Rp X.XXX
- Markup ongkir: +X% dari Biteship (untuk keuntungan logistik)

### Tab Riwayat Pengiriman
- Tabel semua shipment dengan filter status tracking
- Export ke Excel

### Tab Pickup Schedule
- Jadwal pickup SiCepat / J&T hari ini/besok
- Status: Menunggu Dijemput / Sudah Dijemput

---

## HALAMAN 7: MANAJEMEN PROMO (`/dashboard/promotions/`)

### Tab: Voucher | Flash Sale | Produk Diskon

### Tab Voucher

**Daftar Voucher Aktif**
| Kode | Tipe Diskon | Nilai | Min. Belanja | Pakai/Limit | Berlaku Sampai | Status |
|------|------------|-------|-------------|-------------|----------------|--------|
| WELCOME20 | Persentase | 20% | Rp 100.000 | 45/100 | 31 Des 2026 | ✅ |
| FREESHIP | Ongkir Gratis | 100% | Rp 50.000 | 12/50 | 30 Sep 2026 | ✅ |

**Form Buat Voucher Baru:**

| Field | Type | Keterangan |
|-------|------|------------|
| Kode Voucher * | Text (uppercase) | Atau "Auto-generate" |
| Tipe Diskon * | Radio: Persentase | Nominal | Gratis Ongkir |
| Nilai Diskon * | Number (%) atau Rp | — |
| Maksimum Diskon | Rp (untuk tipe %) | Misal: max diskon Rp 50.000 |
| Minimum Belanja | Rp | — |
| Limit Penggunaan | Number | Kosong = unlimited |
| Limit per User | 1 kali | Toggle |
| Berlaku Mulai | Date-time picker | — |
| Berlaku Sampai | Date-time picker | — |
| Produk Berlaku | Semua | Pilih produk tertentu |
| Status | Aktif / Draft | — |

### Tab Flash Sale

**Buat Flash Sale:**

| Field | Keterangan |
|-------|------------|
| Nama Event | "Flash Sale Weekend!" |
| Waktu Mulai | Date-time picker |
| Waktu Selesai | Date-time picker |

**Pilih Produk Flash Sale:**
- Checkbox produk dari katalog
- Per produk: set harga flash sale + stok khusus flash sale
- Stok flash sale bisa < stok total (misal: 50 dari 200 total untuk flash sale)

### Tab Diskon Produk Reguler
- Bulk set `compare_at_price` (harga coret) untuk beberapa produk sekaligus
- Atur periode diskon per produk

---

## HALAMAN 8: KEUANGAN & DOMPET (`/dashboard/finance/`)

### Metric Cards

| Saldo Tersedia | Saldo Ditahan (Escrow) | Total Omset Bulan Ini | Total Penarikan Bulan Ini |
|---------------|----------------------|----------------------|--------------------------|
| Rp 2.350.000 | Rp 875.000 | Rp 15.200.000 | Rp 12.000.000 |

- Tooltip "Saldo Ditahan": "Dana dari pesanan yang belum dikonfirmasi diterima"

### Tombol "Tarik Dana" (jika saldo > Rp 10.000)

### Riwayat Mutasi Dompet (Ledger)

| Tanggal | Keterangan | Tipe | Jumlah | Saldo |
|---------|-----------|------|--------|-------|
| 14 Sep 15:30 | Pesanan ORD-240914-0012 | Kredit (Escrow) | +Rp 172.375 | Rp 2.350.000 |
| 14 Sep 10:00 | Penarikan ke BCA *789 | Debit | -Rp 500.000 | Rp 2.177.625 |

Filter: Semua | Kredit | Debit | Penarikan | Range tanggal
Export ke Excel

### Tab: Tarik Dana (`/dashboard/finance/withdraw/`)

**Form Penarikan:**

| Field | Keterangan |
|-------|------------|
| Jumlah Tarik * | Input Rp (min. Rp 10.000) |
| Bank Tujuan * | BCA / Mandiri / BRI / BNI / dll |
| Nomor Rekening * | Input angka |
| Nama Pemilik Rekening * | Sesuai buku tabungan |
| Catatan | Opsional |

- **Biaya Transfer**: Rp 3.000
- **Estimasi Masuk**: Hari ini (jika < 15.00 WIB) / Besok
- Simpan rekening sebagai favorit
- Riwayat penarikan (tabel)

---

## HALAMAN 9: DATA PELANGGAN (`/dashboard/customers/`)

> Hanya data pelanggan yang pernah order di toko ini.

### Tabel Pelanggan

| Nama | No. WA | Total Order | Total Belanja | Risk Score | Terakhir Order | Aksi |
|------|--------|-------------|--------------|------------|----------------|------|
| Dewi R. | +62812*** | 5 | Rp 875.000 | 🟢 Rendah (5) | 14 Sep | [Detail] |
| Ahmad S. | +62821*** | 1 | Rp 65.000 | 🟢 Rendah (0) | 13 Sep | [Detail] |
| (blacklist) | +62813*** | 3 | Rp 200.000 | 🔴 Tinggi (85) | 5 Sep | [Detail] |

### Detail Pelanggan
- Profil: nama, WA, email, alamat default
- Risk score breakdown (COD risk)
- Riwayat pesanan di toko ini
- Tombol "Kirim Pesan WA"
- Tombol "Blacklist Pelanggan" (untuk COD)

### Export
- Export daftar pelanggan ke Excel / CSV

---

## HALAMAN 10: ANALITIK (`/dashboard/analytics/`)

### Traffic & Conversion
- Pengunjung toko per hari (line chart)
- Sumber traffic (direct, WhatsApp, Instagram, TikTok)
- Conversion rate: pengunjung → order
- Bounce rate per halaman

### Laporan Penjualan
- Omset per periode (bar chart)
- Produk terlaris (ranking table)
- Kategori terlaris
- Rata-rata nilai order (AOV)

### Laporan Keuangan
- Revenue vs Platform Fee vs Profit bersih
- Ongkir total dibayar pembeli vs actual
- Refund & pembatalan

### Laporan Pengiriman
- Volume per kurir
- RTS rate per kurir
- COD success rate

### Export
- Semua laporan bisa export Excel / PDF
- Periode: Hari ini | Minggu ini | Bulan ini | Custom range

---

## HALAMAN 11: PENGATURAN TOKO (`/dashboard/settings/`)

### Tab: Profil Toko

| Field | Keterangan |
|-------|------------|
| Nama Toko * | — |
| Deskripsi Toko | Singkat, tampil di about toko |
| Logo Toko | Upload (min 200×200px) |
| Banner Homepage | Upload (max 5 banner, 1920×600px) |
| Nomor WhatsApp * | Untuk tombol "Chat Penjual" |
| Email Toko | — |
| Alamat Lengkap | Kota/Kabupaten (untuk origin ongkir) |
| Jam Operasional | Waktu buka–tutup per hari |

### Tab: Pengaturan Pembayaran

- Status Xendit (terkoneksi / tidak)
- Metode pembayaran yang aktif (toggle per metode)
- Rekening bank terdaftar (untuk withdraw)
- Riwayat disbursement

### Tab: Notifikasi

| Notifikasi | WhatsApp | Email |
|-----------|----------|-------|
| Pesanan baru masuk | ✅ | ☑ |
| Pembayaran dikonfirmasi | ✅ | — |
| Pesanan selesai | ☑ | — |
| Stok produk < 5 | ✅ | — |
| RTS / Retur pesanan | ✅ | ✅ |

### Tab: Custom Domain

1. Input custom domain: `tokosaya.com`
2. Status: Pending / Aktif / Error
3. Panduan DNS: "Tambahkan CNAME record berikut ke DNS Anda"
   ```
   Tipe: CNAME
   Nama: www (atau @)
   Target: cname.alurelab.shop
   TTL: Auto
   ```
4. SSL status (otomatis dari Cloudflare)

### Tab: Manajemen Tim

**Daftar Anggota:**
| Nama | Email | Role | Status |
|------|-------|------|--------|
| Budi (Owner) | budi@... | Owner | — |
| Siti | siti@... | Manager | Aktif |

**Undang Anggota:**
- Input email
- Pilih role: Manager | Staff Order

**Role Permissions:**
| Akses | Owner | Manager | Staff Order |
|-------|-------|---------|-------------|
| Produk (CRUD) | ✅ | ✅ | ❌ |
| Pesanan (lihat & proses) | ✅ | ✅ | ✅ |
| Keuangan | ✅ | Lihat saja | ❌ |
| Pengaturan | ✅ | ❌ | ❌ |

---

## HALAMAN 12: PAKET LANGGANAN (`/dashboard/subscription/`)

| Paket | Harga/bulan | Produk | Pesanan/bulan | AI Features | Custom Domain | Badge |
|-------|------------|--------|---------------|-------------|---------------|-------|
| **Starter** | Rp 99.000 | 50 | 200 | ❌ | ❌ | — |
| **Pro** | Rp 249.000 | Unlimited | Unlimited | ✅ | ✅ | ⭐ Popular |
| **Business** | Rp 599.000 | Unlimited | Unlimited | ✅ Priority | ✅ + Multi | 🚀 |

- Tanggal perpanjangan & status
- Tombol "Upgrade Paket"
- Riwayat pembayaran langganan
- Pembayaran via QRIS / VA

---

## NOTIFIKASI & ALERT SISTEM

### Jenis Notifikasi (Bell icon):
- 🛒 Pesanan baru dari [nama pembeli]
- 💰 Pembayaran dikonfirmasi untuk ORD-XXXX
- ⚠️ Stok [produk] hampir habis (tersisa 3)
- 🚚 Resi JNE XXXX sudah tergenerate
- 📦 Pesanan ORD-XXXX berhasil diterima pembeli
- ↩️ Pesanan ORD-XXXX dikembalikan (RTS)
- 🔔 Saldo dompet berhasil ditarik ke BCA

### Delivery:
- In-app (notification bell)
- WhatsApp (via Fonnte)
- Email (opsional)

---

## ONBOARDING FLOW (Awal Setup Toko)

### Step 1: Buat Akun
- Nama lengkap + Email + WA + Password

### Step 2: Buat Toko (60 detik target)
- Nama toko → auto-generate slug
- Upload logo (opsional)
- Nomor WA toko
- Kota asal

### Step 3: Atur Pembayaran
- Connect ke Xendit (atau skip untuk nanti)

### Step 4: Tambah Produk Pertama
- Form singkat: nama, foto, harga, stok
- AI auto-generate deskripsi

### Step 5: Lihat Toko!
- Preview storefront
- Share link toko
- CTA "Promosikan di WhatsApp/Instagram"

