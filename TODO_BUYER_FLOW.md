# Rencana Kerja & To-do Audit Buyer Flow

**Status:** Rencana audit — belum mengubah implementasi aplikasi.  
**Rujukan utama:** `/Users/10969sosho/Downloads/dokumentasi_alur_sistem_alurelab_com.md`  
**Backup:** `TODO_BUYER_FLOW.md` belum ada sebelum pekerjaan ini; file dibuat baru sehingga tidak ada isi lama yang ditimpa. Dokumentasi sumber dan perubahan lokal lain tidak diubah.

## Aturan produk yang wajib dijaga

> **KTP HANYA diperlukan untuk proses menjadi verified user dan/atau proses refund. KTP tidak wajib pada registrasi awal, login/OTP, browsing, checkout, maupun penggunaan akun pembeli biasa.**

- Registrasi dasar cukup dengan nomor HP/WhatsApp yang diverifikasi OTP; nama boleh dilengkapi sesuai kebutuhan alur.
- Status login/nomor HP terverifikasi **bukan** bukti identitas KTP dan tidak boleh otomatis ditampilkan sebagai `Verified` secara identitas.
- Minta KTP hanya ketika pembeli secara eksplisit memulai verifikasi menjadi verified user atau proses refund yang memang memerlukannya. Jangan menjadikan KTP sebagai syarat melihat pesanan atau checkout.
- Tegakkan syarat tersebut di backend, bukan hanya dengan menyembunyikan/menampilkan elemen frontend.

## Peta alur dan lokasi implementasi saat ini

| Tahap | Frontend (Next.js) | Backend (Laravel) | Alur yang ditemukan |
|---|---|---|---|
| Jelajah & produk | `frontend/src/app/[store_slug]/page.tsx`, `shop/page.tsx`, `products/[slug]/page.tsx`; komponen `frontend/src/components/buyer/` | `StorefrontController`, rute katalog di `backend/routes/api.php` | Storefront per tenant, daftar/detail produk dan aksi keranjang. |
| Keranjang | `frontend/src/app/[store_slug]/cart/page.tsx`, `frontend/src/store/cart-store.ts` | Belum ada endpoint cart yang persisten; checkout memvalidasi item di server | Keranjang dikelola di browser; backend tetap perlu memvalidasi produk, varian, stok, harga, tarif, dan tenant saat checkout. |
| Login/registrasi buyer | `frontend/src/components/buyer/BuyerLoginModal.tsx`, `frontend/src/store/buyer-store.ts` | `CustomerAuthController`; `POST /api/v1/buyer/request-otp`, `POST /api/v1/buyer/verify-otp` | OTP membuat/login `Customer`; token Sanctum disimpan dalam state Zustand persisten `alurelab_buyer_session`. Tidak terlihat alur KTP di registrasi dasar. |
| Checkout | `frontend/src/app/[store_slug]/checkout/page.tsx` | `POST /api/v1/checkout` → `StorefrontController::checkout`; reservasi stok, Biteship, DOKU/COD | Checkout bisa tanpa sesi buyer. Backend membuat/mencari customer berdasarkan nomor telepon dan menyimpan order. |
| Profil & riwayat | `frontend/src/app/[store_slug]/account/page.tsx`, `orders/page.tsx`, `orders/[id]/page.tsx` | `GET/PUT /api/v1/buyer/profile`, `GET /api/v1/buyer/orders`, `GET /api/v1/buyer/orders/{id}` (Sanctum) | Riwayat dibatasi ke customer dan toko aktif; profil/alamat disimpan melalui API buyer. |
| Refund & verified user | Belum terlihat halaman/alur KTP buyer khusus | Belum terlihat route/proses refund-wallet buyer; wallet yang ditemukan adalah wallet merchant | Perlu audit konfirmasi sebelum menyimpulkan fitur memang tidak ada di area lain/produksi. |

## Temuan awal untuk ditelusuri saat audit

- `account/page.tsx` menampilkan badge **“Verified”** bagi buyer yang sudah login, tanpa status KTP/verifikasi identitas yang tampak di data buyer. Verifikasi apakah label ini menyesatkan dan sumber status yang benar.
- `CustomerAuthController::requestOtp()` mengembalikan `dev_otp` pada response. Pastikan hanya untuk lingkungan/test yang aman; audit pengiriman OTP, pembatasan percobaan, masa berlaku, dan pencegahan enumerasi.
- `CustomerAuthController::verifyOtp()` membuat customer dari nomor HP; checkout juga membuat customer tanpa login. Telusuri konsistensi normalisasi nomor dan efek customer global lintas toko.
- Profile menyimpan nama/email/alamat, sementara identitas KTP dan refund buyer belum tampak pada route/model yang ditinjau. Telusuri keseluruhan migrations, storage, kebijakan akses, penghapusan, serta alur refund sebelum menetapkan gap final.
- Dokumen fitur buyer dan arsitektur menyebut beberapa fitur/penyedia versi lama; validasi perilaku aktual (mis. DOKU kini digunakan di checkout) terhadap kode dan konfigurasi aktif.

## Rencana kerja audit

