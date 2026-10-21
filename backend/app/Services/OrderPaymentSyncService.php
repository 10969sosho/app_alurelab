<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\MerchantWallet;
use App\Models\Order;
use App\Models\Payment;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderPaymentSyncService
{
    public function __construct(
        protected DokuService $dokuService,
        protected InventoryService $inventoryService
    ) {}

    /**
     * Sinkronkan status pembayaran pesanan secara on-demand.
     */
    public function syncOrderPayment(Order $order): Order
    {
        // Jika sudah lunas atau dibatalkan, tidak perlu sync lagi
        if (in_array($order->status, [OrderStatus::PAID_ESCROW, OrderStatus::PROCESSING, OrderStatus::SHIPPED, OrderStatus::DELIVERED, OrderStatus::COMPLETED, OrderStatus::CANCELLED], true)) {
            return $order;
        }

        $payment = Payment::where('order_id', $order->id)->first();
        if (! $payment || $payment->status === PaymentStatus::PAID) {
            return $order;
        }

        $invoiceNumber = $payment->doku_invoice_id ?: $order->order_number;
        $dokuStatus = $this->dokuService->checkOrderStatus($invoiceNumber);

        if (! empty($dokuStatus['paid'])) {
            $this->markAsPaid($order, $payment, $dokuStatus['payload'] ?? []);
            $order->refresh();
        }

        return $order;
    }

    /**
     * Tandai order sebagai terbayar (PAID_ESCROW) dan kredit dompet penjual secara aman.
     */
    public function markAsPaid(Order $order, Payment $payment, array $payload = []): void
    {
        $idempotencyKey = "doku_sync_{$order->order_number}";

        DB::transaction(function () use ($order, $payment, $payload, $idempotencyKey) {
            // Cek idempotency agar saldo escrow tidak bertambah ganda
            if (WalletTransaction::where('idempotency_key', $idempotencyKey)->exists()) {
                return;
            }

            // 1. Update status order
            $order->update([
                'status' => OrderStatus::PAID_ESCROW,
            ]);
            $this->inventoryService->consumeReservations($order->id);

            // 2. Update record payment
            $payment->update([
                'status' => PaymentStatus::PAID,
                'paid_at' => now(),
                'payment_channel' => $payload['channel']['id']
                    ?? $payload['service']['id']
                    ?? $payment->payment_channel,
                'raw_webhook_payload' => $payload ?: $payment->raw_webhook_payload,
            ]);

            // 3. Split kredit: escrow merchant (barang - fee), pool ongkir, fee platform
            MerchantWallet::creditOrderPayment($order, $idempotencyKey, 'Auto-sync DOKU');

            Log::info("Pesanan #{$order->order_number} berhasil disinkronkan ke status PAID_ESCROW via DOKU check-status", [
                'merchant_escrow' => round((float) $order->items_subtotal - (float) $order->platform_fee_amount, 2),
                'shipping_pool' => (float) $order->shipping_cost,
                'platform_fee' => (float) $order->platform_fee_amount,
                'tenant_id' => $order->tenant_id,
            ]);
        });
    }
}
