<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BiteshipService
{
    protected string $apiUrl;

    protected string $apiKey;

    /** Kurir default platform; bisa dioverride per toko lewat settings.couriers. */
    public const DEFAULT_COURIERS = ['jne', 'jnt', 'sicepat', 'anteraja'];

    public function __construct()
    {
        $this->apiUrl = config('services.biteship.url', env('BITESHIP_BASE_URL', 'https://api.biteship.com/v1'));
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
     * Membangun payload item tarif dari cart/checkout client —
     * bobot & value diambil riil dari DB (products.weight_grams, variant price),
     * bukan dari input client, agar rate check dan booking selalu match.
     *
     * @param  array<int, array{product_id?: string, variant_id?: string, quantity?: int}>  $items
     * @return array<int, array{name: string, value: int, quantity: int, weight: int}>
     */
    public function buildRateItems(Store $store, array $items): array
    {
        $rateItems = [];

        foreach ($items as $item) {
            if (empty($item['product_id'])) {
                continue;
            }

            $product = Product::where('tenant_id', $store->id)
                ->whereKey($item['product_id'])
                ->where('is_active', true)
                ->first();

            if (! $product) {
                continue;
            }

            $variant = ! empty($item['variant_id'])
                ? $product->variants()->whereKey($item['variant_id'])->first()
                : null;

            $rateItems[] = [
                'name' => $product->title.($variant ? ' ('.$variant->title.')' : ''),
                'value' => (int) ($variant?->price ?? $product->price),
                'quantity' => max(1, (int) ($item['quantity'] ?? 1)),
                'weight' => max(1, (int) $product->weight_grams),
            ];
        }

        return $rateItems;
    }

    /**
     * Kurir aktif dari settings toko (settings.couriers = ['jne','sicepat',...]).
     */
    public function activeCouriers(?Store $store): string
    {
        $configured = $store?->settings['couriers'] ?? null;

        if (is_array($configured) && $configured !== []) {
            return implode(',', array_map(strval(...), $configured));
        }

        return implode(',', self::DEFAULT_COURIERS);
    }

    /**
     * Menghitung ongkos kirim multi-kurir real-time.
     *
     * @param  array<int, array{name: string, value: int, quantity: int, weight: int}>  $items
     * @return array<int, array<string, mixed>>
     */
    public function calculateRates(string $originAreaId, string $destinationAreaId, array $items, ?Store $store = null): array
    {
        if ($this->isQaSimulationEnabled($store)) {
            return [[
                'courier_code' => 'sicepat',
                'courier_service_code' => 'reg',
                'courier_name' => 'SiCepat QA',
                'courier_service_name' => 'Reguler QA',
                'code' => 'sicepat-reg',
                'price' => 10000,
                'duration' => '1-2 days',
            ]];
        }

        if ($this->isUnconfigured()) {
            throw new \RuntimeException('Biteship API key belum dikonfigurasi.');
        }

        $response = Http::withHeaders([
            'Authorization' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])->post("{$this->apiUrl}/rates/couriers", [
            'origin_area_id' => $originAreaId,
            'destination_area_id' => $destinationAreaId,
            'couriers' => $this->activeCouriers($store),
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
        if ($this->isQaSimulationEnabled($store)) {
            return [
                'id' => 'QA-SHIPMENT-'.$order->order_number,
                'waybill_id' => 'QA-AWB-'.$order->order_number,
                'status' => 'allocated',
                'label_url' => null,
            ];
        }

        if ($this->isUnconfigured()) {
            throw new \RuntimeException('Biteship API key belum dikonfigurasi.');
        }

        $itemDimensions = (array) ($store->settings['shipping_item_dimensions'] ?? []);
        $length = max(1, (int) ($itemDimensions['length'] ?? 10));
        $width = max(1, (int) ($itemDimensions['width'] ?? 10));
        $height = max(1, (int) ($itemDimensions['height'] ?? 10));

        $items = $order->items->map(function ($item) use ($length, $width, $height) {
            return [
                'name' => $item->product_title.($item->variant_title ? " ({$item->variant_title})" : ''),
                'value' => (int) $item->price,
                'quantity' => $item->quantity,
                'weight' => max(1, (int) ($item->product?->weight_grams ?? 200)),
                'length' => $length,
                'width' => $width,
                'height' => $height,
            ];
        })->values()->toArray();

        $payload = [
            'reference_id' => (string) $order->order_number,
            'shipper_contact_name' => $store->name,
            'shipper_contact_phone' => $store->phone_number,
            'origin_area_id' => $store->address_area_id,
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
            $parsed = $response->json();
            $detail = is_array($parsed)
                ? ($parsed['error'] ?? $parsed['message'] ?? $response->body())
                : $response->body();
            throw new \Exception('Booking Biteship gagal: '.substr((string) $detail, 0, 300));
        }

        return $response->json();
    }

    /**
     * Status tracking terkini dari Biteship berdasarkan biteship order id.
     *
     * @return array<string, mixed>
     */
    public function getTracking(string $biteshipOrderId): array
    {
        if ($this->isUnconfigured()) {
            throw new \RuntimeException('Biteship API key belum dikonfigurasi.');
        }

        $response = Http::withHeaders([
            'Authorization' => $this->apiKey,
        ])->get("{$this->apiUrl}/orders/{$biteshipOrderId}");

        if ($response->failed()) {
            throw new \RuntimeException('Biteship tracking lookup gagal.');
        }

        return $response->json() ?? [];
    }

    /**
     * Riwayat perjalanan paket via nomor resi kurir.
     *
     * @return array<string, mixed>
     */
    public function getWaybill(string $courierCode, string $waybillId): array
    {
        if ($this->isUnconfigured()) {
            throw new \RuntimeException('Biteship API key belum dikonfigurasi.');
        }

        $response = Http::withHeaders([
            'Authorization' => $this->apiKey,
        ])->get("{$this->apiUrl}/couriers/{$courierCode}/wayboards/{$waybillId}/trace");

        if ($response->failed()) {
            throw new \RuntimeException('Biteship waybill trace gagal.');
        }

        return $response->json() ?? [];
    }

    private function isUnconfigured(): bool
    {
        return $this->apiKey === '' || str_starts_with($this->apiKey, 'biteship_test_dummy');
    }

    private function isQaSimulationEnabled(?Store $store): bool
    {
        $slugPrefix = (string) config('services.qa_simulation.store_slug');

        return (bool) config('services.qa_simulation.enabled')
            && $store !== null
            && $slugPrefix !== ''
            && str_starts_with($store->slug, $slugPrefix);
    }
}
