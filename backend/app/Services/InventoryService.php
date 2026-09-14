<?php

namespace App\Services;

use App\Models\ProductVariant;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    /**
     * Mengunci stok secara atomik di Redis untuk mencegah Flash Sale Race Condition / Overselling.
     */
    public function reserveStock(string $storeId, string $variantId, int $quantity): bool
    {
        $redisKey = "store:{$storeId}:stock:{$variantId}";

        // Pastikan key ada di Redis; jika belum, populate dari DB
        if (!Redis::exists($redisKey)) {
            $variant = ProductVariant::find($variantId);
            if (!$variant) {
                return false;
            }
            Redis::set($redisKey, $variant->stock);
        }

        // Atomic Decrement di Redis
        $remaining = Redis::decrby($redisKey, $quantity);

        if ($remaining < 0) {
            // Revert seketika karena stok fisik tidak mencukupi
            Redis::incrby($redisKey, $quantity);
            Log::warning("Stok habis saat checkout", [
                'store_id' => $storeId,
                'variant_id' => $variantId,
                'requested_qty' => $quantity,
            ]);
            return false;
        }

        return true;
    }

    /**
     * Mengembalikan stok jika transaksi dibatalkan atau invoice kadaluarsa (15 menit TTL).
     */
    public function releaseStock(string $storeId, string $variantId, int $quantity): void
    {
        $redisKey = "store:{$storeId}:stock:{$variantId}";
        Redis::incrby($redisKey, $quantity);

        // Sinkronisasi kembali ke DB
        ProductVariant::where('id', $variantId)->increment('stock', $quantity);

        Log::info("Stok berhasil dikembalikan (Release Unpaid Stock)", [
            'store_id' => $storeId,
            'variant_id' => $variantId,
            'released_qty' => $quantity,
        ]);
    }

    /**
     * Sinkronisasi nilai stok fisik dari Redis ke PostgreSQL secara persisten.
     */
    public function syncStockToDatabase(string $storeId, string $variantId): void
    {
        $redisKey = "store:{$storeId}:stock:{$variantId}";
        $currentRedisStock = (int) Redis::get($redisKey);

        ProductVariant::where('id', $variantId)->update([
            'stock' => max(0, $currentRedisStock),
        ]);
    }
}
