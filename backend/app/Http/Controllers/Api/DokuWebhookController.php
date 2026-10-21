<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
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
    public function handleNotification(Request $request): mixed
    {
        // Jika browser redirect (GET) dari tombol 'Back to Merchant' DOKU simulator/checkout
        if ($request->isMethod('GET')) {
            $invoiceNumber = $request->query('invoice_number') ?? $request->query('order_id');
            $frontendUrl = rtrim((string) config('doku.buyer_redirect_url', config('doku.frontend_url', 'https://app.alurelab.com')), '/');

            if ($invoiceNumber) {
                if (DB::getDriverName() === 'pgsql') {
                    DB::statement("SET app.is_system_bypass = 'on';");
                }
                $order = Order::where('order_number', $invoiceNumber)->first();
                if ($order && $order->store) {
                    return redirect()->to("{$frontendUrl}/{$order->store->slug}/orders/{$order->order_number}");
                }
            }

            return redirect()->to("{$frontendUrl}");
        }

        if (! $this->dokuService->verifyWebhookSignature($request)) {
            Log::warning('Percobaan Webhook DOKU Tidak Sah (Invalid Signature)', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['error' => 'Unauthorized signature'], 401);
        }

        $payload = $request->all();
        $invoiceNumber = $payload['order']['invoice_number'] ?? $payload['invoice_number'] ?? null;
        // Checkout V1 memakai order.status; notifikasi Direct VA memakai transaction.status.
        $status = strtoupper((string) ($payload['order']['status'] ?? $payload['status'] ?? $payload['transaction']['status'] ?? ''));
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

            DB::transaction(function () use ($order, $payment, $payload, $status, $idempotencyKey) {
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
                        // Notifikasi Direct VA tidak memuat objek payment, channel ada di channel.id
                        ?? $payload['channel']['id']
                        ?? $payment->payment_channel,
                    'raw_webhook_payload' => $payload,
                ]);

                // 3. Split kredit: escrow merchant (barang - fee), pool ongkir, fee platform
                MerchantWallet::creditOrderPayment($order, $idempotencyKey, "DOKU {$status}");

                Log::info("Pesanan #{$order->order_number} berhasil dibayar via DOKU", [
                    'merchant_escrow' => round((float) $order->items_subtotal - (float) $order->platform_fee_amount, 2),
                    'shipping_pool' => (float) $order->shipping_cost,
                    'platform_fee' => (float) $order->platform_fee_amount,
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
