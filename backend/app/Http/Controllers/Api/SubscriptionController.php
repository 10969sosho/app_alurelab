<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Services\DokuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    /**
     * Katalog paket langganan ALURELAB (satu-satunya sumber harga & fitur).
     */
    private const PLANS = [
        'starter' => [
            'name' => 'Starter',
            'amount' => 99000,
            'popular' => false,
            'features' => ['50 produk', '200 pesanan/bulan', 'Storefront standar'],
        ],
        'pro' => [
            'name' => 'Pro',
            'amount' => 249000,
            'popular' => true,
            'features' => ['Produk unlimited', 'Pesanan unlimited', 'Fitur AI dan custom domain'],
        ],
        'business' => [
            'name' => 'Business',
            'amount' => 599000,
            'popular' => false,
            'features' => ['Semua fitur Pro', 'AI prioritas', 'Custom domain + multi-store'],
        ],
    ];

    public function __construct(
        protected DokuService $dokuService
    ) {}

    /**
     * Daftar paket langganan + paket aktif toko saat ini.
     */
    public function plans(Request $request): JsonResponse
    {
        $store = $this->resolveCurrentStore($request);

        $plans = [];
        foreach (self::PLANS as $tier => $plan) {
            $plans[] = [
                'tier' => $tier,
                'name' => $plan['name'],
                'amount' => $plan['amount'],
                'popular' => $plan['popular'],
                'features' => $plan['features'],
            ];
        }

        $activeTier = $store?->plan_tier ?? 'free';

        return response()->json([
            'success' => true,
            'plans' => $plans,
            'active_plan' => [
                'tier' => $activeTier,
                'name' => self::PLANS[$activeTier]['name'] ?? ucfirst((string) $activeTier),
                'amount' => self::PLANS[$activeTier]['amount'] ?? 0,
                'expires_at' => $store?->plan_expires_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Buat tagihan langganan via DOKU Checkout V1 dan kembalikan payment URL.
     */
    public function checkout(Request $request): JsonResponse
    {
        $store = $this->resolveCurrentStore($request);

        if (! $store) {
            return response()->json([
                'success' => false,
                'message' => 'Toko tidak ditemukan. Pastikan Anda memiliki toko aktif.',
            ], 404);
        }

        $validated = $request->validate([
            'plan' => 'required|string|in:'.implode(',', array_keys(self::PLANS)),
            'phone' => 'nullable|string|max:30',
        ]);

        $user = $request->user();
        $rawPhone = $validated['phone'] ?? $user?->phone_number ?? $store->phone_number;
        $cleanPhone = $this->dokuService->sanitizePhoneNumber($rawPhone);

        if ($request->filled('phone')) {
            if ($user) {
                $user->update(['phone_number' => $cleanPhone]);
            }
            $store->update(['phone_number' => $cleanPhone]);
        } else {
            if (empty($store->phone_number) || $store->phone_number === '-') {
                $store->update(['phone_number' => $cleanPhone]);
            }
            if ($user && (empty($user->phone_number) || $user->phone_number === '-')) {
                $user->update(['phone_number' => $cleanPhone]);
            }
        }

        $rank = array_flip(array_keys(self::PLANS));
        $tier = $validated['plan'];
        $currentTier = $store->plan_tier ?? 'free';
        $currentRank = $rank[$currentTier] ?? -1;

        if ($rank[$tier] <= $currentRank) {
            return response()->json([
                'success' => false,
                'message' => $rank[$tier] === $currentRank
                    ? 'Paket '.self::PLANS[$tier]['name'].' sudah aktif di toko Anda.'
                    : 'Toko Anda sudah menggunakan paket yang lebih tinggi.',
            ], 422);
        }

        $subscription = Subscription::create([
            'store_id' => $store->id,
            'plan_tier' => $tier,
            'amount' => self::PLANS[$tier]['amount'],
            'status' => 'pending',
            'invoice_number' => $this->invoiceNumber(),
        ]);

        $result = $this->dokuService->createSubscriptionInvoice($subscription, $store, $request->user());

        if (! $result['success']) {
            $subscription->update(['status' => 'failed']);

            return response()->json([
                'success' => false,
                'message' => $result['error'],
            ], 502);
        }

        $subscription->update(['payment_url' => $result['payment_url']]);

        return response()->json([
            'success' => true,
            'payment_url' => $subscription->payment_url,
            'invoice_number' => $subscription->invoice_number,
        ]);
    }

    /**
     * Riwayat langganan toko yang sedang login.
     */
    public function history(Request $request): JsonResponse
    {
        $store = $this->resolveCurrentStore($request);

        if (! $store) {
            return response()->json([
                'success' => true,
                'subscriptions' => [],
            ]);
        }

        return response()->json([
            'success' => true,
            'subscriptions' => Subscription::where('store_id', $store->id)
                ->latest()
                ->take(20)
                ->get(),
        ]);
    }

    /**
     * Nomor tagihan langganan unik: SUB-YYYYMMDD-XXXXX.
     */
    private function invoiceNumber(): string
    {
        do {
            $invoiceNumber = 'SUB-'.now()->format('Ymd').'-'.Str::upper(Str::random(5));
        } while (Subscription::where('invoice_number', $invoiceNumber)->exists());

        return $invoiceNumber;
    }
}
