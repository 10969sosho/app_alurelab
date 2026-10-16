# AUDIT SELLER FLOW — ALURELAB

**Tanggal:** 2026-10-16
**Scope:** `backend/` (Laravel 11/12 + PostgreSQL + Sanctum) & `frontend/` (Next.js App Router + NextAuth v5). `backend-alurelab/` dan `landing-alurelab/` di luar scope (legacy/landing).
**Tujuan:** memetakan kondisi nyata sebelum membangun alur seller bergaya Shopify: **Registrasi → Toko kosong → "BUAT TOKO" → Home Dashboard + Setup Guide bertahap.**

Status: **[OK]** berjalan penuh · **[SETENGAH]** abu-abu (UI ada, API mock/stub/sebagian) · **[X]** belum ada.

---

## 0. RINGKASAN EKSEKUTIF

1. **Belum ada state "akun tanpa toko".** `/register` membuat user tanpa toko (bagus, sesuai target), **tapi user itu kemudian tidak bisa membuat toko** — satu-satunya endpoint pembuatan toko (`POST /merchants/onboard`) mensyaratkan email unik → selalu 422. Ini *dead-end* kritis di alur yang mau kita bangun.
2. **Tidak ada OTP/WA untuk seller.** Register pakai email + nomor WA (wajib diisi), tapi verifikasi hanya link email. OTP hanya ada di sisi buyer dan **mati di luar environment `local/testing`**.
3. **Tidak ada Setup Guide / checklist onboarding sama sekali** — tidak di frontend, tidak ada tabel, tidak ada endpoint. Yang ada hanya widget "Hal yang Perlu Dilakukan" berisi 3 kartu statis dari data pesanan.
4. **Fitur inti seller sudah tersambung nyata:** Dashboard, Produk (+varian/kategori), Pesanan (+kirim/resi/label), Settings, Escrow/Finance, Inbox/Chat, Analytics (parsial).
5. **Fitur yang tampak ada tapi MATI di backend:** Promosi/Voucher (3 endpoint 503), Bulk Ship (503), Tarik Dana/Payout (503). Subscription/billing murni mock di frontend.
6. **Fitur Shopify standar yang benar-benar belum ada:** Payment setup DOKU (UI), Custom Domain (UI+API), Team/Staff, Content/Pages sebagai modul sendiri, Discounts nyata, Setup Guide, Forgot Password, Notifikasi, Review, Multi-store.

---

## 1. ANALISIS AUTH & ONBOARDING

### 1.1 Endpoint auth backend (`backend/routes/api.php`, prefix `/api/v1`)

| Method | Path | Handler | Catatan |
|---|---|---|---|
| POST | `/auth/register` | `AuthController::register` (`AuthController.php:21`) | **Tanpa store.** Field: `name, email, phone_number, password, password_confirmation` |
| POST | `/auth/login` | `AuthController::login` (`:55`) | Email+password; **wajib email terverifikasi** (`:70`); return `token` + `store` (bisa `null`) |
| GET | `/auth/email/verify/{id}/{hash}` | closure (`routes/api.php:61`) | Signed URL, throttle 6/menit |
| POST/GET | `/auth/logout`, `/auth/me` | `AuthController` | `auth:sanctum` |
| POST | `/merchants/onboard` | `MerchantController::onboard` (`MerchantController.php:36`) | **Satu-satunya pembuat toko.** Public, buat Store+User+StoreUser+Wallet atomik + daftar sub-agnost DOKU |
| — | *forgot/reset password* | **TIDAK ADA** | `grep forgot|resetPassword` = 0 hit |
| POST | `/buyer/request-otp`, `/buyer/verify-otp` | `CustomerAuthController` | Sisi buyer saja |

### 1.2 Frontend flow

