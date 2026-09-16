# ALURELAB Production Readiness Audit

**Tanggal audit:** 16 September 2026  
**Scope:** `backend/`, `frontend/`, database migrations, API routes, UI routes, dan dokumen arsitektur 00-09.  
**Tujuan:** Menentukan apa yang benar-benar aman untuk production, apa yang masih mock/putus, apa yang wajib direvisi, dan apa yang tidak perlu dibangun untuk model bisnis ALURELAB.

## 1. Kesimpulan Eksekutif

ALURELAB **belum production-ready** dan belum boleh menerima transaksi nyata.

Masalah terbesar bukan kekurangan kosmetik, tetapi jalur demo masih dapat terlihat seperti transaksi berhasil:

- Checkout dapat membuat order sukses palsu ketika API gagal atau cart kosong.
- Login buyer dapat menganggap user berhasil login walaupun backend gagal.
- Halaman pembayaran masih simulasi client-side.
- Product, order, tracking, account, dan CMS mempunyai fallback data palsu.
- Authorization tenant dan RBAC belum benar-benar dipasang.
- Webhook payment/shipping belum fail-closed dan belum idempotent.
- Payout dapat berstatus selesai tanpa transfer dana nyata.
- Promo seller tersimpan, tetapi tidak ikut menghitung checkout.

**Keputusan go-live:** `NO-GO` sampai seluruh item P0 pada dokumen ini ditutup dan diuji dengan database/provider staging.

## 2. Model Bisnis Yang Dipakai

Model yang terlihat dari repository dan dokumen adalah:

> SaaS multi-tenant untuk merchant Indonesia. Setiap merchant memiliki satu storefront sendiri, mengelola katalog, menerima order, pembayaran, pengiriman, dan data pelanggan melalui dashboard ALURELAB.

Ini **bukan** marketplace agregator tempat pembeli mencari banyak seller dan membayar satu cart lintas seller seperti Shopee/Tokopedia.

Konsekuensinya:

- Prioritas utama adalah merchant dapat membuat toko, menerbitkan katalog, menerima order, memproses pengiriman, dan menerima dana dengan benar.
- Cart harus dibatasi satu `store_slug`; multi-store cart tidak diperlukan.
- Discovery global, komisi affiliate, live shopping, chat internal, seller rating lintas platform, dan settlement marketplace tidak diperlukan untuk MVP SaaS.
- Benchmark Shopee/Tokopedia dipakai untuk kualitas alur dan edge case, bukan untuk menyalin semua fiturnya.

## 3. Status Gate Production

### P0: Stop-ship

Semua item berikut wajib selesai sebelum toko boleh menerima transaksi real:

1. Hapus semua fallback sukses palsu dari login, checkout, payment, product, account, order tracking, dan CMS.
2. Terapkan auth backend yang benar untuk merchant dan buyer, termasuk logout/revoke token.
3. Terapkan validasi membership tenant dan RBAC pada setiap endpoint seller.
4. Reprice cart di server: produk, varian, harga, stok, ongkir, diskon, dan total tidak boleh dipercaya dari browser.
5. Selesaikan payment live atau matikan online payment sampai benar-benar siap.
6. Verifikasi webhook Xendit dan Biteship dengan signature/token, payload identity, amount, status transition, dan idempotency.
7. Selesaikan inventory reservation/release yang atomik dan punya expiry.
8. Jangan menampilkan bank account, settings private, atau data order buyer kepada pihak yang tidak berhak.
9. Selesaikan payout lifecycle atau matikan fitur withdrawal.
10. Pasang rate limit, logging, alerting, backup, dan test untuk tenant isolation.

### P1: Wajib untuk operasional merchant

- Product form menyimpan field penting: SKU, berat, dimensi, harga modal, media, status draft/aktif, varian, dan kategori.
- Order state machine mencakup cancel, refund, return/RTS, shipment, delivered, completed, dan alasan perubahan.
- Biteship rate lookup, booking shipment, AWB, label, dan tracking terhubung.
- Promo/voucher dihitung di checkout, bukan hanya tersimpan di settings.
- CMS publish dari backend; localStorage hanya untuk draft preview.
- Dashboard memiliki error state, empty state, loading state, dan retry yang jujur.
- Settings menyimpan hanya section yang diubah dan tidak menimpa konfigurasi lain dengan default.

