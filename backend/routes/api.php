<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BiteshipWebhookController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\LogisticsController;
use App\Http\Controllers\Api\MerchantController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\StorefrontController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\XenditWebhookController;
use App\Http\Middleware\IdentifyTenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;

/*
|--------------------------------------------------------------------------
| ALURELAB API Routes v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ═══════════════════════════════════════════════════════════════════════
    // 1. AUTHENTICATION — Public (no tenant, no auth middleware)
    // ═══════════════════════════════════════════════════════════════════════
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::get('/email/verify/{id}/{hash}', function (Request $request, string $id, string $hash) {
            $validSignature = URL::hasValidSignature($request);

            if (! $validSignature && $request->query('expires') && $request->query('signature')) {
                $legacyUrl = $request->getSchemeAndHttpHost()
                    .'/email/verify/'.$id.'/'.$hash
                    .'?expires='.$request->query('expires')
                    .'&signature='.$request->query('signature');
                $validSignature = URL::hasValidSignature(Request::create($legacyUrl));
            }

            abort_unless($validSignature, 403);

            $user = User::findOrFail($id);
            abort_unless(hash_equals(sha1($user->getEmailForVerification()), $hash), 403);

            if (! $user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
            }

            return redirect(env('FRONTEND_URL', 'https://app.alurelab.com').'/login?verified=1');
        })->middleware('throttle:6,1')->name('verification.verify');

        // Protected auth routes
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 2. WEBHOOKS — Public (verifikasi kriptografis internal)
    // ═══════════════════════════════════════════════════════════════════════
    Route::post('/webhooks/xendit/invoice', [XenditWebhookController::class, 'handleInvoice']);
    Route::post('/webhooks/biteship/tracking', [BiteshipWebhookController::class, 'handleTracking']);

    // ═══════════════════════════════════════════════════════════════════════
    // 3. ONBOARDING — Public (buat toko + user sekaligus)
    // ═══════════════════════════════════════════════════════════════════════
    Route::post('/merchants/onboard', [MerchantController::class, 'onboard']);

    // ═══════════════════════════════════════════════════════════════════════
    // 4. STOREFRONT (BUYER) — Tenant-aware, public
    // ═══════════════════════════════════════════════════════════════════════
    Route::middleware([IdentifyTenant::class])->group(function () {
        Route::get('/store', [StorefrontController::class, 'getStore']);
        Route::get('/products', [StorefrontController::class, 'listProducts']);
        Route::get('/products/{slug}', [StorefrontController::class, 'getProduct']);
        Route::get('/logistics/areas', [LogisticsController::class, 'searchAreas']);
        Route::post('/logistics/rates', [LogisticsController::class, 'checkRates']);
        Route::post('/checkout', [StorefrontController::class, 'checkout']);

        // ── Akun Pembeli (Buyer Auth, Profile, & Orders) ─────────────
        Route::post('/buyer/login', [CustomerAuthController::class, 'login']);
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/buyer/profile', [CustomerAuthController::class, 'getProfile']);
            Route::put('/buyer/profile', [CustomerAuthController::class, 'updateProfile']);
            Route::get('/buyer/orders', [CustomerAuthController::class, 'getOrders']);
            Route::get('/buyer/orders/{id}', [CustomerAuthController::class, 'getOrder']);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 5. MERCHANT DASHBOARD — Protected (Sanctum Auth + Tenant + Role)
    // ═══════════════════════════════════════════════════════════════════════
    Route::middleware(['auth:sanctum', IdentifyTenant::class])
        ->prefix('merchant')
        ->group(function () {

            // Overview
            Route::get('/dashboard', [MerchantController::class, 'getDashboardOverview']);
            Route::get('/orders/stats', [OrderController::class, 'stats']);
            Route::get('/categories', [MerchantController::class, 'getCategories'])->middleware('store.role:owner,manager');
            Route::put('/categories', [MerchantController::class, 'updateCategories'])->middleware('store.role:owner,manager');

            // ── Produk ──────────────────────────────────────────────────────
            Route::apiResource('/products', ProductController::class)->middleware('store.role:owner,manager');
            Route::patch('/products/{id}/toggle-status', [ProductController::class, 'toggleStatus'])->middleware('store.role:owner,manager');
            Route::post('/products/bulk', [ProductController::class, 'bulk'])->middleware('store.role:owner,manager');

            // Varian Produk
            Route::get('/products/{id}/variants', [ProductController::class, 'variants'])->middleware('store.role:owner,manager');
            Route::post('/products/{id}/variants', [ProductController::class, 'storeVariant'])->middleware('store.role:owner,manager');
            Route::put('/products/{id}/variants/{variantId}', [ProductController::class, 'updateVariant'])->middleware('store.role:owner,manager');
            Route::delete('/products/{id}/variants/{variantId}', [ProductController::class, 'destroyVariant'])->middleware('store.role:owner,manager');

            // ── Pesanan ─────────────────────────────────────────────────────
            Route::get('/orders', [OrderController::class, 'index']);
            Route::get('/orders/{id}', [OrderController::class, 'show']);
            Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
            Route::post('/orders/{id}/shipment', [OrderController::class, 'createShipment']);
            Route::get('/orders/{id}/label', [OrderController::class, 'printLabel']);

            // ── Upload (Local Storage & Cloudflare R2) ───────────────────────
            Route::post('/upload', [UploadController::class, 'directUpload'])->middleware('store.role:owner,manager');
            Route::post('/upload/presign', [UploadController::class, 'presign'])->middleware('store.role:owner,manager');
            Route::post('/upload/presign-bg', [UploadController::class, 'presignBgRemoval'])->middleware('store.role:owner,manager');

            // ── Store CMS & Tampilan Toko ─────────────────────────────────────
            Route::get('/cms/settings', [MerchantController::class, 'getCmsSettings'])->middleware('store.role:owner,manager');
            Route::put('/cms/settings', [MerchantController::class, 'updateCmsSettings'])->middleware('store.role:owner,manager');

            // ── Pengiriman Massal ─────────────────────────────────────────────
            Route::post('/shipping/bulk-ship', [MerchantController::class, 'bulkShip']);

            // ── Pelanggan & Member ────────────────────────────────────────────
            Route::get('/customers', [MerchantController::class, 'getCustomers']);

            // ── Keuangan & Escrow ─────────────────────────────────────────────
            Route::get('/finance', [MerchantController::class, 'getFinance'])->middleware('store.role:owner,manager');
            Route::post('/finance/withdraw', [MerchantController::class, 'requestPayout'])->middleware('store.role:owner');

            // ── Analisis Bisnis ───────────────────────────────────────────────
            Route::get('/analytics', [MerchantController::class, 'getAnalytics']);

            // ── Pengaturan Toko ───────────────────────────────────────────────
            Route::get('/settings', [MerchantController::class, 'getSettings'])->middleware('store.role:owner,manager');
            Route::put('/settings', [MerchantController::class, 'updateSettings'])->middleware('store.role:owner');

            // ── Pusat Promosi ─────────────────────────────────────────────────
            Route::get('/promotions', [MerchantController::class, 'getPromotions'])->middleware('store.role:owner,manager');
            Route::post('/promotions', [MerchantController::class, 'savePromotion'])->middleware('store.role:owner,manager');
            Route::delete('/promotions/{id}', [MerchantController::class, 'deletePromotion'])->middleware('store.role:owner,manager');
        });

    // ═══════════════════════════════════════════════════════════════════════
    // 6. CHAT — Dual auth (Sanctum seller OR X-Customer-Token buyer)
    // ═══════════════════════════════════════════════════════════════════════
    Route::prefix('chat')->group(function () {
        // Buyer starts a conversation (no Sanctum, uses X-Customer-Token)
        Route::post('/start', [\App\Http\Controllers\Api\ChatController::class, 'start']);

        // List conversations (seller via Sanctum, buyer via X-Customer-Token)
        Route::get('/conversations', [\App\Http\Controllers\Api\ChatController::class, 'index']);

        // Messages in a conversation
        Route::get('/conversations/{id}/messages', [\App\Http\Controllers\Api\ChatController::class, 'messages']);
        Route::post('/conversations/{id}/messages', [\App\Http\Controllers\Api\ChatController::class, 'send']);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 7. ADMIN — Protected (Sanctum Auth, role check in controller)
    // ═══════════════════════════════════════════════════════════════════════
    Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
        Route::get('/stats',          [\App\Http\Controllers\Api\AdminController::class, 'stats']);
        Route::get('/sellers',        [\App\Http\Controllers\Api\AdminController::class, 'sellers']);
        Route::get('/sellers/{id}',   [\App\Http\Controllers\Api\AdminController::class, 'sellerDetail']);
        Route::get('/buyers',         [\App\Http\Controllers\Api\AdminController::class, 'buyers']);
        Route::get('/buyers/{id}',    [\App\Http\Controllers\Api\AdminController::class, 'buyerDetail']);
    });
});