| Rute | File | Behavior |
|---|---|---|
| `/register` | `frontend/src/app/(auth)/register/page.tsx` | Kumpulkan **nama, email, nomor WA (regex `^(\+62\|62\|0)8…`), password**. Tanpa nama toko. → `POST /auth/register` → redirect `/login?registered=1` |
| `/login` | `frontend/src/app/(auth)/login/page.tsx` + `src/lib/auth.ts` | NextAuth credentials → `POST /auth/login`. Tombol Google/Apple/WA **hanya dekorasi** (`toast.info`) |
| `/onboarding` | `frontend/src/app/onboarding/page.tsx` | **Store-first**: `store_name, store_slug (.alurelab.com), owner_name/phone/email, password` → `POST /merchants/onboard`. Tampil 2 langkah tapi 1 request |
| `/forgot-password` | `frontend/src/app/(auth)/forgot-password/page.tsx` | **Murni UI**, `onSubmit` tidak memanggil API; menampilkan "hubungi tim admin" |
| `/email/verify/[id]/[hash]` | `frontend/src/app/email/verify/...` | Redirect ke `/api/v1/auth/email/verify/...` relatif di Next app — **tidak ada route/rewrite → 404** (kecuali reverse proxy) |

Middleware `src/middleware.ts` hanya cek **keberadaan cookie** (`/`, `/dashboard/*`, `/admin/*`, `/login`, `/register`) — tanpa cek role/store. Guard kedua: `(dashboard)/layout.tsx` (session saja) dan `(admin)/admin/layout.tsx` (**role check dikomentari**: `// TODO: uncomment when role system ready`).

### 1.3 Jawaban langsung ke pertanyaan audit

- **Auth nomor WA (OTP)?** → **TIDAK ada untuk seller.** Nomor WA hanya kolom `users.phone_number` (unique) untuk identitas. Tidak ada tabel/kolom OTP, tidak ada integrasi SMS/WA gateway di kode (`.env` punya `FONNTE_API_TOKEN` tapi **0 referensi kode**). OTP buyer ada di `CustomerAuthController.php:46-96` (cache 5 menit, no table, no rate-limit) dan **diblokir 503 di luar `local|testing`** (`:52-57`), plus mengembalikan `dev_otp` di body response.
- **Registrasi langsung maksa nama toko?** → **TIDAK di `/register`** (user murni, tanpa toko — sesuai target). Nama toko hanya diminta di `/onboarding` (jalur lama, store-first). **Jadi dua jalur registrasi paralel yang saling mengunci** — lihat §1.4.
- **User bisa punya akun tanpa toko?** → Secara data **YA**, tapi **secara flow TIDAK bisa lanjut** (dibawah).
- **Relasi User–Tenant–Store:** **tidak ada model `Tenant`.** "Tenant" hanya konvensi penamaan kolom `tenant_id` di `products, orders, order_items, payments, shipments, wallet_transactions, payouts, inventory_reservations, buyer_refund_requests` — semuanya `foreignUuid → stores.id`, dijaga **Postgres RLS** (`2026_09_14_000006`).
  - `User` **BelongsToMany** `Store` via pivot **`store_users`** (`store_id, user_id, role` default `owner`).
  - `StoreUser` = pivot (role string). `Store` punya relasi `users()`; **`Store::storeUsers()` TIDAK ADA** → `AdminController.php:41,79` akan `RelationNotFoundException`.
  - `MerchantWallet.store_id`, `conversations.store_id` memakai `store_id`; sisanya `tenant_id`.
  - Role dijalan `EnsureStoreRole` (`store.role:owner,manager`) di 23 route. **Spatie permission ter-seed (`RoleSeeder`) tapi 0 pemakaian di kode.**

### 1.4 ⚠️ BUG FLOW KRITIS (blocker alur target)

```
/register  →  User dibuat TANPA toko  →  login sukses, store: null
     ↓
/dashboard → IdentifyTenant cari store user → TIDAK ADA → 404 TenantNotFound
     ↓
Coba buat toko → POST /merchants/onboard  →  422 "Email sudah terdaftar"
```

