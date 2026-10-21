# TASK INSTRUCTIONS - 10 CRITICAL ISSUES RESOLUTION

WAJIB:
- Selalu backup file sebelum diubah (`.bak`).
- Jalankan test biasa (syntax, unit test, build test `npm run build` dan `vendor/bin/pint`), tidak perlu ag-browser UI.
- Semua 10 butir ini harus dibereskan tuntas dan langsung deploy ke VPS (`./deploy.sh backend` & `./deploy.sh frontend`).

---

### 1. Save Produk Multi Image Server Error
- Issue: Saat menyimpan produk dengan multi image, upload image sukses tapi saat "Save All" muncul server error (500).
- Lokasi: `backend/app/Http/Controllers/Api/ProductController.php` (store & update method) dan `frontend/src/components/dashboard/ProductForm.tsx`.
- Cek field `images`: di database apakah json/jsonb, array, atau string. Pastikan payload `images` divalidasi `images => 'nullable|array'` dan disimpan dengan benar (json_encode jika perlu atau cast array).
- Periksa PostgreSQL error / laravel.log di backend terkait format `images` atau data varian.

### 2. Posisi & Durasi Toast / Alert
- Issue: Alert/toast muncul di pojok kanan atas mengganggu tombol aksi.
- User request: Pindahkan posisi toast ke **Tengah** (center / top-center) dengan durasi cepat (~1.5 detik / 1500ms) lalu hilang otomatis.
- Lokasi:
  - Cek konfigurasi `Toaster` di `frontend/src/app/layout.tsx` atau `frontend/src/app/(dashboard)/layout.tsx` (sonner / react-hot-toast / toast library yang dipakai).
  - Set `position="top-center"` atau `"bottom-center"` dan `duration={1500}`.

### 3. Check Domain Error di Halaman /dashboard/domains/buy
- Issue: Terjadi error saat mengecek domain di halaman `/dashboard/domains/buy` atau search domain.
- Cek `backend/app/Http/Controllers/Api/DomainController.php` method `check()` dan frontend `frontend/src/app/(dashboard)/dashboard/domains/buy/page.tsx`.
- Pastikan endpoint `POST /api/v1/merchant/domain/check` menerima query/body tanpa gagal (validasi domain, TLD split, sanitize). Jika Openprovider mengembalikan timeout/error, fallback data simulasi/estimasi yang valid harus tetap me-return HTTP 200 dengan struktur data `{success: true, available: true/false, price: 195000, suggestions: [...]}` agar UI tidak crash.

### 4. Ganti Subdomain Default: Hilangkan "alurelab.shop", Gunakan "alurelab.com"
- Issue: Di halaman domains dan banner masih tertulis `alurelab.shop` (misal `pecel-mini.alurelab.shop`), padahal domain platform kita yang aktif dan nyata adalah `alurelab.com` (storefront: `app.alurelab.com/{store_slug}` atau `{store_slug}.alurelab.com`).
- Lokasi:
  - `backend/config/app.php`: `root_domain` ganti dari `alurelab.shop` ke `env('ROOT_DOMAIN', 'alurelab.com')`
  - `frontend/src/app/(dashboard)/dashboard/domains/page.tsx` & komponen lainnya: ganti semua teks/hardcode `alurelab.shop` menjadi `alurelab.com` (atau `app.alurelab.com/${store.slug}`).

### 5. Pasang Existing Custom Domain (Sungguh-sungguh Berfungsi)
- Issue: Existing domain harus benar-benar bisa langsung dipasang dan aktif di toko jika user memasukkan custom domain miliknya.
- Lokasi:
  - `backend/app/Http/Controllers/Api/DomainController.php` method `connect()`
  - Pastikan menyimpan domain ke kolom `stores.custom_domain`.
  - Jika format domain valid (misal `pecelmini.id` atau `www.pecelmini.com`), set status custom domain di database toko dan return info DNS Record resmi yang harus diarahkan (A record ke IP VPS: `103.121.122.135` atau CNAME ke `cname.alurelab.com`).
  - Frontend slideover/modal connect existing domain harus sukses meng-update state dan menampilkan domain yang terhubung.