### P2: Setelah transaksi inti stabil

- Analytics historis dan export.
- WhatsApp/email notifications.
- Customer blacklist dan Anti-RTS workflow yang lebih lengkap.
- Custom domain.
- Subscription billing.
- AI description/photo studio.

## 4. Audit A-Z

Status digunakan sebagai berikut:

- **BLOCKED:** ada risiko transaksi, security, atau data integrity.
- **PARTIAL:** ada implementasi, tetapi belum lengkap/terhubung.
- **MOCK:** UI/API terlihat ada, tetapi data atau efek bisnis masih palsu.
- **MISSING:** belum ada.
- **READY:** cukup untuk MVP setelah verifikasi runtime.
- **DEFER:** tidak dibutuhkan untuk model bisnis MVP.

| Kode | Area | Status | Temuan utama | Prioritas |
|---|---|---|---|---|
| A | Authentication | BLOCKED | Merchant login memakai NextAuth tetapi role selalu owner; buyer login dapat fallback token palsu; OTP belum ada | P0 |
| B | Buyer account | BLOCKED | Profile/order memakai phone query dan token buyer tidak dikirim konsisten; data dapat ter-expose/terubah | P0 |
| C | Catalog buyer | BLOCKED | API gagal dapat berubah menjadi store/product demo; stok/varian dapat difabrikasi | P0 |
| D | Dashboard seller | PARTIAL | Banyak halaman terhubung API, tetapi error disamarkan menjadi nol/default dan banyak control mati | P1 |
| E | Ecommerce checkout | BLOCKED | Cart kosong/API gagal dapat menghasilkan sukses palsu; field wajib memakai default palsu | P0 |
| F | Finance | BLOCKED | Payout langsung `COMPLETED` tanpa Xendit disbursement; ledger tidak cukup aman | P0 |
| G | Goods/product form | PARTIAL | Form ada, tetapi validasi field, media, varian, status, dan error belum production-grade | P1 |
| H | Hosting/deployment | PARTIAL | Ada SOP, tetapi monitoring, secret validation, queue/cron, rollback, dan smoke test belum dibuktikan | P1 |
| I | Inventory | BLOCKED | Redis dan database dapat divergen; reservation gagal pada beberapa path | P0 |
| J | Jobs/queues | MISSING | Expiry reservation, retry webhook, notification, dan reconciliation belum terbukti berjalan | P1 |
| K | CMS/storefront builder | BLOCKED | Save gagal dilaporkan sukses; localStorage dapat mengalahkan published backend; default Kalmora | P0 |
| L | Logistics | BLOCKED | Rate shipping statis, bulk ship fake, webhook Biteship tanpa signature | P0 |
| M | Merchant onboarding | PARTIAL | Wizard ada, tetapi payment/store setup dan validasi belum menjadi kontrak production | P1 |
| N | Notifications | MOCK | Bell badge `21`, tidak ada notification list/handler; WhatsApp/email belum berjalan | P2 |
| O | Orders | BLOCKED | State transition, return/refund/RTS, ownership, dan shipment relation belum konsisten | P0 |
| P | Promotions | BLOCKED | Promotion disimpan dalam settings tetapi checkout selalu `discount_amount = 0` | P0 |
| Q | Query/API contract | BLOCKED | `fetchApi` tidak throw pada HTTP error; header tenant berbeda-beda | P0 |
| R | Reviews/ratings | DEFER | Spec ada, database/API/review moderation belum ada; bukan syarat SaaS storefront MVP | P2 |
| S | Search/catalog filters | MISSING | Search, category route, sort/filter dan pagination production belum tersedia | P1 |
| T | Tenant isolation | BLOCKED | Header tenant dipercaya tanpa cek membership user; RLS context memakai `SET`, bukan `SET LOCAL` | P0 |
| U | Upload/media | BLOCKED | R2 disk belum dikonfigurasi; background removal mengembalikan placeholder; path local berisiko | P0 |
| V | Validation | BLOCKED | Client defaults dan server trust terhadap shipping/relations; validasi antar field belum lengkap | P0 |
| W | Webhooks | BLOCKED | Biteship tidak signature-verified; Xendit tidak API-reconcile; idempotency belum atomik | P0 |
| X | eXperience/accessibility | PARTIAL | Banyak dialog/control tanpa semantics, focus handling, loading/error boundary | P1 |
| Y | Yield/analytics | MOCK | Period tidak dikirim ke API; growth `+14.2%` hardcoded; sales product selalu 0 | P1 |
| Z | Zero-downtime/observability | MISSING | Sentry/alerting/reconciliation/rollback smoke test belum selesai | P1 |