- `MerchantController.php:42-43` memaksa `owner_email` / `owner_phone` **unique terhadap `users`**, jadi user terdaftar **tidak akan pernah bisa** membuat toko. Tidak ada endpoint `POST /stores` untuk user yang sudah login.
- Tidak ada penanganan `store: null` di frontend: `(dashboard)/dashboard/page.tsx:78` hanya fallback teks `'Toko Anda'`, **tidak ada CTA "Buat Toko"**.
- `X-Store-Slug` dibaca dari `localStorage['alurelab_store_slug']` (`src/lib/api.ts:23`) tapi **tidak pernah diset di mana pun** → header tidak pernah terkirim → selalu fallback ke store pertama user (multi-store mati total).

---

## 2. AUDIT SEMUA FITUR SELLER

### 2.1 Halaman frontend dashboard (`frontend/src/app/(dashboard)/`)

| Rute | File |
|---|---|
| `/dashboard` | `dashboard/page.tsx` |
| `/dashboard/analytics` | `dashboard/analytics/page.tsx` |
| `/dashboard/categories` | `dashboard/categories/page.tsx` |
| `/dashboard/cms` | `dashboard/cms/page.tsx` (1688 baris — tema + custom pages) |
| `/dashboard/customers` | `dashboard/customers/page.tsx` |
| `/dashboard/finance` | `dashboard/finance/page.tsx` |
| `/dashboard/inbox`, `/dashboard/inbox/[id]` | `dashboard/inbox/*` |
| `/dashboard/orders`, `/dashboard/orders/[id]` | `dashboard/orders/*` |
| `/dashboard/products`, `/new`, `/[id]/edit` | `dashboard/products/*` + `src/components/dashboard/ProductForm.tsx` |
| `/dashboard/promotions` | `dashboard/promotions/page.tsx` |
| `/dashboard/settings` | `dashboard/settings/page.tsx` (tab: profile, address, couriers, payment) |
| `/dashboard/shipping` | `dashboard/shipping/page.tsx` — **yatim, tidak ada link di sidebar** |
| `/dashboard/subscription` | `dashboard/subscription/page.tsx` (mock) |

Nav: **satu komponen** `src/components/dashboard/Sidebar.tsx` (desktop only, `hidden lg:flex` — **tidak ada nav mobile**).

### 2.2 Menu/sidebar seller (urutan tampil)

| # | Grup | Item | Href | Halaman |
|---|---|---|---|---|
| 0 | — | Ringkasan Beranda | `/dashboard` | ✅ |
| 1 | Pesanan | Pesanan Saya | `/dashboard/orders` | ✅ |
| 2 | Pesanan | Pengembalian/Pembatalan | `/dashboard/orders?tab=return` | ✅ |
| 3 | Produk | Produk Saya | `/dashboard/products` | ✅ |
| 4 | Produk | Tambah Produk Baru | `/dashboard/products/new` | ✅ |
| 5 | Produk | Master Kategori | `/dashboard/categories` | ✅ |
| 6 | Produk | Tampilan Toko (CMS) | `/dashboard/cms` | ✅ |
| 7 | Pusat Promosi | Pusat Promosi | `/dashboard/promotions` | ✅ |
| 8 | Pusat Promosi | Pelanggan & Member | `/dashboard/customers` | ✅ |
| 9 | Pusat Promosi | Pesan Pembeli 💬 | `/dashboard/inbox` | ✅ |
| 10 | Keuangan | Saldo Escrow & Kas | `/dashboard/finance` | ✅ |
| 11 | Keuangan | Analisis Bisnis | `/dashboard/analytics` | ✅ |
| 12 | Pengaturan | Pengaturan Toko | `/dashboard/settings` | ✅ |
| 13 | Pengaturan | Paket Langganan | `/dashboard/subscription` | ✅ |
| — | footer | Badge `Paket {tier}` + Keluar | — | ✅ |

