<?php

namespace App\Services;

use App\Models\ProductVariant;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    /**
     * Mengunci stok secara atomik. Jika Redis tersedia, gunakan Redis concurrency decrement.
     * Jika Redis tidak aktif (e.g. shared hosting), fallback ke atomic database condition (UPDATE ... WHERE stock >= qty).
     */
    public function reserveStock(string $storeId, string $variantId, int $quantity): bool
    {
        // 1. Coba via Redis jika module & service aktif
        try {
            if (extension_loaded('redis') && config('database.redis.default.host')) {
                $redisKey = "store:{$storeId}:stock:{$variantId}";

                if (!Redis::exists($redisKey)) {
                    $variant = ProductVariant::find($variantId);
                    if (!$variant) {
                        return false;
                    }
                    Redis::set($redisKey, $variant->stock);
                }

                $remaining = Redis::decrby($redisKey, $quantity);

                if ($remaining < 0) {
                    Redis::incrby($redisKey, $quantity);
                    Log::warning("Stok habis saat checkout (Redis)", [
                        'store_id' => $storeId,
                        'variant_id' => $variantId,
                        'requested_qty' => $quantity,
                    ]);
                    return false;
                }

                return true;
            }
        } catch (\Throwable $e) {
            Log::info("Redis tidak tersedia, fallback ke PostgreSQL atomic decrement: " . $e->getMessage());
        }

        // 2. Fallback: PostgreSQL atomic condition UPDATE product_variants SET stock = stock - qty WHERE id = ? AND stock >= qty
        $updated = ProductVariant::where('id', $variantId)
            ->where('stock', '>=', $quantity)
            ->decrement('stock', $quantity);

        if (!$updated) {
            Log::warning("Stok habis saat checkout (PostgreSQL Atomic)", [
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
        try {
            if (extension_loaded('redis') && config('database.redis.default.host')) {
                $redisKey = "store:{$storeId}:stock:{$variantId}";
                Redis::incrby($redisKey, $quantity);
            }
        } catch (\Throwable $e) {
            // Abaikan error Redis jika offline
        }

        // Kembalikan ke DB
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
        try {
            if (extension_loaded('redis') && config('database.redis.default.host')) {
                $redisKey = "store:{$storeId}:stock:{$variantId}";
                if (Redis::exists($redisKey)) {
                    $currentRedisStock = (int) Redis::get($redisKey);
                    ProductVariant::where('id', $variantId)->update([
                        'stock' => max(0, $currentRedisStock),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            // Abaikan jika Redis offline
        }
    }
}
