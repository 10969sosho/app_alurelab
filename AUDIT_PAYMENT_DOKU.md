# AUDIT: Integrasi Payment Gateway DOKU (Sub-Merchant)

**Tanggal audit:** 15 Oktober 2026
**Scope:** Seluruh workspace `/Users/10969sosho/PROJECTS/finance/PROJECT/PROJECT ANTIGRAVITY/ALURELAB`
**Status:** Temuan/read-only — belum ada perubahan kode.

---

## 1. Struktur Aplikasi

Monorepo berisi beberapa project independen (bukan workspace/turbo — masing-masing punya `package.json`/`composer.json` sendiri):

| Direktori | Peran | Stack |
|---|---|---|
| `backend/` | **API utama** | **Laravel 13.31**, PHP ^8.3, **PostgreSQL 16** (multi-tenancy via Row-Level Security), Redis 7, Sanctum 4.3, spatie/laravel-permission (terpasang tapi tidak dipakai di route), DomPDF |
| `frontend/` | **App utama** (storefront + dashboard merchant + admin) | **Next.js 15.5 App Router**, React 19, TypeScript, Tailwind, next-auth v5 (beta), axios, TanStack Query, zod |
| `backend-alurelab/` | Prototipe API billing (mati/tidak terhubung) | Express 5 + better-sqlite3 (`alurelab.db`), port 3050 — **tidak direferensikan frontend mana pun** |
| `landing-alurelab/` | Situs marketing statis | HTML/CSS/JS build output |
| `LANDING PAGE/focused-visuals-app/` | Landing app terpisah (punya `.git` sendiri) | TanStack Start + Vite |
| `docs/` | Spesifikasi (sebagian basi) | Dokumen 00–11 |
| `docker-compose.yml` | `postgres:16-alpine`, `redis:7-alpine` |

**Routing produksi** (`.htaccess:14-20`): LiteSpeed → `/api/v1/` + `/sanctum/` ke `backend/public/index.php`, sisanya reverse-proxy ke `127.0.0.1:3040` (Next.js via PM2).

**Catatan dokumentasi:** `docs/06_TECH_STACK_AUDIT.md` & `docs/ALURELAB_MASTER_CONTEXT.md` menyebut "Laravel 11 / MySQL" — **basi**. Realita: Laravel 13 / PostgreSQL.

---

## 2. Kode Payment Gateway yang Sudah Ada

### Kesimpulan: **hanya Xendit. Tidak ada DOKU, Midtrans, Tripay, atau Stripe di mana pun.**

Grep `doku|midtrans|tripay` di seluruh `*.php/*.ts/*.tsx/*.js/*.json/*.md` → nol hasil kode (hanya false positive kata "document"/"Doku" di copy marketing `landing-alurelab/tentang.html`).

### 2.1 Backend Laravel — Xendit XenPlatform (invoice/escrow, pembayaran order) — END-TO-END AKTIF

| File | Isi |
|---|---|
| `backend/app/Services/XenditService.php` | Satu-satunya gateway service. `isConfigured()` (:25, tolak key dummy), `verifyWebhookSignature()` (:30, constant-time pada `x-callback-token`), `createInvoice()` (:42-95) → `POST https://api.xendit.co/v2/invoices`, `external_id = order_number`, TTL 900 detik (:62), **platform fee line item** (:67-72), payment methods QRIS/VA/e-wallet (:73), header **`for-user-id` untuk sub-merchant/escrow merchant** (:82-84), short-circuit simulasi QA (:44) |
| `backend/app/Http/Controllers/Api/XenditWebhookController.php` | `handleInvoice()` (:30-149): cek token → cari order (system-bypass RLS) → validasi identitas+nominal → **idempotency** via `WalletTransaction.idempotency_key = "xendit_wh_{invoiceId}"` (:84-87) → `PAID`: order `paid_escrow`, konsumsi stok, `Payment::PAID`, **kredit `merchant_wallets.escrow_held_balance`** + ledger append-only (:94-138) → `EXPIRED`: batal order + release reservasi (:139-146) |
| `backend/app/Http/Controllers/Api/StorefrontController.php` | `checkout()` (:111-433): gate `isConfigured()` (:171-177, 503 `PAYMENT_UNAVAILABLE`) → create order (:307) → `createInvoice()` (:337) → `Payment::create()` ONLINE (:339) / COD (:354) → reservasi stok TTL dari config (:368) |
| `backend/routes/api.php` | `:89 POST /api/v1/webhooks/xendit/invoice`, `:106 POST /api/v1/checkout`, `:167 GET /api/v1/merchant/finance`, `:168 POST /api/v1/merchant/finance/withdraw` |
| `backend/config/services.php:38-43` | `xendit.secret_key / public_key / webhook_token / invoice_expiry_minutes(1440)`; `qa_simulation` :52-55 |
| `backend/.env.example:46-49` | `XENDIT_SECRET_KEY`, `XENDIT_PUBLIC_KEY`, `XENDIT_WEBHOOK_TOKEN` |
| `backend/app/Console/Commands/ReleaseExpiredReservations.php` | Scheduler tiap menit (`bootstrap/app.php:20-22`) — release stok saat jendela bayar habis |
| `backend/tests/Unit/ProviderWebhookVerificationTest.php` | Test verifikasi webhook token Xendit + Biteship |

