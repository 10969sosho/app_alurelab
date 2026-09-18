<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Store;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Str;

class ShowcaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement("set app.is_system_bypass = 'on';");

        // ==========================================
        // 1. BUAT TOKO 1: FASHION (MINIMALIST)
        // ==========================================
        $user1 = User::firstOrCreate(
            ['email' => 'kalmora@example.com'],
            [
                'name' => 'Kalmora Fashion',
                'password_hash' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        $store1 = Store::firstOrCreate(
            ['slug' => 'kalmora'],
            [
                'name' => 'Kalmora',
                'settings' => $this->getFashionCmsSettings(),
            ]
        );

        if (!\App\Models\StoreUser::where('store_id', $store1->id)->where('user_id', $user1->id)->exists()) {
            \App\Models\StoreUser::create([
                'store_id' => $store1->id,
                'user_id' => $user1->id,
                'role' => 'owner'
            ]);
        }

        $this->seedFashionProducts($store1->id);

        // ==========================================
        // 2. BUAT TOKO 2: GADGET (TECH)
        // ==========================================
        $user2 = User::firstOrCreate(
            ['email' => 'techhub@example.com'],
            [
                'name' => 'TechHub Store',
                'password_hash' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        $store2 = Store::firstOrCreate(
            ['slug' => 'techhub'],
            [
                'name' => 'TechHub ID',
                'settings' => $this->getGadgetCmsSettings(),
            ]
        );

        if (!\App\Models\StoreUser::where('store_id', $store2->id)->where('user_id', $user2->id)->exists()) {
            \App\Models\StoreUser::create([
                'store_id' => $store2->id,
                'user_id' => $user2->id,
                'role' => 'owner'
            ]);
        }

        $this->seedGadgetProducts($store2->id);

        // ==========================================
        // 3. BUAT BUYERS & ORDERS UNTUK SHOWCASE
        // ==========================================
        $this->seedDummyOrders($store1->id);
        $this->seedDummyOrders($store2->id);

        $this->command->info('✅ Showcase Seeder berhasil dijalankan! Dummy data (Toko, Produk, Orders) siap.');
    }

    private function getFashionCmsSettings()
    {
        return [
            'branding' => [
                'fontHeading' => 'playfair',
                'colorTheme' => 'black',
                'primaryColor' => '#111111',
                'backgroundColor' => '#F5F5F3',
            ],
            'sections' => [
                'showAnnouncementBar' => true,
                'showFeatured' => true,
                'showInstagram' => true,
                'showNewsletter' => true,
            ],
            'highlights' => [
                'announcementText' => 'GRATIS ONGKIR SELURUH INDONESIA UNTUK PEMBELIAN DI ATAS RP 500.000',
                'featuredCategory' => 'ESSENTIALS',
                'aboutHeading' => 'REDEFINING EVERYDAY ELEGANCE',
                'aboutStory' => 'Kalmora didirikan untuk memberikan kenyamanan melalui potongan minimalis yang membebaskan gerak. Setiap kain dipilih secara hati-hati agar bisa bertahan lama.',
            ],
            'hero' => [
                'badgeText' => 'MINIMAL / COMFORT / EDITORIAL',
                'headline' => 'KALMORA',
                'description' => 'Koleksi esensial yang tidak lekang oleh waktu.',
                'ctaText' => 'SHOP THE COLLECTION',
                'ctaLink' => '/kalmora/shop',
                'bannerImages' => [
                    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80',
                    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&q=80'
                ]
            ],
            'navigation' => [
                'menuItems' => [
                    ['id' => '1', 'label' => 'Shop All', 'url' => '/kalmora/shop', 'enabled' => true],
                    ['id' => '2', 'label' => 'Track Order', 'url' => '/kalmora/account/orders', 'enabled' => true],
                ],
                'socialLinks' => [
                    'instagram' => 'https://instagram.com/kalmora',
                    'whatsapp' => '628123456789',
                ]
            ],
            'buyerCopy' => [
                'heroTitle' => 'KALMORA',
                'heroSubtitle' => 'Minimalist Essentials',
                'productAddToCart' => 'ADD TO BAG',
                'productBuyNow' => 'BUY IT NOW',
                'productDetails' => 'DETAILS & CARE',
                'cartCheckout' => 'SECURE CHECKOUT',
                'cartContinueShopping' => 'BACK TO SHOP',
                'checkoutSubmit' => 'PLACE ORDER',
            ]
        ];
    }

    private function getGadgetCmsSettings()
    {
        return [
            'branding' => [
                'fontHeading' => 'inter',
                'colorTheme' => 'slate',
                'primaryColor' => '#2563EB',
                'backgroundColor' => '#F8FAFC',
            ],
            'sections' => [
                'showAnnouncementBar' => true,
                'showFeatured' => true,
            ],
            'highlights' => [
                'announcementText' => '⚡ FLASH SALE: Diskon hingga 30% untuk produk Apple & Samsung!',
                'featuredCategory' => 'Gadget Baru',
                'aboutHeading' => 'TEKNOLOGI DALAM GENGGAMAN',
                'aboutStory' => 'TechHub ID menghadirkan produk teknologi terdepan dengan jaminan garansi resmi.',
            ],
            'hero' => [
                'badgeText' => 'GADGET & ACCESSORIES',
                'headline' => 'TECH HUB ID',
                'description' => 'Tingkatkan produktivitasmu dengan teknologi terbaru.',
                'ctaText' => 'LIHAT KATALOG',
                'ctaLink' => '/techhub/shop',
                'bannerImages' => [
                    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80',
                    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1600&q=80'
                ]
            ],
            'navigation' => [
                'menuItems' => [
                    ['id' => '1', 'label' => 'Katalog', 'url' => '/techhub/shop', 'enabled' => true],
                ],
                'socialLinks' => [
                    'whatsapp' => '628123456780',
                ]
            ],
            'buyerCopy' => [
                'heroTitle' => 'TECH HUB',
                'productAddToCart' => 'TAMBAH KERANJANG',
                'productBuyNow' => 'BELI SEKARANG',
                'productDetails' => 'SPESIFIKASI',
                'cartCheckout' => 'LANJUT CHECKOUT',
                'checkoutSubmit' => 'BAYAR SEKARANG',
            ]
        ];
    }

    private function seedFashionProducts($storeId)
    {
        $products = [
            [
                'title' => 'Oversized Linen Shirt',
                'slug' => 'oversized-linen-shirt',
                'price' => 299000,
                'category_name' => 'TOPS',
                'images' => json_encode(['https://images.unsplash.com/photo-1596755094514-f87e32f6b717?q=80&w=800']),
                'variants' => ['M', 'L', 'XL']
            ],
            [
                'title' => 'Minimalist Cotton Trousers',
                'slug' => 'minimalist-cotton-trousers',
                'price' => 349000,
                'category_name' => 'BOTTOMS',
                'images' => json_encode(['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800']),
                'variants' => ['S', 'M', 'L']
            ],
            [
                'title' => 'Classic Trench Coat',
                'slug' => 'classic-trench-coat',
                'price' => 899000,
                'category_name' => 'OUTERWEAR',
                'images' => json_encode(['https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800']),
                'variants' => ['All Size']
            ],
        ];

        foreach ($products as $p) {
            $product = Product::firstOrCreate(
                ['tenant_id' => $storeId, 'slug' => $p['slug']],
                [
                    'title' => $p['title'],
                    'description' => 'Premium material dengan potongan jahitan yang sempurna.',
                    'price' => $p['price'],
                    'category_name' => $p['category_name'],
                    'images' => $p['images'],
                    'is_active' => true,
                ]
            );

            foreach ($p['variants'] as $v) {
                ProductVariant::firstOrCreate(
                    ['tenant_id' => $storeId, 'product_id' => $product->id, 'title' => $v],
                    [
                        'price' => $p['price'],
                        'stock' => rand(5, 50),
                        'sku' => strtoupper(Str::random(6))
                    ]
                );
            }
        }
    }

    private function seedGadgetProducts($storeId)
    {
        $products = [
            [
                'title' => 'Mechanical Keyboard Pro',
                'slug' => 'mech-keyboard-pro',
                'price' => 1250000,
                'category_name' => 'ACCESSORIES',
                'images' => json_encode(['https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800']),
                'variants' => ['Blue Switch', 'Red Switch', 'Brown Switch']
            ],
            [
                'title' => 'Wireless Noise-Cancelling Headphones',
                'slug' => 'wireless-anc-headphones',
                'price' => 2500000,
                'category_name' => 'AUDIO',
                'images' => json_encode(['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=800']),
                'variants' => ['Black', 'Silver']
            ],
            [
                'title' => 'Minimalist Desk Mat',
                'slug' => 'minimalist-desk-mat',
                'price' => 150000,
                'category_name' => 'ACCESSORIES',
                'images' => json_encode(['https://images.unsplash.com/photo-1589710332851-bc29fb462b40?q=80&w=800']),
                'variants' => ['Black', 'Grey']
            ],
        ];

        foreach ($products as $p) {
            $product = Product::firstOrCreate(
                ['tenant_id' => $storeId, 'slug' => $p['slug']],
                [
                    'title' => $p['title'],
                    'description' => 'Produk original bergaransi resmi 1 Tahun.',
                    'price' => $p['price'],
                    'category_name' => $p['category_name'],
                    'images' => $p['images'],
                    'is_active' => true,
                ]
            );

            foreach ($p['variants'] as $v) {
                ProductVariant::firstOrCreate(
                    ['tenant_id' => $storeId, 'product_id' => $product->id, 'title' => $v],
                    [
                        'price' => $p['price'],
                        'stock' => rand(10, 100),
                        'sku' => strtoupper(Str::random(6))
                    ]
                );
            }
        }
    }

    private function seedDummyOrders($storeId)
    {
        $products = Product::where('tenant_id', $storeId)->get();
        if ($products->isEmpty()) return;

        $statuses = ['UNPAID', 'PAID', 'SHIPPED', 'COMPLETED'];
        $customerNames = ['Budi Santoso', 'Siti Aminah', 'John Doe', 'Jane Smith', 'Agus Setiawan'];

        for ($i = 0; $i < 5; $i++) {
            $product = $products->random();
            $variant = ProductVariant::where('product_id', $product->id)->first();
            $qty = rand(1, 3);
            $subtotal = $product->price * $qty;
            $shippingCost = 15000;

            $order = Order::create([
                'tenant_id' => $storeId,
                'order_number' => 'ORD-' . strtoupper(Str::random(8)),
                'status' => $statuses[array_rand($statuses)],
                'total_amount' => $subtotal + $shippingCost,
                'shipping_cost' => $shippingCost,
                'subtotal' => $subtotal,
                'payment_method' => 'ONLINE',
                'shipping_courier' => 'jnt',
                'shipping_service' => 'ez',
                'customer_name' => $customerNames[array_rand($customerNames)],
                'customer_email' => 'customer' . $i . '@example.com',
                'customer_phone' => '0812' . rand(10000000, 99999999),
                'shipping_address' => [
                    'name' => 'Rumah',
                    'address' => 'Jl. Sudirman No ' . rand(1, 100),
                    'city' => 'Jakarta Selatan',
                    'province' => 'DKI Jakarta',
                    'postal_code' => '12190'
                ]
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'tenant_id' => $storeId,
                'product_id' => $product->id,
                'variant_id' => $variant ? $variant->id : null,
                'product_name' => $product->title,
                'variant_name' => $variant ? $variant->title : null,
                'quantity' => $qty,
                'price' => $product->price,
                'total' => $subtotal
            ]);
        }
    }
}
