<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\WalletTxType;
use App\Models\Customer;
use App\Models\MerchantWallet;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\WalletTransaction;
use App\Services\BiteshipService;
use App\Services\DokuService;
use App\Services\OrderPaymentSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DokuPaymentSplitTest extends TestCase
{
    use RefreshDatabase;

    private const WEBHOOK_TARGET = '/api/v1/webhooks/doku/notification';

    public function test_checkout_merchant_net_excludes_shipping_cost(): void
    {
        config([
            'services.qa_simulation.enabled' => true,
            'services.qa_simulation.store_slug' => 'qa-',
        ]);

        [$store, $product, $variant] = $this->createCatalog();
        $rate = $this->quoteShipping($store, $product, 2);

        $response = $this->withHeaders(['X-Store-Slug' => $store->slug])->postJson('/api/v1/checkout', [
            'customer_name' => 'Pembeli Split',
            'customer_phone' => '08123456789',
            'destination_area_id' => 'IDNP1',
            'address_detail' => 'Jl. Split No. 1',
            'courier_code' => $rate['courier_code'],
            'courier_service' => $rate['courier_service_code'],
            'shipping_cost' => $rate['price'],
            'payment_method' => 'ONLINE',
            'items' => [[
                'product_id' => $product->id,
                'variant_id' => $variant->id,
                'quantity' => 2,
            ]],
        ]);

        $response->assertStatus(201);

        $order = Order::where('tenant_id', $store->id)->firstOrFail();
        $shipping = (float) $rate['price'];

        $this->assertEqualsWithDelta(200000, (float) $order->items_subtotal, 0.01);
        $this->assertEqualsWithDelta($shipping, (float) $order->shipping_cost, 0.01);
        $this->assertEqualsWithDelta(3000, (float) $order->platform_fee_amount, 0.01);
        // merchant net = subtotal barang - fee platform (tanpa ongkir)
        $this->assertEqualsWithDelta(197000, (float) $order->merchant_net_amount, 0.01);
        $this->assertEqualsWithDelta(
            (float) $order->total_amount,
            (float) $order->merchant_net_amount + $shipping + (float) $order->platform_fee_amount,
            0.01,
        );

        // QA simulation langsung membayar: split kredit wajib sama
        $this->assertPaymentSplit($order, $shipping, 'qa_payment_'.$order->order_number);
    }

    public function test_doku_webhook_credits_escrow_shipping_pool_and_platform_fee(): void
    {
        [$order, $payment] = $this->createPendingOrder(100000, 10000);

        config([
            'doku.client_id' => 'BRN-0287-test',
            'doku.secret_key' => 'doku-secret-test',
            'services.qa_simulation.enabled' => false,
        ]);

        $body = json_encode([
            'order' => [
                'invoice_number' => $order->order_number,
                'status' => 'PAID',
                'amount' => 110000,
            ],
        ]);
        $requestId = (string) Str::uuid();
        $timestamp = now()->setTimezone('UTC')->format('Y-m-d\TH:i:s.v\Z');
        $signature = app(DokuService::class)->generateSignature($requestId, $timestamp, self::WEBHOOK_TARGET, $body);

        $this->call('POST', self::WEBHOOK_TARGET, [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_CLIENT_ID' => 'BRN-0287-test',
            'HTTP_REQUEST_ID' => $requestId,
            'HTTP_REQUEST_TIMESTAMP' => $timestamp,
            'HTTP_REQUEST_TARGET' => self::WEBHOOK_TARGET,
            'HTTP_SIGNATURE' => $signature,
        ], $body)->assertOk()->assertJson(['status' => 'success']);

        $this->assertSame(OrderStatus::PAID_ESCROW, $order->fresh()->status);
        $this->assertSame(PaymentStatus::PAID, $payment->fresh()->status);

        $this->assertPaymentSplit($order, 10000, 'doku_wh_'.$order->order_number);
    }

    public function test_mark_as_paid_splits_balance_and_is_idempotent(): void
    {
        [$order, $payment] = $this->createPendingOrder(250000, 25000);

        $service = app(OrderPaymentSyncService::class);
        $service->markAsPaid($order, $payment, ['channel' => ['id' => 'QRIS']]);

        $this->assertPaymentSplit($order, 25000, 'doku_sync_'.$order->order_number);

        // Pemanggilan ulang tidak boleh menggandakan saldo
        $service->markAsPaid($order->fresh(), $payment->fresh());

        $this->assertPaymentSplit($order, 25000, 'doku_sync_'.$order->order_number);
    }

    /**
     * Verifikasi: escrow = subtotal - fee, pool ongkir = shipping, fee tercatat, total ledger = total_amount.
     */
    private function assertPaymentSplit(Order $order, float $shipping, string $escrowKey): void
    {
        $order->refresh();
        $subtotal = (float) $order->items_subtotal;
        $fee = (float) $order->platform_fee_amount;

        $wallet = MerchantWallet::where('store_id', $order->tenant_id)->firstOrFail();

        $this->assertEqualsWithDelta($subtotal - $fee, (float) $wallet->escrow_held_balance, 0.01);
        $this->assertEqualsWithDelta($shipping, (float) $wallet->shipping_held_balance, 0.01);
        $this->assertEqualsWithDelta(0, (float) $wallet->available_balance, 0.01);

        $transactions = WalletTransaction::where('order_id', $order->id)->get();
        $byType = $transactions->keyBy(fn (WalletTransaction $tx): string => $tx->type->value);

        $this->assertArrayHasKey(WalletTxType::ORDER_ESCROW_CREDIT->value, $byType);
        $this->assertArrayHasKey(WalletTxType::SHIPPING_ESCROW_CREDIT->value, $byType);
        $this->assertArrayHasKey(WalletTxType::PLATFORM_FEE_CREDIT->value, $byType);

        $this->assertEqualsWithDelta($subtotal - $fee, (float) $byType[WalletTxType::ORDER_ESCROW_CREDIT->value]->amount, 0.01);
        $this->assertEqualsWithDelta($shipping, (float) $byType[WalletTxType::SHIPPING_ESCROW_CREDIT->value]->amount, 0.01);
        $this->assertEqualsWithDelta($fee, (float) $byType[WalletTxType::PLATFORM_FEE_CREDIT->value]->amount, 0.01);

        $this->assertSame($escrowKey, $byType[WalletTxType::ORDER_ESCROW_CREDIT->value]->idempotency_key);
        $this->assertEqualsWithDelta(
            (float) $order->total_amount,
            (float) $transactions->sum(fn (WalletTransaction $tx): float => (float) $tx->amount),
            0.01,
        );
    }

    /**
     * @return array{0: Store, 1: Product, 2: ProductVariant}
     */
    private function createCatalog(): array
    {
        $store = Store::create([
            'name' => 'Toko Split DOKU',
            'slug' => 'qa-split-'.Str::lower(Str::random(6)),
            'phone_number' => '0812'.random_int(10000000, 99999999),
            'address_area_id' => 'IDNP6',
        ]);

        $product = Product::create([
            'tenant_id' => $store->id,
            'title' => 'Produk Split',
            'slug' => 'produk-split-'.Str::lower(Str::random(6)),
            'description' => 'Produk untuk uji split pembayaran.',
            'category_name' => 'Umum',
            'price' => 100000,
            'weight_grams' => 500,
            'is_active' => true,
        ]);

        $variant = ProductVariant::create([
            'tenant_id' => $store->id,
            'product_id' => $product->id,
            'sku' => 'SPLIT-'.Str::upper(Str::random(4)),
            'title' => 'Default',
            'price' => 100000,
            'stock' => 20,
        ]);

        return [$store, $product, $variant];
    }

    /**
     * Ambil tarif ongkir dari service yang sama dipakai controller (estimasi offline).
     *
     * @return array<string, mixed>
     */
    private function quoteShipping(Store $store, Product $product, int $quantity): array
    {
        $rates = app(BiteshipService::class)->calculateRates(
            (string) $store->address_area_id,
            'IDNP1',
            [[
                'name' => $product->title,
                'value' => (int) $product->price,
                'quantity' => $quantity,
                'weight' => max(1, (int) $product->weight_grams),
            ]],
            $store,
        );

        $rate = collect($rates)->first();
        $this->assertNotNull($rate, 'Tarif pengiriman tidak tersedia.');

        return $rate;
    }

    /**
     * @return array{0: Order, 1: Payment}
     */
    private function createPendingOrder(int $subtotal, int $shipping): array
    {
        $store = Store::create([
            'name' => 'Toko Pending Split',
            'slug' => 'pending-split-'.Str::lower(Str::random(6)),
            'phone_number' => '0812'.random_int(10000000, 99999999),
        ]);

        $customer = Customer::create([
            'phone_number' => '628'.random_int(100000000, 999999999),
            'full_name' => 'Buyer Split',
            'default_address' => [],
        ]);

        $fee = round($subtotal * 0.015, 2);

        $order = Order::create([
            'tenant_id' => $store->id,
            'order_number' => 'ORD-'.date('Ymd').'-'.Str::upper(Str::random(6)),
            'customer_id' => $customer->id,
            'status' => OrderStatus::PENDING_PAYMENT,
            'items_subtotal' => $subtotal,
            'shipping_cost' => $shipping,
            'insurance_cost' => 0,
            'discount_amount' => 0,
            'total_amount' => $subtotal + $shipping,
            'platform_fee_percent' => 1.50,
            'platform_fee_amount' => $fee,
            'merchant_net_amount' => $subtotal - $fee,
            'shipping_recipient_name' => 'Buyer Split',
            'shipping_recipient_phone' => '6281234567890',
            'shipping_destination_area_id' => 'IDNP1',
            'shipping_address_detail' => 'Jl. Split No. 1',
        ]);

        $payment = Payment::create([
            'tenant_id' => $store->id,
            'order_id' => $order->id,
            'doku_invoice_id' => $order->order_number,
            'payment_method' => 'ONLINE',
            'amount' => $subtotal + $shipping,
            'status' => PaymentStatus::PENDING,
        ]);

        return [$order, $payment];
    }
}