### 1. Baseline dan inventaris alur
- [ ] Catat branch/commit, status Git, dan perubahan lokal sebelum audit; jangan menimpa pekerjaan yang belum di-commit.
- [ ] Telusuri rute buyer Next.js dan API Laravel dari CTA sampai request/response dan perubahan data.
- [ ] Tandai tiap kemampuan sebagai tersedia, parsial, belum ada, atau belum terverifikasi; pisahkan dokumentasi rencana dari implementasi nyata.
- [ ] Gambar skenario guest, buyer OTP/login, lintas toko, gagal request, dan sesi kedaluwarsa.

### 2. Registrasi, login, profil, dan batas KTP
- [ ] Pastikan registrasi/login OTP dan checkout guest tidak meminta, mengunggah, atau mensyaratkan KTP.
- [ ] Lacak sumber status verified di API, tipe buyer frontend, penyimpanan, dan tampilan; bedakan `phone_verified` dari `identity_verified`.
- [ ] Identifikasi aksi eksplisit untuk memulai verifikasi verified user/refund; pastikan hanya aksi tersebut yang membuka permintaan KTP.
- [ ] Verifikasi backend menolak akses verified/refund yang memang memerlukan KTP bila status/dokumen belum memenuhi syarat, tanpa memblokir akun biasa.
- [ ] Audit penyimpanan berkas KTP: validasi tipe/ukuran, akses privat, otorisasi, enkripsi/retensi, logging tanpa data sensitif, dan penghapusan sesuai kebijakan.
- [ ] Pastikan UI tidak memakai label/badge `Verified` untuk sekadar sesi OTP; tampilkan status belum terverifikasi secara akurat.

### 3. Produk, cart, dan checkout
- [ ] Audit penjelajahan produk, varian/stok, CTA beli/tambah cart, persistensi cart, empty/error state, dan responsif.
- [ ] Pastikan guest dapat mengisi data penerima dan checkout tanpa dipaksa daftar/login/KTP.
- [ ] Cocokkan validasi server dengan harga/stok/varian/tenant, tarif Biteship, ongkir, total, idempotensi, dan pelepasan reservasi saat gagal/kedaluwarsa.
- [ ] Telusuri pembuatan/pengaitan customer untuk order guest dan buyer login; pastikan akses lintas tenant/order tidak bocor.
- [ ] Audit metode pembayaran online/COD, kegagalan pembayaran, pemulihan form, serta status setelah callback/webhook.

### 4. Pasca-pembelian, retur, dan refund
- [ ] Cocokkan daftar/detail order dan tracking frontend dengan status/state backend serta otorisasi pemilik order.
- [ ] Audit invoice, konfirmasi barang diterima, komunikasi, retur/komplain, dan tindakan yang tersedia bagi buyer.
- [ ] Telusuri refund dari pemicu sampai persetujuan, pencatatan ledger, saldo/tujuan refund, notifikasi, dan rekonsiliasi.
- [ ] Tentukan pada langkah refund mana KTP benar-benar dibutuhkan; pastikan hanya data minimum yang dikumpulkan dan tidak menjadi prasyarat belanja biasa.
- [ ] Tandai fitur dalam dokumen sumber yang belum diimplementasikan (mis. refund wallet, invoice PDF, wishlist, review/poin) sebagai gap/keputusan produk, bukan sebagai fitur yang sudah tersedia.

### 5. Keamanan, privasi, aksesibilitas, dan pengujian
- [ ] Audit OTP: delivery provider, rate limit per nomor/IP, percobaan verifikasi, replay, expiry, respons `dev_otp`, dan proteksi abuse.
- [ ] Audit token Sanctum/localStorage, logout/revocation, validasi token dan pembatasan akses endpoint buyer.
- [ ] Audit PII (nomor HP, alamat, email, KTP bila ada), logging, retensi, ekspor/penghapusan, dan pesan privasi.
- [ ] Periksa aksesibilitas form/OTP, label/error, keyboard, fokus modal, touch target, dan tampilan mobile.
- [ ] Jalankan test backend/frontend yang relevan untuk guest checkout, OTP sukses/gagal, batas tenant/order, KTP opsional saat registrasi, dan gating KTP hanya pada verified/refund.
- [ ] Catat hasil dengan bukti file/route/test, tingkat keparahan, dampak buyer, rekomendasi minimum, dan status tindak lanjut.

## Urutan prioritas dan kriteria selesai

1. **P0 — Identitas & akses:** KTP tidak menghalangi registrasi, login, checkout guest, atau akun buyer biasa; verified/refund terlindungi oleh pemeriksaan backend yang tepat; status verified di UI akurat.
2. **P1 — Transaksi:** harga, stok, ongkir, pembayaran, tenant, dan akses order konsisten serta dapat dipulihkan pada kegagalan.
3. **P2 — Pengalaman & fitur:** tracking, retur/refund, dokumentasi, loyalitas, dan fitur eksplorasi dibandingkan dengan dokumentasi produk.

Audit selesai bila alur aktual frontend–API–database sudah dipetakan, setiap butir berstatus dengan bukti, aturan KTP di atas lolos skenario positif/negatif, dan temuan/gap diserahkan sebagai daftar kerja terurut. Dokumen ini adalah rencana audit; belum menyatakan seluruh alur telah diuji atau fitur yang direncanakan telah tersedia.