## 5. Audit Perjalanan Buyer

### 5.1 Membuka storefront

**File:** `frontend/src/app/[store_slug]/page.tsx`, `StorefrontClient.tsx`, `StorefrontController.php`

Yang sudah ada:

- Dynamic route store.
- Store info dan product API.
- Template Modern/Editorial.
- Add to cart.

Yang belum aman:

- Error API menjadi toko kosong/demo, bukan `404` atau error yang bisa di-retry.
- Produk tanpa varian dapat diberi varian `Standard` dan stok buatan.
- `settings` publik mengembalikan seluruh JSON, berpotensi termasuk setting private/bank.
- Template switcher tampil pada storefront production.
- LocalStorage CMS dapat berbeda dengan data yang dilihat pembeli lain.
- Menu CMS dengan anchor relatif dapat keluar dari `store_slug`.

**Acceptance criteria:** store tidak ditemukan harus 404; outage harus menampilkan error/retry; setiap harga/stok/varian berasal dari backend; public settings memakai allowlist; hanya published CMS yang dirender.

### 5.2 Login buyer dan akun

**File:** `BuyerLoginModal.tsx`, `buyer-store.ts`, `CustomerAuthController.php`, account page.

Masalah production:

- Login tidak membuktikan kepemilikan nomor karena OTP/WhatsApp belum ada.
- Catch API membuat `mock-buyer-jwt-token` dan profile palsu.
- Token dan profile disimpan di localStorage.
- Endpoint profile/orders tidak konsisten memakai `auth:sanctum`.
- `phone` query dapat dipakai untuk enumeration/IDOR.
- Logout frontend tidak menjamin revoke token backend.

**Acceptance criteria:** guest boleh checkout, tetapi account/order history wajib memakai session buyer yang valid; endpoint mengambil customer dari token, bukan phone query; OTP atau verifikasi provider selesai; token revoke saat logout; data customer selalu tenant-scoped untuk tampilan toko.

### 5.3 Detail produk dan cart

Yang wajib diperbaiki:

- Product detail tidak boleh membuat product jika slug gagal.
- Quantity tidak boleh melewati stock yang diketahui, dan tetap harus divalidasi ulang server.
- Cart harus memiliki `store_slug`; jangan mencampur item antar toko.
- Cart perlu persist secara sadar atau tetap memory-only dengan pesan yang jelas. Untuk MVP SaaS, persist per store lebih berguna daripada wishlist.
- Cart item harus direfresh/reprice sebelum checkout.
- Product detail yang direncanakan belum seluruhnya ada: gallery/zoom, category, search, review, related products, dan shipping quote.

### 5.4 Checkout

**File:** `frontend/src/app/[store_slug]/checkout/page.tsx`, `StorefrontController.php`, `InventoryService.php`.

Ini adalah blocker tertinggi.

- Empty cart memakai subtotal demo.
- Nama, phone, address, dan area yang kosong diisi default palsu.
- Shipping area dan fee masih hardcoded.
- Browser dapat mengirim shipping cost sendiri.
- Product/variant relationship dan tenant tidak selalu diverifikasi.
- Promotion/voucher tidak masuk total.
- Reservation stock dapat bocor ketika COD ditolak.
- API failure dapat tetap redirect ke invoice simulasi.

**Acceptance criteria checkout:**

1. Cart kosong selalu kembali ke cart.
2. Field penerima, area, detail address, payment method, dan courier wajib valid sesuai bisnis.
3. Server mengambil ulang product/variant price, active state, stock, weight, dan discount.
4. Server menerima hanya shipping quote token yang diterbitkan backend/provider.
5. Total dihitung server dan dikembalikan sebagai order total resmi.
6. Reservation punya id, expiry, release pada semua failure, dan tidak bisa dipakai dua order.
7. Tidak ada response sukses jika order/payment provider gagal.
8. Semua retry memakai idempotency key agar double-click tidak membuat dua order.

