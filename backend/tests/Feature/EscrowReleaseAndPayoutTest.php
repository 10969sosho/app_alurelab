<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\ShipmentStatus;
use App\Enums\WalletTxType;
use App\Models\Customer;
use App\Models\MerchantWallet;
use App\Models\Order;
use App\Models\Payout;
use App\Models\Shipment;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class EscrowReleaseAndPayoutTest extends TestCase
{
    use RefreshDatabase;

    private const WEBHOOK_TARGET = '/api/v1/webhooks/biteship/tracking';

    // ─── Pelepasan Escrow (delivered) ────────────────────────────────────────

    public function test_delivered_webhook_releases_escrow_to_available_balance(): void
    {
        [$order, $wallet] = $this->createDeliveredReadyState(98500);

        $this->sendDeliveredWebhook($order->shipment->biteship_order_id)
            ->assertOk()
            ->assertJson(['status' => 'acknowledged']);

        $this->assertSame(OrderStatus::DELIVERED, $order->fresh()->status);

        $wallet->refresh();
        $this->assertEqualsWithDelta(0, (float) $wallet->escrow_held_balance, 0.01);
        $this->assertEqualsWithDelta(98500, (float) $wallet->available_balance, 0.01);

        $releaseTx = WalletTransaction::where('order_id', $order->id)
            ->where('type', WalletTxType::ESCROW_RELEASED)
            ->firstOrFail();

        $this->assertSame("escrow_rel_{$order->order_number}", $releaseTx->idempotency_key);
        $this->assertEqualsWithDelta(98500, (float) $releaseTx->amount, 0.01);
        $this->assertEqualsWithDelta(0, (float) $releaseTx->balance_before, 0.01);
        $this->assertEqualsWithDelta(98500, (float) $releaseTx->balance_after, 0.01);

        // Webhook ulang tidak boleh melepas dana dua kali.
        $this->sendDeliveredWebhook($order->shipment->biteship_order_id)
            ->assertOk()
            ->assertJson(['status' => 'already_processed']);

        $wallet->refresh();
        $this->assertEqualsWithDelta(98500, (float) $wallet->available_balance, 0.01);
        $this->assertSame(1, WalletTransaction::where('order_id', $order->id)
            ->where('type', WalletTxType::ESCROW_RELEASED)
            ->count());
    }

    public function test_release_order_escrow_is_idempotent_on_direct_call(): void
    {
        [$order, $wallet] = $this->createDeliveredReadyState(50000);

        MerchantWallet::releaseOrderEscrow($order);
        MerchantWallet::releaseOrderEscrow($order->fresh());

        $wallet->refresh();
        $this->assertEqualsWithDelta(0, (float) $wallet->escrow_held_balance, 0.01);
        $this->assertEqualsWithDelta(50000, (float) $wallet->available_balance, 0.01);
        $this->assertSame(1, WalletTransaction::where('order_id', $order->id)
            ->where('type', WalletTxType::ESCROW_RELEASED)
            ->count());
    }

    // ─── Penarikan Dana Seller (payout) ──────────────────────────────────────

    public function test_request_payout_debits_available_balance_and_records_withdrawal(): void
    {
        [$headers, $store, $wallet] = $this->createPayoutState(100000);

        $res = $this->withHeaders($headers)
            ->postJson('/api/v1/merchant/finance/withdraw', ['amount' => 75000]);

        $res->assertStatus(201)->assertJsonPath('success', true);

        $payout = Payout::where('tenant_id', $store->id)->firstOrFail();
        $this->assertSame('PENDING', $payout->status);
        $this->assertEqualsWithDelta(75000, (float) $payout->amount, 0.01);

        $wallet->refresh();
        $this->assertEqualsWithDelta(25000, (float) $wallet->available_balance, 0.01);
        $this->assertEqualsWithDelta(0, (float) $wallet->escrow_held_balance, 0.01);

        $withdrawalTx = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', WalletTxType::WITHDRAWAL)
            ->firstOrFail();

        $this->assertEqualsWithDelta(75000, (float) $withdrawalTx->amount, 0.01);
        $this->assertEqualsWithDelta(100000, (float) $withdrawalTx->balance_before, 0.01);
        $this->assertEqualsWithDelta(25000, (float) $withdrawalTx->balance_after, 0.01);
        $this->assertSame("payout_{$payout->id}", $withdrawalTx->idempotency_key);
    }

    public function test_request_payout_rejects_when_available_balance_insufficient(): void
    {
        [$headers, $store, $wallet] = $this->createPayoutState(60000);

        $this->withHeaders($headers)
            ->postJson('/api/v1/merchant/finance/withdraw', ['amount' => 75000])
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertEqualsWithDelta(60000, (float) $wallet->fresh()->available_balance, 0.01);
        $this->assertSame(0, Payout::where('tenant_id', $store->id)->count());
        $this->assertSame(0, WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', WalletTxType::WITHDRAWAL)
            ->count());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function sendDeliveredWebhook(string $biteshipOrderId)
    {
        config([
            'services.biteship.webhook_header' => 'X-Biteship-Signature',
            'services.biteship.webhook_secret' => 'biteship-webhook-secret',
        ]);

        return $this->call('POST', self::WEBHOOK_TARGET, [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_BITESHIP_SIGNATURE' => 'biteship-webhook-secret',
        ], json_encode([
            'order_id' => $biteshipOrderId,
            'status' => 'delivered',
        ]));
    }

    /**
     * Siapkan toko + wallet dengan dana tertahan escrow, order berstatus SHIPPED,
     * dan shipment siap menerima webhook tracking.
     *
     * @return array{0: Order, 1: MerchantWallet}
     */
    private function createDeliveredReadyState(float $merchantNet): array
    {
        $store = Store::create([
            'name' => 'Toko Escrow Release',
            'slug' => 'escrow-release-'.Str::lower(Str::random(6)),
            'phone_number' => '081'.random_int(10000000, 99999999),
        ]);

        $customer = Customer::create([
            'phone_number' => '628'.random_int(100000000, 999999999),
            'full_name' => 'Buyer Escrow',
            'default_address' => [],
        ]);

        $order = Order::create([
            'tenant_id' => $store->id,
            'order_number' => 'ORD-'.date('Ymd').'-'.Str::upper(Str::random(6)),
            'customer_id' => $customer->id,
            'status' => OrderStatus::SHIPPED,
            'items_subtotal' => 100000,
            'shipping_cost' => 10000,
            'insurance_cost' => 0,
            'discount_amount' => 0,
            'total_amount' => 110000,
            'platform_fee_percent' => 1.50,
            'platform_fee_amount' => 1500,
            'merchant_net_amount' => $merchantNet,
            'shipping_recipient_name' => 'Buyer Escrow',
            'shipping_recipient_phone' => '6281234567890',
            'shipping_destination_area_id' => 'IDNP1',
            'shipping_address_detail' => 'Jl. Escrow No. 1',
        ]);

        Shipment::create([
            'tenant_id' => $store->id,
            'order_id' => $order->id,
            'biteship_order_id' => 'bs-'.Str::lower(Str::random(10)),
            'courier_code' => 'sicepat',
            'courier_service' => 'reg',
            'waybill_id' => 'RESI-'.Str::upper(Str::random(10)),
            'tracking_status' => ShipmentStatus::IN_TRANSIT->value,
        ]);

        $wallet = MerchantWallet::create([
            'store_id' => $store->id,
            'available_balance' => 0,
            'escrow_held_balance' => $merchantNet,
            'shipping_held_balance' => 10000,
        ]);

        return [$order, $wallet];
    }

    /**
     * Siapkan toko milik user login (owner) + wallet + rekening bank untuk payout.
     *
     * @return array{0: array<string, string>, 1: Store, 2: MerchantWallet}
     */
    private function createPayoutState(float $availableBalance): array
    {
        $user = User::create([
            'name' => 'Seller Payout',
            'email' => 'seller.payout.'.Str::random(8).'@example.com',
            'phone_number' => '081'.rand(10000000, 99999999),
            'password_hash' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        $token = $user->createToken('dashboard', ['role:owner'])->plainTextToken;

        $store = Store::create([
            'name' => 'Toko Payout',
            'slug' => 'payout-store-'.Str::lower(Str::random(6)),
            'phone_number' => '081'.rand(10000000, 99999999),
            'settings' => [
                'bank_account' => [
                    'bank_code' => 'BCA',
                    'account_number' => '1234567890',
                    'account_holder' => 'Seller Payout',
                ],
            ],
        ]);

        StoreUser::create([
            'store_id' => $store->id,
            'user_id' => $user->id,
            'role' => 'owner',
        ]);

        $wallet = MerchantWallet::create([
            'store_id' => $store->id,
            'available_balance' => $availableBalance,
            'escrow_held_balance' => 0,
        ]);

        return [['Authorization' => 'Bearer '.$token, 'X-Store-Slug' => $store->slug], $store, $wallet];
    }
}