**Disbursement/payout: stub.** `MerchantController::requestPayout()` (`backend/app/Http/Controllers/Api/MerchantController.php:336-344`) selalu **503 `PAYOUT_UNAVAILABLE`**. Kolom `payouts.xendit_disbursement_id` ada tapi tidak pernah ditulis.

**Gap kritis:** tidak ada kode yang memindahkan `escrow_held_balance → available_balance` (tipe `ESCROW_RELEASED` tidak pernah dipakai). Dana escrow dikredit tapi **tidak pernah dilepas**.

### 2.2 Bug yang Harus Diperbaiki Sebelum Sentuh Jalur Payment

**`App\Enums\WalletTxType` TIDAK ADA.** `backend/app/Enums/` hanya berisi `OrderStatus`, `PaymentStatus`, `ShipmentStatus`. Referensi di 3 file:
- `backend/app/Models/WalletTransaction.php:5,18`
- `backend/app/Http/Controllers/Api/XenditWebhookController.php:7,125`
- `backend/app/Http/Controllers/Api/StorefrontController.php:7,394`

→ Setiap webhook `PAID` atau pembayaran simulasi QA akan **fatal "Class not found"**.

### 2.3 `backend-alurelab/` — Prototipe langganan (Express, TIDAK terhubung)

- `src/routes/subscription.ts`: `POST /api/subscription/create-invoice` (:11) — plan `starter` Rp 99.000 / `pro` Rp 500.000 (:30), raw `fetch` ke Xendit (:47-67); `POST /api/subscription/webhook` (:82) — **tanpa verifikasi signature sama sekali**, set `users.plan` + `subscription_status='active'` +30 hari (:94-135).
- `src/database.ts:9-36` — tabel `users` (kolom `plan`, `subscription_status`, `subscription_expires_at`) + `transactions` (SQLite).
- `backend-alurelab/.env.example:5` — **kemungkinan key Xendit asli ter-commit.**

### 2.4 Frontend — UI pembayaran

- `frontend/src/app/[store_slug]/checkout/page.tsx` — `paymentMethod: 'ONLINE'|'COD'` (:42), tampil `invoice_url` "Bayar Sekarang via Xendit" (:245-257).
- `frontend/src/app/mock/xendit-invoice/[id]/page.tsx` — halaman invoice **palsu untuk demo/QA** (client-side only, :54-61).
- `frontend/src/app/(dashboard)/dashboard/finance/page.tsx` — saldo wallet, withdraw (copy bilang "instan via Xendit Disbursement" — **aspirasional, backend 503**).
- `frontend/src/app/(dashboard)/dashboard/subscription/page.tsx` — kartu plan **statis saja**; :48 eksplisit: *"Checkout … belum tersedia karena API billing backend belum diimplementasikan"*.
- `frontend/src/lib/utils.ts:81-98` — label `payments.payment_method`.

---

## 3. Tabel Order / Payment / Billing

Migrasi di `backend/database/migrations/` (Postgres, PK UUID, `timestampsTz`):

**`2026_09_14_000003_create_customers_orders_and_items_tables.php`**
- `customers`: `phone_number` (unique, **global lintas-tenant**), `full_name`, `email`, `default_address(jsonb)`, `total_orders`, `completed_orders`, `rts_rejected_orders`, `risk_score`, `is_blacklisted`
- `orders`: `tenant_id→stores`, `order_number(unique)`, `customer_id`, `status` (default `pending_payment`), `items_subtotal`, `shipping_cost`, `insurance_cost`, `discount_amount`, `total_amount`, `platform_fee_percent`(1.50), `platform_fee_amount`, `merchant_net_amount`, data pengiriman, idx(tenant_id, status)
- `order_items`: `tenant_id`, `order_id`, `product_id`, `variant_id`, `price`, `quantity`, `subtotal`

**`2026_09_14_000004_create_payments_and_shipments_tables.php`**
- `payments`: `tenant_id`, `order_id`, **`xendit_invoice_id` (unique, 100)**, `payment_method` (QRIS|VIRTUAL_ACCOUNT|EWALLET|COD), `payment_channel`, `amount(15,2)`, `gateway_fee(15,2)`, `status` (default PENDING), `paid_at`, `raw_webhook_payload(jsonb)`
- `shipments`: `biteship_order_id(unique)`, courier, waybill, `is_cod`, `cod_amount`

