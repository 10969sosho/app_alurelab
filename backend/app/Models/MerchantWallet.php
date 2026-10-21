<?php

namespace App\Models;

use App\Enums\WalletTxType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MerchantWallet extends Model
{
    use HasUuids;

    protected $guarded = ['id'];

    protected $casts = [
        'available_balance' => 'decimal:2',
        'escrow_held_balance' => 'decimal:2',
        'shipping_held_balance' => 'decimal:2',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class, 'wallet_id');
    }

    /**
     * Kredit pembayaran pesanan ke tiga neraca secara transparan:
     * - escrow merchant: items_subtotal - platform_fee_amount (tanpa ongkir)
     * - pool ongkir: shipping_cost (shipping_held_balance, tidak bisa dicairkan seller)
     * - fee platform: platform_fee_amount (dicatat tanpa mengubah saldo merchant)
     *
     * Jumlah ketiga baris ledger selalu sama dengan order.total_amount.
     */
    public static function creditOrderPayment(Order $order, string $idempotencyKey, string $context): void
    {
        if (WalletTransaction::where('idempotency_key', $idempotencyKey)->exists()) {
            return;
        }

        $wallet = static::firstOrCreate(
            ['store_id' => $order->tenant_id],
            ['available_balance' => 0, 'escrow_held_balance' => 0, 'shipping_held_balance' => 0]
        );

        $escrowAmount = round((float) $order->items_subtotal - (float) $order->platform_fee_amount, 2);
        $shippingAmount = round((float) $order->shipping_cost, 2);
        $feeAmount = round((float) $order->platform_fee_amount, 2);

        $escrowBefore = (float) $wallet->escrow_held_balance;
        $wallet->increment('escrow_held_balance', $escrowAmount);

        static::recordTransaction(
            $wallet,
            $order,
            WalletTxType::ORDER_ESCROW_CREDIT,
            $escrowAmount,
            $escrowBefore,
            $escrowBefore + $escrowAmount,
            "Dana barang escrow pesanan #{$order->order_number} ({$context})",
            $idempotencyKey,
        );

        if ($shippingAmount > 0) {
            $shippingBefore = (float) $wallet->shipping_held_balance;
            $wallet->increment('shipping_held_balance', $shippingAmount);

            static::recordTransaction(
                $wallet,
                $order,
                WalletTxType::SHIPPING_ESCROW_CREDIT,
                $shippingAmount,
                $shippingBefore,
                $shippingBefore + $shippingAmount,
                "Pool ongkir pesanan #{$order->order_number} — dana kurir, bukan saldo seller ({$context})",
                "{$idempotencyKey}:shipping",
            );
        }

        if ($feeAmount > 0) {
            $current = (float) $wallet->escrow_held_balance;

            static::recordTransaction(
                $wallet,
                $order,
                WalletTxType::PLATFORM_FEE_CREDIT,
                $feeAmount,
                $current,
                $current,
                "Biaya platform ALURELAB pesanan #{$order->order_number} ({$context})",
                "{$idempotencyKey}:fee",
            );
        }
    }

    /**
     * Pelepasan escrow barang saat pesanan terkirim (delivered):
     * pindahkan merchant_net_amount dari escrow_held_balance ke available_balance.
     * Idempoten via key "escrow_rel_{order_number}".
     */
    public static function releaseOrderEscrow(Order $order): void
    {
        $idempotencyKey = "escrow_rel_{$order->order_number}";

        if (WalletTransaction::where('idempotency_key', $idempotencyKey)->exists()) {
            return;
        }

        $amount = round((float) $order->merchant_net_amount, 2);
        if ($amount <= 0) {
            return;
        }

        $wallet = static::firstOrCreate(
            ['store_id' => $order->tenant_id],
            ['available_balance' => 0, 'escrow_held_balance' => 0, 'shipping_held_balance' => 0]
        );

        $escrowBefore = (float) $wallet->escrow_held_balance;
        $availableBefore = (float) $wallet->available_balance;

        // Jangan melebihi saldo escrow yang benar-benar ditahan.
        $amount = min($amount, $escrowBefore);
        if ($amount <= 0) {
            return;
        }

        $wallet->decrement('escrow_held_balance', $amount);
        $wallet->increment('available_balance', $amount);

        static::recordTransaction(
            $wallet,
            $order,
            WalletTxType::ESCROW_RELEASED,
            $amount,
            $availableBefore,
            $availableBefore + $amount,
            "Dana escrow pesanan #{$order->order_number} dilepas ke saldo tersedia",
            $idempotencyKey,
        );
    }

    private static function recordTransaction(
        MerchantWallet $wallet,
        Order $order,
        WalletTxType $type,
        float $amount,
        float $balanceBefore,
        float $balanceAfter,
        string $description,
        string $idempotencyKey,
    ): void {
        WalletTransaction::create([
            'tenant_id' => $order->tenant_id,
            'wallet_id' => $wallet->id,
            'order_id' => $order->id,
            'type' => $type,
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'description' => $description,
            'idempotency_key' => $idempotencyKey,
            'created_at' => now(),
        ]);
    }
}
