# Production QA

Dokumentasi lengkap ada di [`../../docs/11_QA_TESTING_PLAYBOOK.md`](../../docs/11_QA_TESTING_PLAYBOOK.md). Baca dokumen itu untuk arti setiap test, mode normal vs QA simulation, hasil 100 store, dan batasan kapasitas.

Ini adalah QA browser nyata. Test benar-benar membuka halaman dan klik elemen seperti user, bukan memanggil controller langsung.

## Setup

```bash
npm install
npx playwright install chromium
export QA_BASE_URL=https://app.alurelab.com
export QA_STORE_SLUG=kalmora
export QA_BUYER_PHONE='nomor-test-buyer'
export QA_BUYER_NAME='QA Buyer'
export QA_SELLER_EMAIL='email-test-seller'
export QA_SELLER_PASSWORD='password-test-seller'
```

Credential hanya lewat environment. Jangan commit `.env` atau token.

## Jalankan

```bash
npm run qa:buyer
npm run qa:seller
npm run qa:smoke
npm run qa:ui
```

Semi-production mutation loop, only with the dedicated QA store:

```bash
QA_MUTATIONS=1 QA_SKIP_SHIPPING=1 npm run qa:loop
```

This creates a unique category, product, variant, COD or simulated ONLINE order, verifies buyer order history, processes the order, and checks finance. Set `QA_PAYMENT_METHOD=ONLINE` to skip Xendit through the server-side QA simulation gate. Shipment booking is simulated only for the allowlisted QA store.

Load test 100 virtual buyers across QA stores uses k6, not Playwright:

```bash
k6 run -e BASE_URL=https://qa.example.com \
  -e STORE_SLUGS=qa-store-001,qa-store-002 \
  -e VUS=100 -e DURATION=60s \
  qa/load/100-store-buyer-smoke.js
```

Do not run this against live production before creating isolated QA stores and approving the target host. This first stage measures public storefront/catalog capacity; checkout mutation load is a separate stage.


## Mutating test


## Bukti dan triage

Saat gagal, Playwright menyimpan screenshot/video/trace di `test-results/` dan laporan HTML di `qa-report/`. Gunakan bukti itu untuk mengisi issue:

```text
Severity: blocker / high / medium / low
Actor: buyer / seller
URL:
Steps:
Expected:
Actual:
Console/network evidence:
Data created:
```