**`2026_09_14_000005_create_wallets_and_payouts_tables.php`**
- `merchant_wallets`: `store_id(unique)`, `available_balance`, `escrow_held_balance`
- `wallet_transactions`: `type` — `ORDER_ESCROW_CREDIT|ESCROW_RELEASED|WITHDRAWAL|REFUND_DEBIT`, `amount`, `balance_before/after`, **`idempotency_key(unique,150)`**
- `payouts`: `xendit_disbursement_id(unique,nullable)`, bank, `amount`, `fee_amount`(3000), `status`

**RLS:** `2026_09_14_000006_enable_postgres_rls_policies.php` — policy `tenant_isolation_*` pada `products, product_variants, orders, order_items, payments, shipments, wallet_transactions, payouts` berbasis `app.current_tenant_id` / `app.is_system_bypass`.

**TIDAK ADA migrasi untuk:** `subscriptions`, `billing`, `invoices` (platform), `plans`, `teams`, `workspaces`.

---

## 4. Struktur Tenant / Merchant / User / Subscription

**Tenancy = tabel `stores`** (1 baris = 1 merchant tenant). Tidak ada tabel `tenants`/`teams`/`workspaces`.

### Model (`backend/app/Models/`)

- **`Store`** (= tenant). Kolom kunci (`2026_09_14_000001_...php:20-38`): `id(uuid)`, `slug(unique)`, `custom_domain(unique)`, `custom_domain_status`, **`xendit_sub_account_id(unique)`**, **`xendit_account_status` (default 'unregistered')**, **`plan_tier` (default 'starter')**, **`plan_expires_at`**, `settings(jsonb)`. Relasi: `users()` belongsToMany via `store_users` (pivot `role`), `orders()` hasMany(tenant_id), `wallet()` hasOne.
- **`User`** — akun seller/admin (Sanctum, UUID). Kolom: `name`, `email`, `phone_number`, `password_hash` (override `getAuthPassword()` :33-36), `is_superadmin`.
- **`StoreUser`** — join `store_users(store_id, user_id, role default 'owner')`, unique pasangan. **Role yang benar-benar dipakai dari pivot ini**, bukan spatie.
- **`Customer`** — pembeli, **global lintas-tenant via `phone_number`** (ledger anti-RTS: `risk_score`, `is_blacklisted`). OTP via `CustomerAuthController`, terpisah dari `User`.
- **`Order`/`Payment`/`Shipment`/`MerchantWallet`/`WalletTransaction`/`Payout`** — semua ber-`tenant_id`. Catatan: `Order::store()` adalah `belongsTo(Store::class,'tenant_id')` (nama relasi vs kolom tidak sinkron).

### Middleware

- **`IdentifyTenant`** (`backend/app/Http/Middleware/IdentifyTenant.php`) — resolve tenant dari `x-tenant-id` / `x-store-slug` / subdomain `*.alurelab.shop` → `stores.slug` / `custom_domain` aktif; fallback `user->stores()->first()` (:44). Set **`SET app.current_tenant_id = '{uuid}'`** di Postgres (:116), bind `app('current_tenant')` (:119-122). Blokir customer dari `/merchant/*` (:86-94).
- **`EnsureStoreRole`** — cek pivot `role` (`owner,manager,...`), alias `store.role` (`bootstrap/app.php:26`).

### Subscription / Plan

Hanya **2 kolom di `stores`**: `plan_tier` + `plan_expires_at`. **Tabel plan, entitlement check, dan endpoint billing di Laravel tidak ada.** Onboarding hardcode `'plan_tier' => 'starter'` (`MerchantController.php:54`).

**Harga plan tidak konsisten di 3 tempat:**
| Sumber | Plan & harga |
|---|---|
| Dashboard `subscription/page.tsx:6-10` | Starter 99rb / Pro 249rb / Business 599rb |
| Prototipe `subscription.ts:30` | starter 99rb / pro **500rb** (2 plan) |
| Marketing `landing-alurelab/pricing.html:9` | Starter 99rb / **Growth 499rb** / Enterprise Kustom |

**Backlog resmi:** `docs/00_OVERVIEW_AND_ROADMAP.md:101-103` — "SPRINT 7: Merchant Billing (BACKLOG)"; `docs/09_IMPLEMENTATION_PRIORITY.md:35` & `docs/10_PRODUCTION_READINESS_AUDIT.md:72` — "Subscription billing: not implemented".

---

## 5. Implikasi untuk Integrasi DOKU (Sub-Merchant)