### 5.5 Payment dan invoice

**File:** `mock/xendit-invoice/[id]/page.tsx`, `XenditService.php`, `XenditWebhookController.php`.

- Payment status harus berasal dari backend/provider, bukan tombol `Simulasi Bayar Berhasil`.
- Webhook harus cek callback token/signature, invoice/payment ID, order ID, amount, tenant, dan status provider.
- Event duplicate/replay harus aman.
- Expired/failed payment harus release stock.
- Invoice buyer hanya boleh terlihat oleh owner order atau secure token.

Untuk MVP, pilih satu keputusan sederhana: **aktifkan satu metode online yang benar-benar teruji**, atau nonaktifkan online payment dan hanya aktifkan COD/manual flow yang memang sudah aman. Jangan menampilkan QRIS/VA/GoPay/OVO sekaligus jika backend belum mampu reconcile semuanya.

### 5.6 Order tracking dan post-purchase

- Buyer tracking saat ini dapat menampilkan tracking hardcoded.
- Order detail buyer dapat membuat order demo ketika API gagal.
- Belum ada bukti ownership yang cukup.
- State `delivered`, `completed`, `rts_returned`, cancel, refund, dan complaint belum lengkap.
- Invoice PDF, received confirmation, complaint, dan refund perlu diputuskan; jangan tampilkan tombol yang belum bekerja.

**MVP minimum:** order list/detail aman, status nyata, AWB nyata, link tracking provider, invoice HTML/print, dan customer support via WhatsApp. Refund/complaint dapat menjadi P1 setelah payment live, tetapi tidak boleh ada klaim palsu.

## 6. Audit Dashboard Seller

### 6.1 Auth, tenant, dan role

**File:** `routes/api.php`, `IdentifyTenant.php`, `middleware.ts`, `auth.ts`.

Masalah:

- Authenticated user dapat mengirim tenant header lain tanpa bukti membership yang kuat.
- Role/permission sudah diseed tetapi tidak dipasang ke route/policy.
- NextAuth selalu memetakan role ke `owner`.
- Middleware frontend hanya memeriksa session, bukan izin.

**Wajib:** backend menjadi sumber kebenaran. Resolve store dari membership user, bukan header mentah. Header hanya boleh memilih salah satu store yang memang dimiliki/diizinkan user. Terapkan policies/abilities untuk owner, manager, dan staff order pada products, orders, finance, payout, CMS, settings, dan uploads.

### 6.2 Overview dan analytics

Temuan:

- API failure ditampilkan sebagai nol.
- Customer baru kosong/`—`.
- Analytics period berubah di UI tetapi tidak dikirim ke API.
- Growth `+14.2%` hardcoded.
- Product sales literal `0`.
- Traffic/conversion/bounce rate belum punya sumber event yang jelas.

**MVP dashboard:** orders today, gross sales, active products, pending actions, low stock, recent orders. Hapus kartu yang datanya belum tersedia. Analytics lengkap dibangun setelah event tracking dan definisi metric jelas.

### 6.3 Products dan create/edit form

Form production harus memiliki field dan aturan berikut:

| Kelompok | Wajib/aturan |
|---|---|
| Identity | title wajib, slug unik per store, category, optional tags |
| Description | plain text aman atau sanitized rich text; jangan simpan HTML mentah tanpa sanitizer |
| Media | minimal satu image untuk publish; MIME/size/dimension dicek client dan server; reorder; primary image |
| Price | integer rupiah non-negative; `compare_at_price >= price`; modal private |
| Stock | stock atau variant stock tidak boleh negatif; satu sumber kebenaran |
| SKU | unik per store bila diisi |
| Shipping | berat wajib untuk produk fisik; dimensi optional tetapi konsisten |
| Variants | option names/values, kombinasi tidak duplikat, SKU/price/stock per variant |
| Status | draft, active, archived/out-of-stock; publish hanya bila field minimum lengkap |
| SEO | title/description optional; tidak mengalahkan keamanan/checkout |

Yang belum benar-benar ada/terhubung:

