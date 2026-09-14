# 🏗️ 02: SYSTEM ARCHITECTURE & DATA FLOW
### *Detail Teknis Arsitektur Multi-Tenant, Routing Domain & Alur Transaksi*

Dokumen ini menguraikan arsitektur internal sistem, pemisahan tenant, mekanisme *Custom Domain*, dan alur lengkap (*state machine*) sejak pembeli mengklik toko hingga dana masuk ke rekening penjual.

---

## 1. Arsitektur Multi-Tenancy (Row-Level Security)

ALURELAB menggunakan model **Shared Database, Shared Schema dengan Row Level Security (RLS)**. Model ini dipilih karena:
- Menghemat biaya server hingga 80% dibanding model *Database-per-Tenant* (tidak perlu ratusan koneksi DB terpisah).
- Jauh lebih aman dibanding sekadar mengandalkan klausa `where('tenant_id', ...)` di Eloquent Laravel yang rentan kelalaian developer (IDOR / data leak).

### Mekanisme Tenant Resolution:
Setiap *HTTP Request* yang masuk ke backend Laravel melalui middleware `IdentifyTenant`:

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (Browser / App)
    participant CF as Cloudflare Edge
    participant Mid as Middleware IdentifyTenant
    participant Redis as Redis Cache
    participant DB as PostgreSQL 16 (RLS)

    User->>CF: Request: tokoku.com / amanda.alurelab.shop
    CF->>Mid: Forward Request + Header Host
    Mid->>Redis: Cek Host di Cache (Key: `domain:{host}`)
    alt Cache Hit
        Redis-->>Mid: Return tenant_id: "uuid-123"
    else Cache Miss
        Mid->>DB: Query tabel `stores` WHERE custom_domain = host OR slug = subdomain
        DB-->>Mid: Return Store Record
        Mid->>Redis: Cache tenant_id (TTL: 24 Jam)
    end
    Mid->>DB: SET LOCAL app.current_tenant_id = 'uuid-123';
    Mid->>Mid: Ikat Tenant ke Service Container: app()->instance('current_tenant', $store)
    Mid-->>User: Lanjutkan ke Controller dengan Proteksi RLS Aktif
```

---

## 2. Arsitektur Custom Domain (Cloudflare for SaaS)

Pedagang dapat menggunakan domain pribadi mereka (contoh: `hijabmevvah.com`) tanpa harus mengerti setting server yang rumit:

1. **Setup Awal di Dashboard ALURELAB**:
   - Merchant memasukkan domain: `hijabmevvah.com`.
   - Backend memanggil API Cloudflare: `POST /zones/{zone_id}/custom_hostnames` dengan hostname `hijabmevvah.com`.
   - Cloudflare merespons dengan 2 record DNS yang harus dipasang merchant:
     - Record CNAME: `hijabmevvah.com` -> `cname.alurelab.shop` (untuk routing traffic).
     - Record TXT: `_cf-custom-hostname.hijabmevvah.com` (untuk validasi kepemilikan domain & penerbitan sertifikat SSL).
2. **Auto-SSL Issuance**:
   - Sistem Cloudflare otomatis memvalidasi TXT record dan menerbitkan sertifikat SSL Let's Encrypt / Google Trust Services dalam waktu 3–5 menit.
3. **Traffic Ingress**:
   - Begitu domain aktif, seluruh traffic ke `hijabmevvah.com` diarahkan ke edge server ALURELAB dengan enkripsi HTTPS penuh secara otomatis.

---

## 3. End-to-End User Flow

### Flow 1: Merchant Onboarding 60 Detik (The Cursor Effect)
1. **Input**: Calon merchant memasukkan username Instagram toko (`@hijab_official`) atau upload 3 foto produk dari kamera HP.
2. **AI Extractor**:
   - Backend memanggil scraper ringan / API untuk mengambil bio, foto profil, dan 6 postingan produk terbaru.
   - OpenAI GPT-4o-mini otomatis membedah caption menjadi: Nama Produk, Harga Taksiran, Kategori, dan Deskripsi Persuasif.
3. **AI Photo Studio**:
   - Foto produk mentah dikirim ke Replicate (model RMBG-2.0) untuk menghapus background kusam.
   - Model Inpainting menempatkan produk pada latar studio profesional (podium kayu, lighting studio hangat, atau bayangan natural).
4. **Instant Store Creation**:
   - Database membuat akun merchant, toko, domain sementara (`hijab-official.alurelab.shop`), dan mengisi katalog produk dalam 1 transaksi atomik.
   - Merchant langsung melihat toko live mereka dalam waktu kurang dari 60 detik.

---

### Flow 2: Siklus Transaksi Pembeli (Checkout & Order Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: Pembeli Checkout & Pilih Metode Pembayaran
    
    PENDING_PAYMENT --> PAYMENT_FAILED: Batas Waktu Bayar Habis (15 Menit) / Saldo Kurang
    PAYMENT_FAILED --> [*]: Stok Dikembalikan ke Redis (INCRBY)
    
    PENDING_PAYMENT --> PAID_ESCROW: Webhook Xendit Sukses / QRIS Terbayar
    PENDING_PAYMENT --> COD_VERIFIED: Opsi COD Dipilih & Lolos Filter Anti-RTS
    
    PAID_ESCROW --> PROCESSING: Merchant Klik 'Proses Pesanan'
    COD_VERIFIED --> PROCESSING: Merchant Klik 'Proses Pesanan'
    
    PROCESSING --> SHIPPED: Biteship Booking Sukses & Resi AWB Terbit
    
    SHIPPED --> IN_TRANSIT: Kurir Ekspedisi Pick-up Paket
    IN_TRANSIT --> DELIVERED: Paket Diterima Pembeli di Alamat
    IN_TRANSIT --> RETURN_TO_SHIPPER: Pembeli Menolak Paket COD (RTS)
    
    RETURN_TO_SHIPPER --> CANCELLED: Paket Balik ke Merchant
    
    DELIVERED --> COMPLETED: 2x24 Jam Tanpa Komplain (Dana Escrow Cair ke Dompet Merchant)
    COMPLETED --> [*]
```

---

## 4. Mekanisme Kunci Anti-Overselling (Redis Atomic Lock)

Salah satu kegagalan fatal software e-commerce konvensional adalah *race condition*: ketika stok barang tersisa 1, namun ada 5 orang yang menekan tombol bayar pada milidetik yang sama, menyebabkan 5 transaksi berhasil (*overselling*).

ALURELAB menyelesaikan ini di layer Redis In-Memory sebelum menyentuh database relasional:

```php
// Contoh Pseudocode Penanganan Stok Atomik di Controller Checkout
$productId = $request->input('product_id');
$qtyRequested = $request->input('quantity', 1);

$redisStockKey = "store:{$storeId}:stock:{$productId}";

// Eksekusi Atomic Decrement di Redis
$remainingStock = Redis::decrby($redisStockKey, $qtyRequested);

if ($remainingStock < 0) {
    // Stok tidak mencukupi, kembalikan nilai stok segera
    Redis::incrby($redisStockKey, $qtyRequested);
    
    return response()->json([
        'success' => false,
        'message' => 'Maaf, produk ini baru saja habis dibeli pelanggan lain!'
    ], 409);
}

// Jika stok berhasil dikunci, buat tagihan pembayaran dengan TTL 15 menit
$order = Order::create([...]);

// Dispatch Delayed Job: Jika dalam 15 menit belum dibayar, kembalikan stok
ReleaseUnpaidStockJob::dispatch($order->id)->delay(now()->addMinutes(15));
```
