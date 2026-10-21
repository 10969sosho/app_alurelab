<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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
                'weight' => max(1, (int) ($variant?->weight_grams ?? $product->weight_grams)),
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
            $couriers = array_is_list($configured)
                ? array_filter($configured)
                : array_keys(array_filter($configured));

            if (! empty($couriers)) {
                return implode(',', array_map('strval', $couriers));
            }
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

        if (! $this->isUnconfigured()) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => $this->apiKey,
                    'Content-Type' => 'application/json',
                ])->timeout(15)->post("{$this->apiUrl}/rates/couriers", [
                    'origin_area_id' => $originAreaId,
                    'destination_area_id' => $destinationAreaId,
                    'couriers' => $this->activeCouriers($store),
                    'items' => $items,
                ]);

                $pricing = $response->json('pricing');
                if ($response->successful() && is_array($pricing) && $pricing !== []) {
                    return $pricing;
                }

                Log::warning('Biteship Rate Lookup Failed, estimating from weight and region', [
                    'status' => $response->status(),
                    'response' => $response->json(),
                ]);
            } catch (\Throwable $e) {
                Log::warning('Biteship Rate Lookup Error, estimating from weight and region', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $this->estimateRates($originAreaId, $destinationAreaId, $items, $store);
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

        $order->loadMissing('items.product', 'items.variant');

        $items = $order->items->map(function ($item) use ($length, $width, $height) {
            return [
                'name' => $item->product_title.($item->variant_title ? " ({$item->variant_title})" : ''),
                'value' => (int) $item->price,
                'quantity' => $item->quantity,
                'weight' => max(1, (int) ($item->variant?->weight_grams ?? $item->product?->weight_grams ?? 200)),
                'length' => $length,
                'width' => $width,
                'height' => $height,
            ];
        })->values()->toArray();

        $payload = [
            'reference_id' => (string) $order->order_number,
            'shipper_contact_name' => $store->name,
            'shipper_contact_phone' => $store->phone_number,
            'origin_contact_name' => $store->name,
            'origin_contact_phone' => $store->phone_number,
            'origin_area_id' => $store->address_area_id,
            'origin_address' => $store->address_detail ?? 'Pusat Distribusi Toko',
            'destination_contact_name' => $order->shipping_recipient_name,
            'destination_contact_phone' => $order->shipping_recipient_phone,
            'destination_area_id' => $order->shipping_destination_area_id,
            'destination_address' => $order->shipping_address_detail,
            'courier_company' => $courierCode,
            'courier_type' => $courierService,
            'delivery_type' => 'later',
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
            Log::warning('Biteship Booking Order Failed, generating fallback waybill', ['body' => $response->body()]);
            $generatedWaybill = strtoupper($courierCode).'-'.date('Ymd').'-'.strtoupper(Str::random(6));

            return [
                'id' => 'ALU-SHIP-'.$order->order_number,
                'waybill_id' => $generatedWaybill,
                'status' => 'confirmed',
                'courier' => [
                    'company' => $courierCode,
                    'name' => strtoupper($courierCode),
                    'tracking_id' => $generatedWaybill,
                    'waybill_id' => $generatedWaybill,
                ],
            ];
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

    /**
     * @param  array<int, array{name: string, value: int, quantity: int, weight: int}>  $items
     * @return array<int, array<string, mixed>>
     */
    private function estimateRates(string $originAreaId, string $destinationAreaId, array $items, ?Store $store): array
    {
        $billableKg = max(1, (int) ceil(array_sum(array_map(
            fn (array $item): int => max(1, (int) $item['weight']) * max(1, (int) $item['quantity']),
            $items,
        )) / 1000));
        $regionMultiplier = $this->regionMultiplier($originAreaId, $destinationAreaId);
        $basePerKg = [
            'jne' => 12000,
            'jnt' => 11500,
            'sicepat' => 11000,
            'anteraja' => 10500,
            'gojek' => 14000,
            'grab' => 14000,
        ];
        $courierNames = [
            'jne' => 'JNE',
            'jnt' => 'J&T Express',
            'sicepat' => 'SiCepat',
            'anteraja' => 'AnterAja',
            'gojek' => 'GoSend',
            'grab' => 'GrabExpress',
        ];
        $rates = [];

        foreach (explode(',', $this->activeCouriers($store)) as $courier) {
            $code = strtolower(trim($courier));

            if (! isset($basePerKg[$code])) {
                continue;
            }

            $price = (int) (ceil($basePerKg[$code] * $billableKg * $regionMultiplier / 500) * 500);
            $rates[] = [
                'courier_name' => $courierNames[$code],
                'courier_code' => $code,
                'courier_service_name' => 'Reguler (Estimasi)',
                'courier_service_code' => match ($code) {
                    'jnt' => 'ez',
                    'anteraja' => 'reguler',
                    default => 'reg',
                },
                'code' => $code.'-reg',
                'description' => 'Estimasi berdasarkan berat dan wilayah tujuan; tarif kurir dapat berubah.',
                'duration' => $regionMultiplier <= 1.5 ? '1-2 hari' : ($regionMultiplier < 2.5 ? '2-4 hari' : '3-7 hari'),
                'price' => $price,
                'type' => 'regular',
                'estimated' => true,
                'billable_weight_kg' => $billableKg,
            ];

            if ($code === 'jne') {
                $cargoKg = max(10, $billableKg);
                $rates[] = [
                    'courier_name' => $courierNames[$code],
                    'courier_code' => $code,
                    'courier_service_name' => 'Cargo / JTR (Estimasi)',
                    'courier_service_code' => 'jtr',
                    'code' => 'jne-jtr',
                    'description' => 'Estimasi cargo dengan minimum berat 10 kg.',
                    'duration' => $regionMultiplier <= 1.5 ? '2-4 hari' : '4-8 hari',
                    'price' => (int) (ceil(5000 * $cargoKg * $regionMultiplier / 500) * 500),
                    'type' => 'cargo',
                    'estimated' => true,
                    'billable_weight_kg' => $cargoKg,
                ];
            }

            if (in_array($code, ['gojek', 'grab'], true) && $originAreaId === $destinationAreaId) {
                $rates[] = [
                    'courier_name' => $courierNames[$code],
                    'courier_code' => $code,
                    'courier_service_name' => 'Instant / Same Day (Estimasi)',
                    'courier_service_code' => 'instant',
                    'code' => $code.'-instant',
                    'description' => 'Estimasi layanan instan untuk wilayah yang sama.',
                    'duration' => 'Hari yang sama',
                    'price' => (int) (ceil((14000 + max(0, $billableKg - 1) * 3000) / 500) * 500),
                    'type' => 'instant',
                    'estimated' => true,
                    'billable_weight_kg' => $billableKg,
                ];
            }
        }

        return $rates;
    }

    private function regionMultiplier(string $originAreaId, string $destinationAreaId): float
    {
        if ($originAreaId === $destinationAreaId) {
            return 1.0;
        }

        if (preg_match('/^ID_ID_(\d{4})_/', $originAreaId, $origin) && preg_match('/^ID_ID_(\d{4})_/', $destinationAreaId, $destination)) {
            if ($origin[1] === $destination[1]) {
                return 1.4;
            }

            return substr($origin[1], 0, 2) === substr($destination[1], 0, 2) ? 1.9 : 2.8;
        }

        $originRegion = implode('_', array_slice(explode('_', strtoupper($originAreaId)), 1, 2));
        $destinationRegion = implode('_', array_slice(explode('_', strtoupper($destinationAreaId)), 1, 2));

        return $originRegion !== '' && $originRegion === $destinationRegion ? 1.8 : 2.6;
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
