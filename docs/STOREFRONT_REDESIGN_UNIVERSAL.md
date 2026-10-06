# Universal Storefront Redesign & Simplification

Dokumen ini mencatat pembaruan antarmuka (UI/UX) Storefront Alurelab menjadi **1 Template Tunggal Universal**, menggantikan switcher multi-template sebelumnya.

---

## 1. Ringkasan Perubahan

1. **Penyederhanaan Template Tunggal (Universal Model)**:
   - Dihilangkan ketergantungan pada template switcher yang bercabang-cabang (`EditorialTemplate`, `ModernTemplate`, `AdditionalTemplates`).
   - Storefront sekarang menggunakan arsitektur tampilan tunggal yang bersih, elegan, dan adaptif untuk semua jenis produk toko.
   - Tidak ada segmentasi berbasis gender (Universal e-commerce: pakaian, elektronik, kuliner, aksesoris, kerajinan, dll).

2. **Universal Image Placeholder System (`UniversalImage`)**:
   - Komponen fallback otomatis (`ImagePlaceholder.tsx`) yang menangani banner toko dan foto produk jika belum di-upload.
   - Tampilan netral, estetik, berlatar abu-abu lembut / off-white dengan icon SVG subtle dan label informatif tanpa broken image tag.

3. **Desain Mobile (Inspirasi Mockup 1)**:
   - **Header**: Search bar ringkas, tombol navigasi, dan cart counter.
   - **Hero Banner**: Rounded card modern dengan highlight koleksi dan CTA tombol belanja.
   - **Universal Category Bar**: Pill selector yang dapat di-scroll horizontal tanpa filter gender.
   - **Product Grid 2 Kolom**: Card rounded-2xl dengan tombol floating wishlist (love) di sudut foto, label status produk, harga tebal, dan tombol quick-add.
   - **Floating Bottom Navigation Bar**: Pill-shaped floating bar di bagian bawah layar (Home, Katalog, Keranjang dengan badge angka, Akun).

4. **Desain Desktop (Inspirasi Mockup 2)**:
   - Layout responsif yang lapang (*spacious luxury & breathing room*).
   - Product grid 3-4 kolom proporsional.
   - Floating bottom nav otomatis disembunyikan di layar desktop (`md:hidden`).

5. **Kesiapan Deploy Vercel**:
   - Berhasil lulus validasi `npm run build` Next.js 15 (28/28 static & dynamic routes lolos type checking).

---

## 2. File Backup Tersimpan
- `frontend/src/components/templates/backup/StorefrontClient.tsx.bak_universal_redesign`
- `frontend/src/components/templates/backup/EditorialTemplate.tsx.bak_universal_redesign`
- `frontend/src/components/templates/backup/ModernTemplate.tsx.bak_universal_redesign`
- `frontend/src/components/buyer/BuyerProductCard.tsx.bak_universal_redesign`
- `frontend/src/components/buyer/MobileStorefrontHome.tsx.bak_universal_redesign`
- `frontend/src/components/buyer/BuyerBottomNav.tsx.bak_universal_redesign`
