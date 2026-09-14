# 🛍️ 07: PRODUCT DOCS — BUYER FRONTEND (STOREFRONT)
### *Spesifikasi Lengkap Semua Fitur & Halaman untuk Pembeli*

> Status: Referensi design production-ready
> Benchmark: Shopee, Tokopedia, TikTok Shop — disesuaikan untuk single-store e-commerce

---

## STRUKTUR NAVIGASI BUYER (URL Map)

```
/{store_slug}/                          → Beranda Toko
/{store_slug}/products/                 → Semua Produk / Katalog
/{store_slug}/products/{product-slug}/  → Detail Produk
/{store_slug}/cart/                     → Keranjang Belanja
/{store_slug}/checkout/                 → Checkout
/{store_slug}/orders/                   → Daftar Pesanan Saya (tanpa login)
/{store_slug}/orders/{order-id}/        → Detail + Tracking Pesanan
/{store_slug}/orders/{order-id}/invoice → Invoice / Struk Digital
/{store_slug}/search?q=                 → Hasil Pencarian
/{store_slug}/category/{category}/      → Filter per Kategori
/{store_slug}/promo/                    → Halaman Promo & Flash Sale
```

---

## HALAMAN 1: BERANDA TOKO (`/[store_slug]/`)

### Layout Sections (Mobile-First):

#### Header (Sticky)
- Logo toko + nama toko
- Search bar (tap to expand)
- Icon Cart (badge jumlah item real-time via Zustand `useCartStore`)
- Icon WhatsApp untuk kontak penjual
- **Tombol "Akun Saya" / Buyer Profile Drawer**:
  - *State Tamu (Belum Login)*: Membuka drawer One-Click Phone/WhatsApp Auth (hanya input nomor HP/WA dan nama, tanpa kerumitan kata sandi atau kode OTP).
  - *State Terautentikasi (Sudah Login)*:
    - Tombol navbar berubah menampilkan inisial avatar & nama depan pembeli secara reaktif.
    - Menampilkan kartu status pembeli terverifikasi & skor proteksi Anti-RTS.
    - Formulir pembaruan cepat alamat pengiriman default (tersimpan ke database `customers`).
    - Tab **Riwayat Pesanan**: Menampilkan pesanan real dari toko aktif (`GET /api/v1/buyer/orders`) dengan status pengerjaan (Diproses, Dikirim, Selesai) dan tautan lacak resi.
    - Tombol **Keluar Akun (Logout)**: Menghapus session localStorage `alurelab_buyer_session`.

#### Hero Banner / Slider
- Max 5 banner gambar (landscape 16:9)
- Auto-slide 5 detik
- Tap banner → redirect ke halaman promo / produk tertentu
- Fallback: gradient dengan nama toko jika tidak ada banner

#### Flash Sale Section (Conditional — tampil jika ada aktif)
- Countdown timer real-time (jam:menit:detik)
- Horizontal scroll produk flash sale
- Badge "HEMAT X%" merah di setiap card
- Progress bar stok tersisa
- CTA "Lihat Semua"

#### Kategori Cepat
- Grid icon kategori (max 8, scrollable horizontal)
- Tap → filter ke halaman katalog per kategori

#### Produk Terlaris / Rekomendasi
- Grid 2 kolom (mobile), 3-4 kolom (desktop)
- Product card: gambar, nama, harga, harga coret (jika ada promo), rating bintang
- "Terlaris" badge untuk produk sold ≥ threshold merchant

#### Produk Terbaru
- Grid 2 kolom, tampilkan 8 produk terbaru
- Link "Lihat Semua Produk"

#### Info Toko Footer
- Jam operasional
- Alamat kota/kabupaten (tidak perlu spesifik)
- Metode pembayaran yang diterima (icon QRIS, BCA, GoPay, OVO, COD)
- Metode pengiriman (icon kurir yang tersedia)
- Kebijakan pengembalian (singkat)

---

## HALAMAN 2: KATALOG PRODUK (`/[store_slug]/products/`)

### Filter & Sort Bar (Sticky)
- **Filter**: Kategori | Harga Min-Max | Kondisi (Baru/Bekas) | Rating | Promo saja
- **Sort**: Terlaris | Terbaru | Harga Terendah | Harga Tertinggi | Rating Tertinggi
- Jumlah produk ditemukan: "Menampilkan 48 produk"

