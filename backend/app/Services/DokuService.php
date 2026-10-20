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
     * Membuat tagihan Checkout V1 DOKU untuk satu order.
     *
     * @return array{success: bool, invoice_url: ?string, invoice_id: ?string, expiry_date: ?string, error: ?string}
     */
    public function createCheckoutInvoice(Order $order, Store $store): array
    {
        if ($this->isQaSimulationEnabled($store)) {
            return [
                'success' => true,
                'invoice_url' => null,
                'invoice_id' => 'QA-INVOICE-'.$order->order_number,
                'expiry_date' => now()->addMinutes(config('doku.invoice_expiry_minutes', 1440))->toIso8601String(),
                'error' => null,
            ];
        }

        if (! $this->isConfigured()) {
            return $this->failure('Kredensial DOKU (DOKU_CLIENT_ID / DOKU_SECRET_KEY) belum dikonfigurasi.');
        }

        $target = '/checkout/v1/payment';
        $expiryMinutes = (int) config('doku.invoice_expiry_minutes', 1440);

        $payload = [
            'order' => [
                'invoice_number' => $order->order_number,
                'amount' => (int) round($order->total_amount),
                'currency' => 'IDR',
                'description' => "Pembayaran {$order->order_number} di {$store->name}",
                'callback_url' => config('app.url').config('doku.notification_path'),
                'redirect_url' => rtrim((string) config('doku.buyer_redirect_url', config('app.url')), '/').'/'.$store->slug.'/orders',
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
            Log::error('DOKU Create Checkout Failed', ['status' => $posted['status'], 'body' => $posted['body']]);

            return $this->failure('Gagal membuat tagihan pembayaran DOKU: '.$posted['body']);
        }

        $json = json_decode($posted['body'], true) ?? [];

        return [
            'success' => true,
            'invoice_url' => $json['response']['payment']['url']
                ?? $json['payment']['url']
                ?? $json['invoice_url']
                ?? null,
            'invoice_id' => $json['response']['order']['invoice_number']
                ?? $json['order']['invoice_number']
                ?? $order->order_number,
            'expiry_date' => $json['response']['payment']['expired_datetime']
                ?? $json['response']['payment']['expiry_time']
                ?? now()->addMinutes($expiryMinutes)->toIso8601String(),
            'error' => null,
        ];
    }

    /**
     * Membuat tagihan Checkout V1 DOKU untuk pembayaran langganan paket toko.
     *
     * @return array{success: bool, payment_url: ?string, error: ?string}
     */
    public function createSubscriptionInvoice(Subscription $subscription, Store $store, User $user): array
    {
        if (! $this->isConfigured()) {
            return $this->subscriptionFailure('Kredensial DOKU (DOKU_CLIENT_ID / DOKU_SECRET_KEY) belum dikonfigurasi.');
        }

        $frontendUrl = rtrim((string) config('doku.frontend_url', 'https://app.alurelab.com'), '/');

        $payload = [
            'order' => [
                'invoice_number' => $subscription->invoice_number,
                'amount' => (int) $subscription->amount,
                'currency' => 'IDR',
                'description' => "Langganan paket {$subscription->plan_tier} untuk {$store->name}",
                'callback_url' => "{$frontendUrl}/dashboard/subscription?status=success",
                'callback_url_cancel' => "{$frontendUrl}/dashboard/subscription?status=cancel",
            ],
            'payment' => [
                'payment_due_date' => 60,
            ],
            'customer' => [
                'name' => $user->name ?: 'Merchant',
                'email' => $user->email,
                'phone' => $this->sanitizePhoneNumber(
                    (! empty($user->phone_number) && $user->phone_number !== '-')
                        ? $user->phone_number
                        : $store->phone_number
                ),
            ],
        ];

        $body = json_encode($payload, JSON_UNESCAPED_SLASHES);

        $posted = $this->signedPost('/checkout/v1/payment', $body);

        if (! $posted['ok']) {
            Log::error('DOKU Create Subscription Invoice Failed', [
                'invoice_number' => $subscription->invoice_number,
                'status' => $posted['status'],
                'body' => $posted['body'],
            ]);

            return $this->subscriptionFailure('Gagal membuat tagihan langganan DOKU: '.$posted['body']);
        }

        $json = json_decode($posted['body'], true) ?? [];
        $paymentUrl = $json['response']['payment']['url']
            ?? $json['payment']['url']
            ?? $json['invoice_url']
            ?? null;

        if (! $paymentUrl) {
            return $this->subscriptionFailure('Respons DOKU tidak memuat payment URL.');
        }

        return ['success' => true, 'payment_url' => (string) $paymentUrl, 'error' => null];
    }

    /**
     * Registrasi sub-account DOKU (SAC Merchant) untuk sebuah toko.
     * Simpan id sub-account ke store.doku_sub_account_id + status ke doku_account_status.
     *
     * @return array{success: bool, sub_account_id: ?string, error: ?string}
     */
    public function registerSubAccount(Store $store, ?string $ownerEmail = null, ?string $ownerPhone = null): array
    {
        if (! empty($store->doku_sub_account_id)) {
            return ['success' => true, 'sub_account_id' => $store->doku_sub_account_id, 'error' => null];
        }

        if (! $this->isConfigured()) {
            return $this->subAccountFailure('Kredensial DOKU (DOKU_CLIENT_ID / DOKU_SECRET_KEY) belum dikonfigurasi.');
        }

        $target = '/sac-merchant/v1/accounts';
        $email = $ownerEmail ?: ($store->phone_number ? $store->slug.'@alurelab.shop' : 'store_'.$store->id.'@alurelab.shop');

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
     * Validasi signature notifikasi webhook DOKU (Request-Id, Timestamp, HMAC).
     */
    public function verifyWebhookSignature(Request $request): bool
    {
        $signature = (string) $request->header('Signature', '');
        $requestId = (string) $request->header('Request-Id', '');
        $timestamp = (string) $request->header('Request-Timestamp', '');

        if ($signature === '' || $requestId === '' || $timestamp === '') {
            return false;
        }

        $sentAt = strtotime($timestamp);
        if ($sentAt === false) {
            return false;
        }

        $tolerance = (int) config('doku.signature_tolerance_seconds', 300);
        if (abs(time() - $sentAt) > $tolerance) {
            return false;
        }

        $body = (string) $request->getContent();

        // Request-Target bisa dikirim sebagai header atau berupa path notifikasi kita.
        $targets = array_unique(array_filter([
            $request->header('Request-Target'),
            '/'.ltrim($request->path(), '/'),
            (string) config('doku.notification_path'),
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
