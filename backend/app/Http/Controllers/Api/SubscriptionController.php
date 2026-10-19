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
        $store = app('current_tenant') ?? $request->attributes->get('current_store');

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

        return response()->json([
            'success' => true,
            'plans' => $plans,
            'active_plan' => [
                'tier' => $store->plan_tier,
                'name' => self::PLANS[$store->plan_tier]['name'] ?? ucfirst((string) $store->plan_tier),
                'amount' => self::PLANS[$store->plan_tier]['amount'] ?? 0,
                'expires_at' => $store->plan_expires_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Buat tagihan langganan via DOKU Checkout V1 dan kembalikan payment URL.
     */
    public function checkout(Request $request): JsonResponse
    {
        $store = app('current_tenant') ?? $request->attributes->get('current_store');

        $validated = $request->validate([
            'plan' => 'required|string|in:'.implode(',', array_keys(self::PLANS)),
        ]);

        $rank = array_flip(array_keys(self::PLANS));
        $tier = $validated['plan'];
        $currentRank = $rank[$store->plan_tier] ?? 0;

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
        $store = app('current_tenant') ?? $request->attributes->get('current_store');

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