- Bulk action hanya toast/informasi.
- Product filters sebagian cosmetic.
- Edit fetch gagal tetap membuka form kosong.
- Upload UI mengklaim batas file tetapi client tidak memvalidasi.
- AI description, video, drag reorder, dan background removal belum menjadi fitur live.

**Ponytail decision:** jangan membuat AI, rich editor, video, atau 10 gambar sebelum CRUD produk, upload satu gambar, variant, stock, dan publish flow stabil.

### 6.4 Orders, shipping, return

Dashboard harus memisahkan:

- New/pending payment.
- Paid/COD verified.
- Processing.
- Ready to ship.
- Shipped/in transit.
- Delivered/completed.
- Cancelled.
- RTS/return/refund/dispute.

Masalah saat ini:

- Filter return/batal hanya `cancelled`.
- State transition dapat dikirim tanpa backend-authoritative transition map.
- Bulk ship membuat AWB fake.
- Shipment relation belum unique satu order atau jelas multi-shipment.
- Tombol kirim tidak punya per-row lock/confirmation.
- Courier filter tidak dikirim ke API.

**Acceptance criteria:** setiap transition punya allowed-from/allowed-to, actor, timestamp, reason, dan audit log. Shipment hanya dibuat setelah booking provider berhasil, kecuali ada manual shipment mode yang dinyatakan jelas.

### 6.5 Promotions dan voucher

Saat ini seller dapat menyimpan promotion-like data, tetapi buyer tidak pernah mendapat discount.

Minimum voucher model yang diperlukan:

- store_id, code uppercase unique per store.
- type: percentage, fixed, free_shipping.
- value, max_discount, minimum_subtotal.
- start_at, end_at, active.
- usage_limit, usage_count, limit_per_customer.
- product/category scope jika memang dibutuhkan.
- redemption record per order/customer untuk mencegah double use.

Validasi harus atomik saat checkout. Jangan decrement quota hanya dari UI. Flash sale tidak perlu dibangun sebelum voucher biasa dan price override sudah benar.

### 6.6 CMS/storefront

Masalah:

- Save failure dianggap berhasil.
- localStorage dapat menjadi sumber tampilan buyer.
- Default content Kalmora dapat terbawa ke merchant baru.
- Warna/font/template tidak konsisten diterapkan.
- autoplay toggle tidak bekerja.

**MVP CMS:** store name, logo, WhatsApp, hero/banner, tagline, theme color, product sections, published flag. Simpan draft dan published version di backend; preview draft memakai preview token. Hapus fallback brand Kalmora dari default merchant.

### 6.7 Finance, wallet, payout

Ini modul uang dan tidak boleh memakai mock.

- Balance harus berasal dari ledger, bukan reconstruct jika balance nol.
- Wallet transaction harus append-only secara application dan database policy.
- Payout harus `requested -> processing -> completed/failed`, bukan completed langsung.
- Provider disbursement ID, idempotency, fee, failure reason, dan reconciliation wajib disimpan.
- Gunakan row lock/atomic ledger saat reserve balance.
- Nominal minimum dan fee harus satu sumber konfigurasi; dokumen sekarang berbeda antara Rp50.000, Rp100.000, dan Rp10.000.
- Nomor rekening harus masked di UI dan diverifikasi sebelum payout.

Jika belum siap, sidebar finance/payout harus disembunyikan atau diberi status coming soon, bukan menampilkan saldo dan rekening fiktif.

## 7. Audit Backend dan Database

### 7.1 Critical backend findings

| File | Masalah | Dampak |
|---|---|---|
| `IdentifyTenant.php` | Tenant header dipercaya tanpa membership check | Cross-tenant access |
| `routes/api.php` | Route seller tidak memakai permission/policy middleware | Staff dapat finance/payout/settings |
| `CustomerAuthController.php` | Profile/order tidak konsisten protected; phone menjadi credential | IDOR dan PII leak |
| `StorefrontController.php` | Shipping cost/client total dan relation tidak fully verified | Manipulasi total/order |
| `InventoryService.php` | Redis/DB stock dapat divergen; fallback query tenantless | Overselling/stock resurrection |
| `XenditService.php` | Dummy credential/token diterima | Forged paid order |
| `XenditWebhookController.php` | Tidak direct verify provider dan belum atomic idempotency | Duplicate/forged payment |
| `BiteshipWebhookController.php` | Tidak ada signature check; enum class missing | Forged shipment/status dan runtime error |
| `MerchantController.php` | Payout mock completed dan finance bukan ledger-driven | Kerugian finansial |
| `UploadController.php` | R2 config missing, placeholder URL | Media gagal/unsafe |
| `routes/web.php` | Path storage concatenated tanpa containment check | File disclosure risk |

