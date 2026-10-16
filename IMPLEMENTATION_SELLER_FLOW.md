# IMPLEMENTATION — ALUR SELLER ALURELAB (ALA SHOPIFY)

**Tanggal:** 2026-10-16
**Scope:** `backend/` (Laravel 11/12 + Sanctum) & `frontend/` (Next.js App Router + NextAuth v5)
**Prinsip:** Semua file yang diubah di-backup dulu (suffix `.bak_<timestamp>_seller_flow`). Tanpa breaking buyer flow / seeder.

---

## 1. BACKEND

### 1a. `POST /api/v1/stores` — Buat toko untuk user login

| Item | Detail |
|---|---|
| Route | `backend/routes/api.php:105` — di luar group `IdentifyTenant`, middleware **hanya `auth:sanctum`** |
| Handler | `MerchantController::createStore` (`MerchantController.php:135`) |

Validasi: `name` (required, min 3), `slug` (required, unique ke `stores.slug`), `category` (optional string).

Yang dilakukan (atomik dalam 1 transaction):
1. Buat record `Store` dengan default `settings`: `template=default`, `theme=default`, `status=active`, plus `business_category`, `theme_color`, `tagline`, `allow_cod=true`.
2. Kaitkan user login via pivot `store_users` dengan `role='owner'` (`firstOrCreate`).
3. Buat `MerchantWallet` dengan `available_balance=0` / `escrow_held_balance=0`.
4. Set RLS context `app.current_tenant_id` (pgsql).
5. **Di luar transaksi:** daftarkan sub-merchant DOKU via `DokuService::registerSubAccount`. Gagal → log error, status tetap `unregistered`, bisa retry lewat `POST /merchant/payment/setup`.

Response `201`: `{ success, message, store: { id, name, slug, settings } }`

> Ini menutup blocker kritis dari audit §1.4: user yang terdaftar lewat `/register` (tanpa toko) kini **bisa membuat toko** — `onboard()` yang mensyaratkan email unik tidak lagi satu-satunya jalur.

### 1b. `GET /api/v1/merchant/setup-guide`

| Item | Detail |
|---|---|
| Route | `backend/routes/api.php:141` — dalam group `auth:sanctum` + `IdentifyTenant` |
| Handler | `MerchantController::getSetupGuide` (`MerchantController.php:230`) |

5 pilar dihitung **real-time dari data toko** (bukan state tersimpan):

| # | Kunci | Syarat selesai |
|---|---|---|
| 1 | `products_added` | `store.products()->count() > 0` |
| 2 | `design_chosen` | `settings['template']` atau `settings['theme']` terisi |
| 3 | `payments_configured` | `doku_sub_account_id` **atau** `settings['payment_methods']` **atau** COD aktif (`cod_enabled` / fallback `allow_cod`) |
| 4 | `shipping_configured` | `address_area_id` **atau** `address_raw` **atau** `settings.origin_address.area_id` |
| 5 | `domain_connected` | `custom_domain` terisi **dan** `custom_domain_status === 'active'` |

Response: `{ success, completed, total: 5, percent, steps: {…boolean} }`

### 1c. Endpoint 503 dibuka

| Endpoint | Sebelum | Sesudah |
|---|---|---|
| `GET /merchant/promotions` | `503 PROMOTIONS_UNAVAILABLE` | Kode implementasi dijalankan → baca `settings['promotions']` |
| `POST /merchant/promotions` | `503` | Simpan / update voucher ke `settings['promotions']` (kode di-uppercase) |
| `DELETE /merchant/promotions/{id}` | `503` | Hapus voucher dari `settings['promotions']` |
| `POST /merchant/finance/withdraw` | `503 PAYOUT_UNAVAILABLE` | Implementasi penuh (lihat bawah) |

