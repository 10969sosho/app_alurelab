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

class LoadTestSeeder extends Seeder
{
    /**
     * Seed 200 Stores, Products, 200 Buyers, and Realistic Orders
     */
    public function run(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.is_system_bypass = 'on';");
        }

        $passwordHash = Hash::make('password123');

        $categories = ['Fashion', 'Elektronik', 'Kecantikan', 'Kuliner', 'Perlengkapan Rumah', 'Aksesoris', 'Olahraga'];

        $universalProducts = [
            ['title' => 'Tas Ransel Kanvas Premium', 'price' => 249000, 'category' => 'Aksesoris'],
            ['title' => 'Kopi Arabika Single Origin 250g', 'price' => 85000, 'category' => 'Kuliner'],
            ['title' => 'Smart Desk Lamp Minimalist LED', 'price' => 175000, 'category' => 'Perlengkapan Rumah'],
            ['title' => 'Botol Minum Stainless Steel 750ml', 'price' => 120000, 'category' => 'Olahraga'],
            ['title' => 'Serum Wajah Hydrating Glow 30ml', 'price' => 135000, 'category' => 'Kecantikan'],
        ];

        $this->command?->info('Seeding 200 Stores...');

        $storeIds = [];

        // 1. Generate 200 Stores & Owners
        for ($i = 1; $i <= 200; $i++) {
            $sellerEmail = "seller{$i}@alurelab-loadtest.com";
            $storeSlug = "store-test-{$i}";
            $storeName = "Alurelab Store " . str_pad((string)$i, 3, '0', STR_PAD_LEFT);

            $user = User::firstOrCreate(
                ['email' => $sellerEmail],
                [
                    'name' => "Owner Store {$i}",
                    'password_hash' => $passwordHash,
                    'email_verified_at' => now(),
                ]
            );

            $store = Store::firstOrCreate(
                ['slug' => $storeSlug],
                [
                    'name' => $storeName,
                    'phone_number' => '0812' . str_pad((string)$i, 8, '0', STR_PAD_LEFT),
                    'address_area_id' => 'ID_JAWA_TIMUR_BLITAR',
                    'settings' => [
                        'branding' => [
                            'storeName' => $storeName,
                            'tagline' => 'Pusat belanja online terpercaya dengan pengiriman cepat',
                        ],
                        'hero' => [
                            'headline' => 'Selamat Datang di ' . $storeName,
                            'description' => 'Temukan kurasi produk terbaik untuk kebutuhan harian Anda.',
                        ],
                    ],
                ]
            );

            $storeIds[] = $store->id;

            if (!StoreUser::where('store_id', $store->id)->where('user_id', $user->id)->exists()) {
                StoreUser::create([
                    'store_id' => $store->id,
                    'user_id' => $user->id,
                    'role' => 'owner',
                ]);
            }

            // Tiap toko punya 3 produk
            foreach (array_slice($universalProducts, 0, 3) as $pIdx => $prod) {
                $productSlug = Str::slug($prod['title']) . "-{$i}-{$pIdx}";
                $product = Product::firstOrCreate(
                    [
                        'tenant_id' => $store->id,
                        'slug' => $productSlug,
                    ],
                    [
                        'title' => $prod['title'],
                        'category_name' => $prod['category'],
                        'description' => "Produk berkualitas tinggi dari {$storeName}. Dibuat dengan material pilihan untuk kepuasan maksimal.",
                        'price' => $prod['price'],
                        'weight_grams' => 500,
                        'is_active' => true,
                        'images' => [],
                    ]
                );

                if (!ProductVariant::where('product_id', $product->id)->exists()) {
                    ProductVariant::create([
                        'tenant_id' => $store->id,
                        'product_id' => $product->id,
                        'title' => 'Standar',
                        'sku' => "SKU-{$i}-{$pIdx}",
                        'price' => $prod['price'],
                        'stock' => 100,
                    ]);
                }
            }
        }

        $this->command?->info('Seeding 200 Buyers & Active Orders...');

