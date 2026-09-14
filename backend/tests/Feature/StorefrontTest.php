<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Str;

class StorefrontTest extends TestCase
{
    private Store $store;
    private Product $product;
    private ProductVariant $variant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name'         => 'Storefront Demo ' . Str::random(5),
            'slug'         => 'demo-' . Str::lower(Str::random(6)),
            'phone_number' => '081' . rand(10000000, 99999999),
            'settings'     => ['tagline' => 'Belanja Mudah dan Cepat'],
        ]);

        $this->product = Product::create([
            'tenant_id'        => $this->store->id,
            'title'            => 'Gamis Modern Signature',
            'slug'             => 'gamis-modern-' . Str::lower(Str::random(6)),
            'description'      => 'Gamis bahan katun premium.',
            'category_name'    => 'Busana Muslim',
            'price'            => 275000,
            'compare_at_price' => 350000,
            'weight_grams'     => 400,
            'is_active'        => true,
        ]);

        $this->variant = ProductVariant::create([
            'tenant_id'  => $this->store->id,
            'product_id' => $this->product->id,
            'sku'        => 'GMS-SIG-XL',
            'title'      => 'Navy / XL',
            'price'      => 275000,
            'stock'      => 25,
        ]);
    }

    public function test_can_fetch_store_and_products(): void
    {
        $headers = ['X-Store-Slug' => $this->store->slug];

        // 1. Get Store Info
        $storeRes = $this->withHeaders($headers)->getJson('/api/v1/store');
        $storeRes->assertStatus(200)
                 ->assertJsonPath('success', true)
                 ->assertJsonPath('data.name', $this->store->name);

        // 2. List Products
        $listRes = $this->withHeaders($headers)->getJson('/api/v1/products');
        $listRes->assertStatus(200)
                ->assertJsonPath('success', true);

        // 3. Get Product Detail by slug
        $detailRes = $this->withHeaders($headers)->getJson("/api/v1/products/{$this->product->slug}");
        $detailRes->assertStatus(200)
                  ->assertJsonPath('success', true)
                  ->assertJsonPath('data.title', $this->product->title);
    }
}
