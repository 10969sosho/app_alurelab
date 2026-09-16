<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Store;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class XenditService
{
    protected string $secretKey;

    protected string $webhookToken;

    public function __construct()
    {
        $this->secretKey = config('services.xendit.secret_key', env('XENDIT_SECRET_KEY', ''));
        $this->webhookToken = config('services.xendit.webhook_token', env('XENDIT_WEBHOOK_TOKEN', ''));
    }

    /**
     * Memvalidasi token webhook kriptografis dari Xendit.
     */
    public function verifyWebhookSignature(?string $incomingToken): bool
    {
        if (empty($incomingToken) || empty($this->webhookToken)) {
            return false;
        }

        return hash_equals($this->webhookToken, $incomingToken);
    }

    /**
     * Membuat tagihan pembayaran terpisah (Split Invoice XenPlatform).
     */
    public function createInvoice(Order $order, Store $store): array
    {
        if ($this->secretKey === '' || str_starts_with($this->secretKey, 'xnd_development_dummy')) {
            throw new \RuntimeException('Xendit secret key belum dikonfigurasi.');
        }

        $platformFee = round($order->total_amount * ($order->platform_fee_percent / 100), 2);

        $payload = [
            'external_id' => $order->order_number,
            'amount' => (int) $order->total_amount,
            'description' => "Pembayaran {$order->order_number} di {$store->name}",
            'invoice_duration' => 900, // 15 Menit TTL
            'customer' => [
                'given_names' => $order->shipping_recipient_name,
                'mobile_number' => $order->shipping_recipient_phone,
            ],
            'fees' => [
                [
                    'type' => 'ALURELAB_PLATFORM_FEE',
                    'value' => (int) $platformFee,
                ],
            ],
            'payment_methods' => ['QRIS', 'BCA', 'MANDIRI', 'BRI', 'BNI', 'OVO', 'DANA', 'SHOPEEPAY'],
        ];

        // Jika mode live & sub-account terdaftar, pasang header XenPlatform for-user-id
        $headers = [
            'Authorization' => 'Basic '.base64_encode($this->secretKey.':'),
            'Content-Type' => 'application/json',
        ];

        if (! empty($store->xendit_sub_account_id)) {
            $headers['for-user-id'] = $store->xendit_sub_account_id;
        }

        $response = Http::withHeaders($headers)
            ->post('https://api.xendit.co/v2/invoices', $payload);

        if ($response->failed()) {
            Log::error('Xendit Create Invoice Failed', ['body' => $response->body()]);
            throw new \Exception('Gagal membuat invoice pembayaran Xendit: '.$response->body());
        }

        return $response->json();
    }
}
