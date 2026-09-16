<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Services\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class InventoryReservationTest extends TestCase
{
    public function test_expired_reservation_releases_stock_once(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.is_system_bypass = 'on';");
        }

        try {
            $store = Store::create([
                'name' => 'Reservation Test Store',
                'slug' => 'reservation-'.Str::lower(Str::random(8)),
                'phone_number' => '081'.random_int(10000000, 99999999),
            ]);
            $product = Product::create([
                'tenant_id' => $store->id,
                'title' => 'Reservation Product',
                'slug' => 'reservation-'.Str::lower(Str::random(8)),
                'price' => 10000,
            ]);
            $variant = ProductVariant::create([
                'tenant_id' => $store->id,
                'product_id' => $product->id,
                'title' => 'Default',
                'price' => 10000,
                'stock' => 5,
            ]);
            $customer = Customer::create([
                'phone_number' => '082'.random_int(10000000, 99999999),
                'full_name' => 'Reservation Buyer',
            ]);
            $order = Order::create([
                'tenant_id' => $store->id,
                'order_number' => 'ORD-'.Str::upper(Str::random(12)),
                'customer_id' => $customer->id,
                'status' => 'pending_payment',
                'items_subtotal' => 10000,
                'total_amount' => 10000,
                'platform_fee_percent' => 1.5,
                'platform_fee_amount' => 150,
                'merchant_net_amount' => 9850,
                'shipping_recipient_name' => 'Reservation Buyer',
                'shipping_recipient_phone' => $customer->phone_number,
                'shipping_destination_area_id' => 'ID_TEST',
                'shipping_address_detail' => 'Test address',
            ]);

            $inventory = app(InventoryService::class);
            $this->assertTrue($inventory->reserveStock($store->id, $variant->id, 2));
            $inventory->createReservations($store->id, $order->id, [[
                'variant_id' => $variant->id,
                'qty' => 2,
            ]], now()->subMinute());

            $this->artisan('app:release-expired-reservations')->assertSuccessful();

            $this->assertSame(5, $variant->refresh()->stock);
            $this->assertSame('cancelled', $order->refresh()->status->value);
            $this->assertSame('released', InventoryReservation::where('order_id', $order->id)->value('status'));

            $this->artisan('app:release-expired-reservations')->assertSuccessful();
            $this->assertSame(5, $variant->refresh()->stock);
        } finally {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("SET app.is_system_bypass = 'off';");
            }
        }
    }
}
