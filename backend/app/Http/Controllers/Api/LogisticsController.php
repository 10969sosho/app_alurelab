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

        $areas = $this->biteshipService->searchAreas($query);

        return response()->json([
            'success' => true,
            'data' => $areas,
        ]);
    }

    /**
     * Cek ongkir real-time multi-kurir.
     */
    public function checkRates(Request $request): JsonResponse
    {
        /** @var Store $store */
        $store = app('current_tenant');

        $destinationAreaId = $request->input('destination_area_id');
        $items = $request->input('items', []);

        if (! $destinationAreaId) {
            return response()->json(['error' => 'destination_area_id is required'], 400);
        }

        if (! $store->address_area_id) {
            return response()->json([
                'success' => false,
                'error' => 'STORE_ORIGIN_MISSING',
                'message' => 'Alamat asal toko belum dikonfigurasi.',
            ], 422);
        }

        $originAreaId = $store->address_area_id;

        $rates = $this->biteshipService->calculateRates($originAreaId, $destinationAreaId, $items);

        return response()->json([
            'success' => true,
            'origin_area_id' => $originAreaId,
            'rates' => $rates,
        ]);
    }
}
