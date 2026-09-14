<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\Product;
use App\Models\Order;
use App\Models\Customer;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ProductAndOrderTest extends TestCase
{
    private User $user;
    private Store $store;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup tenant & user
        $this->store = Store::create([
            'name'         => 'Test Store ' . Str::random(5),
            'slug'         => 'test-store-' . Str::lower(Str::random(6)),
            'phone_number' => '081' . rand(10000000, 99999999),
        ]);

        $this->user = User::create([
            'name'          => 'Seller Test',
            'email'         => 'seller.' . Str::random(8) . '@example.com',
            'phone_number'  => '082' . rand(10000000, 99999999),
            'password_hash' => Hash::make('password123'),
        ]);

        StoreUser::create([
            'store_id' => $this->store->id,
            'user_id'  => $this->user->id,
            'role'     => 'owner',
        ]);

        $this->token = $this->user->createToken('dashboard', ['role:owner'])->plainTextToken;
    }

    public function test_can_list_and_create_products(): void
    {
        $headers = [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Store-Slug'  => $this->store->slug,
        ];

        // 1. Create product
        $payload = [
            'title'            => 'Kemeja Linen Premium',
            'description'      => 'Kemeja bahan linen adem cocok untuk kerja dan santai.',
            'category_name'    => 'Pakaian Pria',
            'price'            => 189000,
            'compare_at_price' => 249000,
            'cost_price'       => 95000,
            'weight_grams'     => 250,
            'is_active'        => true,
            'variants'         => [
                ['title' => 'Putih / M', 'price' => 189000, 'stock' => 20, 'sku' => 'KL-WHT-M'],
                ['title' => 'Putih / L', 'price' => 189000, 'stock' => 15, 'sku' => 'KL-WHT-L'],
            ],
        ];

        $createRes = $this->withHeaders($headers)
                          ->postJson('/api/v1/merchant/products', $payload);

        $createRes->assertStatus(201)
                  ->assertJsonPath('title', 'Kemeja Linen Premium')
                  ->assertJsonCount(2, 'variants');

        $productId = $createRes->json('id');

        // 2. List products
        $listRes = $this->withHeaders($headers)
                        ->getJson('/api/v1/merchant/products');

        $listRes->assertStatus(200)
                ->assertJsonStructure(['data', 'current_page', 'total']);

        // 3. Toggle status
        $toggleRes = $this->withHeaders($headers)
                          ->patchJson("/api/v1/merchant/products/{$productId}/toggle-status");

        $toggleRes->assertStatus(200)
                  ->assertJsonPath('is_active', false);
    }

    public function test_can_view_orders_and_stats(): void
    {
        $headers = [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Store-Slug'  => $this->store->slug,
        ];

        // Buat customer & order dummy
        $customer = Customer::create([
            'phone_number' => '083' . rand(10000000, 99999999),
            'full_name'    => 'Rian Pratama',
            'email'        => 'rian@example.com',
        ]);

        $order = Order::create([
            'tenant_id'                    => $this->store->id,
            'order_number'                 => 'ORD-' . strtoupper(Str::random(10)),
            'customer_id'                  => $customer->id,
            'status'                       => 'paid_escrow',
            'items_subtotal'               => 189000,
            'shipping_cost'                => 15000,
            'total_amount'                 => 204000,
            'platform_fee_percent'         => 1.5,
            'platform_fee_amount'          => 3060,
            'merchant_net_amount'          => 200940,
            'shipping_recipient_name'      => 'Rian Pratama',
            'shipping_recipient_phone'     => '083123456789',
            'shipping_destination_area_id' => 'ID_ID_3171_317101',
            'shipping_address_detail'      => 'Jl. Sudirman No. 10',
        ]);

        // 1. Get orders list
        $ordersRes = $this->withHeaders($headers)
                          ->getJson('/api/v1/merchant/orders');

        $ordersRes->assertStatus(200)
                  ->assertJsonStructure(['data', 'total']);

        // 2. Get order detail
        $detailRes = $this->withHeaders($headers)
                          ->getJson("/api/v1/merchant/orders/{$order->id}");

        $detailRes->assertStatus(200)
                  ->assertJsonPath('id', $order->id)
                  ->assertJsonPath('status', 'paid_escrow');

        // 3. Update order status to processing
        $updateRes = $this->withHeaders($headers)
                          ->patchJson("/api/v1/merchant/orders/{$order->id}/status", [
                              'status' => 'processing',
                          ]);

        $updateRes->assertStatus(200)
                  ->assertJsonPath('new_status', 'processing');

        // 4. Get order stats
        $statsRes = $this->withHeaders($headers)
                         ->getJson('/api/v1/merchant/orders/stats');

        $statsRes->assertStatus(200);
    }
}