### 7.2 Schema gaps

- Tidak ada durable webhook events table.
- Tidak ada inventory reservations/stock movements table.
- Tidak ada promotion/voucher/redemption table.
- Tidak ada order status history/audit table.
- Tidak ada refunds, disputes, complaints, returns table.
- Tidak ada review/rating table.
- Shipment belum dipastikan unique/relationship policy.
- Customer global by phone bertentangan dengan sebagian klaim RLS tenant isolation. Putuskan secara eksplisit: global risk profile plus tenant-scoped order visibility, atau customer per tenant.
- Wallet transaction belum memiliki hash chain seperti yang diklaim dokumen.
- RLS policy yang ada tidak cukup jika tenant context bisa dipilih attacker dan menggunakan `SET` session-persistent.

### 7.3 Security baseline

Wajib sebelum go-live:

- Fail closed jika credential provider kosong/dummy pada production.
- Throttle login, buyer auth/OTP, checkout, upload, logistics, dan webhook.
- Validasi payload webhook dan reject unknown status.
- Semua mutation memakai authorization policy.
- Semua external URLs/upload MIME divalidasi.
- Sanitize rich text jika diaktifkan.
- CORS, CSRF, cookie, SameSite, HTTPS, secret rotation, dan log redaction diverifikasi.
- Jangan log token, OTP, full address, atau rekening penuh.

## 8. Gap Terhadap Benchmark Shopee/Tokopedia

### 8.1 Wajib untuk ALURELAB MVP

- Storefront cepat dan mobile-first.
- Catalog/product/variant/stock yang benar.
- Guest checkout plus buyer account opsional.
- Server-side pricing and inventory reservation.
- Payment provider yang benar-benar ter-reconcile.
- Courier rate/booking/tracking atau satu manual shipping flow yang jujur.
- Voucher sederhana yang benar-benar mengurangi total.
- Seller order processing dan invoice.
- Customer data per toko dan Anti-RTS dasar.
- CMS publish/preview yang konsisten.
- RBAC, tenant isolation, backup, logs, rate limit, dan support channel.

### 8.2 Penting tetapi bisa setelah MVP

- Search, category, sorting, pagination.
- Product SEO metadata.
- Customer export.
- Analytics sales dan conversion.
- WhatsApp notifications/order updates.
- Return/refund/complaint workflow.
- Multiple shipment service dan pickup scheduling.
- Custom domain.
- Subscription billing.
- Saved addresses.

### 8.3 Tidak perlu dibangun sekarang

- Global marketplace home dan discovery lintas seller.
- Multi-seller cart/combined shipping.
- Internal buyer-seller chat.
- Live shopping/live streaming.
- Affiliate marketplace dan creator commission.
- Coins, points, gamification, badges kompleks.
- PayLater/credit wallet.
- Platform-wide seller rating/review moderation.
- Recommendation engine/AI personalization.
- Flash sale engine sebelum voucher dan stock reservation stabil.
- AI photo studio sebelum upload biasa stabil.

Fitur di daftar ini boleh kembali masuk roadmap setelah ada bukti kebutuhan merchant, bukan karena benchmark memilikinya.

## 9. Rencana Revisi Minimal

### Phase 0: Make demo impossible to confuse with production

- Hapus fallback data sukses dari seluruh mutation dan query.
- Disable mock invoice route di production build/runtime.
- `fetchApi` throw pada non-2xx dan seluruh caller menampilkan error.
- Hapus realistic fake finance/account values.
- Tambahkan `APP_DEMO_MODE` default false di production; demo harus opt-in dan terisolasi.

### Phase 1: Security and data integrity

