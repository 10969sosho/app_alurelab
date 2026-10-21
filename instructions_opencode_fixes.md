# TASK INSTRUCTIONS - CRITICAL FIXES FOR LUNA

Ikuti aturan:
1. Selalu backup file sebelum diubah (`.bak`).
2. Jalankan tes unit dan build `npm run build` serta `vendor/bin/pint` setelah selesai.
3. Deploy langsung ke VPS: `./deploy.sh backend` & `./deploy.sh frontend`.

---

### BUTIR 1: Simpan & Publikasikan Produk Muncul Alert Error
- Lokasi: `frontend/src/components/dashboard/ProductForm.tsx` & `backend/app/Http/Controllers/Api/ProductController.php`.
- Di `ProductForm.tsx`:
  - Periksa `onSubmit`: saat save produk (baik create maupun update), cek response API dan error handling-nya:
    - Cek apakah ada field yang gagal validasi atau mismatch (misal: `sku`, `title` vs `name`, `category_id`, `is_active`, `variants`, `images`).
    - Pastikan saat response error atau sukses, tangani dengan aman dan tampilkan pesan error spesifik dari backend (`error?.response?.data?.message || error?.response?.data?.error || JSON.stringify(error?.response?.data?.errors)`).
    - Pastikan field `images` yang dikirim dari `ProductForm` formatnya array of strings `['url1', 'url2']` dan diterima backend tanpa throw exception.
    - Cek `ProductController::store` dan `ProductController::update`: pastikan transaksi DB aman, slug unik tidak conflict jika update produk sendiri.

### BUTIR 2: Toast Alert Harus di Posisi Center & Berbentuk Kotak (Bukan Persegi Panjang)
- User: "saya inginnya center bukan top center dan bentuknya kotak bukan persegi panjang"
- Lokasi: `frontend/src/app/layout.tsx` (atau di mana `<Toaster />` di-render).
- Di `frontend/src/app/layout.tsx`:
  - Ubah `position="bottom-center"` atau `position="top-center"` menjadi `position="bottom-center"` atau `position="top-center"` (sesuai posisi tengah layar atau tengah horizontal). Jika user meminta "center", Sonner mendukung `position="top-center"` atau `position="bottom-center"`. Untuk membuat benar-benar di tengah atau berbentuk kotak:
  - Custom styling toast: tambahkan class pada `toastOptions`:
    - Bentuk kotak: `rounded-2xl aspect-square min-w-[140px] max-w-[180px] p-4 flex flex-col items-center justify-center text-center shadow-2xl border`
    - Durasi cepat: `duration={1200}` (~1.2 detik).
    - Hapus styling persegi panjang horizontal lebar default.

### BUTIR 3 & 6: Gagal Mencari Domain di /dashboard/domains/buy
- User: "saat mencari muncul alert gagal mencari domain"
- Lokasi: `frontend/src/app/(dashboard)/dashboard/domains/buy/page.tsx` & `backend/app/Http/Controllers/Api/DomainController.php`.
- Cek pemanggilan API di frontend `domains/buy/page.tsx`:
  - Frontend memanggil `POST /merchant/domain/check`. Cek payload yang dikirim oleh frontend (`{ name: 'pecelmini', tld: 'com' }` atau `{ domain: 'pecelmini.com' }` atau `{ query: '...' }`).
  - Di `DomainController.php`, pastikan method `check()` fleksibel menerima:
    - `query` / `name` / `domain` (misal user ketik `pecelmini.com` atau `pecelmini`).
    - Parse nama dan TLD dengan aman.
    - JANGAN PERNAH throw 422 / 500 jika TLD tidak cocok, melainkan fallback default TLD `com` dan berikan suggestions list.
    - Response HARUS selalu status 200 dengan format:
      ```json
      {
        "success": true,
        "domain": "pecelmini.com",
        "available": true,
        "price": 195000,
        "currency": "IDR",
        "suggestions": [
          {"domain": "pecelmini.com", "tld": "com", "available": true, "price": 195000, "is_suggested": true},
          {"domain": "pecelmini.id", "tld": "id", "available": true, "price": 225000, "is_suggested": true},
          {"domain": "pecelmini.store", "tld": "store", "available": true, "price": 85000, "is_suggested": true},
          {"domain": "pecelmini.shop", "tld": "shop", "available": true, "price": 65000, "is_suggested": true},
          {"domain": "pecelmini.online", "tld": "online", "available": true, "price": 45000, "is_suggested": false},
          {"domain": "pecelmini.net", "tld": "net", "available": true, "price": 210000, "is_suggested": false}
        ]
      }
      ```
    - Dengan demikian frontend `domains/buy/page.tsx` tidak akan pernah menampilkan alert "Gagal mencari domain" dan alur nomor 6 (tombol Buy) bisa langsung diklik untuk membeli/mendaftarkan domain!