### Grid Produk
- Layout: 2 kolom (mobile), 3 kolom (tablet), 4 kolom (desktop)
- **Product Card komponen**:
  - Gambar utama (aspect ratio 1:1, lazy load)
  - Badge: "FLASH SALE", "NEW", "TERLARIS", "STOK TERBATAS"
  - Nama produk (max 2 baris, truncated)
  - Harga + harga coret (jika ada)
  - Badge diskon persentase (merah)
  - Rating bintang + jumlah review
  - Tombol "+" Quick Add to Cart
  - Sold count: "terjual 142"

### Infinite Scroll / Pagination
- Infinite scroll (load 24 item per batch)
- Fallback: "Semua produk sudah ditampilkan"

---

## HALAMAN 3: DETAIL PRODUK (`/[store_slug]/products/[slug]/`)

### Bagian Atas — Galeri & Info

#### Image Gallery
- Swipeable full-width image slider
- Thumbnail strip di bawah
- Tap gambar → full screen lightbox / zoom
- Video produk support (jika ada URL video)
- Indikator "1/5" posisi slide

#### Info Produk
- Nama produk (H1)
- **Harga** (besar, tebal) + harga coret + badge "Hemat Rp X.000"
- Flash sale countdown (jika sedang promo)
- Rating: ⭐ 4.8 (127 ulasan)
- Sold count
- SKU / Kode Produk

#### Pilih Varian
- Pilihan Warna: swatch kotak berwarna (jika ada varian warna)
- Pilihan Ukuran: tombol kotak S/M/L/XL/XXL
- Stok tersisa setelah pilih varian: "Stok: 24"
- Varian habis: button disabled + label "Habis"

#### Quantity Selector
- Tombol − dan + dengan input manual
- Maksimum = stok tersisa
- Minimum = 1

#### CTA Buttons (Sticky Bottom Bar mobile)
- "Beli Sekarang" (primary, langsung ke checkout)
- "Tambah ke Keranjang" (secondary)
- Icon keranjang + icon bookmark/wishlist

#### Info Pengiriman (Collapsible)
- Input "Cek Ongkir": masukkan kota/kecamatan
- Tampilkan estimasi kurir + harga (dari Biteship)
- Estimasi tiba: "Tiba 14–16 Sep"

#### Informasi Penjual (Mini Card)
- Logo + nama toko
- Rating toko
- Tombol "Chat di WhatsApp" → wa.me link

### Bagian Bawah — Deskripsi & Review

#### Tab: Deskripsi | Spesifikasi | Ulasan

**Tab Deskripsi**:
- Rich text HTML (support bold, list, image)
- Tombol "Baca Selengkapnya" jika > 300 karakter

**Tab Spesifikasi** (Opsional):
- Tabel key-value: Berat | Dimensi | Material | Warna | Ukuran

**Tab Ulasan**:
- Rating overview: bintang + bar histogram
- Filter: "Semua" | "5 ⭐" | "4 ⭐" | "Ada Foto"
- Review card: nama (disamarkan "D***a"), bintang, teks, foto, tanggal
- Pagination 10 review per halaman

#### Produk Serupa / Might Also Like
- Grid horizontal 2 kolom, 4-6 produk dari kategori sama

---

## HALAMAN 4: KERANJANG BELANJA (`/[store_slug]/cart/`)

### Cart Items List
Setiap item:
- Thumbnail produk
- Nama + varian yang dipilih
- Harga per item
- Quantity selector (− qty +)
- Tombol hapus (icon trash, confirm modal)
- Checkbox pilih item (untuk checkout parsial)

### Order Summary (Sticky Bottom / Right Sidebar desktop)
- Subtotal: Rp X.XXX.XXX
- (Ongkir dihitung di checkout)
- Total Estimasi
- Tombol "Checkout Sekarang" (disabled jika cart kosong)

### Empty State
- Ilustrasi keranjang kosong
- CTA "Lihat Produk"

### Saved for Later (Wishlist mini)
- Item yang disimpan / di-wishlist

---

## HALAMAN 5: CHECKOUT (SATU HALAMAN) (`/[store_slug]/checkout/`)

> Sudah ada implementasi 4-step. Ini adalah spesifikasi production-ready-nya.

