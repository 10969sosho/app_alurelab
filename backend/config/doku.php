<?php

return [

    /*
    |--------------------------------------------------------------------------
    | DOKU Payment Gateway (Checkout V1 / Sub-Account)
    |--------------------------------------------------------------------------
    */

    'client_id' => env('DOKU_CLIENT_ID', ''),
    'secret_key' => env('DOKU_SECRET_KEY', ''),
    'environment' => env('DOKU_ENVIRONMENT', 'sandbox'),

    'base_url' => env('DOKU_ENVIRONMENT', 'sandbox') === 'production'
        ? 'https://api.doku.com'
        : 'https://api-sandbox.doku.com',

    'invoice_expiry_minutes' => (int) env('DOKU_INVOICE_EXPIRY_MINUTES', 1440),

    'notification_path' => '/api/v1/webhooks/doku/notification',

    // Toleransi clock-skew untuk validasi Request-Timestamp webhook (detik).
    'signature_tolerance_seconds' => 300,

    'payment_methods' => ['QRIS', 'BCA', 'MANDIRI', 'BRI', 'BNI', 'OVO', 'DANA', 'SHOPEEPAY'],

];
