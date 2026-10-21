# TASK INSTRUCTIONS - IN-APP CUSTOM PAYMENT PAGE

## Goal
User tidak ingin pembeli dilempar ke halaman eksternal DOKU yang memunculkan kotak "CA - Cristian Albertus".
User ingin halaman pembayaran custom di dalam toko sendiri:
`https://app.alurelab.com/[store_slug]/orders/[id]/pay` (atau tampilan modal/halaman bayar in-app).

## Key Requirements:
1. **Header Pembayaran 100% Toko**:
   - Logo / Avatar Toko (`store.logo_url` atau inisial brand warna primer).
   - Nama Toko Asli (`store.name`, misal `PECEL mini`).
   - Nomor Pesanan (`order.order_number`) & Total Pembayaran (`formatRupiah(total_amount)`).
   - Countdown waktu batas pembayaran (misal 24 jam / timer aktif).

2. **Dua Mode Pembayaran Utama (Direct VA & DOKU Modal/QRIS)**:
   - **Mode A: Virtual Account Direct (BCA / Mandiri / BRI / BNI)**:
     - Backend telah terbukti support direct VA generation via DOKU:
       - Endpoint: `POST /bca-virtual-account/v2/payment-code` (atau bank lain).
       - Mengembalikan `virtual_account_info.virtual_account_number`.
     - Tampilkan card Bank:
       - Logo Bank (BCA / Mandiri / BRI / BNI).
       - Nomor Virtual Account dengan tombol copy/salin satu kali klik (`Salin Nomor VA`).
       - Nama Akun / Merchant Info (Atas nama toko `PECEL mini`).
       - Panduan cara bayar (m-Banking, ATM, Internet Banking) dalam accordion rapi.
   - **Mode B: QRIS & E-Wallet / All Channel**:
     - Jika pembeli memilih QRIS / E-Wallet atau DOKU Checkout, tampilkan DOKU JS Popup Modal (`jokul-checkout-1.0.0.js`) langsung di atas halaman toko kita!
     - Pembeli tidak pindah tab/halaman, tetap di dalam website toko dengan overlay pop-up modern.
     - Begitu sukses dibayar di modal, otomatis redirect ke halaman order tracking (`/[store_slug]/orders/[order_number]`).

3. **Real-time Status Polling**:
   - Di halaman custom payment (`/[store_slug]/orders/[id]/pay`), pasang auto-check status setiap 3-5 detik ke endpoint `/buyer/orders/{id}`.
   - Begitu order terdeteksi `paid_escrow` (karena real-time sync DOKU yang sudah kita buat), langsung alihkan pembeli ke halaman sukses `/orders/[id]` dengan animasi centang hijau!

4. **Integration di Checkout**:
   - Di `frontend/src/app/[store_slug]/checkout/page.tsx`:
     - Setelah checkout berhasil di-submit, jangan `window.location.href = invoice_url` (halaman luar DOKU).
     - Alihkan langsung ke halaman payment in-app toko:
       `router.push(`/${storeSlug}/orders/${orderNumber}/pay`)`.
   - Di halaman `orders/[id]/page.tsx`:
     - Tombol "Bayar Sekarang" juga arahkan ke `/${storeSlug}/orders/${orderNumber}/pay`.

5. **Backend Endpoint**:
   - Tambahkan method di `DokuService` dan controller buyer:
     - `POST /api/v1/buyer/orders/{id}/pay`
     - Menerima `channel` (misal `BCA_VA`, `MANDIRI_VA`, `QRIS`, `DOKU_CHECKOUT`).
     - Jika VA: panggil Direct VA DOKU, simpan nomor VA di record payment (`payment.payment_channel`, `payment.raw_webhook_payload`), kembalikan `{va_number, bank, expired_at}`.
     - Jika Checkout / QRIS: kembalikan `{payment_url}` untuk diload via `loadJokulCheckout`.

## Aturan:
- Backup semua file sebelum diedit (`.bak`).
- Test build frontend (`npm run build`) dan backend sampai lulus tanpa error!
