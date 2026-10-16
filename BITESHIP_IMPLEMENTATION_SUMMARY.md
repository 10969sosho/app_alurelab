# Biteship End-to-End Integration — Implementation Summary

Tanggal: 2026-10-15
Backup file yang ditimpa: suffix `.bak_20261015_*` di samping file asli.

## 1. Konfigurasi

- `backend/.env` & `backend/.env.example`:
  - `BITESHIP_BASE_URL=https://api.biteship.com/v1` (baru; fallback lama `BITESHIP_API_URL` tetap didukung).
  - `BITESHIP_API_KEY` diset sesuai permintaan (key `biteship_test.…` ALURELAB).
  - `BITESHIP_WEBHOOK_SECRET` diisi random secret (dulu **kosong** → semua webhook 401, tracking tidak pernah jalan). Ganti dengan secret yang didaftarkan di dashboard Biteship.
- `backend/config/services.php`: `services.biteship.url` kini membaca `BITESHIP_BASE_URL` (fallback `BITESHIP_API_URL`). Konfigurasi DOKU **tidak disentuh**.

## 2. Backend

### BiteshipService (`app/Services/BiteshipService.php`)
- **Bobot riil**: `createShippingOrder` menghitung `weight` per item dari `order_items → product.weight_grams` (bukan hardcode 200 g). Dimensi item dari `store.settings.shipping_item_dimensions` (default 10×10×10 cm).
- **`reference_id`** = `order_number` dikirim ke `POST /orders` (idempotensi/traceability di dashboard Biteship).
- Origin hardcode Surabaya dihapus — memakai `store.address_area_id` yang sudah di-guard controller.
- **Kurir aktif dari settings toko**: `settings.couriers` (array) → `activeCouriers()`; default platform `jne,jnt,sicepat,anteraja`.
- **`buildRateItems()`**: helper baru — membangun payload tarif dari DB (`weight_grams` + harga varian), dipakai rate check dan checkout supaya selalu match (anti 409).
- **Method baru**: `getTracking(biteshipOrderId)` (`GET /orders/{id}`) dan `getWaybill(courier, waybillId)` (`GET /couriers/{courier}/wayboards/{waybill}/trace`).
- Guard QA simulation: `store_slug` kosong tidak lagi match semua toko.

### LogisticsController
- `checkRates` kini memvalidasi input dan membangun item tarif **server-side** dari `products.weight_grams` (client tidak lagi mengontrol bobot/harga → anti mismatch & abuse).
- `searchAreas` & `checkRates` dibungkus try/catch → 503 rapi (bukan 500 mentah).

### Webhook (`BiteshipWebhookController`)
- Status lengkap ditangani: `allocated, picking_up, picked, dropping_off, in_transit, delivered, cancelled, returned, return_to_shipper, rejected`.
- `ShipmentStatus` enum ditambah: `PICKED`, `DROPPING_OFF`, `CANCELLED`.
- Mapping ke order: in-transit-ish → `shipped`; `delivered` → `delivered` + `delivered_at`; `cancelled` → `cancelled`; returned/rejected → `rts_returned` (dengan outcome Anti-RTS).
- Lookup diperbaiki: payload tanpa `order_id`/`courier_waybill_id` ditolak 422 (dulu bisa match shipment acak via `IS NULL OR IS NULL`).
- `SET app.current_tenant_id` tetap literal (SET Postgres tidak menerima bind param), nilai berasal dari kolom DB.

### OrderController
- `createShipment` kini mengisi `shipped_at` (kolomnya selalu NULL sebelumnya).
- Alur manual merchant `POST /merchant/orders/{id}/shipment` tetap: booking Biteship → simpan `Shipment` → order `shipped`. Tidak ada auto-ship saat paid (COD perlu verifikasi dulu; alur toko = manual booking).

## 3. Frontend

### Checkout (`[store_slug]/checkout/page.tsx`)
- **Bug 409 weight mismatch fixed**: payload rate tak lagi hardcode `weight: 200` — kirim `product_id/variant_id/quantity` (+ `weightGrams` dari cart). Bobot final dihitung backend dari DB, sehingga quote display == re-quote checkout.
- **Bug area id fixed**: `destination_area_id` yang dikirim = hasil resolve (`nextAreaId`), bukan argumen mentah yang bisa kosong; `buildAreaId` fallback kini format Biteship `ID_ID_{regency}_{district}` (bukan dotted string salah format).
- Copy success screen Xendit → DOKU.

### Cart (`store/cart-store.ts`)
- `CartItem` punya field opsional `weightGrams`; diisi dari `product.weight_grams` di `BuyerProductCard` dan halaman produk (add to cart & buy now).

### Tracking
- Buyer (`[store_slug]/orders/[id]/page.tsx`): badge **Status Resi** dari `shipment.tracking_status` (allocated → returned) di kartu resi.
- Merchant (`dashboard/orders/[id]/page.tsx`): badge status resi di kartu logistik + opsi kurir `anteraja` (standard) ditambahkan.

## 4. Verifikasi

- `vendor/bin/pint --dirty` → 1 file diformat ulang (phpdoc).
- `php artisan test --compact` → **27/27 tests passed, 140 assertions**.
- File DOKU (`config/doku.php`, DokuService, webhook DOKU, env DOKU) tidak diubah.

## Catatan tindak lanjut (belum dikerjakan, sadar disederhanakan)

- Set `BITESHIP_WEBHOOK_SECRET` di dashboard Biteship = nilai di `.env` agar webhook tracking live diterima.
- `POST /logistics/rates` belum diberi rate-limit (pertimbangkan `throttle` bila sudah masuk produksi publik).
- Weight varian produk tidak ada kolomnya di DB (hanya `products.weight_grams`) — bila per-variant weight, tambah kolom + migrasi.
- `merchant/shipping/bulk-ship` masih disabled (503) — di luar scope.
