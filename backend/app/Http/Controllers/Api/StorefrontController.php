<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\MerchantWallet;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Services\AntiRtsService;
use App\Services\BiteshipService;
use App\Services\DokuService;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StorefrontController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService,
        protected AntiRtsService $antiRtsService,
        protected BiteshipService $biteshipService,
        protected DokuService $dokuService
    ) {}

    /**
     * Mengambil profil publik toko aktif.
     */
    public function getStore(Request $request): JsonResponse
    {
        /** @var Store|null $store */
        $store = $this->resolveCurrentStore($request);
        if (! $store) {
            return response()->json([
                'success' => false,
                'message' => 'Toko tidak ditemukan.',
            ], 404);
        }

        $settings = $store->settings ?? [];
        $publicSettings = array_intersect_key($settings, array_flip([
            'template',
            'branding',
            'hero',
            'navigation',
            'pages',
            'sections',
            'highlights',
            'buyerCopy',
        ]));

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'custom_domain' => $store->custom_domain,
                'logo_url' => $store->logo_url,
                'phone_number' => $store->phone_number,
                'settings' => $publicSettings,
            ],
        ]);
    }

    /**
     * Menampilkan katalog produk toko.
     */
    public function listProducts(Request $request): JsonResponse
    {
        /** @var Store|null $store */
        $store = $this->resolveCurrentStore($request);
        if (! $store) {
            return response()->json([
                'success' => false,
                'message' => 'Toko tidak ditemukan.',
            ], 404);
        }

        $products = Product::where('tenant_id', $store->id)
            ->where('is_active', true)
            ->with(['variants'])
            ->latest()
            ->paginate(24);

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Detail produk beserta varian stok.
     */
    public function getProduct(Request $request, string $slug): JsonResponse
    {
        $store = $this->resolveCurrentStore($request);
        if (! $store) {
            return response()->json([
                'success' => false,
                'message' => 'Toko tidak ditemukan.',
            ], 404);
        }

        $product = Product::where('tenant_id', $store->id)
            ->where('slug', $slug)
            ->where('is_active', true)
            ->with(['variants'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * Endpoint one-page checkout with atomic inventory reservation.
     */
    public function checkout(Request $request): JsonResponse
    {
        /** @var Store|null $store */
        $store = $this->resolveCurrentStore($request);
        if (! $store) {
            return response()->json([
                'success' => false,
                'message' => 'Toko tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:30',
            'customer_email' => 'nullable|email|max:255',
            'destination_area_id' => 'required|string',
            'address_detail' => 'required|string',
            'shipping_notes' => 'nullable|string',
            'courier_code' => 'required|string',
            'courier_service' => 'required|string',
            'shipping_cost' => 'required|numeric|min:0',
            'payment_method' => 'required|string|in:ONLINE,COD',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid',
            'items.*.variant_id' => 'required|uuid',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $rateItems = [];
        foreach ($validated['items'] as $itemData) {
            $product = Product::where('tenant_id', $store->id)
                ->whereKey($itemData['product_id'])
                ->where('is_active', true)
                ->first();

            $variant = ! empty($itemData['variant_id'])
                ? ProductVariant::where('tenant_id', $store->id)
                    ->where('product_id', $itemData['product_id'])
                    ->whereKey($itemData['variant_id'])
                    ->first()
                : null;

            if (! $product || ! $variant) {
                return response()->json([
                    'success' => false,
                    'error' => 'INVALID_ITEM',
                    'message' => 'Produk atau varian tidak tersedia di toko ini.',
                ], 422);
            }

            $rateItems[] = [
                'name' => $product->title.' ('.$variant->title.')',
                'value' => (int) $variant->price,
                'quantity' => $itemData['quantity'],
                'weight' => max(1, (int) ($variant?->weight_grams ?? $product->weight_grams)),
            ];
        }

        if (! $store->address_area_id) {
            return response()->json([
                'success' => false,
                'error' => 'STORE_ORIGIN_MISSING',
                'message' => 'Alamat asal toko belum dikonfigurasi.',
            ], 422);
        }

        if ($validated['payment_method'] === 'ONLINE' && ! $this->isQaSimulationEnabled($store) && ! $this->dokuService->isConfigured()) {
            return response()->json([
                'success' => false,
                'error' => 'PAYMENT_UNAVAILABLE',
                'message' => 'Pembayaran online belum tersedia saat ini.',
            ], 503);
        }

        try {
            $rates = $this->biteshipService->calculateRates(
                $store->address_area_id,
                $validated['destination_area_id'],
                $rateItems,
                $store,
            );
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'error' => 'SHIPPING_PROVIDER_UNAVAILABLE',
                'message' => 'Tarif pengiriman belum tersedia. Coba lagi.',
            ], 503);
        }

        $selectedRate = collect($rates)->first(fn (array $rate): bool => ($rate['courier_code'] ?? null) === $validated['courier_code']
            && ($rate['courier_service_code'] ?? null) === $validated['courier_service']
        );

        if (! $selectedRate || (int) $selectedRate['price'] !== (int) $validated['shipping_cost']) {
            return response()->json([
                'success' => false,
                'error' => 'SHIPPING_QUOTE_EXPIRED',
                'message' => 'Tarif pengiriman berubah. Ambil tarif terbaru lalu coba lagi.',
            ], 409);
        }

        // Lock stock atomically only after product, tenant, variant, and shipping validation.
        $lockedItems = [];
        foreach ($validated['items'] as $itemData) {
            $variantId = $itemData['variant_id'];
            $qty = $itemData['quantity'];

            $isLocked = $this->inventoryService->reserveStock($store->id, $variantId, $qty);
            if (! $isLocked) {
                // Rollback item yang sempat terkunci sebelumnya
                foreach ($lockedItems as $locked) {
                    $this->inventoryService->releaseStock($store->id, $locked['variant_id'], $locked['qty']);
                }

                return response()->json([
                    'success' => false,
                    'error' => 'OUT_OF_STOCK',
                    'message' => 'Maaf, salah satu produk di keranjang Anda baru saja habis dipesan pembeli lain.',
                ], 409);
            }

            $lockedItems[] = ['variant_id' => $variantId, 'qty' => $qty];
        }

        try {
            $response = DB::transaction(function () use ($validated, $store, $selectedRate, $lockedItems) {
                // 2. Resolve / Create Profil Customer
                $cleanPhone = preg_replace('/[^0-9]/', '', $validated['customer_phone']);
                if (str_starts_with($cleanPhone, '0')) {
                    $cleanPhone = '62'.substr($cleanPhone, 1);
                }

                $customer = Customer::firstOrCreate(
                    ['phone_number' => $cleanPhone],
                    [
                        'full_name' => $validated['customer_name'],
                        'email' => $validated['customer_email'] ?? null,
                        'default_address' => [
                            'area_id' => $validated['destination_area_id'],
                            'detail' => $validated['address_detail'],
                        ],
                    ]
                );

                // 3. Cek Proteksi COD Anti-RTS jika memilih COD
                if ($validated['payment_method'] === 'COD') {
                    $riskEvaluation = $this->antiRtsService->evaluateCustomerRisk($customer);
                    if (! $riskEvaluation['allow_cod']) {
                        return response()->json([
                            'success' => false,
                            'error' => 'COD_REJECTED',
                            'message' => $riskEvaluation['reason'],
                            'require_dp' => $riskEvaluation['require_dp'],
                        ], 422);
                    }
                }

                // 4. Hitung Subtotal & Financial Split
                $subtotal = 0;
                $orderItemsData = [];

                foreach ($validated['items'] as $itemData) {
                    $product = Product::where('tenant_id', $store->id)
                        ->whereKey($itemData['product_id'])
                        ->where('is_active', true)
                        ->firstOrFail();
                    $variant = ! empty($itemData['variant_id'])
                        ? ProductVariant::where('tenant_id', $store->id)
                            ->where('product_id', $product->id)
                            ->whereKey($itemData['variant_id'])
                            ->firstOrFail()
                        : null;

                    $itemPrice = $variant ? $variant->price : $product->price;
                    $lineTotal = $itemPrice * $itemData['quantity'];
                    $subtotal += $lineTotal;

                    $orderItemsData[] = [
                        'tenant_id' => $store->id,
                        'product_id' => $product->id,
                        'variant_id' => $variant?->id,
                        'product_title' => $product->title,
                        'variant_title' => $variant?->title,
                        'price' => $itemPrice,
                        'quantity' => $itemData['quantity'],
                        'subtotal' => $lineTotal,
                    ];
                }

                $shippingCost = (float) $selectedRate['price'];
                $totalAmount = $subtotal + $shippingCost;

                // Potongan Platform ALURELAB 1.5% dari nilai barang
                $platformFeePercent = 1.50;
                $platformFeeAmount = round($subtotal * ($platformFeePercent / 100), 2);
                // Merchant net = nilai barang saja; ongkir dipisahkan ke pool ongkir saat pembayaran.
                $merchantNetAmount = $subtotal - $platformFeeAmount;

                $orderNumber = 'ORD-'.date('Ymd').'-'.strtoupper(Str::random(6));

                // 5. Simpan Order
                $order = Order::create([
                    'tenant_id' => $store->id,
                    'order_number' => $orderNumber,
                    'customer_id' => $customer->id,
                    'status' => $validated['payment_method'] === 'COD'
                        ? OrderStatus::COD_VERIFIED
                        : OrderStatus::PENDING_PAYMENT,
                    'items_subtotal' => $subtotal,
                    'shipping_cost' => $shippingCost,
                    'insurance_cost' => 0,
                    'discount_amount' => 0,
                    'total_amount' => $totalAmount,
                    'platform_fee_percent' => $platformFeePercent,
                    'platform_fee_amount' => $platformFeeAmount,
                    'merchant_net_amount' => $merchantNetAmount,
                    'shipping_recipient_name' => $validated['customer_name'],
                    'shipping_recipient_phone' => $cleanPhone,
                    'shipping_destination_area_id' => $validated['destination_area_id'],
                    'shipping_address_detail' => $validated['address_detail'],
                    'shipping_notes' => $validated['shipping_notes'] ?? null,
                ]);

                foreach ($orderItemsData as $item) {
                    $item['order_id'] = $order->id;
                    OrderItem::create($item);
                }

                // 6. Integrasi Pembayaran (DOKU Checkout V1)
                $paymentResponse = null;
                if ($validated['payment_method'] === 'ONLINE') {
                    $invoice = $this->dokuService->createCheckoutInvoice($order, $store);

                    if (! ($invoice['success'] ?? false)) {
                        return response()->json([
                            'success' => false,
                            'error' => 'PAYMENT_GATEWAY_ERROR',
                            'message' => $invoice['error'] ?? 'Gagal membuat tagihan pembayaran.',
                        ], 502);
                    }

                    Payment::create([
                        'tenant_id' => $store->id,
                        'order_id' => $order->id,
                        'doku_invoice_id' => $invoice['invoice_id'],
                        'payment_url' => $invoice['invoice_url'] ?? null,
                        'payment_method' => 'ONLINE',
                        'amount' => $totalAmount,
                        'status' => PaymentStatus::PENDING,
                    ]);

                    $paymentResponse = [
                        'invoice_url' => $invoice['invoice_url'] ?? null,
                        'payment_url' => $invoice['invoice_url'] ?? null,
                        'invoice_id' => $invoice['invoice_id'],
                        'expiry_date' => $invoice['expiry_date'] ?? null,
                    ];
                } else {
                    Payment::create([
                        'tenant_id' => $store->id,
                        'order_id' => $order->id,
                        'doku_invoice_id' => 'COD-'.$order->order_number,
                        'payment_method' => 'COD',
                        'amount' => $totalAmount,
                        'status' => PaymentStatus::PENDING,
                    ]);
                }

                $this->inventoryService->createReservations(
                    $store->id,
                    $order->id,
                    $lockedItems,
                    now()->addMinutes(config('doku.invoice_expiry_minutes', 1440)),
                    $validated['payment_method'] === 'COD',
                );

                if ($validated['payment_method'] === 'ONLINE' && $this->isQaSimulationEnabled($store)) {
                    $order->update(['status' => OrderStatus::PAID_ESCROW]);
                    $this->inventoryService->consumeReservations($order->id);

                    Payment::where('order_id', $order->id)->update([
                        'status' => PaymentStatus::PAID,
                        'paid_at' => now(),
                        'payment_channel' => 'QA_SIMULATION',
                    ]);

                    MerchantWallet::creditOrderPayment(
                        $order,
                        'qa_payment_'.$order->order_number,
                        'QA payment simulated',
                    );
                }

                return response()->json([
                    'success' => true,
                    'order_number' => $order->order_number,
                    'total_amount' => $totalAmount,
                    'payment' => $paymentResponse,
                ], 201);
            });

            if ($response->getStatusCode() >= 400) {
                foreach ($lockedItems as $locked) {
                    $this->inventoryService->releaseStock($store->id, $locked['variant_id'], $locked['qty']);
                }
            }

            return $response;
        } catch (\Throwable $e) {
            // Revert stok jika gagal
            foreach ($lockedItems as $locked) {
                $this->inventoryService->releaseStock($store->id, $locked['variant_id'], $locked['qty']);
            }
            throw $e;
        }
    }

    private function isQaSimulationEnabled(Store $store): bool
    {
        return (bool) config('services.qa_simulation.enabled')
            && str_starts_with($store->slug, (string) config('services.qa_simulation.store_slug'));
    }
}