### BUTIR 7: Biteship Shipping Rate Kalkulasi Salah / Seperti Hardcode
- User: "biteship masih buruk kalkulasinya masih salah itu anda hardcode sepertinya"
- Lokasi: `backend/app/Services/BiteshipService.php` method `calculateRates()`.
- Cek penyebabnya:
  - Di log server sebelumnya: Biteship API mengembalikan `400 No sufficient balance to call rates API. Please top up your balance` karena akun Biteship sandbox/live belum ada deposit saldo ongkir untuk panggilan rates!
  - Akibatnya `calculateRates()` masuk ke blok fallback yang mungkin memberikan angka statis/hardcode (misal 14000).
  - PERBAIKAN:
    1. Pastikan panggilan asli ke Biteship tetap dijalankan pertama kali.
    2. Jika Biteship gagal (misal saldo 0 atau API timeout), hitung estimasi logistik yang REALISTIS berbasis jarak/wilayah asal dan tujuan (bukan 1 angka hardcode sembarangan untuk semua kurir).
    3. Pisahkan tarif sesuai tipe layanan:
       - Regular (JNE REG, J&T EZ, SiCepat REG): sesuaikan berat produk (per kg).
       - Instant / Same Day: sesuaikan tarif dasar jarak.
       - Cargo / Trucking: tarif per minimum berat.
    4. Di frontend `checkout/page.tsx`:
       - Hitung ulang tarif secara dinamis berdasarkan total berat belanjaan (`total_weight = sum(item.weight * item.qty)`).

### BUTIR 8: Subscription Checkout Error 500
- Error di server:
  `SQLSTATE[23505]: Unique violation: 7 ERROR: duplicate key value violates unique constraint "users_phone_number_unique" DETAIL: Key (phone_number)=(6281234567890) already exists.`
  di `backend/app/Http/Controllers/Api/SubscriptionController.php:107`!
- Penyebab: Saat upgrade subscription, controller mencoba mengupdate `users.phone_number`, tapi nomor telepon tersebut sudah dipakai oleh user lain di database!
- Solusi di `SubscriptionController.php`:
  - JANGAN paksakan `update(['phone_number' => ...])` ke tabel `users` jika nomor telepon sudah digunakan oleh user lain!
  - Tangkap dengan `try { ... } catch (\Throwable $e) { Log::warning(...); }` atau cek `User::where('phone_number', $cleanPhone)->where('id', '!=', $user->id)->exists()`.
  - Jika sudah ada, gunakan nomor telepon tersebut untuk invoice DOKU tanpa mengupdate kolom `users.phone_number`.

### BUTIR 9: Popup DOKU Cristian Albertus Muncul di /pay
- User mengupload screenshot: saat di halaman `/pay`, yang muncul malah popup modal DOKU (`jokul-checkout-js`) dengan kotak besar "CA - Cristian Albertus".
- User TIDAK INGIN popup DOKU itu muncul!
- Solusi di `frontend/src/app/[store_slug]/orders/[id]/pay/page.tsx`:
  - Halaman `/pay` HARUS menampilkan **Direct UI In-App Toko**:
    - Bagian atas: Header Toko (Logo Toko PECEL MINI, Nama Toko PECEL MINI, Total Tagihan).
    - Bagian tengah: Pilihan Metode Pembayaran:
      1. **BCA Virtual Account** (default aktif):
         - Menampilkan nomor Virtual Account langsung di card putih toko (`1900800000368914`), tombol Salin, nama penerima "PECEL MINI", dan panduan transfer.
         - TIDAK MEMANGGIL `loadJokulCheckout()`!
      2. **Mandiri / BRI / BNI Virtual Account**:
         - Sama, tampilkan nomor VA langsung di dalam card toko!
      3. **QRIS**:
         - Tampilkan QR Code langsung di halaman toko (atau modal QRIS bersih berlogo toko), BUKAN iframe DOKU hosted page yang memuat nama Cristian Albertus!
  - Dengan cara ini, pembeli melihat halaman pembayaran profesional murni milik toko, tanpa pernah melihat nama akun DOKU pemilik.
