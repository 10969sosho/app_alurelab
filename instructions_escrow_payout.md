# TASK: ESCROW RELEASE & SELLER PAYOUT DISBURSEMENT FLOW

## 1. Goal
Menyelesaikan siklus penuh keuangan toko:
1. **Pelepasan Escrow Otomatis (`releaseEscrow`)**:
   - Ketika order dinyatakan selesai/terkirim (`OrderStatus::DELIVERED` atau seller/buyer konfirmasi selesai):
     - Pindahkan dana dari `merchant_wallets.escrow_held_balance` ke `merchant_wallets.available_balance`.
     - Buat method `MerchantWallet::releaseOrderEscrow(Order $order)` dengan idempotency (`escrow_rel_{order_number}`).
     - Panggil di `BiteshipWebhookController` saat status `delivered` dan sediakan command/endpoint penyelesaian order jika manual.
     - Catat di `wallet_transactions` tipe `ESCROW_RELEASED`.
2. **Pencairan Dana Seller (`requestPayout` & Payout Processing)**:
   - Di `MerchantController::requestPayout`:
     - Saat penarikan diajukan, debet `available_balance` (atau tahan di pending withdrawal) dan catat `WalletTransaction` tipe `WITHDRAWAL`.
     - Tambahkan field `doku_payout_id` / status tracking di model `Payout`.
   - Siapkan method `DokuService::createPayout(...)` atau runner simulasi/sandbox payout ke DOKU Payout API.

## 2. Aturan
- Wajib buat file cadangan `.bak_20261021_payout_escrow` sebelum memodifikasi file.
- Pastikan semua test di `backend/tests/` tetap passed.
