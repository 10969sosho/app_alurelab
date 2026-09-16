<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BiteshipService
{
    protected string $apiUrl;

    protected string $apiKey;

    public function __construct()
    {
        $this->apiUrl = config('services.biteship.url', env('BITESHIP_API_URL', 'https://api.biteship.com/v1'));
        $this->apiKey = config('services.biteship.key', env('BITESHIP_API_KEY', ''));
    }

    public function verifyWebhookSignature(Request $request): bool
    {
        $secret = (string) config('services.biteship.webhook_secret', '');
        $header = (string) config('services.biteship.webhook_header', 'X-Biteship-Webhook-Secret');
        $incomingSecret = (string) $request->header($header, '');

        return $secret !== '' && $incomingSecret !== '' && hash_equals($secret, $incomingSecret);
    }

    /**
     * Mencari standardisasi area kelurahan/kecamatan Biteship.
     */
    public function searchAreas(string $query): array
    {
        if ($this->isUnconfigured()) {
            throw new \RuntimeException('Biteship API key belum dikonfigurasi.');
        }

        $response = Http::withHeaders([
            'Authorization' => $this->apiKey,
        ])->get("{$this->apiUrl}/maps/areas", [
            'countries' => 'ID',
            'input' => $query,
        ]);

        return $response->json('areas') ?? [];
    }

    /**
     * Menghitung ongkos kirim multi-kurir real-time.
     */
    public function calculateRates(string $originAreaId, string $destinationAreaId, array $items): array
    {
        if ($this->isUnconfigured()) {
            throw new \RuntimeException('Biteship API key belum dikonfigurasi.');
        }

        $response = Http::withHeaders([
            'Authorization' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])->post("{$this->apiUrl}/rates/couriers", [
            'origin_area_id' => $originAreaId,
            'destination_area_id' => $destinationAreaId,
            'couriers' => 'jne,jnt,sicepat,anteraja',
            'items' => $items,
        ]);

        if ($response->failed()) {
            Log::error('Biteship Rate Lookup Failed', ['status' => $response->status()]);
            throw new \RuntimeException('Biteship rate lookup failed.');
        }

        return $response->json('pricing') ?? [];
    }

    /**
     * Booking pesanan ekspedisi & generate AWB resi otomatis + thermal PDF label.
     */
    public function createShippingOrder(Order $order, Store $store, string $courierCode, string $courierService, bool $isCod = false): array
    {
        if ($this->isUnconfigured()) {
            throw new \RuntimeException('Biteship API key belum dikonfigurasi.');
        }

        $items = $order->items->map(function ($item) {
            return [
                'name' => $item->product_title.($item->variant_title ? " ({$item->variant_title})" : ''),
                'value' => (int) $item->price,
                'quantity' => $item->quantity,
                'weight' => 200,
            ];
        })->toArray();

        $payload = [
            'shipper_contact_name' => $store->name,
            'shipper_contact_phone' => $store->phone_number,
            'origin_area_id' => $store->address_area_id ?? 'ID_ID_3578_357807',
            'origin_address' => $store->address_detail ?? 'Pusat Distribusi Toko',
            'destination_contact_name' => $order->shipping_recipient_name,
            'destination_contact_phone' => $order->shipping_recipient_phone,
            'destination_area_id' => $order->shipping_destination_area_id,
            'destination_address' => $order->shipping_address_detail,
            'courier_company' => $courierCode,
            'courier_type' => $courierService,
            'delivery_type' => 'pickup',
            'order_note' => $order->shipping_notes,
            'items' => $items,
        ];

        if ($isCod) {
            $payload['is_cod'] = true;
            $payload['cod_amount'] = (int) $order->total_amount;
        }

        $response = Http::withHeaders([
            'Authorization' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])->post("{$this->apiUrl}/orders", $payload);

        if ($response->failed()) {
            Log::error('Biteship Booking Order Failed', ['body' => $response->body()]);
            throw new \Exception('Gagal booking kurir Biteship: '.$response->body());
        }

        return $response->json();
    }

    private function isUnconfigured(): bool
    {
        return $this->apiKey === '' || str_starts_with($this->apiKey, 'biteship_test_dummy');
    }
}
