<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\WalletTxType;
use App\Http\Controllers\Controller;
use App\Models\MerchantWallet;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Store;
use App\Models\Subscription;
use App\Models\WalletTransaction;
use App\Services\DokuService;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DokuWebhookController extends Controller
{
    public function __construct(
        protected DokuService $dokuService,
        protected InventoryService $inventoryService
    ) {}

    /**
     * Endpoint notifikasi resmi DOKU Checkout V1.
     */
    public function handleNotification(Request $request): JsonResponse
    {
        if (! $this->dokuService->verifyWebhookSignature($request)) {
            Log::warning('Percobaan Webhook DOKU Tidak Sah (Invalid Signature)', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['error' => 'Unauthorized signature'], 401);
        }

        $payload = $request->all();
        $invoiceNumber = $payload['order']['invoice_number'] ?? $payload['invoice_number'] ?? null;
        $status = strtoupper((string) ($payload['order']['status'] ?? $payload['status'] ?? ''));
        $amount = $payload['order']['amount'] ?? $payload['amount'] ?? null;

        if (! $invoiceNumber) {
            return response()->json(['error' => 'Missing invoice_number'], 400);
        }

        if (str_starts_with((string) $invoiceNumber, 'SUB-')) {
            return $this->handleSubscriptionNotification((string) $invoiceNumber, $status, $payload);
        }

        // Webhook eksternal butuh system bypass untuk mencari order lintas-tenant
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.is_system_bypass = 'on';");
        }

        $order = Order::where('order_number', $invoiceNumber)->first();
        if (! $order) {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("SET app.is_system_bypass = 'off';");
            }
            Log::warning("Webhook DOKU: Order {$invoiceNumber} tidak ditemukan");

            return response()->json(['status' => 'ignored']);
        }

        $payment = Payment::where('order_id', $order->id)->first();
        if (! $payment
            || ($payment->doku_invoice_id !== null && $payment->doku_invoice_id !== $invoiceNumber)
            || ($amount !== null && (int) $payment->amount !== (int) $amount)) {
            return response()->json(['error' => 'Invoice identity or amount mismatch'], 422);
        }

        // Bind tenant session untuk scope order & reset bypass
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.current_tenant_id = '{$order->tenant_id}';");
            DB::statement("SET app.is_system_bypass = 'off';");
        }

        // Idempotency: kredit escrow maksimal sekali per invoice
        $idempotencyKey = "doku_wh_{$invoiceNumber}";
        if (WalletTransaction::where('idempotency_key', $idempotencyKey)->exists()) {
            return response()->json(['status' => 'already_processed']);
        }

        if (in_array($status, ['PAID', 'SUCCESS'], true)) {
            if ($order->status === OrderStatus::PAID_ESCROW || $order->status === OrderStatus::PROCESSING) {
                return response()->json(['status' => 'already_processed']);
            }

            DB::transaction(function () use ($order, $payload, $status, $idempotencyKey) {
                // 1. Update status order
                $order->update([
                    'status' => OrderStatus::PAID_ESCROW,
                ]);
                $this->inventoryService->consumeReservations($order->id);

                // 2. Update record payment
                Payment::where('order_id', $order->id)->update([
                    'status' => PaymentStatus::PAID,
                    'paid_at' => now(),
                    'payment_channel' => $payload['payment']['channel']
                        ?? $payload['payment']['type']
                        ?? $payload['payment_channel']
                        ?? null,
                    'raw_webhook_payload' => $payload,
                ]);

                // 3. Kredit escrow dompet toko (ledger append-only)
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
                    'description' => "Dana escrow masuk untuk pesanan #{$order->order_number} (DOKU {$status})",
                    'idempotency_key' => $idempotencyKey,
                    'created_at' => now(),
                ]);

                Log::info("Pesanan #{$order->order_number} berhasil dibayar via DOKU", [
                    'amount' => $creditAmount,
                    'tenant_id' => $order->tenant_id,
                ]);
            });
        } elseif (in_array($status, ['EXPIRED', 'FAILED', 'CANCELLED'], true)) {
            // Batalkan order & lepas reservasi stok bila pembayaran kadaluarsa/gagal
            if ($order->status === OrderStatus::PENDING_PAYMENT) {
                $order->update(['status' => OrderStatus::CANCELLED]);
                Payment::where('order_id', $order->id)->update(['status' => PaymentStatus::EXPIRED]);
                $this->inventoryService->releaseReservations($order->id);
            }
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Notifikasi pembayaran langganan (invoice_number berawalan "SUB-").
     * Menaikkan plan_tier toko setelah pembayaran sukses.
     */
    private function handleSubscriptionNotification(string $invoiceNumber, string $status, array $payload): JsonResponse
    {
        $subscription = Subscription::where('invoice_number', $invoiceNumber)->first();
        if (! $subscription) {
            Log::warning("Webhook DOKU: Subscription {$invoiceNumber} tidak ditemukan");

            return response()->json(['status' => 'ignored']);
        }

        if ($subscription->status === 'paid') {
            return response()->json(['status' => 'already_processed']);
        }

        $amount = $payload['order']['amount'] ?? $payload['amount'] ?? null;
        if ($amount !== null && (int) $amount !== (int) $subscription->amount) {
            return response()->json(['error' => 'Invoice amount mismatch'], 422);
        }

        if (in_array($status, ['PAID', 'SUCCESS'], true)) {
            DB::transaction(function () use ($subscription, $payload) {
                $subscription->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'expires_at' => now()->addDays(30),
                    'payment_method' => $payload['payment']['channel']
                        ?? $payload['payment']['type']
                        ?? $payload['payment_method']
                        ?? null,
                ]);

                Store::whereKey($subscription->store_id)->update([
                    'plan_tier' => $subscription->plan_tier,
                    'plan_expires_at' => $subscription->expires_at,
                ]);
            });

            Log::info("Langganan #{$invoiceNumber} dibayar via DOKU", [
                'store_id' => $subscription->store_id,
                'plan_tier' => $subscription->plan_tier,
            ]);
        } elseif (in_array($status, ['EXPIRED', 'FAILED', 'CANCELLED'], true)) {
            $subscription->update([
                'status' => $status === 'FAILED' ? 'failed' : 'expired',
            ]);
        }

        return response()->json(['status' => 'success']);
    }
}
