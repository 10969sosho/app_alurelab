# 💳 03: PAYMENT & SHIPPING INTEGRATION
### *Spesifikasi Teknis Xendit XenPlatform & Biteship Logistics API*

Dokumen ini memuat detail implementasi teknis untuk dua pilar operasional vital ALURELAB: pemrosesan dana pembayaran berlisensi dan otomatisasi pengiriman multi-kurir se-Indonesia.

---

## 1. Integrasi Payment Gateway (Xendit XenPlatform)

### 1.1 Hierarki Akun & Alur Pembagian Dana (Fee Splitting)
ALURELAB menggunakan produk **Xendit XenPlatform** dengan tipe **Owned Sub-Account**. 

```
[ PEMBELI ] ──(Bayar Rp 100.000 via QRIS)──> [ REKENING ESCROW XENDIT (PJP BI) ]
                                                            │
                                  ┌─────────────────────────┴─────────────────────────┐
                                  ▼                                                   ▼
                     [ ALURELAB MASTER ACCOUNT ]                         [ MERCHANT SUB-ACCOUNT ]
                     Platform Fee: 1.5% = Rp 1.500                       Net Balance: Rp 97.800
                     (Laba Bersih Platform)                              (Tersimpan di Virtual Ledger)
                                                                                      │
                                                                       Merchant Klik 'Tarik Dana'
                                                                                      │
                                                                                      ▼
                                                                         [ REKENING BANK PRIBADI SELLER ]
                                                                         (BCA / Mandiri / BRI / Jago)
```

### 1.2 Payload Pembuatan Tagihan Pembayaran (Split Payment)
Saat pembeli menekan tombol 'Bayar Sekarang', backend mengirim request ke Xendit:

```json
POST https://api.xendit.co/v2/invoices
Headers:
  Authorization: Basic <BASE64_ENCODED_XENDIT_SECRET_KEY:>
  for-user-id: <MERCHANT_XENDIT_SUB_ACCOUNT_ID>
  Content-Type: application/json

Body:
{
  "external_id": "ORD-20260914-00192",
  "amount": 150000,
  "description": "Pembayaran Pesanan #00192 di Toko Hijab Mevvah",
  "invoice_duration": 900,
  "customer": {
    "given_names": "Rina Wulandari",
    "mobile_number": "+6281234567890"
  },
  "fees": [
    {
      "type": "ALURELAB_PLATFORM_FEE",
      "value": 2250
    }
  ],
  "payment_methods": ["QRIS", "BCA", "MANDIRI", "BRI", "BNI", "OVO", "DANA", "SHOPEEPAY"]
}
```

### 1.3 Penanganan Webhook Xendit & Verifikasi Signature
Webhook adalah pintu masuk kritis untuk mengubah status pesanan menjadi `PAID`. Wajib diverifikasi untuk mencegah serangan *fake webhook spoofing*:

```php
// app/Http/Controllers/Api/XenditWebhookController.php
public function handleInvoiceCallback(Request $request)
{
    $callbackToken = $request->header('x-callback-token');
    
    // Verifikasi Token Rahasia dari Dashboard Xendit
    if ($callbackToken !== config('services.xendit.webhook_token')) {
        Log::warning('Percobaan Fake Webhook Terdeteksi dari IP: ' . $request->ip());
        return response()->json(['error' => 'Unauthorized'], 401);
    }

    $payload = $request->all();
    $externalId = $payload['external_id'];
    $status = $payload['status']; // 'PAID' or 'EXPIRED'

    $order = Order::where('order_number', $externalId)->firstOrFail();

    if ($status === 'PAID' && $order->status === OrderStatus::PENDING_PAYMENT) {
        DB::transaction(function () use ($order, $payload) {
            $order->update([
                'status' => OrderStatus::PAID_ESCROW,
                'paid_at' => now(),
                'payment_method' => $payload['payment_method'],
                'payment_channel' => $payload['payment_channel']
            ]);

            // Catat ke Mutasi Dompet Internal Merchant
            MerchantWallet::recordPendingEscrow($order);

            // Kirim notifikasi WhatsApp otomatis ke pembeli dan merchant
            NotificationService::dispatchOrderPaid($order);
        });
    }

    return response()->json(['status' => 'success']);
}
```

### 1.4 Kebijakan Pencairan Dana (Batch Withdrawal)
- **Aturan Minimum**: Penjual dapat mencairkan dana saldo toko mereka jika akumulasi saldo yang sudah selesai (*completed*) mencapai **minimal Rp 100.000**.
- **Biaya Transfer Bank**: Dikenakan biaya flat transfer antar-bank sebesar **Rp 3.000** per penarikan dana (dipotong dari saldo penarikan). 
- **Tujuan**: Mencegah pemborosan biaya payout Rp 3.000 pada pesanan-pesanan bernilai kecil.

---

## 2. Integrasi Logistik Multi-Kurir (Biteship API)

