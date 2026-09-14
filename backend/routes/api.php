<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\StorefrontController;
use App\Http\Controllers\Api\LogisticsController;
use App\Http\Controllers\Api\XenditWebhookController;
use App\Http\Controllers\Api\BiteshipWebhookController;
use App\Http\Controllers\Api\MerchantController;
use App\Http\Middleware\IdentifyTenant;

/*
|--------------------------------------------------------------------------
| ALURELAB API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // 1. Webhook Providers (Kriptografis & Tanpa Middleware Tenant)
    Route::post('/webhooks/xendit/invoice', [XenditWebhookController::class, 'handleInvoice']);
    Route::post('/webhooks/biteship/tracking', [BiteshipWebhookController::class, 'handleTracking']);

    // 2. Onboarding Merchant 60-Detik (The Cursor Effect)
    Route::post('/merchants/onboard', [MerchantController::class, 'onboard']);

    // 3. Storefront & Checkout (Wajib Lolos Tenant Identification & RLS Kernel)
    Route::middleware([IdentifyTenant::class])->group(function () {
        // Toko & Katalog
        Route::get('/store', [StorefrontController::class, 'getStore']);
        Route::get('/products', [StorefrontController::class, 'listProducts']);
        Route::get('/products/{slug}', [StorefrontController::class, 'getProduct']);

        // Logistik & Ongkir
        Route::get('/logistics/areas', [LogisticsController::class, 'searchAreas']);
        Route::post('/logistics/rates', [LogisticsController::class, 'checkRates']);

        // Checkout 1-Halaman
        Route::post('/checkout', [StorefrontController::class, 'checkout']);

        // Dashboard Merchant (Data Toko Aktif)
        Route::get('/merchant/dashboard', [MerchantController::class, 'getDashboardOverview']);
    });
});
