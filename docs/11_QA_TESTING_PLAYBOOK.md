# ALURELAB QA Testing Playbook

Dokumen ini menjelaskan cara pengujian ALURELAB dari sudut pandang user dan server. Targetnya bukan hanya memastikan halaman terbuka, tetapi membuktikan alur bisnis dari seller membuat produk sampai buyer membeli dan order masuk ke finance.

## 1. Model Pengujian

Ada tiga lapisan pengujian:

1. **Browser smoke test**
   - Membuka production melalui browser Chromium.
   - Klik elemen UI seperti user asli.
   - Tidak membuat produk atau order.
   - Dipakai untuk login, logout, katalog, cart, checkout kosong, dashboard, dan finance.

2. **Semi-production mutation loop**
   - Menggunakan store dan akun QA khusus.
   - Membuat kategori, produk, variant, buyer, order, dan perubahan status.
   - Boleh membuat data, tetapi tidak menyentuh toko production normal.

3. **Load test**
   - Menggunakan banyak store QA dan virtual buyer.
   - Mengukur error rate dan latency API.
   - Tidak memakai browser per user karena browser terlalu mahal untuk pengukuran kapasitas server.

## 2. Mode Provider

### Mode Normal

Store production biasa memakai provider asli:

- Payment: Xendit.
- Rate dan shipment: Biteship.
- Webhook provider tetap wajib memakai signature/token.

### Mode QA Simulation

Simulation hanya aktif jika dua syarat terpenuhi di backend:

```text
QA_SIMULATION_ENABLED=true
QA_SIMULATION_STORE_SLUG=qa-
```

Slug store harus dimulai dengan `qa-`. Karena itu `kalmora`, `kopitiam`, dan store production lain tidak terkena simulation.

Dalam mode ini:

- Payment ONLINE langsung menjadi `PAID`.
- Dana langsung masuk `escrow_held_balance` dan wallet transaction.
- Rate shipping memakai rate QA lokal.
- Tombol proses shipment tetap memakai endpoint order normal.
- Endpoint menghasilkan AWB QA, misalnya `QA-AWB-ORD-...`.
- State machine order tetap dijalankan normal.

Simulation bukan payment gateway palsu di frontend. Keputusan simulasi dibuat server-side dan dibatasi namespace QA.

## 3. Akun QA

### Semi-Production Store

```text
Store slug: qa-loop-20260918
Seller email: qa-loop-20260918@alurelab.test
Seller password: QA-Loop-2026!
```

Store ini dipakai untuk loop browser mutasi.

### Load Test Stores

```text
qa-load-001 sampai qa-load-100
```

Setiap store load memiliki wallet, satu produk aktif, satu variant, dan stok awal 1000.

## 4. Buyer Smoke Test

File:

```text
frontend/qa/buyer-smoke.spec.ts
```

Yang diuji:

- Storefront dapat dibuka.
- Produk dapat dibuka.
- Produk dapat ditambahkan ke cart.
- Cart tidak hilang saat pindah halaman.
- Checkout dapat dibuka.
- Buyer login dengan nomor HP.
- Buyer logout.
- Checkout kosong diblokir.

Jalankan:

```bash
cd frontend
QA_BASE_URL=https://app.alurelab.com \
QA_STORE_SLUG=kalmora \
QA_BUYER_PHONE='nomor-qa' \
QA_BUYER_NAME='QA Buyer' \
npx playwright test qa/buyer-smoke.spec.ts
```

Hasil terakhir: **3/3 PASS**.

## 5. Seller Smoke Test

File:

```text
frontend/qa/seller-smoke.spec.ts
```

Yang diuji:

- Seller login.
- Dashboard terbuka.
- Halaman produk terbuka.
- Form produk menampilkan field utama.
- Seller logout.
- Halaman finance dapat dibuka.

Jalankan:

```bash
cd frontend
QA_BASE_URL=https://app.alurelab.com \
QA_STORE_SLUG=qa-loop-20260918 \
QA_SELLER_EMAIL=qa-loop-20260918@alurelab.test \
QA_SELLER_PASSWORD='QA-Loop-2026!' \
npx playwright test qa/seller-smoke.spec.ts
```

Hasil terakhir: **4/4 PASS**.

## 6. Semi-Production Full Loop

File:

```text
frontend/qa/semi-production-loop.spec.ts
```

Urutan test:

1. Seller login.
2. Buat kategori unik.
3. Simpan master kategori.
4. Buat produk unik.
5. Aktifkan variant.
6. Isi harga, berat, stok, dan SKU variant.
7. Publish produk.
8. Buyer login.
9. Buka produk.
10. Add to bag.
11. Isi alamat buyer.
12. Pilih payment COD atau simulated ONLINE.
13. Submit checkout.
14. Pastikan buyer melihat order di order history.
15. Seller membuka order.
16. Ubah status ke `processing`.
17. Buat shipment melalui tombol satu klik.
18. Pastikan status menjadi `shipped`.
19. Buka finance.