### 6. Pembelian Domain (Direct Payment Flow)
- Issue: Domain harus bisa langsung diproses / dibeli.
- Pastikan alur `POST /api/v1/merchant/domain/register`:
  - Menerima nama domain & durasi tahun.
  - Memotong saldo merchant / membuat tagihan domain atau mengaktifkan domain ke toko.
  - Berikan feedback jelas dan daftarkan custom domain ke toko merchant.

### 7. Pengiriman Biteship: Jangan Tampilkan Rate Sebelum Alamat Diisi
- Issue: Di halaman checkout `frontend/src/app/[store_slug]/checkout/page.tsx`, tarif ongkir (rates) sudah muncul sebelum pembeli memilih/memasukkan alamat lengkap (wilayah/area_id).
- Solusi:
  - Ongkos kirim / pilihan kurir HANYA boleh di-fetch dan ditampilkan JIKA pembeli sudah memilih wilayah tujuan (`destination_area_id` sudah ada).
  - Jika alamat belum dipilih, tampilkan placeholder rapi: "Pilih wilayah tujuan pengiriman terlebih dahulu untuk melihat opsi kurir & ongkos kirim".

### 8. Upgrade Paket Langganan Server Error di Admin
- Issue: Saat admin/seller klik upgrade paket di `/dashboard/subscription`, terjadi server error 500.
- Cek `backend/app/Http/Controllers/Api/SubscriptionController.php` dan `backend/app/Services/DokuService.php` method `createSubscriptionInvoice()`.
- Cek parameter yang dikirim: `plan_tier`, `payment_method`, dsb.
- Selesaikan bug penyebab 500 (cek type error atau missing parameter di `createSubscriptionInvoice`).

### 9. Popup Payment DOKU Masih Menampilkan Nama Cristian Albertus
- Issue: User mengupload screenshot ke-2 di mana saat checkout popup DOKU dibuka, masih muncul box besar "CA - Cristian Albertus".
- Mengapa ini terjadi?
  - Karena popup tersebut adalah iframe/modal yang me-load URL DOKU Hosted (`https://staging.doku.com/...`)!
  - User ingin agar TIDAK ADA box Cristian Albertus tersebut sama sekali!
- Solusi yang tepat:
  - Di halaman bayar `/pay` atau checkout, untuk Virtual Account (BCA, Mandiri, BRI, BNI), JANGAN BUKA POPUP DOKU!
  - Tampilkan **Direct Virtual Account UI milik kita sendiri** di dalam halaman:
    - User klik "BCA Virtual Account" -> Langsung muncul card putih bersih di halaman toko dengan Logo BCA, Nomor VA (`1900800000368914`), tombol Salin, nama penerima "PECEL MINI", dan cara transfer. Tanpa popup DOKU!
  - Untuk QRIS: jika popup DOKU terpaksa dipanggil untuk scan QRIS, pastikan hanya jika user memilih QRIS, atau jika memungkinkan render QR string langsung.

### 10. Konsistensi Huruf Besar/Kecil Nama Toko: "PECEL MINI" bukan "PECEL mini"
- Issue: Di database toko bernama `PECEL MINI` (atau `PECEL mini`), tapi di beranda dan detail order berubah-ubah.
- Pastikan:
  - Periksa nilai asli kolom `name` di tabel `stores` untuk toko `pecel-mini`. Jika di database tertulis `PECEL mini`, berikan fitur agar saat nama toko diedit di Pengaturan Toko menjadi `PECEL MINI`, database benar-benar ter-update.
  - Di semua komponen frontend: `BuyerTopBar.tsx`, `CmsStorefrontView.tsx`, `orders/[id]/page.tsx`, `orders/page.tsx`, dll:
    - JANGAN ADA fungsi `.toLowerCase()` atau format kustom yang mengubah casing nama toko!
    - Tampilkan persis `{store.name}`.
