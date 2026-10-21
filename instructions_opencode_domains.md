# TASK INSTRUCTIONS - DOMAINS PAGE & BUY DOMAIN FEATURE

## Background & User Request
User ingin fitur Beli Domain seperti di Shopify:
- Ada menu tersendiri di Sidebar Dashboard: **Domains** (`/dashboard/domains`).
- Memiliki sub-halaman atau tab/tampilan **Buy new domain** (`/dashboard/domains/buy` atau tombol "Buy new domain").
- Tampilan harus mengacu ke screenshot referensi Shopify yang diberikan user:
  - Header: Breadcrumb `< ⚙️ Domains` lalu Judul besar **"Buy new domain"**.
  - Info banner: "Buy or connect a custom domain..."
  - Card: **"Find the perfect domain"** - "Purchase, host, and manage your domain all in one place with ALURELAB".
  - Input pencarian domain: `mywebsite.com` dengan tombol **Search**.
  - Hasil pencarian persis:
    - Jika domain yang diketik tersedia: Tampilkan baris hijau centang `[nama_domain] [Available (badge hijau)]` + Harga (misal `Rp 195.000 / tahun` atau `$16.00 USD / year`) + Tombol **Buy** (atau Hubungkan).
  - Bagian **"You might like these" / "Suggested ✨"**:
    - Memberikan rekomendasi nama domain alternatif dengan TLD `.com`, `.id`, `.store`, `.shop`, `.online` dsb beserta harga dan tombol **Buy**.
  - Bagian **"Other extensions"**:
    - Rekomendasi ekstensi lain (`.net`, `.org`, `.co.id`).
  - Ketika tombol **Buy** diklik:
    - Muncul modal konfirmasi pembelian domain (jangka waktu 1-5 tahun, total biaya, auto-setup DNS ke server ALURELAB).
    - Memanggil backend API `/api/v1/merchant/domain/register`.
  - Pada halaman utama `/dashboard/domains`:
    - Tampilkan status domain toko saat ini:
      1. Primary domain aktif (subdomain `[store_slug].alurelab.com` atau custom domain).
      2. Daftar custom domain toko dengan status DNS / SSL.
      3. Tombol "Buy new domain" dan "Connect existing domain".

## Backend Check
- File: `backend/app/Http/Controllers/Api/DomainController.php` & `backend/app/Services/OpenproviderService.php`.
- Endpoint yang sudah ada:
  - `POST /api/v1/merchant/domain/check` (menerima `{name: "xyz", tld: "com"}`)
  - `POST /api/v1/merchant/domain/register` (menerima `{name: "xyz", tld: "com", years: 1}`)
- Tambahkan endpoint helper jika diperlukan:
  - `GET /api/v1/merchant/domains` (mengambil domain aktif toko & status custom domain dari `stores.custom_domain`).
  - Update `DomainController::check` agar jika user mengetik `tokoku.com` atau hanya `tokoku`, sistem otomatis mengecek ekstensi utama dan memberikan `suggestions` (beberapa TLD seperti `com`, `id`, `store`, `shop`, `online`).
  - Jika Openprovider sandbox belum ada saldo/kredensial, berikan graceful realistic simulation fallback agar UI tidak crash dan user bisa mencoba flow pembelian domain secara mulus.

## Sidebar Update
- Di `frontend/src/components/dashboard/Sidebar.tsx`:
  - Tambahkan menu **Domains** di nav items (misal di bawah Pengaturan Toko atau Sales Channels / Settings) dengan icon `Globe` dari `lucide-react`.

## Aturan Pengerjaan
- Backup semua file yang akan diubah (`.bak`).
- Desain mengikuti referensi Shopify yang bersih, modern, dan fungsional.
- Pastikan build frontend (`npm run build`) dan backend (`pint`) bebas error.
