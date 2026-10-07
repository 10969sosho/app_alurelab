<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Shipment;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FlagshipStoreSeeder extends Seeder
{
    /**
     * Seed Toko Flagship 'Kalmora Official' dengan katalog lengkap,
     * foto HD Unsplash nyata, kategori bervariasi, dan banyak pesanan/penjualan.
     */
    public function run(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.is_system_bypass = 'on';");
        }

        $passwordHash = Hash::make('password123');

        // 1. User & Toko Kalmora
        $user = User::firstOrCreate(
            ['email' => 'founder@kalmora.com'],
            [
                'name' => 'Kalmora Studio',
                'password_hash' => $passwordHash,
                'email_verified_at' => now(),
            ]
        );

        $store = Store::updateOrCreate(
            ['slug' => 'kalmora'],
            [
                'name' => 'Kalmora Official',
                'phone_number' => '081234567890',
                'address_area_id' => 'ID_JAWA_TIMUR_SURABAYA',
                'logo_url' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&q=80',
                'settings' => [
                    'branding' => [
                        'storeName' => 'Kalmora Official',
                        'tagline' => 'Quiet Luxury & Timeless Daily Essentials',
                        'primaryColor' => '#18181b',
                    ],
                    'hero' => [
                        'headline' => 'Quiet Luxury, Loudly Considered.',
                        'description' => 'Eksplorasi koleksi pakaian premium dan aksesoris kurasi terbaik untuk gaya hidup modern Anda.',
                        'bannerImage' => 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
                        'bannerImages' => [
                            'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
                            'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&auto=format&fit=crop&q=80',
                        ],
                    ],
                ],
            ]
        );

        StoreUser::firstOrCreate(
            ['store_id' => $store->id, 'user_id' => $user->id],
            ['role' => 'owner']
        );

        // 2. Katalog 12 Produk Unggulan dengan Foto Asli
        $catalog = [
            [
                'title' => 'The Column Linen Dress',
                'slug' => 'the-column-linen-dress',
                'category_name' => 'Dresses',
                'price' => 489000,
                'compare_at_price' => 599000,
                'description' => 'Gaun linen organik dengan potongan ramping minimalis yang sejuk dan bernapas.',
                'images' => [
                    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80',
                ],
                'variants' => [
                    ['title' => 'Sand Beige / S', 'price' => 489000, 'stock' => 25],
                    ['title' => 'Sand Beige / M', 'price' => 489000, 'stock' => 40],
                    ['title' => 'Sand Beige / L', 'price' => 489000, 'stock' => 15],
                ],
            ],
            [
                'title' => 'Oversized Blazer Charcoal',
                'slug' => 'oversized-blazer-charcoal',
                'category_name' => 'Outerwear',
                'price' => 699000,
                'compare_at_price' => 850000,
                'description' => 'Blazer oversized dengan konstruksi semi-formal dan sentuhan wol lembut berkualitas.',
                'images' => [
                    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80',
                ],
                'variants' => [
                    ['title' => 'Charcoal / M', 'price' => 699000, 'stock' => 30],
                    ['title' => 'Charcoal / L', 'price' => 699000, 'stock' => 20],
                ],
            ],
            [
                'title' => 'Relaxed Poplin Shirt Sage',
                'slug' => 'relaxed-poplin-shirt-sage',
                'category_name' => 'Tops',
                'price' => 329000,
                'compare_at_price' => 389000,
                'description' => 'Kemeja katun poplin premium dengan warna sage lembut untuk tampilan santai maupun formal.',
                'images' => [
                    'https://images.unsplash.com/photo-1596755094514-f87e32f6b717?w=800&auto=format&fit=crop&q=80',
                ],
                'variants' => [
                    ['title' => 'Sage Green / All Size', 'price' => 329000, 'stock' => 60],
                ],
            ],
            [
                'title' => 'Structured Leather Tote Bag',
                'slug' => 'structured-leather-tote-bag',
                'category_name' => 'Bags',
                'price' => 549000,
                'compare_at_price' => 680000,
                'description' => 'Tas jinjing berbahan kulit sintetis vegan bertekstur grain dengan kompartemen laptop 14 inch.',
                'images' => [
                    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
                ],
                'variants' => [
                    ['title' => 'Caramel Brown', 'price' => 549000, 'stock' => 35],
                    ['title' => 'Matte Black', 'price' => 549000, 'stock' => 45],
                ],
            ],
            [
                'title' => 'Minimalist Leather Watch Rose Gold',
                'slug' => 'minimalist-leather-watch-rose-gold',
                'category_name' => 'Watches',
                'price' => 420000,
                'compare_at_price' => 520000,
                'description' => 'Jam tangan dial hitam elegan dengan tali kulit asli dan bingkai rose gold anti karat.',
                'images' => [
                    'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
                ],
                'variants' => [
                    ['title' => 'Rose Gold Dial 40mm', 'price' => 420000, 'stock' => 50],
                ],
            ],
            [
                'title' => 'Tailored Pleated Trousers Taupe',
                'slug' => 'tailored-pleated-trousers-taupe',
                'category_name' => 'Bottoms',
                'price' => 379000,
                'compare_at_price' => 450000,
                'description' => 'Celana panjang lipit dengan siluet lurus yang memberikan ilusi kaki jenjang dan rapi.',
                'images' => [
                    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80',
                ],
                'variants' => [
                    ['title' => 'Taupe / S (27-28)', 'price' => 379000, 'stock' => 20],
                    ['title' => 'Taupe / M (29-30)', 'price' => 379000, 'stock' => 35],
                    ['title' => 'Taupe / L (31-32)', 'price' => 379000, 'stock' => 25],
                ],
            ],
            [
                'title' => 'Chunky Knit Sweater Cream',
                'slug' => 'chunky-knit-sweater-cream',
                'category_name' => 'Knitwear',
                'price' => 359000,
                'compare_at_price' => 429000,
                'description' => 'Sweater rajut tebal nan lembut dengan kerah crew neck, menghangatkan dan modis.',
                'images' => [
                    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80',
                ],
                'variants' => [
                    ['title' => 'Cream / M', 'price' => 359000, 'stock' => 30],
                    ['title' => 'Cream / L', 'price' => 359000, 'stock' => 25],
                ],
            ],
            [
                'title' => 'Classic Chelsea Leather Boots',
                'slug' => 'classic-chelsea-leather-boots',
                'category_name' => 'Shoes',
                'price' => 749000,
                'compare_at_price' => 899000,
                'description' => 'Sepatu boots chelsea kulit cokelat gelap dengan sol karet tebal anti selip yang tahan lama.',
                'images' => [
                    'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&auto=format&fit=crop&q=80',
                ],
                'variants' => [
                    ['title' => 'Dark Brown / 40', 'price' => 749000, 'stock' => 15],
                    ['title' => 'Dark Brown / 41', 'price' => 749000, 'stock' => 20],
                    ['title' => 'Dark Brown / 42', 'price' => 749000, 'stock' => 18],
                ],
            ],
            [
                'title' => 'Signature Canvas Crossbody Bag',
                'slug' => 'signature-canvas-crossbody-bag',
                'category_name' => 'Bags',
                'price' => 289000,
                'compare_at_price' => 349000,
                'description' => 'Tas selempang kanvas water-repellent dengan aksen strap kulit untuk mobilitas harian.',
                'images' => [
                    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
                ],
                'variants' => [
                    ['title' => 'Natural Canvas', 'price' => 289000, 'stock' => 45],
                ],
            ],
            [
                'title' => 'Silk Satin Slip Midi Dress',
                'slug' => 'silk-satin-slip-midi-dress',
                'category_name' => 'Dresses',
                'price' => 459000,
                'compare_at_price' => 550000,
                'description' => 'Gaun midi sutra satin hitam dengan potongan flowy lembut dan tali spageti yang anggun.',
                'images' => [
                    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
                ],
                'variants' => [
                    ['title' => 'Midnight Black / S', 'price' => 459000, 'stock' => 20],
                    ['title' => 'Midnight Black / M', 'price' => 459000, 'stock' => 30],
                ],
            ],
            [
                'title' => 'Urban Minimalist Sneakers White',
                'slug' => 'urban-minimalist-sneakers-white',
                'category_name' => 'Shoes',
                'price' => 520000,
                'compare_at_price' => 650000,
                'description' => 'Sepatu kets putih polos berbahan kulit microfiber dengan bantalan empuk untuk jalan santai.',
                'images' => [
                    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80',
                ],
                'variants' => [
                    ['title' => 'White / 39', 'price' => 520000, 'stock' => 15],
                    ['title' => 'White / 40', 'price' => 520000, 'stock' => 25],
                    ['title' => 'White / 41', 'price' => 520000, 'stock' => 20],
                ],
            ],
            [
                'title' => 'Wool Blend Trench Coat Camel',
                'slug' => 'wool-blend-trench-coat-camel',
                'category_name' => 'Outerwear',
                'price' => 899000,
                'compare_at_price' => 1100000,
                'description' => 'Mantel trench wol warna camel klasik dengan ikat pinggang statement untuk sentuhan editorial.',
                'images' => [
                    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
                ],
                'variants' => [
                    ['title' => 'Camel / All Size', 'price' => 899000, 'stock' => 20],
                ],
            ],
        ];

        $createdProducts = [];

        foreach ($catalog as $item) {
            $product = Product::updateOrCreate(
                ['tenant_id' => $store->id, 'slug' => $item['slug']],
                [
                    'title' => $item['title'],
                    'category_name' => $item['category_name'],
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'compare_at_price' => $item['compare_at_price'],
                    'weight_grams' => 450,
                    'images' => $item['images'],
                    'is_active' => true,
                ]
            );

            $createdProducts[] = $product;

            foreach ($item['variants'] as $v) {
                ProductVariant::updateOrCreate(
                    [
                        'tenant_id' => $store->id,
                        'product_id' => $product->id,
                        'title' => $v['title'],
                    ],
                    [
                        'price' => $v['price'],
                        'stock' => $v['stock'],
                        'sku' => 'KLM-' . strtoupper(Str::random(5)),
                    ]
                );
            }
        }

        // 3. Buat 50 Penjualan/Pesanan Nyata (Orders) untuk Toko Kalmora
        $buyerNames = [
            'Amanda Putri', 'Bima Sakti', 'Clara Stefani', 'Dion Pratama', 'Erika Novita',
            'Fajar Ramadhan', 'Gisella Anastasia', 'Hendra Wijaya', 'Indah Permatasari', 'Jovian Tan',
            'Kevin Sanjaya', 'Larasati Ayu', 'Muhammad Rizky', 'Nadia Saphira', 'Oki Setiana',
            'Putri Marino', 'Qory Sandioriva', 'Rangga Sasana', 'Siti Rahma', 'Tio Nugroho',
            'Umar Wirahadi', 'Vania Clara', 'Wulan Guritno', 'Xavier Lee', 'Yasmine Wildblood',
        ];

        $statuses = [
            OrderStatus::PAID_ESCROW,
            OrderStatus::PROCESSING,
            OrderStatus::SHIPPED,
            OrderStatus::SHIPPED,
            OrderStatus::COMPLETED,
            OrderStatus::COMPLETED,
            OrderStatus::COMPLETED,
        ];

        for ($orderIdx = 1; $orderIdx <= 50; $orderIdx++) {
            $buyerName = $buyerNames[($orderIdx - 1) % count($buyerNames)];
            $phone = '62812' . str_pad((string)$orderIdx, 7, '8', STR_PAD_LEFT);
            $email = Str::slug($buyerName) . "{$orderIdx}@gmail.com";

            $customer = Customer::firstOrCreate(
                ['phone_number' => $phone],
                [
                    'full_name' => $buyerName,
                    'email' => $email,
                    'default_address' => [
                        'area_id' => 'ID_DKI_JAKARTA_SELATAN',
                        'detail' => "Apartemen Sudirman Park Tower B Lt. {$orderIdx}, Jakarta Selatan",
                    ],
                ]
            );

            $pickedProduct = $createdProducts[$orderIdx % count($createdProducts)];
            $pickedVariant = ProductVariant::where('product_id', $pickedProduct->id)->first();
            $itemPrice = $pickedVariant ? $pickedVariant->price : $pickedProduct->price;
            $qty = ($orderIdx % 3) + 1;
            $subtotal = $itemPrice * $qty;
            $shippingCost = 18000;
            $totalAmount = $subtotal + $shippingCost;
            $platformFee = round($subtotal * 0.015, 2);
            $merchantNet = $subtotal - $platformFee;

            $status = $statuses[$orderIdx % count($statuses)];
            $orderNumber = "ORD-KLM-" . date('Ymd') . "-" . str_pad((string)$orderIdx, 4, '0', STR_PAD_LEFT);

            $order = Order::updateOrCreate(
                ['order_number' => $orderNumber],
                [
                    'tenant_id' => $store->id,
                    'customer_id' => $customer->id,
                    'items_subtotal' => $subtotal,
                    'shipping_cost' => $shippingCost,
                    'insurance_cost' => 0,
                    'discount_amount' => 0,
                    'total_amount' => $totalAmount,
                    'platform_fee_percent' => 1.50,
                    'platform_fee_amount' => $platformFee,
                    'merchant_net_amount' => $merchantNet,
                    'status' => $status,
                    'shipping_recipient_name' => $buyerName,
                    'shipping_recipient_phone' => $phone,
                    'shipping_destination_area_id' => 'ID_DKI_JAKARTA_SELATAN',
                    'shipping_address_detail' => "Apartemen Sudirman Park Tower B Lt. {$orderIdx}, Jakarta Selatan",
                    'created_at' => now()->subHours($orderIdx * 3),
                ]
            );

            OrderItem::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'tenant_id' => $store->id,
                    'product_id' => $pickedProduct->id,
                    'variant_id' => $pickedVariant?->id,
                    'product_title' => $pickedProduct->title,
                    'variant_title' => $pickedVariant?->title,
                    'quantity' => $qty,
                    'price' => $itemPrice,
                    'subtotal' => $subtotal,
                ]
            );

            Payment::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'tenant_id' => $store->id,
                    'xendit_invoice_id' => 'XND-KLM-' . strtoupper(Str::random(10)),
                    'payment_method' => 'QRIS',
                    'payment_channel' => 'BCA',
                    'amount' => $totalAmount,
                    'gateway_fee' => 0,
                    'status' => PaymentStatus::PAID,
                    'paid_at' => now()->subHours($orderIdx * 3),
                ]
            );

            Shipment::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'tenant_id' => $store->id,
                    'biteship_order_id' => 'BS-KLM-' . strtoupper(Str::random(8)),
                    'courier_code' => 'sicepat',
                    'courier_service' => 'best',
                    'waybill_id' => '0034' . str_pad((string)$orderIdx, 8, '9', STR_PAD_LEFT),
                    'tracking_status' => $status === OrderStatus::COMPLETED ? 'delivered' : 'allocated',
                    'is_cod' => false,
                    'cod_amount' => 0,
                ]
            );
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.is_system_bypass = 'off';");
        }

        $this->command?->info("Toko Flagship 'Kalmora Official' berhasil diseed dengan 12 produk HD dan 50 riwayat pesanan!");
    }
}
