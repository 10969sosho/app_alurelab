<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\ShipmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Services\AntiRtsService;
use App\Services\BiteshipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BiteshipWebhookController extends Controller
{
    public function __construct(
        protected AntiRtsService $antiRtsService,
        protected BiteshipService $biteshipService,
    ) {}

    /**
     * Webhook Pelacakan Logistik Biteship (Auto Tracking Update).
     */
    public function handleTracking(Request $request): JsonResponse
    {
        if (! $this->biteshipService->verifyWebhookSignature($request)) {
            Log::warning('Percobaan Webhook Biteship Tidak Sah (Invalid Signature)', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['error' => 'Unauthorized webhook'], 401);
        }

        $payload = $request->all();
        $orderId = $payload['order_id'] ?? null;
        $status = $payload['status'] ?? null; // allocated, picking_up, in_transit, delivered, return_to_shipper
        $waybillId = $payload['courier_waybill_id'] ?? null;

        if (! in_array($status, ['allocated', 'picking_up', 'in_transit', 'delivered', 'return_to_shipper', 'rejected'], true)) {
            return response()->json(['error' => 'Unsupported shipment status'], 422);
        }

        Log::info('Biteship Tracking Webhook Event Received', [
            'order_id' => $orderId,
            'status' => $status,
            'waybill_id' => $waybillId,
        ]);

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.is_system_bypass = 'on';");
        }

        $shipment = Shipment::where('biteship_order_id', $orderId)
            ->orWhere('waybill_id', $waybillId)
            ->first();

        if (! $shipment) {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("SET app.is_system_bypass = 'off';");
            }

            return response()->json(['message' => 'Shipment ignored or not found'], 200);
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.current_tenant_id = '{$shipment->tenant_id}';");
            DB::statement("SET app.is_system_bypass = 'off';");
        }

        $targetStatus = match ($status) {
            'allocated' => ShipmentStatus::ALLOCATED->value,
            'picking_up' => ShipmentStatus::PICKING_UP->value,
            'in_transit' => ShipmentStatus::IN_TRANSIT->value,
            'delivered' => ShipmentStatus::DELIVERED->value,
            'return_to_shipper', 'rejected' => ShipmentStatus::RETURN_TO_SHIPPER->value,
        };

        if ($shipment->tracking_status === $targetStatus) {
            return response()->json(['status' => 'already_processed']);
        }

        $order = $shipment->order;

        switch ($status) {
            case 'allocated':
            case 'picking_up':
                $shipment->update(['tracking_status' => $targetStatus]);
                break;
            case 'in_transit':
                $shipment->update(['tracking_status' => ShipmentStatus::IN_TRANSIT->value]);
                $order->update(['status' => OrderStatus::SHIPPED]);
                break;

            case 'delivered':
                $shipment->update([
                    'tracking_status' => ShipmentStatus::DELIVERED->value,
                    'delivered_at' => now(),
                ]);
                $order->update(['status' => OrderStatus::DELIVERED]);
                $this->antiRtsService->recordOrderOutcome($order->customer, true);
                break;

            case 'return_to_shipper':
            case 'rejected':
                $shipment->update(['tracking_status' => ShipmentStatus::RETURN_TO_SHIPPER->value]);
                $order->update(['status' => OrderStatus::RTS_RETURNED]);
                $this->antiRtsService->recordOrderOutcome($order->customer, false);
                break;
        }

        return response()->json(['status' => 'acknowledged']);
    }
}