Jalankan full simulation:

```bash
cd frontend
QA_MUTATIONS=1 \
QA_PAYMENT_METHOD=ONLINE \
QA_BASE_URL=https://app.alurelab.com \
QA_STORE_SLUG=qa-loop-20260918 \
QA_BUYER_PHONE=081299992026 \
QA_BUYER_NAME='QA Buyer Loop' \
QA_SELLER_EMAIL=qa-loop-20260918@alurelab.test \
QA_SELLER_PASSWORD='QA-Loop-2026!' \
npm run qa:loop
```

Untuk sementara melewati shipment:

```bash
QA_MUTATIONS=1 QA_SKIP_SHIPPING=1 npm run qa:loop
```

Hasil terakhir full simulation: **1/1 PASS**.

## 7. Hasil Bug yang Ditemukan dan Diperbaiki

### Stale Next.js build

HTML production memakai hash asset lama sementara filesystem memakai hash baru. Dampaknya CSS/JS mengembalikan HTTP 400.

Perbaikan: restart PM2 setelah build production.

### Product action sebelum data siap

Tombol `ADD TO BAG` dapat diklik ketika data produk belum selesai dimuat. Handler tidak mendapat produk, tetapi router tetap berpindah ke cart.

Perbaikan: tombol disabled sebelum produk siap dan handler tidak melakukan navigasi jika produk belum ada.

### COD tidak bisa diproses seller

Backend mengizinkan `cod_verified -> processing`, tetapi UI hanya menampilkan tombol proses untuk `paid_escrow`.

Perbaikan: UI sekarang menampilkan `Proses Pesanan` untuk kedua status tersebut.

### Katalog lintas tenant

Endpoint storefront produk belum membatasi query dengan `tenant_id`.

Perbaikan: list dan detail produk sekarang selalu memakai tenant aktif.

### Accessibility locator

Beberapa label form tidak terhubung dengan input melalui `for/id`. QA memakai placeholder/type sebagai workaround, tetapi ini tetap gap accessibility yang perlu dirapikan jika prioritas UI/accessibility naik.

## 8. Hasil Load Test

### Public Store/Catalog

- 100 store berbeda.
- 100 worker paralel.
- Store endpoint: 0 error.
- Catalog endpoint: 0 error.
- Worst store latency: 6.4 detik.
- Worst catalog latency: 8.3 detik.

### Checkout Mutation

- 100 buyer paralel.
- Setiap buyer memakai store QA berbeda.
- Payment ONLINE disimulasikan server-side.
- HTTP `201`: 100/100.
- Error: 0.
- Worst checkout latency: 6.84 detik.
- Database: 200 order QA, 200 payment PAID, 200 escrow transaction.

### Interpretasi

Ini belum berarti server maksimal hanya 100 user. Test ini hanya satu titik kapasitas.

Baseline CPU, PostgreSQL, I/O, dan memory sebelum test belum direkam. Saat observasi setelah load, server menunjukkan load average sekitar 18-21 dan swap hampir penuh. Sebelum menaikkan concurrency, pasang monitoring baseline.

## 9. Tahap Load Test Berikutnya

Urutan aman:

1. Baseline 5 menit tanpa traffic.
2. 100 VU selama 60 detik.
3. 200 VU selama 60 detik.
4. 500 VU selama 60 detik.
5. Stop jika error rate >1%, p95 >2 detik, database connection exhausted, atau swap terus naik.

Script awal:

```text
frontend/qa/load/100-store-buyer-smoke.js
```

Jalankan dengan k6:

```bash
k6 run \
  -e BASE_URL=https://qa.example.com \
  -e STORE_SLUGS=qa-load-001,qa-load-002,qa-load-003 \
  -e VUS=100 \
  -e DURATION=60s \
  frontend/qa/load/100-store-buyer-smoke.js
```

Jangan memakai toko production normal sebagai target load test.

## 10. Bukti Test

Playwright menyimpan bukti kegagalan di:

```text
frontend/test-results/
frontend/qa-report/
```

Bukti meliputi screenshot, video, trace, console error, request gagal, dan response HTTP 4xx/5xx.

## 11. Status Sekarang

```text
Buyer smoke: PASS
Seller smoke: PASS
Finance smoke: PASS
Semi-production COD loop: PASS
Semi-production simulated ONLINE loop: PASS
100-store catalog load: PASS, 0 error
100-checkout mutation load: PASS, 100/100
Real Xendit: belum diuji pada payment nyata
Real Biteship booking: sengaja belum dipakai
Maximum server capacity: belum disimpulkan
```
