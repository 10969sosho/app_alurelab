<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Store;
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

    /**
     * Mencari standardisasi area kelurahan/kecamatan Biteship.
     */
    public function searchAreas(string $query): array
    {
        if (str_starts_with($this->apiKey, 'biteship_test_dummy') || empty($this->apiKey)) {
            return [
                [
                    'id' => 'ID_ID_3578_357807',
                    'name' => 'Sukolilo, Surabaya, Jawa Timur',
                    'postal_code' => 60111,
                ],
                [
                    'id' => 'ID_ID_3171_317101',
                    'name' => 'Kemang, Mampang Prapatan, Jakarta Selatan',
                    'postal_code' => 12730,
                ],
            ];
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
        if (str_starts_with($this->apiKey, 'biteship_test_dummy') || empty($this->apiKey)) {
            return [
                [
                    'courier_name' => 'J&T Express',
                    'courier_code' => 'jnt',
                    'courier_service_name' => 'EZ (Reguler)',
                    'courier_service_code' => 'ez',
                    'duration' => '1 - 2 Hari',
                    'price' => 18000,
                ],
                [
                    'courier_name' => 'SiCepat Ekspres',
                    'courier_code' => 'sicepat',
                    'courier_service_name' => 'REG',
                    'courier_service_code' => 'reg',
                    'duration' => '1 - 2 Hari',
                    'price' => 17000,
                ],
                [
                    'courier_name' => 'JNE',
                    'courier_code' => 'jne',
                    'courier_service_name' => 'REG',
                    'courier_service_code' => 'reg',
                    'duration' => '2 - 3 Hari',
                    'price' => 19000,
                ],
            ];
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

        return $response->json('pricing') ?? [];
    }

    /**
     * Booking pesanan ekspedisi & generate AWB resi otomatis + thermal PDF label.
     */
    public function createShippingOrder(Order $order, Store $store, string $courierCode, string $courierService, bool $isCod = false): array
    {
        if (str_starts_with($this->apiKey, 'biteship_test_dummy') || empty($this->apiKey)) {
            $mockAwb = 'AWB' . strtoupper($courierCode) . rand(10000000, 99999999);
            return [
                'id' => 'biteship_ord_' . bin2hex(random_bytes(6)),
                'waybill_id' => $mockAwb,
                'courier' => [
                    'company' => $courierCode,
                    'type' => $courierService,
                ],
                'status' => 'allocated',
                'label_url' => "https://api.biteship.com/v1/labels/{$mockAwb}.pdf",
                'tracking_url' => "https://track.biteship.com/{$mockAwb}",
            ];
        }

        $items = $order->items->map(function ($item) {
            return [
                'name' => $item->product_title . ($item->variant_title ? " ({$item->variant_title})" : ''),
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
            throw new \Exception('Gagal booking kurir Biteship: ' . $response->body());
        }

        return $response->json();
    }
}
