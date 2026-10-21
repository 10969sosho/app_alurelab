# TASK INSTRUCTIONS - ROUND 2

## 1. Filter Status Pesanan di Halaman Orders (`/[store_slug]/orders/page.tsx`)
- Tab filter: "Semua", "Belum Bayar", "Diproses", "Dikirim", "Sudah Tiba".
- Saat ini filternya belum menyaring data dengan benar.
- Cek pemetaan status order:
  - "Belum Bayar" -> `pending_payment`
  - "Diproses" -> `paid_escrow`, `processing`
  - "Dikirim" -> `shipped`
  - "Sudah Tiba" -> `delivered`, `completed`
- Pastikan filter bekerja real-time di client saat tab diklik, dan juga sinkron dengan query param URL `?tab=...`.

## 2. Nama Toko & Icon Toko di Seluruh Sub-halaman Storefront
- Terlihat di screenshot cart & orders:
  - Nama toko masih berupa teks kecil dengan icon bulat huruf "p" abu-abu/hitam default.
  - Halaman yang harus diperbaiki:
    - `/[store_slug]/cart/page.tsx`
    - `/[store_slug]/account/page.tsx`
    - `/[store_slug]/orders/page.tsx`
    - `/[store_slug]/orders/[id]/page.tsx`
    - `/[store_slug]/products/[slug]/page.tsx` (detail produk)
    - `/[store_slug]/checkout/page.tsx`
  - Gunakan `store.logo_url` jika ada. Jika ada `store.logo_url`, tampilkan `<img>` avatar/logo toko secara tajam (`rounded-full` atau `rounded-lg`, `object-cover`, `w-9 h-9`). Jika tidak ada, gunakan initial toko dengan warna brand toko yang elegan.
  - Tampilkan `store.name` dengan typography yang tegas, elegan, dan casing aslinya (bukan lowercase `pecel mini` seperti di screenshot, tapi sesuai `$store->name` misalnya `PECEL mini`).

## 3. Redesign Halaman Checkout (`/[store_slug]/checkout/page.tsx`)
- User: "tampilannya masih AI banget harus dirubah".
- Rombak tampilan Checkout menjadi modern, clean, minimalis berkelas (seperti Shopify Plus / modern D2C e-commerce):
  - Latar belakang bersih (`bg-slate-50` dengan card putih `bg-white border border-slate-200/80 shadow-sm rounded-2xl`).
  - Layout 2 kolom di desktop:
    - Kiri: Form Alamat Penerima (Data diri, nomor WhatsApp, pilihan wilayah Biteship, detail jalan) & Pilihan Pengiriman (Kurir, Layanan, Estimasi, Ongkir) & Metode Pembayaran.
    - Kanan (Sticky summary): Ringkasan Belanja (Foto produk, judul, varian, qty, subtotal, ongkir, voucher/diskon, total bayar).
  - Pilihan kurir dan metode pembayaran menggunakan radio card modern dengan logo/badge ekspedisi yang rapi.
  - Hapus elemen-elemen warna hijau toska kaku/card tebal aneh bergaya generic AI UI.

## 4. DOKU Payment Gateway: Nama di Header DOKU Checkout
- User menanyakan: "kemudian di DOKU apakah bisa diganti nama toko bukan CRISTIAN ALBERTUS?"
- Perhatikan screenshot ke-3 DOKU Checkout (`staging.doku.com`):
  - Di bagian atas ada box besar dengan avatar inisial "C A" dan teks "Cristian Albertus".
  - Di bawahnya ada:
    - Customer Information: Name: CRISTIAN ALBERTUS, Phone: 6281334999789.
  - Di DOKU Checkout V1:
    - Box atas dengan avatar "CA Cristian Albertus" adalah **Merchant Business Name** atau **Account Name** yang terdaftar di akun Client ID DOKU tersebut (Client-Id: BRN-0287-1792043041007 milik akun bisnis Cristian Albertus). Nama profil merchant utama di header DOKU dikonfigurasi di dashboard DOKU Back Office (Merchant Profile / Business Info).
    - Namun jika menggunakan Sub-Account / `additional_info.settlement.sub_account_id` atau merchant name override jika didukung oleh DOKU, cek apakah payload `/checkout/v1/payment` mendukung `merchant.name` atau sejenisnya.
    - Cek juga payload `customer.name`: saat ini `customer.name` dikirim dari nama penerima order (`CRISTIAN ALBERTUS`).
    - Buat audit jelas di kode dan dokumentasikan penjelasannya untuk user.

---
ATURAN:
- Backup semua file sebelum diedit (`.bak`).
- Test build frontend (`npm run build`) dan backend setelah selesai!
