# Implementasi Buyer Flow ALURELAB — Fase 1–3

Rujukan: `TODO_BUYER_FLOW.md` dan `/Users/10969sosho/Downloads/dokumentasi_alur_sistem_alurelab_com.md`.

## Ringkasan hasil

- **KTP tidak diminta untuk registrasi/login OTP, browsing, checkout guest, atau profil biasa.** Form KYC di akun baru terbuka setelah pembeli menekan tombol **Mulai Verifikasi Identitas**.
- Badge akun sekarang memisahkan **Phone Verified** dari status identitas **Identity Verified**, **KYC Pending**, **KYC Rejected**, atau **Unverified**.
- OTP pengembangan hanya dikembalikan di `APP_ENV=local/testing`. Karena belum ditemukan integrasi SMS/WhatsApp OTP, environment lain mendapat `503 Pengiriman OTP belum dikonfigurasi` (bukan respons sukses palsu).
- Pengajuan KYC menyimpan NIK dalam bentuk terenkripsi dan foto di disk `local` privat, dengan validasi gambar JPEG/PNG/WebP maksimal 5 MB per berkas.
- Refund/retur dibatasi pada order milik buyer di tenant aktif dengan status `delivered`/`completed`, wajib KYC berstatus `approved`, menyimpan rekening buyer, dan membuat klaim berstatus `pending`.

## Perubahan utama

### Fase 1 — Auth, profil, pemisahan badge

- `backend/app/Models/Customer.php`: Customer kini kompatibel dengan autentikasi Sanctum; menambahkan `phone_verified` dan relasi buyer KYC, rekening bank, serta refund.
- `backend/app/Http/Controllers/Api/CustomerAuthController.php`: OTP sukses menandai nomor terverifikasi; `dev_otp` dibatasi ke local/testing. Detail order memuat status klaim tanpa mengirim rekening tujuan.
- `backend/app/Http/Controllers/Api/StorefrontController.php`: checkout guest tetap tanpa login/KTP dan tidak gagal saat email opsional tidak diisi.
- `frontend/src/app/[store_slug]/account/page.tsx`, `frontend/src/store/buyer-store.ts`, dan `frontend/src/components/buyer/BuyerLoginModal.tsx`: badge nomor telepon dan identitas terpisah; data status disinkronkan dari API.
- Tidak ada field KTP pada form checkout atau profil biasa.

### Fase 2 — KYC, rekening, retur/refund

- Model: `BuyerKyc`, `BuyerBankAccount`, `BuyerRefundRequest`.
- Controller: `backend/app/Http/Controllers/Api/BuyerFlowController.php`.

| Method | Endpoint | Fungsi |
|---|---|---|
| `POST` | `/api/v1/buyer/kyc/submit` | KTP, selfie, NIK 16 digit, dan nama sesuai identitas; status awal `pending`. |
| `GET` | `/api/v1/buyer/kyc/status` | Status KYC untuk buyer aktif. |
| `GET` | `/api/v1/buyer/bank-account` | Mengambil rekening tersimpan untuk form refund buyer. |
| `POST` | `/api/v1/buyer/orders/{id}/refund` | Mengajukan retur/refund dan menyimpan rekening; ditolak backend bila identitas belum disetujui. |
| `GET` | `/api/v1/admin/buyers/{id}/kyc` | Status/nama KYC untuk superadmin. |
| `GET` | `/api/v1/admin/buyers/{id}/kyc/documents/{ktp\|selfie}` | Mengalirkan dokumen dari disk privat khusus superadmin. |
| `PATCH` | `/api/v1/admin/buyers/{id}/kyc` | Menyetujui atau menolak pengajuan KYC; hanya superadmin. |

- `frontend/src/app/[store_slug]/account/page.tsx`: CTA eksplisit membuka formulir KYC.
- `frontend/src/app/[store_slug]/orders/[id]/page.tsx`: formulir retur/refund, rekening bank, status klaim, serta tautan ke KYC jika belum disetujui.
- Isolasi order dilakukan dengan `tenant_id` dan `customer_id`; permintaan aktif ganda dan order yang belum diterima ditolak.

### Fase 3 — Verifikasi

- `backend/tests/Feature/BuyerFlowTest.php`: OTP tanpa KTP, tidak mengirim dev OTP di luar local/testing, guest checkout tanpa KTP, unggah KYC privat, dan refund gating/review.
- `php artisan test --compact tests/Feature/BuyerFlowTest.php`: **5 lulus, 28 assertion**.
- `php artisan test --compact`: **32 lulus, 168 assertion**.
- `npm run build` di `frontend`: **lulus** (kompilasi, pemeriksaan tipe, dan static generation).
- Pint dijalankan pada file PHP yang berubah.

## Backup

Sebelum edit, file yang sudah ada disalin ke file `*.bak_20261016_buyer_flow`. File Laravel baru dibuat melalui Artisan dan salinan stub awalnya disimpan dengan suffix yang sama sebelum diisi. Perubahan lokal lain yang telah ada sebelumnya tetap dipertahankan.

## Batas implementasi yang perlu ditindaklanjuti

1. **OTP produksi belum dapat dikirim** karena repository tidak memiliki provider SMS/WhatsApp atau kredensialnya. Endpoint sengaja mengembalikan 503 di luar local/testing; integrasikan provider sebelum membuka login OTP produksi.
2. Refund saat ini adalah **pengajuan klaim** (`pending`), belum keputusan merchant/admin, transfer bank, pembukuan wallet, atau rekonsiliasi gateway. Endpoint tersebut belum ditentukan pada cakupan buyer API rujukan.
3. Review KYC tersedia sebagai API khusus superadmin, belum ada layar review di dashboard admin.
4. Beberapa fitur dalam dokumentasi induk—wallet refund, invoice PDF, wishlist, reward/referral, dan fitur retensi lain—tetap di luar tiga fase implementasi ini.
