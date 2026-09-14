<?php

namespace Database\Seeders;

use App\Models\MerchantWallet;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Seed Roles & Permissions
        $this->call(RoleSeeder::class);

        // ==========================================
        // Tenant 1: Hijab Mevvah Official
        // ==========================================
        $store1 = Store::create([
            'name' => 'Hijab Mevvah Official',
            'slug' => 'hijab-mevvah',
            'custom_domain' => 'hijabmevvah.com',
            'custom_domain_status' => 'active',
            'plan_tier' => 'pro',
            'logo_url' => 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300',
            'phone_number' => '081234567890',
            'address_area_id' => 'ID_ID_3171_317101',
            'address_detail' => 'Jl. Kemang Raya No. 45, Mampang Prapatan, Jakarta Selatan',
            'settings' => [
                'tagline' => 'Elegansi Muslimah Modern Indonesia',
                'primary_color' => '#831843',
                'accent_color' => '#F472B6',
            ]
        ]);

        $user1 = User::create([
            'name' => 'Amanda Putri',
            'email' => 'amanda@hijabmevvah.com',
            'phone_number' => '081234567890',
            'password_hash' => Hash::make('password123'),
        ]);

        StoreUser::create([
            'store_id' => $store1->id,
            'user_id' => $user1->id,
            'role' => 'owner',
        ]);

        MerchantWallet::create([
            'store_id' => $store1->id,
            'available_balance' => 3500000.00,
            'escrow_held_balance' => 1250000.00,
        ]);

        // Set RLS tenant context for Postgres non-superuser
        DB::statement("SET app.current_tenant_id = '{$store1->id}';");

        $prod1 = Product::create([
            'tenant_id' => $store1->id,
            'title' => 'Hijab Silk Premium Emerald Glow',
            'slug' => 'hijab-silk-premium-emerald-glow',
            'description' => 'Hijab sutra premium dengan kilau mewah, tegak di dahi, dan sejuk seharian.',
            'category_name' => 'Hijab',
            'price' => 149000,
            'compare_at_price' => 199000,
            'cost_price' => 75000,
            'weight_grams' => 180,
            'images' => [
                'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600',
            ],
            'is_active' => true,
        ]);

        ProductVariant::create([
            'tenant_id' => $store1->id,
            'product_id' => $prod1->id,
            'sku' => 'HM-SILK-EMR-OS',
            'title' => 'Emerald Green / All Size',
            'price' => 149000,
            'stock' => 50,
        ]);

        ProductVariant::create([
            'tenant_id' => $store1->id,
            'product_id' => $prod1->id,
            'sku' => 'HM-SILK-ROSE-OS',
            'title' => 'Dusty Rose / All Size',
            'price' => 149000,
            'stock' => 35,
        ]);

        // ==========================================
        // Tenant 2: Vibe Sneakers Surabaya
        // ==========================================
        $store2 = Store::create([
            'name' => 'Vibe Sneakers Surabaya',
            'slug' => 'vibe-sneakers',
            'custom_domain' => 'vibesneakers.id',
            'custom_domain_status' => 'active',
            'plan_tier' => 'business',
            'logo_url' => 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=300',
            'phone_number' => '087812345678',
            'address_area_id' => 'ID_ID_3578_357807',
            'address_detail' => 'Jl. Kertajaya Indah Timur No. 88, Sukolilo, Surabaya',
            'settings' => [
                'tagline' => 'Curated Streetwear & Authentic Kicks',
                'primary_color' => '#0F172A',
                'accent_color' => '#3B82F6',
            ]
        ]);

        $user2 = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@vibesneakers.id',
            'phone_number' => '087812345678',
            'password_hash' => Hash::make('password123'),
        ]);

        StoreUser::create([
            'store_id' => $store2->id,
            'user_id' => $user2->id,
            'role' => 'owner',
        ]);

        MerchantWallet::create([
            'store_id' => $store2->id,
            'available_balance' => 8900000.00,
            'escrow_held_balance' => 4500000.00,
        ]);

        // Set RLS tenant context for Postgres non-superuser
        DB::statement("SET app.current_tenant_id = '{$store2->id}';");

        $prod2 = Product::create([
            'tenant_id' => $store2->id,
            'title' => 'Retro Runner Glide 90s Edition',
            'slug' => 'retro-runner-glide-90s-edition',
            'description' => 'Sneakers vintage dengan bantalan cloud-foam ultra empuk untuk mobilitas harian.',
            'category_name' => 'Footwear',
            'price' => 589000,
            'compare_at_price' => 749000,
            'cost_price' => 320000,
            'weight_grams' => 850,
            'images' => [
                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
            ],
            'is_active' => true,
        ]);

        ProductVariant::create([
            'tenant_id' => $store2->id,
            'product_id' => $prod2->id,
            'sku' => 'VS-RUN-41',
            'title' => 'Size 41 / Red Core',
            'price' => 589000,
            'stock' => 15,
        ]);

        ProductVariant::create([
            'tenant_id' => $store2->id,
            'product_id' => $prod2->id,
            'sku' => 'VS-RUN-42',
            'title' => 'Size 42 / Red Core',
            'price' => 589000,
            'stock' => 20,
        ]);
    }
}
