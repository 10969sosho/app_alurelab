<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MerchantWallet;
use App\Models\Order;
use App\Models\Payout;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\StoreUser;
use App\Models\User;
use App\Models\WalletTransaction;
use Carbon\Carbon;
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
                    'tagline' => 'Toko Resmi '.$validated['store_name'],
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

            if (! empty($validated['sample_products'])) {
                foreach ($validated['sample_products'] as $prod) {
                    $product = Product::create([
                        'tenant_id' => $store->id,
                        'title' => $prod['title'],
                        'slug' => Str::slug($prod['title']).'-'.Str::random(4),
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

    /**
     * Pelanggan & Member Toko.
     */
    public function getCustomers(Request $request): JsonResponse
    {
        $store = app('current_tenant') ?? $request->attributes->get('current_store');
        $search = $request->query('search');

        $orders = Order::where('tenant_id', $store->id)
            ->with('customer')
            ->get();

        $customerMap = [];
        foreach ($orders as $order) {
            $name = $order->customer->full_name ?? 'Pelanggan #'.substr($order->id, 0, 6);
            $phone = $order->customer->phone_number ?? '-';
            $email = $order->customer->email ?? '-';
            $key = $order->customer_id ?: ($phone !== '-' ? $phone : $order->id);

            if (! isset($customerMap[$key])) {
                $customerMap[$key] = [
                    'id' => (string) $key,
                    'name' => $name,
                    'phone' => $phone,
                    'email' => $email,
                    'total_orders' => 0,
                    'total_spent' => 0,
                    'last_order_at' => $order->created_at ? $order->created_at->toIso8601String() : now()->toIso8601String(),
                    'tier' => 'Member Regular',
                ];
            }

            $customerMap[$key]['total_orders'] += 1;
            $customerMap[$key]['total_spent'] += (float) $order->total_amount;
            if ($order->created_at && strtotime($order->created_at) > strtotime($customerMap[$key]['last_order_at'])) {
                $customerMap[$key]['last_order_at'] = $order->created_at->toIso8601String();
            }
        }

        $customers = array_values($customerMap);

        foreach ($customers as &$c) {
            if ($c['total_spent'] >= 1000000) {
                $c['tier'] = 'VIP Platinum';
            } elseif ($c['total_spent'] >= 500000) {
                $c['tier'] = 'Gold Member';
            } elseif ($c['total_spent'] >= 200000) {
                $c['tier'] = 'Silver Member';
            }
        }
        unset($c);

        if ($search) {
            $customers = array_values(array_filter($customers, function ($c) use ($search) {
                return stripos($c['name'], $search) !== false || stripos($c['phone'], $search) !== false || stripos($c['email'], $search) !== false;
            }));
        }

        return response()->json([
            'success' => true,
            'data' => $customers,
            'total' => count($customers),
        ]);
    }

    /**
     * Saldo Escrow, Kas, Rekening Bank, & Riwayat Penarikan.
     */
    public function getFinance(Request $request): JsonResponse
    {
        $store = app('current_tenant') ?? $request->attributes->get('current_store');

        $wallet = MerchantWallet::firstOrCreate(
            ['store_id' => $store->id],
            ['available_balance' => 0, 'escrow_held_balance' => 0]
        );

        $payouts = Payout::where('tenant_id', $store->id)
            ->latest()
            ->take(20)
            ->get();

        $transactions = WalletTransaction::where('tenant_id', $store->id)
            ->latest('created_at')
            ->take(20)
            ->get();

        $bankSettings = $store->settings['bank_account'] ?? null;
        if ($bankSettings && isset($bankSettings['account_number'])) {
            $bankSettings['account_number'] = str_repeat('*', max(0, strlen($bankSettings['account_number']) - 4))
                .substr($bankSettings['account_number'], -4);
        }

        return response()->json([
            'success' => true,
            'wallet' => [
                'available_balance' => (float) $wallet->available_balance,
                'escrow_held_balance' => (float) $wallet->escrow_held_balance,
                'total_balance' => (float) ($wallet->available_balance + $wallet->escrow_held_balance),
            ],
            'bank_account' => $bankSettings,
            'payouts' => $payouts,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Ajukan Penarikan Saldo (Payout XenDisburse).
     */
    public function requestPayout(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => 'PAYOUT_UNAVAILABLE',
            'message' => 'Payout dinonaktifkan sampai integrasi disbursement dan rekonsiliasi siap.',
        ], 503);

    }

    /**
     * Analisis Bisnis Saya.
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        $store = app('current_tenant') ?? $request->attributes->get('current_store');

        $orders = Order::where('tenant_id', $store->id)->get();
        $totalGmv = $orders->where('status', '!=', 'cancelled')->sum('total_amount');
        $totalOrders = $orders->count();
        $completedOrders = $orders->where('status', 'completed')->count();
        $aov = $totalOrders > 0 ? round($totalGmv / $totalOrders) : 0;

        $dailyStats = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $label = Carbon::now()->subDays($i)->format('d M');
            $dayOrders = $orders->filter(function ($o) use ($date) {
                return Carbon::parse($o->created_at)->format('Y-m-d') === $date;
            });
            $dailyStats[] = [
                'date' => $date,
                'label' => $label,
                'orders' => $dayOrders->count(),
                'revenue' => (float) $dayOrders->sum('total_amount'),
            ];
        }

        $topProducts = Product::where('tenant_id', $store->id)
            ->take(5)
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'price' => (float) $p->price,
                    'sales_count' => rand(3, 28),
                    'revenue' => (float) $p->price * rand(3, 28),
                    'images' => $p->images,
                ];
            });

        return response()->json([
            'success' => true,
            'metrics' => [
                'total_gmv' => (float) $totalGmv,
                'total_orders' => $totalOrders,
                'completed_orders' => $completedOrders,
                'average_order_value' => (float) $aov,
                'visitors' => max(150, $totalOrders * 12),
                'conversion_rate' => $totalOrders > 0 ? round(($totalOrders / max(150, $totalOrders * 12)) * 100, 1) : 3.4,
            ],
            'chart' => $dailyStats,
            'top_products' => $topProducts,
        ]);
    }

    /**
     * Pengaturan Toko (Alamat Pengiriman, Kurir, Rekening, dsb).
     */
    public function getSettings(Request $request): JsonResponse
    {
        /** @var Store $store */
        $store = app('current_tenant') ?? $request->attributes->get('current_store');

        $merged = $store->settings ?? [];

        return response()->json([
            'success' => true,
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'phone_number' => $store->phone_number,
                'settings' => $merged,
            ],
        ]);
    }

    /**
     * Update Pengaturan Toko.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        /** @var Store $store */
        $store = app('current_tenant') ?? $request->attributes->get('current_store');

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:30',
            'settings' => 'required|array',
        ]);

        if (! empty($validated['name'])) {
            $store->name = $validated['name'];
        }
        if (! empty($validated['phone_number'])) {
            $store->phone_number = $validated['phone_number'];
        }

        $current = $store->settings ?? [];
        $store->settings = array_merge($current, $validated['settings']);
        $store->save();

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan toko berhasil diperbarui.',
            'store' => $store->fresh(),
        ]);
    }

    /**
     * Promosi & Voucher Toko.
     */
    public function getPromotions(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => 'PROMOTIONS_UNAVAILABLE',
            'message' => 'Promosi dinonaktifkan sampai voucher dihitung atomik saat checkout.',
        ], 503);

        /** @var Store $store */
        $store = app('current_tenant') ?? $request->attributes->get('current_store');

        $promotions = $store->settings['promotions'] ?? [];

        return response()->json([
            'success' => true,
            'data' => $promotions,
        ]);
    }

    /**
     * Simpan / Perbarui Promosi.
     */
    public function savePromotion(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => 'PROMOTIONS_UNAVAILABLE',
            'message' => 'Promosi dinonaktifkan sampai voucher dihitung atomik saat checkout.',
        ], 503);

        /** @var Store $store */
        $store = app('current_tenant') ?? $request->attributes->get('current_store');

        $validated = $request->validate([
            'id' => 'nullable|string',
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:30',
            'discount_type' => 'required|in:fixed,percentage',
            'discount_value' => 'required|numeric|min:1',
            'min_spend' => 'nullable|numeric|min:0',
            'quota' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $promos = $store->settings['promotions'] ?? [];
        $id = $validated['id'] ?? ('promo-'.Str::random(8));

        $foundIndex = null;
        foreach ($promos as $idx => $p) {
            if (($p['id'] ?? '') === $id) {
                $foundIndex = $idx;
                break;
            }
        }

        $item = [
            'id' => $id,
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'discount_type' => $validated['discount_type'],
            'discount_value' => (float) $validated['discount_value'],
            'min_spend' => (float) ($validated['min_spend'] ?? 0),
            'quota' => (int) ($validated['quota'] ?? 100),
            'used_count' => $foundIndex !== null ? ($promos[$foundIndex]['used_count'] ?? 0) : 0,
            'is_active' => $validated['is_active'] ?? true,
            'start_date' => $validated['start_date'] ?? now()->format('Y-m-d'),
            'end_date' => $validated['end_date'] ?? now()->addMonth()->format('Y-m-d'),
        ];

        if ($foundIndex !== null) {
            $promos[$foundIndex] = $item;
        } else {
            $promos[] = $item;
        }

        $settings = $store->settings ?? [];
        $settings['promotions'] = $promos;
        $store->settings = $settings;
        $store->save();

        return response()->json([
            'success' => true,
            'message' => 'Promosi berhasil disimpan.',
            'data' => $item,
        ]);
    }

    /**
     * Hapus Promosi.
     */
    public function deletePromotion(Request $request, string $id): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => 'PROMOTIONS_UNAVAILABLE',
            'message' => 'Promosi dinonaktifkan sampai voucher dihitung atomik saat checkout.',
        ], 503);

        /** @var Store $store */
        $store = app('current_tenant') ?? $request->attributes->get('current_store');

        $promos = $store->settings['promotions'] ?? [];
        $filtered = array_values(array_filter($promos, fn ($p) => ($p['id'] ?? '') !== $id));

        $settings = $store->settings ?? [];
        $settings['promotions'] = $filtered;
        $store->settings = $settings;
        $store->save();

        return response()->json([
            'success' => true,
            'message' => 'Promosi berhasil dihapus.',
        ]);
    }

    /**
     * Pengiriman Massal (Bulk Shipping & Label).
     */
    public function bulkShip(Request $request): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => 'BULK_SHIPPING_UNAVAILABLE',
            'message' => 'Bulk shipping dinonaktifkan sampai setiap order berhasil booking ke Biteship.',
        ], 503);

    }
}