**Tidak ada di menu:** Setup Guide, Content/Pages (tertanam di CMS), Payment DOKU, Domain, Team/Staff, Shipping (orphan), Notifications.

### 2.3 Tabel status semua fitur

| Fitur (Shopify-map) | Halaman FE | Endpoint BE | Status | Bukti / catatan |
|---|---|---|---|---|
| **Home / Dashboard** | `/dashboard` | `GET /merchant/dashboard`, `GET /merchant/orders?per_page=8` | **[OK]** | `MerchantController.php:188` — 9 stat real dari Order/Product/Wallet |
| **Setup Guide / Onboarding checklist** | widget statis "Hal yang Perlu Dilakukan" (`dashboard/page.tsx:99-128`) | **tidak ada** | **[X]** | 3 kartu status pesanan/pending, tanpa state completion, tanpa `nextStep`, tanpa tabel |
| **Produk: CRUD + gambar + status** | `/dashboard/products`, `/new`, `/[id]/edit` | `apiResource products`, `PATCH toggle-status`, `POST bulk` | **[OK]** | `ProductController.php` (361 ln) real query+pagination. ⚠ `ilike` = Postgres-only |
| **Varian produk** | dalam `ProductForm` | `GET/POST/PUT/DELETE products/{id}/variants*` | **[OK]** | `ProductController.php:268-339` |
| **Master Kategori** | `/dashboard/categories` | `GET/PUT /merchant/categories` | **[OK]** | disimpan di `stores.settings.categories` (bukan tabel) |
| **Pencarian/filter produk** | quick filter low_stock/top_selling | server filter `?search=&is_active=` | **[SETENGAH]** | filter klien hanya mem-filter halaman yang sudah di-fetch; deep-link `?low_stock=true` dari home diabaikan |
| **Pesanan: list + tab status** | `/dashboard/orders` | `GET /merchant/orders` | **[OK]** | `OrderController.php:16-60` |
| **Detail pesanan + ubah status** | `/dashboard/orders/[id]` | `GET/PATCH /merchant/orders/{id}(/status)` | **[OK]** | state machine `:16-26,87-118` |
| **Pengiriman per pesanan + label** | detail order | `POST /merchant/orders/{id}/shipment`, `GET .../label` | **[OK]** | Biteship live, `OrderController.php:124-238` |
| **Pengembalian/Pembatalan (returns)** | tab `?tab=return` | → `?status=cancelled` | **[SETENGAH]** | tab hanya memetakan `cancelled`; `rts_returned` tidak difilter; tidak ada alur refund seller |
| **Bulk shipping** | `/dashboard/shipping` (tidak di menu) | `POST /merchant/shipping/bulk-ship` | **[SETENGAH]** | FE real, **BE `503 BULK_SHIPPING_UNAVAILABLE`** (`MerchantController.php:747`) |
| **Pelanggan & Member** | `/dashboard/customers` | `GET /merchant/customers` | **[SETENGAH]** | query order real, tapi **tier VIP Platinum/Gold/Silver hasil rumus hardcode** (`:338-346`), tanpa pagination, tanpa kolom `customers.tier` |
| **Loyalty/tier card** | bagian atas customers | — | **[SETENGAH]** | teks "Tiering otomatis" murni tampilan |
| **Promo / Voucher / Diskon** | `/dashboard/promotions` | `GET/POST/DELETE /merchant/promotions` | **[SETENGAH]** | FE memanggil API → **ketiganya `503 PROMOTIONS_UNAVAILABLE`** (`MerchantController.php:627,649,719`); kode setelah `return` mati; penyimpananpun cuma `settings['promotions']` JSON; **checkout selalu `discount_amount = 0`** (`StorefrontController.php:317`) |
| **Content / Custom Pages** | tab "Halaman Kustom" di `/dashboard/cms` | via `PUT /merchant/cms/settings` (key `pages`) | **[SETENGAH]** | bukan tabel `pages`, tanpa CRUD slug terpisah, tanpa SEO/meta; tidak ada route `/pages` seller |
| **Theme / Storefront design (CMS)** | `/dashboard/cms` | `GET/PUT /merchant/cms/settings` | **[SETENGAH]** | backend `array_merge` buta ke `stores.settings` jsonb (tanpa skema); **FE menyimpan ke localStorage & tetap men-toast sukses bila PUT gagal** (`cms/page.tsx:317-330`) → seller kira sudah publish |
| **Analytics / Laporan** | `/dashboard/analytics` | `GET /merchant/analytics` | **[SETENGAH]** | GMV/AOV/orders real; **`visitors` & `conversion_rate` = rumus `max(150, orders*12)`** (`MerchantController.php:497-498`) — bukan data; toggle 7/30 hari **hanya ganti queryKey, param tidak pernah dikirim**; tanpa export |
| **Escrow & Kas** | `/dashboard/finance` | `GET /merchant/finance` | **[OK]** | wallet + payouts + transaksi |
| **Tarik Dana (Payout)** | tombol withdraw | `POST /merchant/finance/withdraw` | **[SETENGAH]** | FE real → **BE `503 PAYOUT_UNAVAILABLE`** (`MerchantController.php:410`) |
| **Payment setup DOKU** | **tidak ada halaman** | `POST /merchant/payment/setup`, `GET /merchant/payment/status` | **[X]** (FE) / **[OK]** (BE) | Endpoint BE real (registrasi sub-agnost DOKU) tapi **0 pemanggilan di frontend**. Tab "Pembayaran" di settings hanya COD + rekening bank penarikan |
| **Shipping config (Biteship)** | settings tab `couriers` (toggle kurir) | `GET /logistics/areas`, `POST /logistics/rates` | **[SETENGAH]** | tidak ada UI API key/warehouse/origin service level; origin cuma `stores.address_area_id` |
| **Custom Domain** | **tidak ada** | **tidak ada** | **[X]** | hanya kolom `stores.custom_domain` + `custom_domain_status` yang dibaca `IdentifyTenant.php:64-66`; tidak ada request/verify/DNS-check |
| **Team / Staff** | **tidak ada** | **tidak ada** | **[X]** | role hanya kolom pivot; `RoleSeeder` membuat `staff_order` tapi tidak bisa di-assign; `EnsureStoreRole` sudah siap dipakai |
| **Langganan / Billing** | `/dashboard/subscription` | **tidak ada** | **[X]** | `plans[]` hardcode, checkout disabled ("API billing backend belum diimplementasikan") |
| **Inbox / Chat** | `/dashboard/inbox(/[id])` | `GET/POST /chat/conversations*` | **[OK]** | `ChatController` |
| **Pengaturan Toko** | `/dashboard/settings` | `GET/PUT /merchant/settings` | **[OK]** | profile, alamat+wilayah, kurir, COD, rekening bank |
| **Upload gambar (R2)** | dalam form | `POST /merchant/upload`, `/upload/presign(-bg)` | **[OK]** | ⚠ whitelist folder `presign` ≠ `directUpload` |
| **Registrasi / Login** | `/register`, `/login` | `POST /auth/register`, `/auth/login` | **[OK]** | |
| **Lupa password** | `/forgot-password` | **tidak ada** | **[X]** | UI bilang "hubungi admin" |
| **Verifikasi email** | `/email/verify/[id]/[hash]` | `GET /auth/email/verify/...` | **[SETENGAH]** | redirect FE ke `/api/v1/...` yang tidak ada di Next → 404 |
| **Multi-store switcher** | — | login selalu ambil store **pertama** (`AuthController.php:77-80`) | **[X]** | `X-Store-Slug` tidak pernah di-set |
| **Notifikasi / Activity log** | — | — | **[X]** | |
| **Review produk** | — | — | **[X]** | |
| **SEO / Meta per halaman** | — | — | **[X]** | tidak ditemukan di CMS |
| **Admin panel** | `/admin`, `/admin/sellers*`, `/admin/buyers*` | `GET /admin/*` | **[SETENGAH]** | FE real; BE `AdminController` **tanpa cek `is_superadmin`** (semua token seller bisa baca) dan `Store::with('storeUsers')` **relasi tidak ada** → error; `/admin/orders|analytics|settings` di-link tapi halaman 404 |