### Progress Indicator
`[1. Data Penerima] → [2. Alamat] → [3. Pengiriman] → [4. Pembayaran]`

### Step 1: Data Penerima
- **Indikator Status Pembeli**:
  - Jika pembeli sudah login via `useBuyerStore`: Menampilkan badge *"Terhubung"* dan alert info *"Masuk sebagai [Nama] ([No HP]). Data pengiriman otomatis terisi!"*.
- **Auto-Fill Pintar**: Kolom Nama, No. WhatsApp, Email, dan Alamat Detail langsung di-prefill otomatis dari data profil pembeli aktif.
- **Formulir Manual**: Jika pembeli berbelanja sebagai tamu (guest), form dapat diisi langsung tanpa paksaan registrasi:
  - Nama lengkap *
  - Nomor WhatsApp aktif * (dengan format 08xxx / 628xxx)
  - Email (opsional, untuk salinan nota digital)

### Step 2: Alamat Pengiriman
- Powered by Biteship Area Search
- Input kota/kecamatan (autocomplete dropdown)
- Input kelurahan (autocomplete cascading)
- Kode pos (auto-fill dari area)
- Detail alamat (nama jalan, RT/RW, nomor)
- Catatan untuk kurir (opsional)
- Simpan alamat ini untuk checkout berikutnya (toggle)

### Step 3: Pilih Kurir & Layanan
- Tampilkan dari Biteship API:
  ```
  ┌─────────────────────────────────────────┐
  │ SiCepat BEST   Rp 15.000  Est. 1-2 hari │ ← recommended
  │ J&T EZ         Rp 13.000  Est. 2-3 hari │
  │ JNE REG        Rp 14.000  Est. 2-3 hari │
  │ AnterAja REG   Rp 12.000  Est. 2-3 hari │
  │ [+ Asuransi pengiriman Rp 2.000]        │ ← toggle
  └─────────────────────────────────────────┘
  ```
- Badge "Paling Murah" / "Paling Cepat"
- Estimasi tanggal tiba
- Toggle asuransi pengiriman

### Step 4: Metode Pembayaran
```
💳 Bayar Online (Aman via Xendit)
   ○ QRIS (semua e-wallet & m-banking)
   ○ Virtual Account BCA
   ○ Virtual Account Mandiri
   ○ Virtual Account BRI
   ○ Virtual Account BNI
   ○ GoPay
   ○ OVO
   ○ ShopeePay
   ○ Dana

💵 Bayar di Tempat (COD)
   ⚠️ Proteksi Anti-RTS Aktif
   Verifikasi nomor WhatsApp diperlukan.
   [Status Anda: Bisa COD / Tidak bisa COD]
```

### Order Summary (Selalu Terlihat)
- Item list (ringkas)
- Subtotal produk: Rp X
- Ongkir: Rp X
- Asuransi: Rp X
- Diskon voucher: -Rp X
- Platform fee: (tersembunyi dari buyer)
- **Total: Rp X**
- Input voucher / kode promo

### CTA
- "Buat Pesanan & Bayar" → POST ke `/checkout`
- Loading state dengan skeleton
- Setelah sukses → redirect ke halaman payment / success

---

## HALAMAN 6: KONFIRMASI PEMBAYARAN

### Untuk Pembayaran Online (QRIS/VA)
- Tampilkan kode QR (QRIS) atau nomor VA + batas waktu
- Timer countdown: "Bayar sebelum 15:37:22"
- Panduan cara bayar per metode
- Tombol "Saya Sudah Bayar" (trigger polling status)
- Tombol "Ganti Metode Pembayaran"
- Auto-refresh setiap 10 detik untuk cek status

### Untuk COD
- Konfirmasi pesanan berhasil dibuat
- Instruksi: "Kurir akan menghubungi Anda sebelum pengiriman"

### Halaman Sukses Pembayaran
- Animasi centang hijau
- Nomor pesanan: `ORD-20260914-XXXX`
- Ringkasan pesanan
- CTA: "Lacak Pesanan" | "Lanjut Belanja"
- Auto-redirect ke halaman tracking setelah 5 detik

---

## HALAMAN 7: PESANAN SAYA (`/[store_slug]/orders/`)

