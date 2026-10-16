<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // [DEPRECATED 2026-10-15] Xendit digantikan DOKU → lihat config/doku.php

    'biteship' => [
        'url' => env('BITESHIP_BASE_URL', env('BITESHIP_API_URL', 'https://api.biteship.com/v1')),
        'key' => env('BITESHIP_API_KEY', ''),
        'webhook_header' => env('BITESHIP_WEBHOOK_HEADER', 'X-Biteship-Webhook-Secret'),
        'webhook_secret' => env('BITESHIP_WEBHOOK_SECRET', ''),
    ],

    'qa_simulation' => [
        'enabled' => (bool) env('QA_SIMULATION_ENABLED', false),
        'store_slug' => env('QA_SIMULATION_STORE_SLUG', ''),
    ],

];
