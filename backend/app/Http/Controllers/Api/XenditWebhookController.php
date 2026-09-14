<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\WalletTxType;
use App\Http\Controllers\Controller;
use App\Models\MerchantWallet;
use App\Models\Order;
use App\Models\Payment;
use App\Models\WalletTransaction;
use App\Services\InventoryService;
use App\Services\XenditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class XenditWebhookController extends Controller
{
    public function __construct(
        protected XenditService $xenditService,
        protected InventoryService $inventoryService
    ) {}

    /**
     * Endpoint Webhook Resmi Xendit Invoice Callback.
     */
    public function handleInvoice(Request $request): JsonResponse
    {
        $callbackToken = $request->header('x-callback-token');

        if (!$this->xenditService->verifyWebhookSignature($callbackToken)) {
            Log::warning('Percobaan Webhook Xendit Tidak Sah (Invalid Token)', [
                'ip' => $request->ip(),
                'token' => $callbackToken,
            ]);
            return response()->json(['error' => 'Unauthorized token'], 401);
        }

        $payload = $request->all();
        $externalId = $payload['external_id'] ?? null;
        $status = $payload['status'] ?? null; // PAID, EXPIRED
        $invoiceId = $payload['id'] ?? null;

        if (!$externalId) {
            return response()->json(['error' => 'Missing external_id'], 400);
        }

        // External webhook needs system bypass to locate order by global external_id
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.is_system_bypass = 'on';");
        }

        $order = Order::where('order_number', $externalId)->first();
        if (!$order) {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("SET app.is_system_bypass = 'off';");
            }
            Log::warning("Webhook Xendit: Order {$externalId} tidak ditemukan");
            return response()->json(['error' => 'Order not found'], 404);
        }

        // Bind tenant session for order scope & reset bypass
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.current_tenant_id = '{$order->tenant_id}';");
            DB::statement("SET app.is_system_bypass = 'off';");
        }

        // Idempotency: Jika order sudah PAID, return success seketika
        if ($status === 'PAID') {
            if ($order->status === OrderStatus::PAID_ESCROW || $order->status === OrderStatus::PROCESSING) {
                return response()->json(['status' => 'already_processed']);
            }

            DB::transaction(function () use ($order, $payload, $invoiceId) {
                // 1. Update Order Status
                $order->update([
                    'status' => OrderStatus::PAID_ESCROW,
                ]);

                // 2. Update Payment Record
                Payment::where('order_id', $order->id)->update([
                    'status' => PaymentStatus::PAID,
                    'paid_at' => now(),
                    'payment_channel' => $payload['payment_channel'] ?? null,
                    'raw_webhook_payload' => $payload,
                ]);

                // 3. Masukkan Dana ke Escrow Dompet Toko (Virtual Ledger Append-Only)
                $wallet = MerchantWallet::firstOrCreate(
                    ['store_id' => $order->tenant_id],
                    ['available_balance' => 0, 'escrow_held_balance' => 0]
                );

                $balanceBefore = $wallet->escrow_held_balance;
                $creditAmount = $order->merchant_net_amount;
                $balanceAfter = $balanceBefore + $creditAmount;

                $wallet->increment('escrow_held_balance', $creditAmount);

                WalletTransaction::create([
                    'tenant_id' => $order->tenant_id,
                    'wallet_id' => $wallet->id,
                    'order_id' => $order->id,
                    'type' => WalletTxType::ORDER_ESCROW_CREDIT,
                    'amount' => $creditAmount,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'description' => "Dana escrow masuk untuk pesanan #{$order->order_number}",
                    'idempotency_key' => "xendit_wh_{$invoiceId}",
                    'created_at' => now(),
                ]);

                Log::info("Pesanan #{$order->order_number} berhasil dibayar via Xendit", [
                    'amount' => $creditAmount,
                    'tenant_id' => $order->tenant_id
                ]);
            });
        } elseif ($status === 'EXPIRED') {
            // Revert stok kembali jika pembayaran kadaluarsa
            if ($order->status === OrderStatus::PENDING_PAYMENT) {
                $order->update(['status' => OrderStatus::CANCELLED]);

                foreach ($order->items as $item) {
                    $variantId = $item->variant_id ?? $item->product_id;
                    $this->inventoryService->releaseStock($order->tenant_id, $variantId, $item->quantity);
                }
            }
        }

        return response()->json(['status' => 'success']);
    }
}