### 2.4 Backend: endpoint yang HANYA STUB (return 503, kode mati setelahnya)

| Endpoint | Kode | Kode mati sesudah `return` |
|---|---|---|
| `GET/POST/DELETE /merchant/promotions` | `MerchantController.php:623-629, 645-651, 715-721` | `:631-640, 653-709, 723-737` |
| `POST /merchant/shipping/bulk-ship` | `:743-749` | `:751+` |
| `POST /merchant/finance/withdraw` | `:406-412` | — |
| `POST /buyer/login` | `CustomerAuthController.php:35-41` | sengaja `410 Gone` |

### 2.5 Tabel kehilangan (missing) yang dibutuhkan alur target Shopify

| Tabel/konsep | Pengganti sementara |
|---|---|
| `onboarding_checklist` / setup guide steps | tidak ada sama sekali |
| `pages` (CMS) | `stores.settings->pages` JSON |
| `discounts` / `discount_codes` | `stores.settings->promotions` JSON + feature 503 |
| `domains` + verifikasi DNS | 2 kolom di `stores` |
| `staff_invitations` | hanya pivot `store_users` |
| `themes` / template | `stores.settings` blob (`template` dibaca tapi tidak pernah ditulis) |
| `analytics_events` / `page_views` | tidak ada — `visitors` = rumus |
| `shipping_profiles` / rates | nilai hardcode di checkout |
| `notifications`, `activity_log`, `product_reviews`, `webhooks` merchant-defined | tidak ada |