> Tanpa login — akses via nomor WhatsApp (OTP)

### Flow Akses
1. Input nomor WhatsApp
2. Kirim OTP via WhatsApp
3. Input OTP → unlock daftar pesanan

### Daftar Pesanan (Timeline Card)
Setiap pesanan:
- Nomor pesanan
- Status badge (warna-coded)
- Tanggal order
- Thumbnail produk (max 3)
- Total harga
- CTA: "Lacak" | "Lihat Detail" | "Beli Lagi"

### Status Pesanan (Color Coded)
```
🟡 Menunggu Pembayaran    pending_payment
🔵 Pembayaran Diterima    paid_escrow
🟣 Diproses               processing
🚚 Dikirim                shipped
📦 Dalam Perjalanan       in_transit
✅ Selesai                completed
❌ Dibatalkan             cancelled
↩️ Dikembalikan           rts_returned
```

---

## HALAMAN 8: DETAIL & TRACKING PESANAN (`/[store_slug]/orders/[id]/`)

### Info Pesanan
- Nomor pesanan + tanggal
- Status saat ini (badge besar)
- Timeline progress bar horizontal

### Tracking Kurir (Timeline Vertikal)
```
✅ [14 Sep 15:30] Paket tiba di gudang SiCepat Jakarta Pusat
✅ [14 Sep 08:00] Paket diserahkan ke kurir SiCepat
✅ [13 Sep 16:00] Pesanan dikirim dari toko
⬤  [13 Sep 10:00] Pesanan sedang diproses
```
- Nomor resi: JT1234567890 (tap → copy)
- Tombol "Cek Resi" → link ke situs kurir
- Estimasi tiba

### Informasi Penerima
- Nama + nomor WA (disamarkan)
- Alamat (disamarkan sebagian untuk privacy)

### Ringkasan Produk
- Daftar item yang dipesan
- Harga dan subtotal

### Tombol Aksi
- "Pesanan Diterima" (confirm received — hanya muncul jika status "Dikirim")
- "Hubungi Penjual" → WhatsApp
- "Komplain Pesanan" → form komplain (muncul jika sudah delivered)

---

## HALAMAN 9: INVOICE DIGITAL (`/[store_slug]/orders/[id]/invoice`)

### Konten Invoice
- Kop: Logo toko + nama + alamat
- Nomor invoice + tanggal
- Identitas pembeli (nama, WA, alamat)
- Tabel item pesanan
- Breakdown biaya (subtotal, ongkir, diskon, total)
- Metode pembayaran + waktu pembayaran
- QR Code unik pesanan
- Stempel / watermark digital

### Aksi
- Tombol "Download PDF"
- Tombol "Share via WhatsApp"
- Tombol Print (browser print dialog)

---

## HALAMAN 10: HALAMAN PROMO (`/[store_slug]/promo/`)

### Flash Sale (jika aktif)
- Banner flash sale besar
- Countdown timer
- Grid produk flash sale dengan harga coret + harga promo + progress stok

### Voucher Tersedia
- Kartu voucher: kode, minimal belanja, diskon, berlaku sampai
- Tombol "Pakai Voucher" → input di checkout

### Produk Promo Reguler
- Grid produk dengan badge diskon

---

## KOMPONEN GLOBAL (Reusable)

### Floating WhatsApp Button
- Selalu tampil di kanan bawah
- Tap → buka WhatsApp ke nomor toko dengan pesan otomatis

### Toast Notification
- "Produk berhasil ditambahkan ke keranjang!"
- "Stok produk ini hanya tersisa 3"
- "Voucher berhasil dipakai, hemat Rp X.000"

### Modal Bottom Sheet (Mobile)
- Pilih varian produk (dari product card quick-add)
- Konfirmasi hapus item cart
- Preview gambar (lightbox)

### Empty State Components
- Produk tidak ditemukan
- Keranjang kosong
- Tidak ada pesanan

---

## AKSESIBILITAS & PERFORMA

- Semua gambar: `alt` text wajib
- Touch target minimum 44×44px
- Color contrast WCAG AA minimum
- SSR/ISR untuk SEO: semua halaman toko dirender server-side
- Lazy load gambar (Next.js `<Image>`)
- Core Web Vitals target: LCP < 2.5s, FID < 100ms, CLS < 0.1