**Payout (`requestPayout`, `MerchantController.php:519`):**
- Validasi rekening bank (dari request atau fallback `settings['bank_account']`, mendukung `bank_code`/`bank_name` dan `account_holder_name`/`account_holder`).
- **Minimal penarikan Rp 50.000** → `422` bila kurang.
- Saldo tidak mencukupi → `422`.
- Simpan record `Payout` dengan **`status = 'PENDING'`** (kolom `doku_payout_id` siap untuk integrasi disbursement berikutnya).
- Catatan: saldo wallet sengaja **tidak didebet** saat request — pencairan diproses saat disbursement benar-benar jalan (lihat komentar `ponytail:`).

**Perbaikan teks Xendit → DOKU:** `AuthController::formatStore` kini mengembalikan `doku_sub_account_id` + `doku_account_status` (menggantikan `xendit_account_status`); komentar `Payout XenDisburse` → `Payout DOKU Disbursement`.

---

## 2. FRONTEND

### 2a. Halaman Buat Toko — `/create-store`

| File | Peran |
|---|---|
| `frontend/src/app/create-store/page.tsx` **(baru)** | Form: Nama Toko, Slug (`.alurelab.com`), Kategori Bisnis/Industri, tombol **"Buat Toko Sekarang 🚀"** |
| `frontend/src/app/(dashboard)/layout.tsx` | `session.store?.slug` kosong → `redirect('/create-store')` (**tanpa 404/crash**) |
| `frontend/src/middleware.ts` | `/create-store` di-guard: butuh session cookie |
| `frontend/src/lib/auth.ts` | Callback `jwt` kini menarik ulang `GET /auth/me` bila `token.store` masih null → sesi terisi otomatis setelah toko dibuat |

Alur submit: `POST /stores` → simpan `localStorage['alurelab_store_slug']` → `await updateSession()` (refresh JWT agar `session.store` terisi) → `router.push('/dashboard')` + `router.refresh()`.

Slug otomatis di-generate dari nama toko sampai seller mengeditnya sendiri.

### 2b. Setup Guide Cards — persis pola Shopify

| File | Peran |
|---|---|
| `frontend/src/components/dashboard/SetupGuide.tsx` **(baru)** | Komponen checklist onboarding |
| `frontend/src/app/(dashboard)/dashboard/page.tsx` | `<SetupGuide />` dirender di atas widget "Hal yang Perlu Dilakukan" (widget lama **tidak dihapus** — tidak breaking) |

Isi kartu (judul/deskripsi/CTA sesuai spesifikasi):

| Kartu | CTA | Link |
|---|---|---|
| Add your first product | Tambah Produk | `/dashboard/products/new` |
| Choose your store design | Pilih Desain | `/dashboard/cms` |
| Set up payments | Aktivasi Pembayaran | `/dashboard/settings?tab=payment` |
| Review shipping rates | Atur Pengiriman | `/dashboard/settings?tab=address` |
| Get a custom domain | Atur Domain | `/dashboard/settings?tab=domain` |

- Progress **"X dari 5 selesai"** + progress bar (amber < 40%, oranye `#EE4D2D`, hijau `emerald-500` bila semua selesai).
- Kartu yang sudah terpenuhi otomatis mendapat badge **Done** + centang hijau + coret judul.
- Tombol **"Tutup panduan"** / **"Tampilkan panduan"** (collapse) disimpan di `localStorage['alurelab_setup_guide_dismissed']`.

### 2c. Pengaturan Pembayaran DOKU & Domain di Settings

| File | Peran |
|---|---|
| `frontend/src/app/(dashboard)/dashboard/settings/page.tsx` | Tab aktif kini bisa di-deep-link via `?tab=` (profile / address / couriers / payment / domain) |

**Tab Pembayaran** — kartu **DOKU Merchant Gateway** di paling atas:
- Badge status `AKTIF` / `BELUM AKTIF` + pill QRIS · Virtual Account · COD.
- Menampilkan Sub-Account ID bila sudah terdaftar.
- Tombol **"Aktivasi DOKU Payment"** → `POST /merchant/payment/setup` (hanya tampil bila belum aktif), lalu invalidate `merchant-payment-status`.

**Tab Domain (baru)** — menampilkan subdomain aktif + custom domain beserta status verifikasi (target link kartu "Get a custom domain").