---

## 3. SEEDER & KREDENSIAL TEST SELLER

`backend/database/seeders/DatabaseSeeder.php:21` **hanya memanggil `RoleSeeder`** — Flagship/Showcase/LoadTest harus dipanggil manual (`php artisan db:seed --class=FlagshipStoreSeeder`). Password universal semua seeder: **`password123`**. DB aktif: **pgsql `alurelab_dev`** (`backend/.env:18-23`); FE live mengarah ke `https://poco.digitalblitar.com/api/v1` (`frontend/.env.local:6-7`).

| Seeder (manual) | Email | Password | Verified? | Slug toko | Data |
|---|---|---|---|---|---|
| `FlagshipStoreSeeder` ✅ **paling lengkap** | `founder@kalmora.com` | `password123` | ✅ | `kalmora` | 12 produk HD, **50 orders** + payment + shipment, 20 buyer |
| `ShowcaseSeeder` | `kalmora@example.com` | `password123` | ✅ | `kalmora` ⚠️ **bentrok slug** | 3 produk, 5 order |
| `ShowcaseSeeder` | `techhub@example.com` | `password123` | ✅ | `techhub` | 3 produk, 5 order |
| `LoadTestSeeder` (200 seller) | `seller{1..200}@alurelab-loadtest.com` | `password123` | ✅ | `store-test-{1..200}` | 3 produk + order uji |
| `DatabaseSeeder` (default) | `amanda@hijabmevvah.com` | `password123` | ❌ **tidak ada `email_verified_at` → LOGIN DITOLAK** | `hijab-mevvah` | 1 produk, custom domain, wallet |
| `DatabaseSeeder` (default) | `budi@vibesneakers.id` | `password123` | ❌ **ditolak** | `vibe-sneakers` | 1 produk, custom domain, wallet |

