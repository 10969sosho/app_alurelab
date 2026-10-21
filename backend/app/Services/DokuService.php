<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Store;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DokuService
{
    protected string $clientId;

    protected string $secretKey;

    public function __construct()
    {
        $this->clientId = (string) config('doku.client_id', '');
        $this->secretKey = (string) config('doku.secret_key', '');
    }

    public function isConfigured(): bool
    {
        return $this->clientId !== '' && $this->secretKey !== '';
    }

    public function baseUrl(): string
    {
        return rtrim((string) config('doku.base_url', 'https://api-sandbox.doku.com'), '/');
    }

    /**
     * Signature DOKU Checkout V1 = HMAC-SHA256 dari string header + Digest body.
     * Format resmi DOKU: "HMACSHA256=" . base64_encode(hmac_raw)
     *
     * @return string signature string
     */
    public function generateSignature(string $requestId, string $requestTimestamp, string $requestTarget, string $body): string
    {
        $digest = base64_encode(hash('sha256', $body, true));

        $stringToSign = 'Client-Id:'.$this->clientId."\n"
            .'Request-Id:'.$requestId."\n"
            .'Request-Timestamp:'.$requestTimestamp."\n"
            .'Request-Target:'.$requestTarget."\n"
            .'Digest:'.$digest;

        $rawHmac = hash_hmac('sha256', $stringToSign, $this->secretKey, true);

        return 'HMACSHA256='.base64_encode($rawHmac);
    }

    /**
     * Signature untuk request GET (tanpa Digest).
     */
    public function generateGetSignature(string $requestId, string $requestTimestamp, string $requestTarget): string
    {
        $stringToSign = 'Client-Id:'.$this->clientId."\n"
            .'Request-Id:'.$requestId."\n"
            .'Request-Timestamp:'.$requestTimestamp."\n"
            .'Request-Target:'.$requestTarget;

        $rawHmac = hash_hmac('sha256', $stringToSign, $this->secretKey, true);

        return 'HMACSHA256='.base64_encode($rawHmac);
    }

    /**
     * GET signed request ke DOKU (misal: Check Status).
     *
     * @return array{ok: bool, status: int, body: string}
     */
    public function signedGet(string $target): array
    {
        $requestId = (string) Str::uuid();
        $timestamp = now('UTC')->format('Y-m-d\TH:i:s\Z');

        try {
            $response = Http::withHeaders([
                'Client-Id' => $this->clientId,
                'Request-Id' => $requestId,
                'Request-Timestamp' => $timestamp,
                'Request-Target' => $target,
                'Signature' => $this->generateGetSignature($requestId, $timestamp, $target),
            ])->get($this->baseUrl().$target);
        } catch (\Throwable $e) {
            Log::error('DOKU GET Request Gagal (transport)', ['target' => $target, 'error' => $e->getMessage()]);

            return ['ok' => false, 'status' => 0, 'body' => $e->getMessage()];
        }

        return ['ok' => $response->successful(), 'status' => $response->status(), 'body' => $response->body()];
    }

    /**
     * POST signed request JSON ke DOKU dengan header Client-Id / Digest / Signature.
     *
     * @return array{ok: bool, status: int, body: string}
     */
    protected function signedPost(string $target, string $body): array
    {
        $requestId = (string) Str::uuid();
        // DOKU Checkout V1 membutuhkan format ISO-8601 UTC tanpa milidetik: 2026-10-19T12:00:00Z
        $timestamp = now('UTC')->format('Y-m-d\TH:i:s\Z');

        try {
            $response = Http::withHeaders([
                'Client-Id' => $this->clientId,
                'Request-Id' => $requestId,
                'Request-Timestamp' => $timestamp,
                'Request-Target' => $target,
                'Digest' => base64_encode(hash('sha256', $body, true)),
                'Signature' => $this->generateSignature($requestId, $timestamp, $target, $body),
                'Content-Type' => 'application/json',
            ])->withBody($body, 'application/json')->post($this->baseUrl().$target);
        } catch (\Throwable $e) {
            Log::error('DOKU Request Gagal (transport)', ['target' => $target, 'error' => $e->getMessage()]);

            return ['ok' => false, 'status' => 0, 'body' => $e->getMessage()];
        }

        return ['ok' => $response->successful(), 'status' => $response->status(), 'body' => $response->body()];
    }

    /**
     * Mengecek status pembayaran invoice langsung ke DOKU.
     *
     * @return array{ok: bool, paid: bool, status: string, payload: array}
     */
    public function checkOrderStatus(string $invoiceNumber): array
    {
        if (! $this->isConfigured()) {
            return ['ok' => false, 'paid' => false, 'status' => 'UNCONFIGURED', 'payload' => []];
        }

        $target = "/orders/v1/status/{$invoiceNumber}";
        $res = $this->signedGet($target);

        if (! $res['ok']) {
            Log::warning('DOKU checkOrderStatus gagal', ['target' => $target, 'body' => $res['body']]);

            return ['ok' => false, 'paid' => false, 'status' => 'ERROR', 'payload' => []];
        }

        $json = json_decode($res['body'], true) ?? [];
        $txStatus = strtoupper((string) ($json['transaction']['status'] ?? ''));
        $orderStatus = strtoupper((string) ($json['order']['status'] ?? ''));

        $isPaid = ($txStatus === 'SUCCESS' || $orderStatus === 'SUCCESS' || $orderStatus === 'PAID');

        return [
            'ok' => true,
            'paid' => $isPaid,
            'status' => $txStatus ?: $orderStatus,
            'payload' => $json,
        ];
    }

    /**
     * Membuat tagihan Checkout V1 DOKU untuk satu order.
     *
     * CATATAN NAMA TAMPIL DI HALAMAN DOKU (audit 2026-10-20):
     * - Header DOKU Checkout (avatar + "Cristian Albertus") adalah MERCHANT/ACCOUNT NAME
     *   dari akun yang memilik Client ID (DOKU_CLIENT_ID) tersebut. Nama ini dikonfigurasi
     *   di DOKU Back Office (Merchant Profile / Business Info) dan TIDAK bisa di-override
     *   per transaksi: payload /checkout/v1/payment hanya menerima order, payment, customer,
     *   dan additional_info — tidak ada field merchant.name.
     * - "Customer Information: Name" pada halaman DOKU berasal dari payload `customer.name`
     *   di bawah ini, yaitu nama penerima pesanan (bukan nama toko).
     * - Opsi menampilkan nama toko: (1) daftarkan DOKU merchant account terpisah per toko
     *   (Client ID baru -> header menampilkan nama bisnis toko tersebut), atau
     *   (2) gunakan sub-account settlement (additional_info.settlement.sub_account_id) —
     *   dana cair ke sub-account toko, tetapi header checkout tetap nama merchant utama, atau
     *   (3) hubungi DOKU untuk opsi white-label / merchant name override bila tersedia.
     *
     * @return array{success: bool, invoice_url: ?string, invoice_id: ?string, expiry_date: ?string, error: ?string}
     */
    public function createCheckoutInvoice(Order $order, Store $store): array
    {
        if ($this->isQaSimulationEnabled($store)) {
            return [
                'success' => true,
                'invoice_url' => config('app.url')."/qa-simulator/{$order->order_number}",
                'invoice_id' => $order->order_number,
                'expiry_date' => now()->addMinutes(15)->toIso8601String(),
                'error' => null,
            ];
        }

        if (! $this->isConfigured()) {
            return $this->failure('Kredensial DOKU (DOKU_CLIENT_ID / DOKU_SECRET_KEY) belum dikonfigurasi.');
        }

        $target = '/checkout/v1/payment';
        $expiryMinutes = (int) config('doku.invoice_expiry_minutes', 1440);

        $frontendUrl = rtrim((string) config('doku.buyer_redirect_url', config('doku.frontend_url', 'https://app.alurelab.com')), '/');
        $buyerReturnUrl = "{$frontendUrl}/{$store->slug}/orders/{$order->order_number}";

        $payload = [
            'order' => [
                'invoice_number' => $order->order_number,
                'amount' => (int) round($order->total_amount),
                'currency' => 'IDR',
                'description' => "Pembayaran {$order->order_number} di {$store->name}",
                'callback_url' => $buyerReturnUrl,
                'redirect_url' => $buyerReturnUrl,
                'expiry' => [
                    'duration' => $expiryMinutes,
                    'unit' => 'MINUTE',
                ],
            ],
            'payment' => [
                'payment_methods' => config('doku.payment_methods', ['QRIS']),
            ],
            'customer' => [
                'name' => $order->shipping_recipient_name,
                'phone' => $this->sanitizePhoneNumber($order->shipping_recipient_phone),
            ],
        ];

        $additionalInfo = $this->settlementInfo($store);
        if ($additionalInfo !== []) {
            $payload['additional_info'] = $additionalInfo;
        }

        $body = json_encode($payload, JSON_UNESCAPED_SLASHES);

        $posted = $this->signedPost($target, $body);

        if (! $posted['ok']) {
            Log::error('DOKU Create Checkout Invoice Gagal', [
                'order_number' => $order->order_number,
                'status' => $posted['status'],
                'body' => $posted['body'],
            ]);

            return $this->failure('Gagal membuat tagihan DOKU: '.$posted['body']);
        }

        $json = json_decode($posted['body'], true) ?? [];
        $invoiceUrl = $json['response']['payment']['url']
            ?? $json['payment']['url']
            ?? $json['response']['payment_url']
            ?? null;

        $invoiceId = $json['response']['order']['invoice_number']
            ?? $json['order']['invoice_number']
            ?? $order->order_number;

        $expiryDate = $json['response']['order']['expiry_date']
            ?? $json['order']['expiry_date']
            ?? now()->addMinutes($expiryMinutes)->toIso8601String();

        return [
            'success' => true,
            'invoice_url' => $invoiceUrl,
            'invoice_id' => $invoiceId,
            'expiry_date' => $expiryDate,
            'error' => null,
        ];
    }

    /**
     * Generate nomor Virtual Account (Direct API DOKU Non-SNAP) untuk satu order.
     * Endpoint: POST /{bank}-virtual-account/v2/payment-code
     *
     * @return array{success: bool, va_number: ?string, bank: ?string, expired_at: ?string, error: ?string}
     */
    public function createDirectVa(Order $order, Store $store, string $bank): array
    {
        $bank = strtolower($bank);

        if (! in_array($bank, ['bca', 'mandiri', 'bri', 'bni'], true)) {
            return $this->vaFailure("Bank Virtual Account '{$bank}' belum didukung.");
        }

        $expiryMinutes = (int) config('doku.invoice_expiry_minutes', 1440);
        $expiredAt = now()->addMinutes($expiryMinutes)->toIso8601String();

        if ($this->isQaSimulationEnabled($store)) {
            return [
                'success' => true,
                'va_number' => '99'.substr(preg_replace('/\D/', '', (string) $order->id), 0, 14),
                'bank' => strtoupper($bank),
                'expired_at' => $expiredAt,
                'error' => null,
            ];
        }

        if (! $this->isConfigured()) {
            return $this->vaFailure('Kredensial DOKU (DOKU_CLIENT_ID / DOKU_SECRET_KEY) belum dikonfigurasi.');
        }

        $payload = [
            'order' => [
                'invoice_number' => $order->order_number,
                'amount' => (int) round($order->total_amount),
            ],
            'virtual_account_info' => [
                'expired_time' => $expiryMinutes,
                'reusable_status' => false,
                'info1' => $store->name,
                'info2' => $order->order_number,
                'info3' => 'Pembayaran pesanan '.$order->order_number,
            ],
            'customer' => [
                'name' => $order->shipping_recipient_name,
                'email' => $order->customer?->email ?: 'buyer@alurelab.com',
            ],
        ];

        if ($bank === 'bni') {
            // BNI VA mensyaratkan merchant_unique_reference (numerik, maks 13 digit).
            $payload['virtual_account_info']['merchant_unique_reference'] = substr(str_pad((string) sprintf('%u', crc32($order->order_number)), 13, '0', STR_PAD_LEFT), 0, 13);
        }

        $target = "/{$bank}-virtual-account/v2/payment-code";
        $posted = $this->signedPost($target, json_encode($payload, JSON_UNESCAPED_SLASHES));

        if (! $posted['ok']) {
            Log::error('DOKU Create Direct VA Gagal', [
                'order_number' => $order->order_number,
                'bank' => strtoupper($bank),
                'status' => $posted['status'],
                'body' => $posted['body'],
            ]);

            return $this->vaFailure('Gagal membuat Virtual Account '.strtoupper($bank).': '.$posted['body']);
        }

        $json = json_decode($posted['body'], true) ?? [];
        $vaNumber = $json['virtual_account_info']['virtual_account_number']
            ?? $json['response']['virtual_account_info']['virtual_account_number']
            ?? $json['payment_code']
            ?? null;

        if (! $vaNumber) {
            return $this->vaFailure('Respons DOKU tidak memuat nomor Virtual Account.');
        }

        return [
            'success' => true,
            'va_number' => (string) $vaNumber,
            'bank' => strtoupper($bank),
            'expired_at' => $expiredAt,
            'error' => null,
        ];
    }

    /**
     * URL script DOKU Checkout JS (jokul-checkout-1.0.0.js) sesuai environment.
     * Dipakai frontend untuk memanggil loadJokulCheckout(payment_url) sebagai modal overlay.
     */
    public function checkoutJsUrl(): string
    {
        $isProduction = (string) config('doku.environment', 'sandbox') === 'production';

        return $isProduction
            ? 'https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js'
            : 'https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js';
    }

    /**
     * Membuat sesi DOKU Checkout untuk pembayaran langganan SaaS (SaaS Subscription).
     * Data merchant dikirim atas Nama Toko ($store->name), bukan nama akun user pemilik.
     *
     * @return array{success: bool, payment_url: ?string, error: ?string}
     */
    public function createSubscriptionInvoice(Subscription $subscription, Store $store, ?User $owner = null, ?string $phone = null): array
    {
        if (! $this->isConfigured()) {
            return $this->subscriptionFailure('Kredensial DOKU belum dikonfigurasi.');
        }

        $target = '/checkout/v1/payment';
        $frontendUrl = rtrim((string) config('doku.frontend_url', 'http://localhost:3000'), '/');

        $payload = [
            'order' => [
                'invoice_number' => $subscription->invoice_number,
                'amount' => (int) round($subscription->amount),
                'currency' => 'IDR',
                'callback_url' => "{$frontendUrl}/dashboard/subscription?status=success",
                'callback_url_cancel' => "{$frontendUrl}/dashboard/subscription?status=cancel",
                'expiry' => [
                    'duration' => 120,
                    'unit' => 'MINUTE',
                ],
            ],
            'payment' => [
                'payment_methods' => config('doku.payment_methods', ['QRIS']),
                'payment_due_date' => 60,
            ],
            'customer' => [
                'name' => $store->name,
                'email' => $owner?->email,
                'phone' => $phone ? $this->sanitizePhoneNumber($phone) : null,
            ],
        ];

        $body = json_encode($payload, JSON_UNESCAPED_SLASHES);

        $posted = $this->signedPost('/checkout/v1/payment', $body);

        if (! $posted['ok']) {
            Log::error('DOKU Create Subscription Invoice Gagal', [
                'invoice_number' => $subscription->invoice_number,
                'status' => $posted['status'],
                'body' => $posted['body'],
            ]);

            return $this->subscriptionFailure('Gagal membuat tagihan DOKU: '.$posted['body']);
        }

        $json = json_decode($posted['body'], true) ?? [];
        $paymentUrl = $json['response']['payment']['url']
            ?? $json['payment']['url']
            ?? $json['response']['payment_url']
            ?? null;

        return [
            'success' => true,
            'payment_url' => $paymentUrl,
            'error' => null,
        ];
    }

    /**
     * Mendaftarkan Sub-Account DOKU untuk toko/merchant agar escrow dan settlement otomatis.
     * Email akun selalu memakai email asli owner bila tersedia; dummy hanya fallback terakhir.
     *
     * @return array{success: bool, sub_account_id: ?string, error: ?string}
     */
    public function registerSubAccount(Store $store, ?string $ownerEmail = null): array
    {
        if ($this->isQaSimulationEnabled($store)) {
            $mockSubAccountId = 'SUB-QA-'.strtoupper(substr(md5($store->id), 0, 10));

            return ['success' => true, 'sub_account_id' => $mockSubAccountId, 'error' => null];
        }

        if (! empty($store->doku_sub_account_id)) {
            return ['success' => true, 'sub_account_id' => $store->doku_sub_account_id, 'error' => null];
        }

        if (! $this->isConfigured()) {
            return $this->subAccountFailure('Kredensial DOKU (DOKU_CLIENT_ID / DOKU_SECRET_KEY) belum dikonfigurasi.');
        }

        $target = '/sac-merchant/v1/accounts';

        $email = $ownerEmail ?: $store->users()->wherePivot('role', 'owner')->first()?->email;

        if (! $email) {
            $email = 'store_'.$store->id.'@alurelab.com';
        }

        $body = json_encode([
            'account' => [
                'name' => $store->name,
                'email' => $email,
                'type' => 'STANDARD',
            ],
        ], JSON_UNESCAPED_SLASHES);

        $posted = $this->signedPost($target, $body);

        if (! $posted['ok']) {
            Log::error('DOKU Register Sub-Account Failed', [
                'store_id' => $store->id,
                'status' => $posted['status'],
                'body' => $posted['body'],
            ]);

            return $this->subAccountFailure('Gagal mendaftarkan sub-account DOKU: '.$posted['body']);
        }

        $json = json_decode($posted['body'], true) ?? [];
        $subAccountId = $json['response']['account']['id']
            ?? $json['account']['id']
            ?? $json['id']
            ?? null;

        if (! $subAccountId) {
            return $this->subAccountFailure('Respons DOKU tidak memuat id sub-account.');
        }

        $store->doku_sub_account_id = (string) $subAccountId;
        $store->doku_account_status = (string) ($json['response']['account']['status'] ?? $json['account']['status'] ?? 'registered');
        $store->save();

        return ['success' => true, 'sub_account_id' => $store->doku_sub_account_id, 'error' => null];
    }

    /**
     * Validasi HMAC Signature webhook DOKU Checkout V1.
     */
    public function verifyWebhookSignature(Request $request): bool
    {
        if (config('services.qa_simulation.bypass_webhook_signature', false)) {
            return true;
        }

        $clientId = $request->header('Client-Id');
        $requestId = $request->header('Request-Id');
        $timestamp = $request->header('Request-Timestamp');
        $signature = $request->header('Signature');
        $target = $request->header('Request-Target', (string) config('doku.notification_path'));

        if (! $clientId || ! $requestId || ! $timestamp || ! $signature) {
            return false;
        }

        if ($clientId !== $this->clientId) {
            return false;
        }

        $sentAt = strtotime($timestamp);
        $tolerance = (int) config('doku.signature_tolerance_seconds', 300);

        if ($sentAt === false || abs(time() - $sentAt) > $tolerance) {
            return false;
        }

        $body = $request->getContent();

        $targets = array_unique(array_filter([
            $target,
            (string) config('doku.notification_path'),
            $request->getRequestUri(),
            '/'.$request->path(),
        ]));

        foreach ($targets as $target) {
            if (hash_equals($this->generateSignature($requestId, $timestamp, (string) $target, $body), $signature)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Sanitasi dan normalisasi nomor telepon ke format resmi DOKU (628xxxx, 9-16 digit).
     */
    public function sanitizePhoneNumber(?string $phone): string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);

        if (str_starts_with($digits, '08')) {
            $digits = '628'.substr($digits, 2);
        } elseif (str_starts_with($digits, '8')) {
            $digits = '628'.substr($digits, 1);
        } elseif (str_starts_with($digits, '6208')) {
            $digits = '628'.substr($digits, 4);
        }

        if (strlen($digits) < 9 || strlen($digits) > 16 || ! str_starts_with($digits, '62')) {
            return '6281234567890';
        }

        return $digits;
    }

    /**
     * Informasi settlement sub-merchant DOKU (bila toko sudah punya sub-account / rekening bank).
     *
     * @return array<string, mixed>
     */
    protected function settlementInfo(Store $store): array
    {
        if (empty($store->doku_sub_account_id)) {
            return [];
        }

        $bank = $store->settings['bank_account'] ?? null;

        return [
            'settlement' => array_filter([
                'sub_account_id' => $store->doku_sub_account_id,
                'bank' => $bank ? array_filter([
                    'bank_name' => $bank['bank_code'] ?? $bank['bank_name'] ?? null,
                    'account_no' => $bank['account_number'] ?? null,
                    'account_name' => $bank['account_holder_name'] ?? $bank['account_holder'] ?? null,
                ]) : null,
            ]),
        ];
    }

    /**
     * @return array{success: bool, invoice_url: null, invoice_id: null, expiry_date: null, error: string}
     */
    protected function failure(string $error): array
    {
        return [
            'success' => false,
            'invoice_url' => null,
            'invoice_id' => null,
            'expiry_date' => null,
            'error' => $error,
        ];
    }

    /**
     * @return array{success: bool, va_number: null, bank: null, expired_at: null, error: string}
     */
    protected function vaFailure(string $error): array
    {
        return [
            'success' => false,
            'va_number' => null,
            'bank' => null,
            'expired_at' => null,
            'error' => $error,
        ];
    }

    /**
     * @return array{success: bool, payment_url: null, error: string}
     */
    protected function subscriptionFailure(string $error): array
    {
        return ['success' => false, 'payment_url' => null, 'error' => $error];
    }

    /**
     * @return array{success: bool, sub_account_id: null, error: string}
     */
    protected function subAccountFailure(string $error): array
    {
        return ['success' => false, 'sub_account_id' => null, 'error' => $error];
    }

    private function isQaSimulationEnabled(Store $store): bool
    {
        return (bool) config('services.qa_simulation.enabled')
            && str_starts_with($store->slug, (string) config('services.qa_simulation.store_slug'));
    }
}
