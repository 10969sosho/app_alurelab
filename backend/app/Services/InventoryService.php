<?php

namespace App\Services;

use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProductVariant;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    /**
     * Reserve stock using the database as the single source of truth.
     */
    public function reserveStock(string $storeId, string $variantId, int $quantity): bool
    {
        $updated = ProductVariant::where('id', $variantId)
            ->where('tenant_id', $storeId)
            ->where('stock', '>=', $quantity)
            ->decrement('stock', $quantity);

        if (! $updated) {
            Log::warning('Stok habis saat checkout', [
                'store_id' => $storeId,
                'variant_id' => $variantId,
                'requested_qty' => $quantity,
            ]);

            return false;
        }

        return true;
    }

    /**
     * Mengembalikan stok jika transaksi dibatalkan atau invoice kadaluarsa.
     */
    public function releaseStock(string $storeId, string $variantId, int $quantity): void
    {
        ProductVariant::where('id', $variantId)
            ->where('tenant_id', $storeId)
            ->increment('stock', $quantity);

        Log::info('Stok berhasil dikembalikan (Release Unpaid Stock)', [
            'store_id' => $storeId,
            'variant_id' => $variantId,
            'released_qty' => $quantity,
        ]);
    }

    /**
     * Persist the stock hold after the order has been created.
     */
    public function createReservations(
        string $storeId,
        string $orderId,
        array $lockedItems,
        CarbonInterface $expiresAt,
        bool $consumed = false,
    ): void {
        foreach ($lockedItems as $locked) {
            InventoryReservation::create([
                'tenant_id' => $storeId,
                'order_id' => $orderId,
                'variant_id' => $locked['variant_id'],
                'quantity' => $locked['qty'],
                'status' => $consumed ? 'consumed' : 'held',
                'expires_at' => $expiresAt,
                'consumed_at' => $consumed ? now() : null,
            ]);
        }
    }

    public function consumeReservations(string $orderId): void
    {
        InventoryReservation::where('order_id', $orderId)
            ->where('status', 'held')
            ->update([
                'status' => 'consumed',
                'consumed_at' => now(),
            ]);
    }

    public function releaseReservations(string $orderId): int
    {
        return DB::transaction(function () use ($orderId): int {
            $reservations = InventoryReservation::where('order_id', $orderId)
                ->where('status', 'held')
                ->lockForUpdate()
                ->get();

            foreach ($reservations as $reservation) {
                $this->releaseReservation($reservation);
            }

            return $reservations->count();
        });
    }

    public function releaseExpiredReservations(): int
    {
        return DB::transaction(function (): int {
            $reservations = InventoryReservation::where('status', 'held')
                ->where('expires_at', '<=', now())
                ->lockForUpdate()
                ->get();

            foreach ($reservations as $reservation) {
                $this->releaseReservation($reservation);
                Order::whereKey($reservation->order_id)
                    ->where('status', 'pending_payment')
                    ->update(['status' => 'cancelled']);
                Payment::where('order_id', $reservation->order_id)
                    ->where('status', 'PENDING')
                    ->update(['status' => 'EXPIRED']);
            }

            return $reservations->count();
        });
    }

    private function releaseReservation(InventoryReservation $reservation): void
    {
        ProductVariant::where('id', $reservation->variant_id)
            ->where('tenant_id', $reservation->tenant_id)
            ->increment('stock', $reservation->quantity);

        $reservation->update([
            'status' => 'released',
            'released_at' => now(),
        ]);

        Log::info('Inventory reservation released', [
            'reservation_id' => $reservation->id,
            'order_id' => $reservation->order_id,
            'variant_id' => $reservation->variant_id,
            'quantity' => $reservation->quantity,
        ]);
    }
}