- Auth/session/revoke buyer dan merchant.
- Membership/RBAC/policies.
- Server-side checkout repricing.
- Inventory reservation table/expiry/release.
- Webhook verification/idempotency.
- Public/private settings split.
- Rate limit and upload hardening.

### Phase 2: Sell one real order end-to-end

- One real payment method.
- One real courier rate and booking path.
- One product with/without variant.
- One voucher type or no voucher until ready.
- One complete order state machine.
- Invoice and tracking.

### Phase 3: Seller operation

- Product form completeness.
- Orders/shipping filters and actions.
- CMS publish/preview.
- Customer list and basic Anti-RTS.
- Finance read-only until payout is reconciled.

### Phase 4: Growth and polish

- Analytics, notifications, returns/refunds, search, custom domain, billing, AI.

## 10. Test Matrix Sebelum Go-Live

### Automated tests

- Merchant user cannot read/write another store by changing slug/header.
- Owner, manager, and staff permissions match the matrix.
- Buyer A cannot read/update buyer B profile or order.
- Product, variant, order item, payment, and shipment must share the expected tenant.
- Client-submitted price/shipping/discount is ignored and server total wins.
- Double checkout idempotency creates one order.
- Concurrent stock reservation cannot oversell.
- Every failed checkout releases reservation.
- Voucher quota cannot be exceeded concurrently.
- Xendit/Biteship invalid signature, replay, wrong amount, wrong order, and duplicate events are rejected/idempotent.
- Payout concurrent requests cannot spend the same balance.
- Upload rejects invalid MIME, oversized files, traversal, and unauthorized store.
- Public storefront never returns private settings.

### Manual E2E scenarios

1. Register merchant, create store, publish one product, open public storefront.
2. Buyer guest checks out valid product with valid shipping and receives real payment state.
3. Buyer refreshes/retries payment; no duplicate order.
4. Payment webhook arrives twice; one ledger effect only.
5. Merchant sees paid order, processes it, books shipment, receives AWB, and buyer sees tracking.
6. Delivery/completion releases escrow once.
7. COD high-risk path is rejected without losing stock.
8. Voucher applies, expires, reaches quota, and cannot be reused beyond policy.
9. Seller changes CMS on device A; buyer/device B sees only published result.
10. API outage produces explicit error, never fake success.

### Runtime commands

Run in backend with staging credentials/database, not only syntax checks:

```bash
php artisan migrate:fresh --seed
php artisan route:list --path=api
php artisan test
```

Then run an actual HTTP smoke test against staging for login, product, checkout, webhook, and order transitions. `php -l` alone is insufficient.

## 11. Definition Of Done

ALURELAB dapat disebut production-ready untuk MVP hanya jika:

- Tidak ada fallback mock yang dapat membuat order/login/payment sukses.
- Semua P0 ditutup dengan automated test atau evidence runtime.
- Satu merchant baru dapat onboarding sampai storefront live.
- Satu buyer dapat checkout sampai status order nyata.
- Seller dapat memproses order sampai shipment nyata.
- Payment, inventory, wallet, dan shipment dapat direkonsiliasi.
- Cross-tenant dan role abuse test gagal sesuai harapan.
- Error, retry, timeout, empty state, dan loading state terlihat jujur di UI.
- Backup restore dan rollback deployment pernah diuji.
- Monitoring memberi alert ketika payment/webhook/queue gagal.

## 12. Kontradiksi Dokumen Yang Harus Dibereskan

Sebelum sprint berikutnya, tetapkan satu sumber kebenaran untuk hal berikut:

- Laravel disebut 11 di docs, tetapi `composer.json` menggunakan 13.
- PostgreSQL disebut 13.23 dan 16 di lokasi berbeda.
- Payout minimum berbeda antara dokumen dan code.
- Buyer auth disebut OTP/WhatsApp, tetapi code hanya menerima phone.
- R2 disebut belum ada, tetapi route upload seolah tersedia.
- Xendit escrow disebut live, tetapi mock invoice dan payout masih aktif.
- RLS disebut aktif penuh, tetapi customers tidak tenant-scoped dan tenant context dapat dipilih dari request.
- Status order di docs, enum, controller, dan webhook belum satu state machine.

Jangan menambah fitur baru sebelum kontradiksi ini diputuskan dan ditulis ulang dalam satu dokumen kontrak API/domain.
