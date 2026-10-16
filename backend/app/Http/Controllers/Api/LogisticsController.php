<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Services\BiteshipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogisticsController extends Controller
{
    public function __construct(
        protected BiteshipService $biteshipService
    ) {}

    /**
     * Autocomplete pencarian kecamatan / kelurahan.
     */
    public function searchAreas(Request $request): JsonResponse
    {
        $query = $request->query('query', '');
        if (strlen($query) < 3) {
            return response()->json(['data' => []]);
        }

        try {
            $areas = $this->biteshipService->searchAreas($query);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'error' => 'LOGISTICS_PROVIDER_UNAVAILABLE',
                'message' => 'Pencarian alamat belum tersedia. Coba lagi.',
            ], 503);
        }

        return response()->json([
            'success' => true,
            'data' => $areas,
        ]);
    }

    /**
     * Cek ongkir real-time multi-kurir.
     * Bobot & value item diambil riil dari DB (bukan input client).
     */
    public function checkRates(Request $request): JsonResponse
    {
        /** @var Store $store */
        $store = app('current_tenant');

        $validated = $request->validate([
            'destination_area_id' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid',
            'items.*.variant_id' => 'nullable|uuid',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        if (! $store->address_area_id) {
            return response()->json([
                'success' => false,
                'error' => 'STORE_ORIGIN_MISSING',
                'message' => 'Alamat asal toko belum dikonfigurasi.',
            ], 422);
        }

        $rateItems = $this->biteshipService->buildRateItems($store, $validated['items']);

        if ($rateItems === []) {
            return response()->json([
                'success' => false,
                'error' => 'INVALID_ITEM',
                'message' => 'Produk tidak tersedia di toko ini.',
            ], 422);
        }

        try {
            $rates = $this->biteshipService->calculateRates(
                $store->address_area_id,
                $validated['destination_area_id'],
                $rateItems,
                $store,
            );
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'error' => 'SHIPPING_PROVIDER_UNAVAILABLE',
                'message' => 'Tarif pengiriman belum tersedia. Coba lagi.',
            ], 503);
        }

        return response()->json([
            'success' => true,
            'origin_area_id' => $store->address_area_id,
            'rates' => $rates,
        ]);
    }
}
