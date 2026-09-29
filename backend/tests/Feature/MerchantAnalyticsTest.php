<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class MerchantAnalyticsTest extends TestCase
{
    private User $user;

    private Store $store;

    private string $token;

    private array $headers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Analytics Store '.Str::random(5),
            'slug' => 'analytics-store-'.Str::lower(Str::random(6)),
            'phone_number' => '081'.rand(10000000, 99999999),
        ]);

        $this->user = User::create([
            'name' => 'Seller Analytics',
            'email' => 'seller.analytics.'.Str::random(8).'@example.com',
            'phone_number' => '082'.rand(10000000, 99999999),
            'password_hash' => Hash::make('password123'),
        ]);

        StoreUser::create([
            'store_id' => $this->store->id,
            'user_id' => $this->user->id,
            'role' => 'owner',
        ]);

        $this->token = $this->user->createToken('dashboard', ['role:owner'])->plainTextToken;

        $this->headers = [
            'Authorization' => 'Bearer '.$this->token,
            'X-Store-Slug' => $this->store->slug,
        ];
    }

    private function makeProduct(string $title, float $price): Product
    {
        return Product::create([
            'tenant_id' => $this->store->id,
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'description' => 'Deskripsi '.$title,
            'category_name' => 'Umum',
            'price' => $price,
            'weight_grams' => 200,
            'is_active' => true,
            'images' => ['https://example.com/'.$title.'.jpg'],
        ]);
    }

    private function makeOrder(Customer $customer, string $status = 'paid_escrow', ?string $createdAt = null): Order
    {
        $attributes = [
            'tenant_id' => $this->store->id,
            'order_number' => 'ORD-'.strtoupper(Str::random(10)),
            'customer_id' => $customer->id,
            'status' => $status,
            'items_subtotal' => 100000,
            'shipping_cost' => 10000,
            'total_amount' => 110000,
            'platform_fee_percent' => 1.5,
            'platform_fee_amount' => 1650,
            'merchant_net_amount' => 108350,
            'shipping_recipient_name' => $customer->full_name,
            'shipping_recipient_phone' => $customer->phone_number,
            'shipping_destination_area_id' => 'ID_ID_3171_317101',
            'shipping_address_detail' => 'Jl. Sudirman No. 10',
        ];

        if ($createdAt !== null) {
            $attributes['created_at'] = $createdAt;
        }

        return Order::create($attributes);
    }

    private function makeOrderItem(Order $order, Product $product, int $quantity, float $price): OrderItem
    {
        return OrderItem::create([
            'tenant_id' => $this->store->id,
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_title' => $product->title,
            'price' => $price,
            'quantity' => $quantity,
            'subtotal' => $price * $quantity,
        ]);
    }

    public function test_analytics_top_products_use_real_sales_and_are_stable(): void
    {
        $customer = Customer::create([
            'phone_number' => '083'.rand(10000000, 99999999),
            'full_name' => 'Pembeli Analytics',
            'email' => 'pembeli.'.Str::random(8).'@example.com',
        ]);

        $productA = $this->makeProduct('Produk Terlaris '.Str::random(4), 50000);
        $productB = $this->makeProduct('Produk Kedua '.Str::random(4), 120000);
        $productCancelled = $this->makeProduct('Produk Dibatalkan '.Str::random(4), 90000);

        $orderA = $this->makeOrder($customer);
        $this->makeOrderItem($orderA, $productA, 3, 50000);

        $orderB = $this->makeOrder($customer);
        $this->makeOrderItem($orderB, $productA, 2, 50000);
        $this->makeOrderItem($orderB, $productB, 1, 120000);

        $orderCancelled = $this->makeOrder($customer, 'cancelled');
        $this->makeOrderItem($orderCancelled, $productCancelled, 99, 90000);

        $first = $this->withHeaders($this->headers)->getJson('/api/v1/merchant/analytics');
        $first->assertStatus(200);

        $top = $first->json('top_products');
        $this->assertCount(2, $top);
        $this->assertSame($productA->id, $top[0]['id']);
        $this->assertSame(5, (int) $top[0]['sales_count']);
        $this->assertEquals(5 * 50000, (float) $top[0]['revenue']);
        $this->assertSame($productB->id, $top[1]['id']);
        $this->assertSame(1, (int) $top[1]['sales_count']);

        $ids = array_column($top, 'id');
        $this->assertNotContains($productCancelled->id, $ids);

        $second = $this->withHeaders($this->headers)->getJson('/api/v1/merchant/analytics');
        $second->assertStatus(200);
        $this->assertSame($first->json('top_products'), $second->json('top_products'));
    }

    public function test_dashboard_counts_distinct_new_customers_in_last_30_days(): void
    {
        $recentA = Customer::create([
            'phone_number' => '084'.rand(10000000, 99999999),
            'full_name' => 'Pelanggan Baru A',
            'email' => 'baru.a.'.Str::random(8).'@example.com',
        ]);
        $recentB = Customer::create([
            'phone_number' => '085'.rand(10000000, 99999999),
            'full_name' => 'Pelanggan Baru B',
            'email' => 'baru.b.'.Str::random(8).'@example.com',
        ]);
        $old = Customer::create([
            'phone_number' => '086'.rand(10000000, 99999999),
            'full_name' => 'Pelanggan Lama',
            'email' => 'lama.'.Str::random(8).'@example.com',
        ]);

        $this->makeOrder($recentA, 'paid_escrow', now()->subDays(3)->toDateTimeString());
        $this->makeOrder($recentA, 'completed', now()->subDays(10)->toDateTimeString());
        $this->makeOrder($recentB, 'processing', now()->subDay()->toDateTimeString());
        $this->makeOrder($old, 'completed', now()->subDays(45)->toDateTimeString());

        $res = $this->withHeaders($this->headers)->getJson('/api/v1/merchant/dashboard');
        $res->assertStatus(200)
            ->assertJsonPath('stats.new_customers', 2);
    }
}
