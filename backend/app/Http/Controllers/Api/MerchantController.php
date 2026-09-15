<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MerchantWallet;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MerchantController extends Controller
{
    /**
     * Merchant 60-Second Onboarding (The Cursor Effect).
     * Mendaftarkan toko, user, dompet escrow, dan produk perdana dalam 1 transaksi atomik.
     */
    public function onboard(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_name' => 'required|string|max:255',
            'store_slug' => 'required|string|max:100|unique:stores,slug',
            'owner_name' => 'required|string|max:255',
            'owner_email' => 'required|email|max:255|unique:users,email',
            'owner_phone' => 'required|string|max:30|unique:users,phone_number',
            'password' => 'required|string|min:8',
            'sample_products' => 'nullable|array',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // 1. Buat Store
            $store = Store::create([
                'name' => $validated['store_name'],
                'slug' => Str::slug($validated['store_slug']),
                'phone_number' => $validated['owner_phone'],
                'plan_tier' => 'starter',
                'custom_domain_status' => 'pending',
                'settings' => [
                    'theme_color' => '#0F172A',
                    'tagline' => 'Toko Resmi ' . $validated['store_name'],
                    'allow_cod' => true,
                ],
            ]);

            // 2. Buat User Owner (kolom PostgreSQL: password_hash)
            $user = User::create([
                'name' => $validated['owner_name'],
                'email' => $validated['owner_email'],
                'phone_number' => $validated['owner_phone'],
                'password_hash' => Hash::make($validated['password']),
                'is_superadmin' => false,
            ]);

            // 3. Kaitkan RBAC Owner
            StoreUser::create([
                'store_id' => $store->id,
                'user_id' => $user->id,
                'role' => 'owner',
            ]);

            // 4. Inisialisasi Dompet Escrow Toko
            MerchantWallet::create([
                'store_id' => $store->id,
                'available_balance' => 0.00,
                'escrow_held_balance' => 0.00,
            ]);

            // 5. Set RLS tenant context & buat Sampel Produk Awal jika ada
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("SET app.current_tenant_id = '{$store->id}';");
            }

            if (!empty($validated['sample_products'])) {
                foreach ($validated['sample_products'] as $prod) {
                    $product = Product::create([
                        'tenant_id' => $store->id,
                        'title' => $prod['title'],
                        'slug' => Str::slug($prod['title']) . '-' . Str::random(4),
                        'description' => $prod['description'] ?? 'Produk unggulan dengan kualitas terbaik.',
                        'category_name' => $prod['category'] ?? 'Umum',
                        'price' => $prod['price'] ?? 100000,
                        'compare_at_price' => $prod['compare_at_price'] ?? null,
                        'weight_grams' => $prod['weight'] ?? 200,
                        'images' => $prod['images'] ?? [],
                        'is_active' => true,
                    ]);

                    ProductVariant::create([
                        'tenant_id' => $store->id,
                        'product_id' => $product->id,
                        'sku' => strtoupper(Str::random(8)),
                        'title' => 'Standard',
                        'price' => $prod['price'] ?? 100000,
                        'stock' => $prod['stock'] ?? 50,
                    ]);
                }
            }

            $token = $user->createToken('merchant-auth')->plainTextToken;

            $proto = $request->header('x-forwarded-proto') ?: $request->getScheme();
            $host = $request->header('x-forwarded-host') ?: $request->getHost();
            $storefrontUrl = "{$proto}://{$host}/{$store->slug}";

            return response()->json([
                'success' => true,
                'message' => 'Toko berhasil dibuat dalam hitungan detik!',
                'store' => [
                    'id' => $store->id,
                    'name' => $store->name,
                    'slug' => $store->slug,
                    'storefront_url' => $storefrontUrl,
                ],
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'token' => $token,
            ], 201);
        });
    }

    /**
     * Data ikhtisar dashboard pedagang.
     */
    public function getDashboardOverview(Request $request): JsonResponse
    {
        /** @var Store $store */
        $store = app('current_tenant');

        $wallet = MerchantWallet::firstOrCreate(
            ['store_id' => $store->id],
            ['available_balance' => 0, 'escrow_held_balance' => 0]
        );

        $totalOrders = Order::count();
        $totalGmv = Order::sum('total_amount');
        $recentOrders = Order::with('items')->latest()->take(10)->get();

        return response()->json([
            'success' => true,
            'overview' => [
                'store_name' => $store->name,
                'store_slug' => $store->slug,
                'available_balance' => $wallet->available_balance,
                'escrow_held_balance' => $wallet->escrow_held_balance,
                'total_orders' => $totalOrders,
                'total_gmv' => $totalGmv,
            ],
            'recent_orders' => $recentOrders,
        ]);
    }

    /**
     * Mengambil konfigurasi CMS tampilan toko aktif.
     */
    public function getCmsSettings(Request $request): JsonResponse
    {
        /** @var Store $store */
        $store = app('current_tenant');

        return response()->json([
            'success' => true,
            'data' => [
                'store_name' => $store->name,
                'store_slug' => $store->slug,
                'settings' => $store->settings ?? [],
            ],
        ]);
    }

    /**
     * Menyimpan pembaruan konfigurasi CMS tampilan toko aktif.
     */
    public function updateCmsSettings(Request $request): JsonResponse
    {
        /** @var Store $store */
        $store = app('current_tenant');

        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        $currentSettings = $store->settings ?? [];
        $newSettings = array_merge($currentSettings, $validated['settings']);

        $store->update([
            'settings' => $newSettings,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi tampilan toko berhasil disimpan.',
            'data' => [
                'settings' => $store->fresh()->settings,
            ],
        ]);
    }
}