### 2.1 Standardisasi Alamat & Cek Tarif Ongkir Akurat
Untuk mencegah salah hitung ongkir yang merugikan merchant, input alamat pembeli di frontend menggunakan *autocomplete area search* dari endpoint Biteship:

```
GET https://api.biteship.com/v1/maps/areas?countries=ID&input=sukolilo surabaya
```
Setiap area mengembalikan `area_id` unik (contoh: `ID_ID_3578_357807`). Saat checkout, `area_id` origin toko dan destinasi pembeli dikirim ke:

```json
POST https://api.biteship.com/v1/rates/couriers
{
  "origin_area_id": "ID_ID_3171_317101",
  "destination_area_id": "ID_ID_3578_357807",
  "couriers": "jne,jnt,sicepat,anteraja",
  "items": [
    {
      "name": "Hijab Silk Premium",
      "value": 125000,
      "weight": 200,
      "quantity": 1
    }
  ]
}
```

### 2.2 Pembuatan Pesanan Kirim & Auto-AWB Resi
Saat merchant menekan tombol **"Kirim Pesanan"**, backend mengeksekusi booking kurir secara langsung:

```json
POST https://api.biteship.com/v1/orders
{
  "shipper_contact_name": "Hijab Mevvah Store",
  "shipper_contact_phone": "081298765432",
  "origin_area_id": "ID_ID_3171_317101",
  "origin_address": "Jl. Kemang Raya No. 45, Jakarta Selatan",
  "destination_contact_name": "Rina Wulandari",
  "destination_contact_phone": "081234567890",
  "destination_area_id": "ID_ID_3578_357807",
  "destination_address": "Jl. Kertajaya Indah No. 12, Surabaya",
  "courier_company": "sicepat",
  "courier_type": "reg",
  "delivery_type": "pickup",
  "delivery_date": "2026-09-14",
  "delivery_time": "13:00-15:00",
  "order_note": "Harap jangan dibanting, paket pakaian premium",
  "items": [...]
}
```

**Respons API Instan**:
- `waybill_id`: Nomor resi resmi (contoh: `004289127819`).
- `tracking_url`: Tautan tracking real-time kurir.
- `label_url`: Tautan download label pengiriman PDF standar thermal printer (100x150 mm) dengan barcode resi siap cetak dan tempel di kardus.

---

## 3. Sistem Proteksi COD (Smart Anti-RTS Engine)

Masalah nomor 1 penjual online di Indonesia adalah **Return to Shipper (RTS)**: pembeli menolak paket saat kurir tiba, menyebabkan modal penjual hangus untuk membayar ongkos kirim bolak-balik.

ALURELAB menerapkan **3 Lapis Proteksi Anti-RTS**:

```
[ PEMBELI PILIH OPSI COD ]
            │
            ▼
[ LAYER 1: ALURELAB FRAUD RISK SCORING ]
Cek riwayat nomor WhatsApp pembeli di seluruh jaringan toko ALURELAB.
Pernah menolak paket COD di toko lain?
   ├── YA (Skor Risiko Tinggi) ──> WAJIB BAYAR DP ONGKIR RP 20.000 VIA QRIS SEBELUM DIPROSES
   └── TIDAK (Skor Risiko Rendah) ─┐
                                   ▼
[ LAYER 2: WHATSAPP OTP CONFIRMATION ]
Sistem otomatis mengirim tombol verifikasi ke WhatsApp pembeli:
"Konfirmasi pesanan COD Rp 150.000 Anda? Klik [YA, SAYA MEMESAN]"
   ├── Klik YA dalam 3 Jam ──────> PESANAN DILANJUTKAN KE SISTEM PACKING
   └── TIDAK DIBALAS / MENOLAK ──> PESANAN DIBATALKAN OTOMATIS (MENCEGAH KERUGIAN ONGKIR)
                                   │
                                   ▼
[ LAYER 3: COURIER AUTO DISPATCH ]
Kurir mengantar paket -> Pembeli bayar tunai -> Dana direkonsiliasi H+1 s/d H+3 ke platform.
```

---

## 4. Monetisasi Selisih Diskon Logistik (Platform Margin)

Biteship memberikan diskon volume pengiriman kepada ALURELAB sebesar **15% – 20%** dari total tarif normal kurir. 

### Model Bagi Hasil:
- **Diskon ke Merchant**: Kita berikan diskon ongkir **10%** sebagai *selling point* ("Jualan di ALURELAB ongkir kurir otomatis diskon 10%").
- **Platform Margin**: ALURELAB menahan **5%** sebagai laba pasif platform.
- **Simulasi**: Pada skala 25.000 paket/bulan dengan rata-rata ongkir Rp 15.000 (Total omzet ongkir Rp 375 Juta/bulan), platform mengantongi laba bersih pasif sebesar **Rp 18.750.000 per bulan** murni dari efisiensi logistik.
