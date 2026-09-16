<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shipment;
use App\Services\BiteshipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    // State Machine transitions yang valid
    private const VALID_TRANSITIONS = [
        'pending_payment' => ['cancelled'],
        'paid_escrow' => ['processing', 'cancelled'],
        'cod_verified' => ['processing', 'cancelled'],
        'processing' => ['shipped'],
        'shipped' => ['delivered'],
        'delivered' => ['completed'],
        'completed' => [],
        'cancelled' => [],
        'rts_returned' => [],
    ];

    /**
     * GET /merchant/orders
     */
    public function index(Request $request): JsonResponse
    {
        $store = $request->attributes->get('current_store');

        $query = Order::where('tenant_id', $store->id)
            ->with(['customer', 'items.product', 'payment', 'shipment'])
            ->orderBy('created_at', 'desc');

        // Filter status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        // Filter kurir
        if ($request->filled('courier')) {
            $query->whereHas('shipment', fn ($q) => $q->where('courier_code', $request->courier));
        }
        // Filter tanggal
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'ilike', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('full_name', 'ilike', "%{$search}%")
                        ->orWhere('phone_number', 'ilike', "%{$search}%"));
            });
        }

        $orders = $query->paginate($request->input('per_page', 20));

        return response()->json($orders);
    }

    /**
     * GET /merchant/orders/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $store = $request->attributes->get('current_store');

        $order = Order::where('tenant_id', $store->id)
            ->with(['customer', 'items.product', 'items.variant', 'payment', 'shipment'])
            ->findOrFail($id);

        return response()->json($order);
    }

    /**
     * PATCH /merchant/orders/{id}/status
     * Update status pesanan (state machine).
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $store = $request->attributes->get('current_store');
        $order = Order::where('tenant_id', $store->id)->findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $newStatus = $validated['status'];
        $currentStatus = $order->status instanceof OrderStatus
            ? $order->status->value
            : (string) $order->status;
        $allowedNext = self::VALID_TRANSITIONS[$currentStatus] ?? [];

        if (! in_array($newStatus, $allowedNext)) {
            return response()->json([
                'message' => "Tidak bisa mengubah status dari [{$currentStatus}] ke [{$newStatus}].",
                'allowed' => $allowedNext,
            ], 422);
        }

        $order->update(['status' => $newStatus]);

        return response()->json([
            'message' => 'Status pesanan berhasil diperbarui.',
            'order_id' => $order->id,
            'old_status' => $currentStatus,
            'new_status' => $newStatus,
        ]);
    }

    /**
     * POST /merchant/orders/{id}/shipment
     * Buat pengiriman via Biteship.
     */
    public function createShipment(Request $request, string $id): JsonResponse
    {
        $store = $request->attributes->get('current_store');
        $order = Order::where('tenant_id', $store->id)
            ->with(['items.product', 'customer'])
            ->findOrFail($id);

        $orderStatusValue = $order->status instanceof OrderStatus
            ? $order->status->value
            : (string) $order->status;

        if ($orderStatusValue !== 'processing') {
            return response()->json([
                'message' => 'Pengiriman hanya bisa dibuat saat pesanan berstatus [processing].',
            ], 422);
        }

        $validated = $request->validate([
            'courier_code' => 'required|string',
            'courier_service' => 'required|string',
        ]);

        if ($order->shipment) {
            return response()->json(['message' => 'Pengiriman untuk pesanan ini sudah dibuat.'], 409);
        }

        $biteshipService = app(BiteshipService::class);
        $isCod = $order->payment?->payment_method === 'COD';

        try {
            $biteshipData = $biteshipService->createShippingOrder(
                $order,
                $store,
                $validated['courier_code'],
                $validated['courier_service'],
                $isCod
            );
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Booking pengiriman gagal. Coba lagi.'], 503);
        }

        $waybillId = $biteshipData['waybill_id'] ?? ($biteshipData['courier']['waybill_id'] ?? null);
        if (empty($biteshipData['id']) || empty($waybillId)) {
            return response()->json(['message' => 'Provider tidak mengembalikan detail pengiriman yang valid.'], 502);
        }

        $shipment = Shipment::create([
            'tenant_id' => $store->id,
            'order_id' => $order->id,
            'biteship_order_id' => $biteshipData['id'],
            'courier_code' => $validated['courier_code'],
            'courier_service' => $validated['courier_service'],
            'waybill_id' => $waybillId,
            'tracking_status' => $biteshipData['status'] ?? 'allocated',
            'shipping_label_url' => $biteshipData['label_url'] ?? ($biteshipData['courier']['link'] ?? null),
            'is_cod' => $isCod,
            'cod_amount' => $isCod ? $order->total_amount : 0,
        ]);

        // Update order status ke shipped
        $order->update(['status' => 'shipped']);

        return response()->json([
            'message' => 'Pengiriman berhasil dibuat.',
            'shipment' => $shipment,
            'waybill' => $shipment->waybill_id,
            'label_url' => $shipment->shipping_label_url,
        ], 201);
    }

    /**
     * GET /merchant/orders/{id}/label
     * Download thermal label PDF dari Biteship.
     */
    public function printLabel(Request $request, string $id): JsonResponse
    {
        $store = $request->attributes->get('current_store');
        $order = Order::where('tenant_id', $store->id)->findOrFail($id);
        $shipment = $order->shipment;

        if (! $shipment || ! $shipment->shipping_label_url) {
            return response()->json(['message' => 'Label belum tersedia. Buat pengiriman terlebih dahulu.'], 404);
        }

        return response()->json([
            'label_url' => $shipment->shipping_label_url,
            'waybill_id' => $shipment->waybill_id,
            'courier' => $shipment->courier_code,
        ]);
    }

    /**
     * GET /merchant/orders/stats
     * Statistik pesanan untuk dashboard overview.
     */
    public function stats(Request $request): JsonResponse
    {
        $store = $request->attributes->get('current_store');

        $counts = Order::where('tenant_id', $store->id)
            ->selectRaw("
                COUNT(*) FILTER (WHERE status = 'paid_escrow') as paid_escrow,
                COUNT(*) FILTER (WHERE status = 'processing') as processing,
                COUNT(*) FILTER (WHERE status = 'shipped') as shipped,
                COUNT(*) FILTER (WHERE status = 'pending_payment') as pending_payment
            ")
            ->first();

        return response()->json($counts);
    }
}
