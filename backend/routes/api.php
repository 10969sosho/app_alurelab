<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\StorefrontController;
use App\Http\Controllers\Api\LogisticsController;
use App\Http\Controllers\Api\XenditWebhookController;
use App\Http\Controllers\Api\BiteshipWebhookController;
use App\Http\Controllers\Api\MerchantController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Middleware\IdentifyTenant;

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
        Route::post('/login',    [AuthController::class, 'login']);

        // Protected auth routes
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me',      [AuthController::class, 'me']);
        });
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 2. WEBHOOKS — Public (verifikasi kriptografis internal)
    // ═══════════════════════════════════════════════════════════════════════
    Route::post('/webhooks/xendit/invoice',    [XenditWebhookController::class, 'handleInvoice']);
    Route::post('/webhooks/biteship/tracking', [BiteshipWebhookController::class, 'handleTracking']);

    // ═══════════════════════════════════════════════════════════════════════
    // 3. ONBOARDING — Public (buat toko + user sekaligus)
    // ═══════════════════════════════════════════════════════════════════════
    Route::post('/merchants/onboard', [MerchantController::class, 'onboard']);

    // ═══════════════════════════════════════════════════════════════════════
    // 4. STOREFRONT (BUYER) — Tenant-aware, public
    // ═══════════════════════════════════════════════════════════════════════
    Route::middleware([IdentifyTenant::class])->group(function () {
        Route::get('/store',              [StorefrontController::class, 'getStore']);
        Route::get('/products',           [StorefrontController::class, 'listProducts']);
        Route::get('/products/{slug}',    [StorefrontController::class, 'getProduct']);
        Route::get('/logistics/areas',    [LogisticsController::class, 'searchAreas']);
        Route::post('/logistics/rates',   [LogisticsController::class, 'checkRates']);
        Route::post('/checkout',          [StorefrontController::class, 'checkout']);

        // ── Akun Pembeli (Buyer Auth, Profile, & Orders) ─────────────
        Route::post('/buyer/login',       [CustomerAuthController::class, 'login']);
        Route::get('/buyer/profile',      [CustomerAuthController::class, 'getProfile']);
        Route::put('/buyer/profile',      [CustomerAuthController::class, 'updateProfile']);
        Route::get('/buyer/orders',       [CustomerAuthController::class, 'getOrders']);
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

        // ── Produk ──────────────────────────────────────────────────────
        Route::apiResource('/products', ProductController::class);
        Route::patch('/products/{id}/toggle-status', [ProductController::class, 'toggleStatus']);
        Route::post('/products/bulk',                [ProductController::class, 'bulk']);

        // Varian Produk
        Route::get('/products/{id}/variants',                 [ProductController::class, 'variants']);
        Route::post('/products/{id}/variants',                [ProductController::class, 'storeVariant']);
        Route::put('/products/{id}/variants/{variantId}',     [ProductController::class, 'updateVariant']);
        Route::delete('/products/{id}/variants/{variantId}',  [ProductController::class, 'destroyVariant']);

        // ── Pesanan ─────────────────────────────────────────────────────
        Route::get('/orders',                  [OrderController::class, 'index']);
        Route::get('/orders/{id}',             [OrderController::class, 'show']);
        Route::patch('/orders/{id}/status',    [OrderController::class, 'updateStatus']);
        Route::post('/orders/{id}/shipment',   [OrderController::class, 'createShipment']);
        Route::get('/orders/{id}/label',       [OrderController::class, 'printLabel']);

        // ── Upload (Local Storage & Cloudflare R2) ───────────────────────
        Route::post('/upload',                  [UploadController::class, 'directUpload']);
        Route::post('/upload/presign',          [UploadController::class, 'presign']);
        Route::post('/upload/presign-bg',       [UploadController::class, 'presignBgRemoval']);

        // ── Store CMS & Tampilan Toko ─────────────────────────────────────
        Route::get('/cms/settings',             [MerchantController::class, 'getCmsSettings']);
        Route::put('/cms/settings',             [MerchantController::class, 'updateCmsSettings']);
    });
});
