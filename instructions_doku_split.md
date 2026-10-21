# TASK: SUB-ACCOUNT SETTLEMENT & SPLIT WALLET ONGKIR DOKU

## 1. Konteks & Goal
Sistem harus memisahkan aliran dana pembayaran pesanan secara tegas dan riil:
1. **Sub-Account Seller**:
   - Toko yang punya `doku_sub_account_id` wajib dikirimkan di payload DOKU Checkout V1 pada `additional_info.settlement.sub_account_id` agar DOKU Sandbox mengenali settlement merchant tersebut.
   - Porsi dana barang (`order.items_subtotal - order.platform_fee_amount`) masuk ke **`merchant_wallets.escrow_held_balance`** toko.
2. **Dompet Ongkir (Shipping Wallet / Pool Logistik)**:
   - Ongkir (`order.shipping_cost`) TIDAK BOLEH masuk ke saldo seller/merchant.
   - Ongkir wajib masuk ke pool/dompet ongkir (`platform_wallets` / saldo logistik biteship) agar seller tidak bisa menarik dana yang seharusnya dipakai membayar kurir.
   - Di tabel `merchant_wallets`, tambahkan atau buat model/tabel pool ongkir atau kolom terpisah yang jelas (misal: `shipping_held_balance` atau tabel `shipping_wallets` / `platform_wallets` tipe `SHIPPING_POOL`).
   - Setiap transaksi webhook / markAsPaid:
     - Kredit seller escrow: `items_subtotal - platform_fee_amount`
     - Kredit ongkir pool: `shipping_cost` (tipe transaksi `SHIPPING_ESCROW_CREDIT`)
     - Fee platform: `platform_fee_amount` (tipe transaksi `PLATFORM_FEE_CREDIT`)
     - Total = `order.total_amount` (100% balance cocok).

## 2. File Terkait
- `backend/app/Services/DokuService.php`:
  - Pastikan method `settlementInfo(Store $store)` menyertakan `sub_account_id` dengan benar bila `store->doku_sub_account_id` ada.
- `backend/app/Services/OrderPaymentSyncService.php` & `backend/app/Http/Controllers/Api/DokuWebhookController.php`:
  - Ubah perhitungan kredit saldo. Saat ini `order->merchant_net_amount` mencakup `total_amount - platform_fee_amount` (sehingga ongkir ikut masuk ke merchant_net_amount).
  - Pisahkan:
    - Net Barang Merchant = `order.items_subtotal - order.platform_fee_amount`
    - Pool Ongkir = `order.shipping_cost`
    - Catat di ledger `wallet_transactions` secara transparan!
- Database Migration:
  - Buat migration jika dibutuhkan tabel `platform_wallets` atau kolom `shipping_held_balance` / pool saldo ongkir.
- Buat test / run script untuk melakukan test checkout DOKU nyata ke sandbox dan verifikasi datanya.

## 3. Aturan
- WAJIB backup file sebelum diubah (`.bak_20261021_doku_split`).
- Jalankan php artisan test atau unit test terkait untuk memastikan tidak ada test yang break.
