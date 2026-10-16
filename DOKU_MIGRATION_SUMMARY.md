# DOKU MIGRATION SUMMARY

Migrasi total payment gateway: **Xendit → DOKU Checkout V1 (Sandbox + Sub-Merchant)**.
Tanggal: 2026-10-15. Semua file lama dicadangkan dengan akhiran `.bak_20261015_doku_migration`.

## 1. File Baru

| File | Isi |
|---|---|
| `backend/app/Enums/WalletTxType.php` | Enum `ORDER_ESCROW_CREDIT`, `ESCROW_RELEASED`, `WITHDRAWAL`, `REFUND_DEBIT` (sebelumnya hilang → path payment fatal). |
| `backend/database/migrations/2026_10_15_000001_replace_xendit_with_doku_columns.php` | `payments.doku_invoice_id` (nullable, unique), `payments.payment_url` (text nullable), `payments.xendit_invoice_id` → **nullable**; `stores.doku_sub_account_id` (nullable, unique), `stores.doku_account_status` (default `unregistered`); `payouts.doku_payout_id` (nullable, unique). `down()` men-drop kolom baru (rollback sudah diuji). |
| `backend/config/doku.php` | `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `DOKU_ENVIRONMENT`, base URL sandbox `https://api-sandbox.doku.com` / production `https://api.doku.com`, `DOKU_INVOICE_EXPIRY_MINUTES`, path notifikasi, toleransi signature 300s, daftar payment method. |
| `backend/app/Services/DokuService.php` | `generateSignature()` (HMAC-SHA256 atas `Client-Id`/`Request-Id`/`Request-Timestamp`/`Request-Target`/`Digest`, digest = base64 SHA-256 body), `createCheckoutInvoice($order, $store)` → `POST {base}/checkout/v1/payment` (payload `order.*`, `payment.payment_methods`, `customer`, `additional_info.settlement` bila toko punya `doku_sub_account_id` + rekening bank di `settings.bank_account`), return `[success, invoice_url, invoice_id, expiry_date, error]`, `verifyWebhookSignature($request)` (Request-Id + timestamp segar ±300s + HMAC multi-target). Pintu simulasi QA dipertahankan. |
| `backend/app/Http/Controllers/Api/DokuWebhookController.php` | `handleNotification()`: verifikasi signature → bypass RLS (`SET app.is_system_bypass`) → cari order via `invoice_number` → cek identitas/amount payment → idempotency `doku_wh_{invoice_number}` → kredit `merchant_wallets.escrow_held_balance` + ledger `WalletTxType::ORDER_ESCROW_CREDIT` → order `OrderStatus::PAID_ESCROW` + konsumsi stok; status `EXPIRED/FAILED/CANCELLED` → batal order + lepas reservasi. |
| `backend/tests/Unit/DokuServiceTest.php` | Checkout request signed (URL, header, digest, signature HMAC, payload), gagal tanpa kredensial. |

## 2. File Diubah (backup: `*.bak_20261015_doku_migration`)

| File | Perubahan |
|---|---|
| `backend/routes/api.php` | `POST /api/v1/webhooks/doku/notification` → `DokuWebhookController@handleNotification`; route Xendit **dikomentari (deprecated)**; import Xendit dibuang; `pint` formatting. |
| `backend/app/Http/Controllers/Api/StorefrontController.php` | `XenditService` → `DokuService`: guard `PAYMENT_UNAVAILABLE` pakai `dokuService->isConfigured()`, `checkout()` memanggil `createCheckoutInvoice()`, gagal gateway → **502 `PAYMENT_GATEWAY_ERROR`** (order tidak dibuat payment), payment disimpan ke `doku_invoice_id` + `payment_url`, COD → `doku_invoice_id = COD-{order_number}`, expiry reservasi memakai `config('doku.invoice_expiry_minutes')`. Respons `payment` tetap memuat `invoice_url` (kompatibel frontend) + `payment_url`. |
| `backend/app/Http/Controllers/Api/AuthController.php` | `formatStore()` menambah `doku_account_status` (menyisakan `xendit_account_status` untuk kompatibilitas frontend). |
| `backend/config/services.php` | Blok `xendit.*` dihapus (deprecated → `config/doku.php`). |
| `backend/.env` / `backend/.env.example` | Ditambah: `DOKU_CLIENT_ID=BRN-0287-1792043041007`, `DOKU_SECRET_KEY=SK-VdyEuHc2V4sMAGhqZCFA`, `DOKU_ENVIRONMENT=sandbox`, `DOKU_INVOICE_EXPIRY_MINUTES=1440`; variabel Xendit ditandai `[DEPRECATED]`. |
| `backend/tests/Unit/ProviderWebhookVerificationTest.php` | Test Xendit diganti DOKU: signature benar/salah, timestamp basi ditolak, notifikasi valid order tak dikenal → `ignored`, notifikasi palsu → 401; test Biteship dipertahankan. |

## 3. File Dihapus (cadangan `.bak_20261015_doku_migration` tersedia)

- `backend/app/Services/XenditService.php`
- `backend/app/Http/Controllers/Api/XenditWebhookController.php`

## 4. Verifikasi

- `php artisan migrate` → DONE; kolom & index unique terverifikasi (`php artisan db:table`).
- `php artisan migrate:rollback --step=1` lalu `php artisan migrate` → rollback-safe, teruji.
- `php artisan route:list --path=webhooks` → hanya `doku/notification` + `biteship/tracking`.
- `vendor/bin/pint --dirty` / `pint` file baru → bersih.
- `php artisan test --compact` → **18/18 lulus, 92 asersi**.

## 5. Deviasi & Catatan

1. **RLS bypass memakai `'on'`, bukan `'true'`** — policy Postgres (`2026_09_14_000006_...php:41`) mengecek `= 'on'`; memakai `'true'` membuat webhook tidak bisa menemukan order (RLS FORCE).
2. Platform fee 1,5% tidak dikirim sebagai line item fee di payload DOKU (tidak ada field fee yang terverifikasi di Checkout V1); escrow tetap dikredit `merchant_net_amount`. Bila DOKU sandbox menerima field fee/split, tambahkan di `DokuService::createCheckoutInvoice()`.
3. `additional_info.settlement` memakai `stores.doku_sub_account_id` + `settings.bank_account` — format akhir mengikuti skema settlement DOKU yang disetujui account manager.
4. `payouts.doku_payout_id` hanya disiapkan; `MerchantController::requestPayout()` masih 503 (disbursement belum diimplementasikan, sama seperti sebelumnya).
5. Frontend masih menampilkan copy "Xendit" (checkout button, finance page, terms, template footer) — tidak diubah karena di luar lingkup instruksi; `invoice_url` tetap dikirim sehingga alur bayar jalan.
6. `composer.json` masih memuat `xendit/xendit-php` (tidak diubah tanpa persetujuan) — tidak dipakai kode mana pun.
7. Seeder (`FlagshipStoreSeeder`, `LoadTestSeeder`) masih mengisi `xendit_invoice_id` (kolom masih ada, nullable) — tidak berpengaruh pada alur DOKU.
