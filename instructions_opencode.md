# TASK INSTRUCTIONS FOR OPENCODE WORKER

## 1. Storefront Desktop Navbar
- **File**: `frontend/src/components/buyer/BuyerTopBar.tsx`, `frontend/src/components/buyer/BuyerHeader.tsx`, `frontend/src/components/cms/CmsStorefrontView.tsx` (dan tempat nav render).
- User requirement:
  - Hilangkan teks menu navigasi desktop (`HOME`, `SHOP`, `BAG`, `ACCOUNT`).
  - Navbar desktop dibuat simpel & bersih: Di sebelah nama toko, langsung Search bar di tengah (`flex-1 max-w-xl mx-auto`), lalu di kanan hanya icon chat, keranjang/bag (badge qty), dan akun / avatar.
  - Nama toko (Brand Name): **TIDAK BOLEH berubah huruf besar kecilnya (case-sensitive as is dari database)**. Jangan pakai `uppercase`, `capitalize`, atau `lowercase` di CSS styling teks nama toko! Pertahankan casing asli (`store.name`).

## 2. Chat System: Desktop Floating Popup vs Mobile Full Page
- User requirement:
  - **Desktop view**: Chat BUKAN full page (`/chat`). Ketika icon chat diklik di desktop, tampilkan Floating Chat Modal / Drawer yang cukup besar dan elegan di pojok kanan bawah (`fixed bottom-6 right-6 w-[420px] h-[600px] max-h-[85vh] shadow-2xl rounded-2xl border bg-white z-50 flex flex-col overflow-hidden`).
  - **Mobile view**: Tetap navigasi full page ke `/[store_slug]/chat`.
  - Halaman `/[store_slug]/chat/page.tsx` tetap ada untuk mobile & direct link.

## 3. Pelanggan & Member
- User requirement:
  - Pelanggan baru yang hanya mendaftar/login via OTP WhatsApp (walaupun belum pernah belanja / total_orders = 0) **HARUS langsung masuk ke list Pelanggan & Member** (`Customer`).
  - Cek backend: `CustomerAuthController::verifyOtp` — pastikan saat buyer mendaftar/verifikasi OTP, record `Customer` terhubung ke tenant/store dan muncul di dashboard merchant `/dashboard/customers`.
  - Hapus embel-embel tier 'Silver Member', 'Member Regular', dll. yang membingungkan. Ganti dengan badge status simpel seperti "Terdaftar" atau "Pembeli Aktif" (atau jika belum beli: "Belum Belanja", jika sudah beli: "X Pesanan"). Tidak ada sistem kasta tier ala Silver/Gold.

## 4. Admin Pengaturan Toko: Profil Toko vs Alamat
- **File**: `frontend/src/app/(dashboard)/dashboard/settings/page.tsx`
- User requirement:
  - Tombol "Simpan Perubahan" di tab Profil Toko (`general`/profil) **hanya menyimpan data profil toko** (nama toko, deskripsi, kontak, logo/icon). Jangan validasi atau menuntut data alamat gudang kecuali jika menekan tombol simpan khusus alamat atau "Simpan Semua".
  - Backend `MerchantSettingsController` / `MerchantController` sesuaikan agar endpoint update profile toko independen dari update address.

## 5. Subdomain & Nama Toko
- User requirement:
  - Saat nama toko diubah di profil toko, apakah subdomain toko (`slug`) bisa ikut di-update? Ya, berikan opsi input atau auto-update slug (dengan validasi ketersediaan slug/subdomain unik).
  - Di sidebar dashboard admin kiri atas (`Sidebar.tsx` / `AdminHeader.tsx`): **HAPUS nama toko kecil di bawah logo/ikon**, ganti header pojok kiri atas cukup dengan tulisan besar/elegan **"Seller Center"**.

## 6. Upload / Change ICON TOKO (Favicon / Avatar Toko)
- User requirement:
  - Tambahkan fitur upload/ganti **Logo / Icon Toko** di Pengaturan Toko > Profil Toko.
  - Simpan URL logo toko di field `logo_url` pada model `Store` (dan kolom db jika sudah ada atau settings).
  - Tampilkan icon toko tersebut di storefront header/favicon.

## 7. Payment Gateway Customer Name (Atas Nama TOKO, bukan Nama Akun Pemilik)
- User requirement:
  - Pada payload DOKU Checkout invoice di `backend/app/Services/DokuService.php`:
    - `description`: "Pembayaran {order_number} di {store_name}" (sudah).
    - Pastikan data merchant yang dikirim ke gateway atas nama **Nama Toko (`$store->name`)**, bukan nama akun user pemilik.

## 8. Buyer Detail Pesanan (`/[store_slug]/orders/[id]/page.tsx`)
- User requirement:
  - Tampilan jangan terlihat "AI" / kotak-kotak kaku hijau aneh.
  - Buat template bersih berwarna **PUTIH (`bg-white`)**, card modern rapi, full page di desktop (layout lebar profesional), dan responsive di mobile.
  - Tampilan status tracking, rincian produk, dan kurir dibuat clean dan elegan (standar e-commerce modern).

---
WAJIB:
- Buat file `.bak` sebelum mengedit file apapun!