### 5.1 Pemetaan konsep Xendit → DOKU

| Konsep | Xendit (ada) | DOKU (perlu) |
|---|---|---|
| Sub-merchant/penjual | `for-user-id` header + `stores.xendit_sub_account_id` | Sub-merchant ID DOKU (registered via API DOKU) |
| Status onboarding sub-merchant | `stores.xendit_account_status` | Perlu kolom/konversi status DOKU |
| Buat tagihan | `POST /v2/invoices` (`XenditService::createInvoice`) | API Invoice/Virtual Account DOKU (baru) |
| Webhook | `POST /api/v1/webhooks/xendit/invoice` + `x-callback-token` | Endpoint webhook DOKU baru + verifikasi signature DOKU |
| Kolom penampung di `payments` | **`xendit_invoice_id` (unique)** | Tidak ada kolom generik `gateway`/`transaction_id` — **perlu migrasi** (kolom `doku_invoice_id` atau rename ke generik + `gateway` column) |
| Idempotency ledger | `idempotency_key = "xendit_wh_{id}""` | Pola sama bisa dipakai, prefix `doku_wh_` |
| Fee platform | Line item fee di payload invoice | Tidak ada; hitung manual via `platform_fee_amount` (kolom sudah ada) |
| Config | `config/services.php` + `.env` | Tambah `doku.*` + `DOKU_*` env |

### 5.2 Yang bisa DIPAKAI ULANG langsung (jangan ditulis ulang)

1. **Alur checkout & webhook sudah benar** — cukup ganti `XenditService` dengan adapter DOKU di balik interface/service yang sama; `StorefrontController::checkout()` dan `XenditWebhookController` tinggal dipindah/diganti gateway-nya.
2. **Skema `payments` + RLS + idempotency + escrow ledger** sudah cocok untuk model sub-merchant.
3. **`IdentifyTenant` + `store.role`** sudah menjamin isolasi per-merchant.
4. **Scheduler release-reservasi** tidak bergantung gateway.

### 5.3 Yang BELUM ADA (harus dibuat untuk DOKU)

1. **Mapping sub-merchant DOKU** — kolom `stores` hanya punya `xendit_sub_account_id`; perlu keputusan: tambah kolom `doku_sub_merchant_id` atau generikkan (`gateway`, `gateway_account_id`).
2. **Endpoint webhook DOKU** + verifikasi signature (salin pola `verifyWebhookSignature` constant-time).
3. **Kolom referensi transaksi gateway generik** di `payments` (saat ini hanya `xendit_invoice_id`).
4. **Migration** untuk tabel `subscriptions`/`billing` bila DOKU juga dipakai untuk langganan merchant (Sprint 7) — saat ini tidak ada sama sekali.
5. **Escrow release + payout** masih 503 — kalau DOKU dipakai untuk split/settlement, ini wajib diisi.

### 5.4 Perbaikan prasyarat (sebelum kode payment baru)

- [ ] **Buat `backend/app/Enums/WalletTxType.php`** — path pembayaran saat ini fatal tanpa ini.
- [ ] Putuskan **satu gateway** atau rancang multi-gateway (`payments.gateway` column) sejak awal — jangan tambah kolom `doku_*` berdampingan dengan `xendit_*` bila bisa dihindari.
- [ ] Selaraskan **harga plan** (dashboard vs prototipe vs landing) sebelum billing apapun di-build.
- [ ] Rotasi & bersihkan **key yang ter-commit** (`backend-alurelab/.env.example:5`, `backend/.env`).
- [ ] Dokumen `docs/03_PAYMENT_AND_SHIPPING_INTEGRATION.md` = spesifikasi Xendit; perlu revisi/duplikat untuk DOKU.

---

## 6. Ringkasan Eksekutif

1. **Struktur:** `backend/` = Laravel 13 + PostgreSQL 16 (RLS multi-tenant) — API utama; `frontend/` = Next.js 15; `backend-alurelab/` = Express+SQLite prototipe mati.
2. **Payment existing:** **Xendit XenPlatform saja**, end-to-end untuk order (invoice → webhook → escrow). Tidak ada DOKU/Midtrans/Tripay/Stripe. Payout & escrow-release belum diimplementasi (503).
3. **Tenant/merchant:** tabel `stores` = tenant (kolom `xendit_sub_account_id`, `plan_tier`, `plan_expires_at`); pivot `store_users` = RBAC; `customers` = pembeli global lintas-tenant. **Subscription billing di Laravel belum ada** (hanya 2 kolom plan + prototipe Express yang tidak terhubung).
4. **Blocker awal:** enum `WalletTxType` hilang (payment path fatal), kolom `payments` hanya menampung Xendit (`xendit_invoice_id`), harga plan 3 sumber tidak konsisten.