**Cara login testing yang aman:** `php artisan db:seed --class=FlagshipStoreSeeder` → login `founder@kalmora.com` / `password123`.
Untuk `DatabaseSeeder`, verifikasi manual dulu: `php artisan tinker --execute 'App\Models\User::whereNull("email_verified_at")->update(["email_verified_at" => now()]);'`

⚠️ `database/factories/UserFactory.php:31` menulis kolom `password`, padahal kolomnya **`password_hash`** → user dari factory tidak bisa login.

---

## 4. BUG KRITIS DI LUAR SCOPE FITUR (wajib diperbaiki saat bangun alur)

1. **Dead-end registrasi tanpa toko** (§1.4) — blocker #1 alur target.
2. **`/admin/*` tanpa cek role** — `routes/api.php:216` hanya `auth:sanctum`, komentar bilang "role check in controller" tapi `AdminController` tidak mengecek apa pun; FE `(admin)/admin/layout.tsx:17-20` role check dikomentari.
3. **`AdminController` memakai relasi/kolom yang tidak ada**: `Store::storeUsers` (`:41,79`), `stores.status` (`:42`), `store.status`/`store.description` (`:63,90,92`) → error 500.
4. **CMS melapor sukses padahal gagal** (`cms/page.tsx:317-330`) — seller mengira tema/pages sudah ter-publish.
5. **Verifikasi email 404** (redirect ke `/api/v1/...` yang tidak ada di Next).
6. **`alurelab_store_slug` tidak pernah diset** → header `X-Store-Slug` mati.
7. **Tidak ada nav mobile** untuk dashboard seller.
8. Query Postgres-only (`ilike`, `COUNT(*) FILTER`) → 500 bila dijalankan di sqlite.

---

## 5. REKOMENDASI ALUR TARGET (urutan kerja)

**Fase 1 — Perbaiki fondasi auth (blocker):**
1. Endpoint `POST /stores` (atau buat `onboard` menerima user login) untuk user tanpa toko → state "toko kosong" resmi.
2. Login `store: null` → frontend redirect ke `/onboarding`/`/create-store` (**CTA "BUAT TOKO"**), jangan ke `/dashboard`.
3. Tentukan registrasi: **email ATAU nomor WA** — saat ini keduanya wajib tanpa OTP. Kalau mau OTP WA, bangun tabel `otps` + aktifkan Fonnte (token sudah ada di `.env`), jangan pinjam OTP buyer yang cuma cache & dev-only.

**Fase 2 — Setup Guide ala Shopify:**
4. Tabel `store_setup_steps` (atau deret state di `stores.settings.onboarding`) + endpoint `GET /merchant/setup-guide` & `PATCH .../steps/{step}`.
5. Widget di `/dashboard` ganti 3 kartu statis → checklist bertahap: `Tambah produk pertama` · `Pilih desain toko` · `Siapkan pembayaran` · `Cek tarif ongkir` · `Custom domain` · `Undang staff`. Hitung dari data real (produk>0, cms filled, `doku_account_status`, `address_area_id`, `custom_domain`).

**Fase 3 — Hidupkan fitur yang sudah ada tapi mati:**
6. Promotions (tabel `discounts` + hitung atomik saat checkout — alasan 503 sudah tertulis di kode), Bulk-ship, Payout withdraw.
7. Halaman **Payment (DOKU)** di settings → panggil `POST /merchant/payment/setup` + `GET /merchant/payment/status` yang sudah real.

**Fase 4 — Fitur baru Shopify standar:** Custom Domain (request+verify DNS), Team/Staff invite (`EnsureStoreRole` sudah siap), Content/Pages sebagai modul, Forgot password, Notifikasi.

**Dilema yang harus diputuskan lebih dulu:** apakah `/onboarding` (store-first) dipertahankan atau diganti jadi `/register` (user-first) + "Buat Toko" — saat ini keduanya hidup berdampingan dan saling memblokir.