        // 2. Generate 200 Buyers & Orders
        for ($j = 1; $j <= 200; $j++) {
            $buyerPhone = '6289' . str_pad((string)$j, 8, '5', STR_PAD_LEFT);
            $buyerName = "Buyer User " . str_pad((string)$j, 3, '0', STR_PAD_LEFT);
            $buyerEmail = "buyer{$j}@alurelab-loadtest.com";

            $customer = Customer::firstOrCreate(
                ['phone_number' => $buyerPhone],
                [
                    'full_name' => $buyerName,
                    'email' => $buyerEmail,
                    'default_address' => [
                        'area_id' => 'ID_DKI_JAKARTA_SELATAN',
                        'detail' => "Jl. Percobaan No. {$j}, Jakarta Selatan",
                    ],
                ]
            );

            // Buat order untuk buyer ini di salah satu toko
            $targetStoreId = $storeIds[($j - 1) % count($storeIds)];
            $sampleProduct = Product::where('tenant_id', $targetStoreId)->first();
            $sampleVariant = $sampleProduct ? ProductVariant::where('product_id', $sampleProduct->id)->first() : null;

            if ($sampleProduct && $sampleVariant) {
                $orderNumber = "ORD-TEST-" . strtoupper(Str::random(8)) . "-{$j}";
                $itemPrice = $sampleVariant->price;
                $shippingCost = 15000;
                $totalAmount = $itemPrice + $shippingCost;

                $statuses = [OrderStatus::PENDING_PAYMENT, OrderStatus::PAID_ESCROW, OrderStatus::PROCESSING, OrderStatus::SHIPPED, OrderStatus::COMPLETED];
                $orderStatus = $statuses[$j % count($statuses)];

                $platformFeeAmount = round($itemPrice * 0.015, 2);
                $merchantNet = $itemPrice - $platformFeeAmount;

                $order = Order::firstOrCreate(
                    ['order_number' => $orderNumber],
                    [
                        'tenant_id' => $targetStoreId,
                        'customer_id' => $customer->id,
                        'items_subtotal' => $itemPrice,
                        'shipping_cost' => $shippingCost,
                        'insurance_cost' => 0,
                        'discount_amount' => 0,
                        'total_amount' => $totalAmount,
                        'platform_fee_percent' => 1.50,
                        'platform_fee_amount' => $platformFeeAmount,
                        'merchant_net_amount' => $merchantNet,
                        'status' => $orderStatus,
                        'shipping_recipient_name' => $buyerName,
                        'shipping_recipient_phone' => $buyerPhone,
                        'shipping_destination_area_id' => 'ID_DKI_JAKARTA_SELATAN',
                        'shipping_address_detail' => "Jl. Percobaan No. {$j}, Jakarta Selatan",
                        'created_at' => now()->subMinutes($j * 5),
                    ]
                );

                if (!OrderItem::where('order_id', $order->id)->exists()) {
                    OrderItem::create([
                        'tenant_id' => $targetStoreId,
                        'order_id' => $order->id,
                        'product_id' => $sampleProduct->id,
                        'variant_id' => $sampleVariant->id,
                        'product_title' => $sampleProduct->title,
                        'variant_title' => $sampleVariant->title,
                        'quantity' => 1,
                        'price' => $itemPrice,
                        'subtotal' => $itemPrice,
                    ]);
                }

                if (!Payment::where('order_id', $order->id)->exists()) {
                    Payment::create([
                        'tenant_id' => $targetStoreId,
                        'order_id' => $order->id,
                        'xendit_invoice_id' => 'XND-INV-' . strtoupper(Str::random(12)),
                        'payment_method' => 'QRIS',
                        'payment_channel' => 'GOPAY',
                        'amount' => $totalAmount,
                        'gateway_fee' => 0,
                        'status' => in_array($orderStatus, [OrderStatus::PAID_ESCROW, OrderStatus::PROCESSING, OrderStatus::SHIPPED, OrderStatus::COMPLETED])
                            ? PaymentStatus::PAID
                            : PaymentStatus::PENDING,
                        'paid_at' => in_array($orderStatus, [OrderStatus::PAID_ESCROW, OrderStatus::PROCESSING, OrderStatus::SHIPPED, OrderStatus::COMPLETED])
                            ? now()->subMinutes($j * 4)
                            : null,
                    ]);
                }

                if (!Shipment::where('order_id', $order->id)->exists()) {
                    Shipment::create([
                        'tenant_id' => $targetStoreId,
                        'order_id' => $order->id,
                        'biteship_order_id' => 'BS-ORD-' . strtoupper(Str::random(10)),
                        'courier_code' => 'jne',
                        'courier_service' => 'reg',
                        'waybill_id' => 'JNE' . strtoupper(Str::random(10)),
                        'tracking_status' => 'allocated',
                        'is_cod' => false,
                        'cod_amount' => 0,
                    ]);
                }
            }
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("SET app.is_system_bypass = 'off';");
        }

        $this->command?->info('200 Stores, Products, and 200 Buyers with Orders successfully seeded!');
    }
}