### 2d. Bug fixes

1. **`X-Store-Slug` selalu terkirim.** `alurelab_store_slug` kini disimpan eksplisit di dua titik:
   - `login/page.tsx` — setelah `signIn` sukses, tarik `getSession()` dan simpan slug (hapus bila null).
   - `create-store/page.tsx` — setelah `POST /stores` sukses.
   `lib/api.ts` memakai konstanta `STORE_SLUG_KEY` yang di-export bersama (interceptor tidak lagi memakai string literal).
2. **Halaman promosi berfungsi.** `isError` early-return (yang mengunci seluruh halaman termasuk tombol "Buat Promo Baru") dihapus; pesan error mutation kini menampilkan pesan dari server. Backend sudah tidak 503.
3. **Teks Xendit → DOKU** di: `app/layout.tsx` (meta description), `legal/terms`, `[store_slug]/account`, `[store_slug]/pages/[slug]`, `dashboard/finance` (DOKU Disbursement), `dashboard/cms` (default announcement), `EditorialTemplate`. `lib/utils.ts` menambah key `doku` untuk label metode pembayaran (key `xendit` dipertahankan sebagai fallback data lama). Route mock internal `/mock/xendit-invoice` sengaja tidak direname agar tidak mematahkan link uji coba.

---

## 3. VERIFIKASI

| Cek | Hasil |
|---|---|
| `php artisan route:list` | `POST api/v1/stores`, `GET api/v1/merchant/setup-guide` terdaftar; promotions/withdraw tetap ada |
| `vendor/bin/pint --dirty` | **passed** |
| `php artisan test --compact` | **40/40 passed** (32 lama + 8 baru), 223 assertions |
| `npx tsc --noEmit` (frontend) | **0 error** |
| `npm run build` (frontend) | **Sukses** — `/create-store` muncul di route manifest |

### Test baru: `backend/tests/Feature/SellerFlowSetupTest.php`

1. `test_authenticated_user_can_create_store` — store + pivot owner + wallet + default settings.
2. `test_create_store_requires_authentication` — `401`.
3. `test_create_store_rejects_short_name_and_duplicate_slug` — `422` pada `name` & `slug`.
4. `test_setup_guide_reports_five_pillars_and_progress` — 3/5 selesai, percent 60.
5. `test_setup_guide_marks_products_and_domain_when_present` — pilar produk & domain aktif.
6. `test_promotions_crud_is_no_longer_blocked` — GET/POST/DELETE tanpa 503, kode di-uppercase.
7. `test_payout_requires_minimum_balance_and_bank_account` — tanpa rekening & di bawah Rp 50.000 → `422`, tidak ada record Payout.
8. `test_payout_creates_pending_record_when_valid` — Payout `PENDING` tersimpan dengan benar.

---

## 4. BACKUP

Semua file yang dimodifikasi tersalin dengan suffix `.bak_<YYYYMMDD_HHMMSS>_seller_flow` di direktori masing-masing, contoh:

- `backend/app/Http/Controllers/Api/MerchantController.php.bak_20261016_121545_seller_flow`
- `backend/routes/api.php.bak_20261016_121545_seller_flow`
- `frontend/src/app/(dashboard)/layout.tsx.bak_20261016_121545_seller_flow`
- …dst (18 file backend + frontend, lihat sesi kerja).

---

## 5. CATATAN / PEKERJAAN LANJUTAN (di luar scope permintaan)

- **Checkout belum menghitung voucher.** `StorefrontController::checkout` masih selalu `discount_amount = 0` — penyimpanan voucher sudah jalan, tapi penerapan atomik saat checkout butuh migrasi tabel `discounts` + lock (alasan 503 asli). Form seller sudah berfungsi.
- **Saldo belum didebet** saat request payout (sengaja — tunggu integrasi disbursement nyata).
- **Bulk ship** masih `503` (tidak diminta dalam brief ini).
- `bulkShip` kode setelah stub kosong — butuh booking Biteship per-order bila diaktifkan.
